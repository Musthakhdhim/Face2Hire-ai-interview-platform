declare global {
  interface Window {
    global?: Window;
  }
}

if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}

import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface RealtimeEventDto<T = unknown> {
  eventType: string;
  entityId: number | null;
  payload: T;
  timestamp: string;
}

type TopicCallback = (event: RealtimeEventDto) => void;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private topicListeners: Map<string, Set<TopicCallback>> = new Map();
  private activeStompSubs: Map<string, StompSubscription> = new Map();

  ensureConnected() {
    if (this.client && this.client.active) {
      return;
    }

    const token = localStorage.getItem('accessToken') || '';
    const wsUrl = `${API_BASE_URL}/ws/interview${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 4000,
      debug: () => {},
      onConnect: () => {
        this.isConnected = true;
        this.resubscribeAllTopics();
      },
      onDisconnect: () => {
        this.isConnected = false;
        this.activeStompSubs.clear();
      },
      onWebSocketClose: () => {
        this.isConnected = false;
        this.activeStompSubs.clear();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
      },
    });

    this.client.activate();
  }

  subscribe(topic: string, callback: TopicCallback): () => void {
    this.ensureConnected();

    let listeners = this.topicListeners.get(topic);
    if (!listeners) {
      listeners = new Set();
      this.topicListeners.set(topic, listeners);
    }
    listeners.add(callback);

    if (this.isConnected && this.client && !this.activeStompSubs.has(topic)) {
      this.subscribeStompTopic(topic);
    }

    return () => {
      const set = this.topicListeners.get(topic);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.topicListeners.delete(topic);
          const sub = this.activeStompSubs.get(topic);
          if (sub) {
            try {
              sub.unsubscribe();
            } catch {
              // ignore
            }
            this.activeStompSubs.delete(topic);
          }
        }
      }
    };
  }

  private resubscribeAllTopics() {
    if (!this.client || !this.isConnected) return;
    for (const topic of this.topicListeners.keys()) {
      if (!this.activeStompSubs.has(topic)) {
        this.subscribeStompTopic(topic);
      }
    }
  }

  private subscribeStompTopic(topic: string) {
    if (!this.client || !this.isConnected) return;
    try {
      const sub = this.client.subscribe(topic, (msg: IMessage) => {
        try {
          const parsed: RealtimeEventDto = JSON.parse(msg.body);
          const listeners = this.topicListeners.get(topic);
          if (listeners) {
            listeners.forEach((cb) => cb(parsed));
          }
        } catch (err) {
          console.error('Failed to parse realtime message on topic', topic, err);
        }
      });
      this.activeStompSubs.set(topic, sub);
    } catch (err) {
      console.error('Failed to subscribe to STOMP topic', topic, err);
    }
  }

  disconnect() {
    this.isConnected = false;
    this.activeStompSubs.clear();
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
  }
}

export const websocketService = new WebSocketService();
