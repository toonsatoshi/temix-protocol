import { Context } from 'telegraf';

export const callbackHandler = async (ctx: Context) => {
  if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

  const data = ctx.callbackQuery.data;

  if (data.startsWith('audit_clarify_')) {
    const sessionId = data.replace('audit_clarify_', '');
    await ctx.answerCbQuery();
    await ctx.reply(`Please provide your clarification for session \`${sessionId}\`. You can simply type your answer below.`, { parse_mode: 'Markdown' });
    // In a real implementation, we would set a session state to capture the next message as clarification
  } else if (data.startsWith('audit_cancel_')) {
    await ctx.answerCbQuery('Request cancelled');
    await ctx.editMessageText('❌ Request cancelled.');
  }
};
