import { Context, Markup } from 'telegraf';
import { PartialResolution } from '@temix/types';

export class AuditCardView {
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static async send(ctx: Context, sessionId: string, partial: PartialResolution) {
    const reason = this.escapeHtml(partial.partialJusEntry.reason);
    const unresolved = this.escapeHtml(partial.partialJusEntry.unresolvedFields.join(', '));

    const text = `🛠️ <b>Resolution Audit Required</b>\n\n` +
      `<b>Reason:</b> ${reason}\n` +
      `<b>Unresolved:</b> <code>${unresolved}</code>\n\n` +
      `The AI engine needs more information to complete the Tact-to-UI mapping. Please provide more details or clarify your intent.`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('📝 Provide Clarification', `audit_clarify_${sessionId}`)],
      [Markup.button.callback('❌ Cancel Request', `audit_cancel_${sessionId}`)]
    ]);

    await ctx.reply(text, { 
      parse_mode: 'HTML',
      ...keyboard
    });
  }
}
