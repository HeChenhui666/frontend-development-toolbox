/**
 * 局域网聊天中继：只做 WebSocket 转发与房间成员管理，不解析 cipher 载荷。
 * 使用：在项目根目录执行 `npm run lan-chat-server`
 * 默认监听 0.0.0.0:8765，局域网内其它机器可连 ws://<本机IP>:8765
 */
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.LAN_CHAT_PORT || 8765);
const HOST = process.env.LAN_CHAT_HOST || '0.0.0.0';

function randomId() {
  const a = new Uint8Array(10);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

function sanitizeRoom(room) {
  const s = String(room || '')
    .trim()
    .slice(0, 64)
    .replace(/[^\w\u4e00-\u9fff-]/g, '-');
  return s || 'default';
}

/** @type {Map<import('ws').WebSocket, { id: string; name: string; rooms: Set<string>; pub: string | null }>} */
const clients = new Map();

function send(ws, obj) {
  if (ws.readyState === 1) ws.send(JSON.stringify(obj));
}

function broadcast(obj, pred) {
  for (const [ws, meta] of clients) {
    if (ws.readyState !== 1) continue;
    if (pred && !pred(ws, meta)) continue;
    send(ws, obj);
  }
}

function rosterExcept(excludeWs) {
  /** @type {Array<{ id: string; name: string; pub: string | null }>} */
  const list = [];
  for (const [w, m] of clients) {
    if (w === excludeWs || w.readyState !== 1) continue;
    list.push({ id: m.id, name: m.name, pub: m.pub });
  }
  return list;
}

const wss = new WebSocketServer({ host: HOST, port: PORT });

wss.on('listening', () => {
  console.log(`[lan-chat-server] ws://${HOST}:${PORT} (cipher 由客户端加密，本服务不读取明文)`);
});

wss.on('error', (err) => { console.error('[lan-chat-server] 服务器错误：', err); });

wss.on('connection', (ws) => {
  if (clients.size >= 100) { ws.close(1013, 'Too many connections'); return; }
  const id = randomId();
  clients.set(ws, { id, name: '匿名', rooms: new Set(), pub: null });

  send(ws, { t: 'welcome', id });

  for (const p of rosterExcept(ws)) {
    send(ws, { t: 'peer', peer: p });
  }

  ws.on('message', (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }
    const meta = clients.get(ws);
    if (!meta || !data || typeof data !== 'object') return;

    if (data.t === 'hello') {
      meta.name = String(data.name || '匿名').trim().slice(0, 32) || '匿名';
      if (typeof data.pub === 'string' && data.pub.length > 0 && data.pub.length <= 200) {
        meta.pub = data.pub;
      }
      broadcast({ t: 'peer', peer: { id: meta.id, name: meta.name, pub: meta.pub } }, (w) => w !== ws);
    }

    if (data.t === 'pub' && typeof data.pub === 'string') {
      meta.pub = data.pub;
      broadcast({ t: 'peer', peer: { id: meta.id, name: meta.name, pub: meta.pub } });
    }

    if (data.t === 'join' && data.room) {
      const room = sanitizeRoom(data.room);
      meta.rooms.add(room);
      send(ws, { t: 'joined', room });
    }

    if (data.t === 'leave' && data.room) {
      meta.rooms.delete(sanitizeRoom(data.room));
    }

    if (data.t === 'room' && data.room && typeof data.cipher === 'string') {
      if (data.cipher.length > 65536) { send(ws, { t: 'error', msg: 'cipher too large' }); return; }
      const room = sanitizeRoom(data.room);
      if (!meta.rooms.has(room)) return;
      broadcast(
        { t: 'room', from: meta.id, room, cipher: data.cipher },
        (w, m) => m.rooms.has(room) && w !== ws
      );
    }

    if (data.t === 'dm' && data.to && typeof data.cipher === 'string') {
      if (data.cipher.length > 65536) { send(ws, { t: 'error', msg: 'cipher too large' }); return; }
      for (const [w, m] of clients) {
        if (m.id === data.to) {
          send(w, { t: 'dm', from: meta.id, cipher: data.cipher });
          return;
        }
      }
    }
  });

  ws.on('error', (err) => { console.error('[lan-chat-server] 客户端错误：', err); });

  ws.on('close', () => {
    const m = clients.get(ws);
    clients.delete(ws);
    if (m) {
      broadcast({ t: 'peer_left', id: m.id });
    }
  });
});
