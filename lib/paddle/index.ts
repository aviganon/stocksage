import { Paddle, Environment } from '@paddle/paddle-node-sdk';

let _paddle: Paddle | null = null;

export function getPaddle(): Paddle {
  if (!_paddle) {
    const key = process.env.PADDLE_API_KEY;
    if (!key) throw new Error('PADDLE_API_KEY is not set');
    const isLive = key.startsWith('pdl_live');
    _paddle = new Paddle(key, {
      environment: isLive ? Environment.production : Environment.sandbox,
    });
  }
  return _paddle;
}

export const PADDLE_PRICES: Record<'standard' | 'deep', string> = {
  standard: process.env.PADDLE_STANDARD_PRICE_ID ?? '',
  deep:     process.env.PADDLE_DEEP_PRICE_ID ?? '',
};

export const PADDLE_AMOUNTS: Record<'standard' | 'deep', string> = {
  standard: '$1.99',
  deep:     '$3.99',
};
