import { Context } from 'telegraf';
import { IssueCard } from '@temix/types';

export class IssueCardView {
  static async send(ctx: Context, issue: IssueCard) {
    const typeEmoji = {
      deterministic: '🚫',
      heuristic: '⚠️',
      internal_error: '💥',
    };

    const text = `${typeEmoji[issue.violationType]} *Constraint Violation*
ID: \`${issue.constraintId}\`

${issue.humanReadableMessage}

${issue.affectedField ? `*Affected Field:* \`${issue.affectedField}\`` : ''}
${issue.suggestedCorrection ? `*Suggestion:* ${issue.suggestedCorrection}` : ''}
`;

    await ctx.reply(text, { parse_mode: 'Markdown' });
  }
}
