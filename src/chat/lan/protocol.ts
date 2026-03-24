export type ServerToClient =
  | { t: 'welcome'; id: string }
  | { t: 'peer'; peer: { id: string; name: string; pub: string | null } }
  | { t: 'peer_left'; id: string }
  | { t: 'joined'; room: string }
  | { t: 'room'; from: string; room: string; cipher: string }
  | { t: 'dm'; from: string; cipher: string };

export type ClientToServer =
  | { t: 'hello'; name: string; pub?: string }
  | { t: 'pub'; pub: string }
  | { t: 'join'; room: string }
  | { t: 'leave'; room: string }
  | { t: 'room'; room: string; cipher: string }
  | { t: 'dm'; to: string; cipher: string };
