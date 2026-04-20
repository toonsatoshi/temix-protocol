import { Telegraf } from 'telegraf';
import * as dotenv from 'dotenv';
import { messageHandler } from './handlers/message';
import { callbackHandler } from './handlers/callback';

dotenv.config({ override: true }); 
console.log('Environment variables loaded from .env');

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

export const bot = new Telegraf(token);

// Middleware for logging/auth
bot.use(async (ctx, next) => {
  const start = Date.now();
  const updateType = ctx.updateType;
  const from = ctx.from ? `@${ctx.from.username || ctx.from.id}` : 'unknown';
  
  let detail = '';
  if (ctx.message && 'text' in ctx.message) {
    detail = `: "${ctx.message.text}"`;
  } else if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
    detail = `: (callback) "${ctx.callbackQuery.data}"`;
  }

  console.log(`[BOT] Incoming ${updateType} from ${from}${detail} (ID: ${ctx.update.update_id})`);
  
  await next();
  
  const ms = Date.now() - start;
  console.log(`[BOT] Handled ${updateType} in ${ms}ms`);
});

// Register handlers
bot.on('text', messageHandler);
bot.on('callback_query', callbackHandler);

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
    console.log('Starting bot in long-polling mode...');
    await bot.launch();
    console.log('Bot is ready and listening for messages.');
  }

  // Enable graceful stop
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
