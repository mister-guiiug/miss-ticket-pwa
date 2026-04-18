/**
 * Client WebSocket pour Miss Ticket PWA
 * Permet la communication avec l'application desktop
 */

export interface SessionState {
  instance_id: string;
  email: string;
  concert_url: string;
  status: string;
  queue_position: string;
  proxy: string;
  effective_ip: string;
  timestamp: number;
}

export interface WebSocketMessage {
  type: 'state' | 'session_update' | 'session_removed' | 'response' | 'error';
  sessions?: SessionState[];
  data?: SessionState;
  instance_id?: string;
  message?: string;
  action?: string;
  success?: boolean;
}

export type MessageHandler = (message: WebSocketMessage) => void;

export class DesktopBridge {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isManualClose = false;

  constructor(url: string = 'ws://127.0.0.1:8765') {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.isManualClose = false;
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
          console.log('[PWA] Connecté au desktop:', this.url);
          this.reconnectAttempts = 0;
          resolve();
        };
        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this._handleMessage(message);
          } catch (e) {
            console.error('[PWA] Erreur parsing message:', e);
          }
        };
        this.ws.onclose = () => {
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectDelay);
          }
        };
        this.ws.onerror = (error) => {
          console.error('[PWA] Erreur WebSocket:', error);
          reject(error);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(message: Record<string, unknown>): void {
    if (!this.connected) return;
    this.ws!.send(JSON.stringify(message));
  }

  private _handleMessage(message: WebSocketMessage): void {
    const { type } = message;
    if (type && this.handlers.has(type)) {
      this.handlers.get(type)!.forEach(handler => handler(message));
    }
    if (this.handlers.has('*')) {
      this.handlers.get('*')!.forEach(handler => handler(message));
    }
  }

  on(type: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      const handlers = this.handlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(type);
        }
      }
    };
  }

  getState(): void {
    this.send({ action: 'get_state' });
  }

  launchSession(email: string, password: string, concertUrl: string, proxy?: unknown): void {
    this.send({ action: 'launch_session', email, password, concert_url: concertUrl, proxy });
  }

  stopSession(instanceId: string): void {
    this.send({ action: 'stop_session', instance_id: instanceId });
  }

  stopAllSessions(): void {
    this.send({ action: 'stop_all' });
  }
}

let bridge: DesktopBridge | null = null;

export function getDesktopBridge(): DesktopBridge {
  if (!bridge) {
    bridge = new DesktopBridge();
  }
  return bridge;
}
