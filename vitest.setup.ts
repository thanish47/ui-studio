/**
 * Vitest setup file
 * Polyfills for browser APIs needed in tests
 */

import 'fake-indexeddb/auto';

// Polyfill for BroadcastChannel
if (typeof BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel extends EventTarget {
    name: string;
    private static channels = new Map<string, Set<BroadcastChannel>>();

    constructor(name: string) {
      super();
      this.name = name;

      if (!BroadcastChannel.channels.has(name)) {
        BroadcastChannel.channels.set(name, new Set());
      }
      BroadcastChannel.channels.get(name)!.add(this);
    }

    postMessage(message: any) {
      const channels = BroadcastChannel.channels.get(this.name);
      if (channels) {
        channels.forEach((channel) => {
          if (channel !== this) {
            const event = new MessageEvent('message', { data: message });
            channel.dispatchEvent(event);
          }
        });
      }
    }

    close() {
      const channels = BroadcastChannel.channels.get(this.name);
      if (channels) {
        channels.delete(this);
        if (channels.size === 0) {
          BroadcastChannel.channels.delete(this.name);
        }
      }
    }
  } as any;
}

// Polyfill for crypto.randomUUID if not available
if (typeof crypto === 'undefined') {
  global.crypto = {
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
  } as any;
} else if (!crypto.randomUUID) {
  crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}
