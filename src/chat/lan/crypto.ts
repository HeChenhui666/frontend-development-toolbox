/**
 * Web Crypto：群聊用「房间口令 + 房间名」PBKDF2 派生 AES-GCM；
 * 私聊用 ECDH(P-256) + HKDF 派生 AES-GCM（中继只见密文与 from/to/room 元数据）。
 */

const PBKDF2_ITERATIONS = 120000;
const HKDF_SALT_UTF8 = 'toolbox-lan-dm-hkdf-v1';

function u8ToB64(u8: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
  return btoa(bin);
}

function b64ToU8(b64: string): Uint8Array {
  const bin = atob(b64.trim());
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

export async function deriveRoomKey(roomId: string, passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rid = roomId.trim().slice(0, 128);
  const salt = enc.encode(`toolbox-lan-room-v2::${rid}`);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptText(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  );
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return u8ToB64(combined);
}

export async function decryptText(key: CryptoKey, payload: string): Promise<string> {
  const combined = b64ToU8(payload);
  if (combined.length < 13) throw new Error('invalid payload');
  const iv = combined.slice(0, 12);
  const ct = combined.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

export async function encryptChatEnvelope(key: CryptoKey, text: string): Promise<string> {
  const plain = JSON.stringify({ text, ts: Date.now() });
  return encryptText(key, plain);
}

export type ChatEnvelope = { text: string; ts: number };

export async function decryptChatEnvelope(key: CryptoKey, cipher: string): Promise<ChatEnvelope> {
  const raw = await decryptText(key, cipher);
  const o = JSON.parse(raw) as ChatEnvelope;
  if (typeof o?.text !== 'string') throw new Error('invalid envelope');
  return o;
}

export async function generateEcdhKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
}

export async function exportEcdhPublicSpki(publicKey: CryptoKey): Promise<string> {
  const buf = await crypto.subtle.exportKey('spki', publicKey);
  return u8ToB64(new Uint8Array(buf));
}

export async function importEcdhPeerPublic(spkiB64: string): Promise<CryptoKey> {
  const raw = b64ToU8(spkiB64);
  return crypto.subtle.importKey('spki', raw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

export async function deriveDmAesKey(
  myPrivateKey: CryptoKey,
  peerPublicKey: CryptoKey,
  myId: string,
  peerId: string
): Promise<CryptoKey> {
  const [a, b] = myId < peerId ? [myId, peerId] : [peerId, myId];
  const bits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey },
    myPrivateKey,
    256
  );
  const enc = new TextEncoder();
  const ikm = await crypto.subtle.importKey('raw', bits, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      salt: enc.encode(HKDF_SALT_UTF8),
      info: enc.encode(`${a}|${b}`),
      hash: 'SHA-256',
    },
    ikm,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}
