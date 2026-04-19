import { Context } from 'telegraf';

export class PipelineStatusView {
  static async sendInitialStatus(ctx: Context) {
    return await ctx.reply('🔍 Thinking...', { parse_mode: 'Markdown' });
  }

  static async updateStatus(ctx: Context, messageId: number, stage: string) {
    const statusMap: Record<string, string> = {
      'Stage 1': '📥 Ingesting intent...',
      'Stage 2': '🤖 Resolving Tact deltas and JUS mappings...',
      'Stage 3': '🛡️ Validating security constraints...',
      'Stage 4': '⛓️ Committing to event log...',
      'Stage 5': '🏗️ Materializing file tree...',
      'Stage 6': '🌐 Exposing updated interface...',
    };

    const text = `🔄 ${statusMap[stage] || `Processing ${stage}...`}`;
    try {
      await ctx.telegram.editMessageText(ctx.chat!.id, messageId, undefined, text);
    } catch (e) {
      // Ignore "message is not modified" errors
    }
  }

  static async sendFinalSuccess(ctx: Context, messageId: number, eventHash: string) {
    const text = `✅ *Success!*
State Transition committed.
Hash: \`${eventHash}\`

Interface updated. View in Mini App.`;
    await ctx.telegram.editMessageText(ctx.chat!.id, messageId, undefined, text, { parse_mode: 'Markdown' });
  }

  static async sendAwaitingAudit(ctx: Context, messageId: number, sessionId: string) {
    const text = `⚠️ *Audit Required*
DeepSeek reached a non-deterministic boundary. Please verify the proposed mappings in the Resolution Audit card.
Session ID: \`${sessionId}\``;
    await ctx.telegram.editMessageText(ctx.chat!.id, messageId, undefined, text, { parse_mode: 'Markdown' });
  }
}
