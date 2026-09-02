/// <reference types="vite/client" />

interface MuxPlayerElement extends HTMLElement {
  playbackId: string;
  streamType: string;
  addEventListener(type: 'ended', listener: (this: HTMLElement, ev: Event) => void): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare global {
  interface Window {
    HTMLElement: typeof HTMLElement;
  }
  namespace JSX {
    interface IntrinsicElements {
      'mux-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'playback-id'?: string;
        'stream-type'?: string;
      }, HTMLElement>;
    }
  }
}
