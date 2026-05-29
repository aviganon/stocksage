'use client';

import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string; eventCallback?: (e: unknown) => void }) => void;
      Checkout: {
        open: (opts: {
          transactionId: string;
          settings?: {
            displayMode?: 'overlay' | 'inline';
            locale?: string;
            successUrl?: string;
            frameTarget?: string;
            frameInitialHeight?: number;
          };
        }) => void;
        close: () => void;
      };
    };
  }
}

let paddleLoaded = false;

function loadPaddleScript(): Promise<void> {
  if (paddleLoaded || typeof window === 'undefined') return Promise.resolve();
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.onload = () => { paddleLoaded = true; resolve(); };
    document.head.appendChild(script);
  });
}

function initPaddle() {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token || !window.Paddle) return;
  const isLive = token.startsWith('live_');
  if (!isLive) window.Paddle.Environment.set('sandbox');
  window.Paddle.Initialize({ token });
}

export function usePaddleCheckout() {
  useEffect(() => {
    loadPaddleScript().then(initPaddle);
  }, []);

  const openCheckout = useCallback(async (
    transactionId: string,
    successUrl: string,
  ) => {
    await loadPaddleScript();
    initPaddle();
    if (!window.Paddle) {
      window.location.href = `https://checkout.paddle.com/checkout/${transactionId}`;
      return;
    }
    window.Paddle.Checkout.open({
      transactionId,
      settings: {
        displayMode: 'overlay',
        successUrl,
      },
    });
  }, []);

  return { openCheckout };
}
