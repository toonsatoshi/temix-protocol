import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { messageHandler } from './handlers/message';

dotenv.config(); // Looks for .env in process.cwd()

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

export const bot = new Telegraf(token);

// Middleware for logging/auth could go here

// Register handlers
bot.on('text', messageHandler);

// Command examples
bot.start((ctx) => ctx.reply('Welcome to Temix Protocol. Send me your intent to begin.'));

export async function launchBot() {
  const mode = process.env.BOT_MODE || 'polling';
  
  if (mode === 'webhook') {
    const url = process.env.WEBHOOK_URL;
    if (!url) throw new Error('WEBHOOK_URL is required for webhook mode');
    console.log(`Starting bot in webhook mode at ${url}`);
    await bot.launch({
      webhook: {
        domain: url,
        port: Number(process.env.PORT) || 3000,
      },
    });
  } else {
    console.log('Starting bot in long-polling mode');
    await bot.launch();
  }

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
