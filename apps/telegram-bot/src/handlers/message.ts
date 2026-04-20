import { Context } from 'telegraf';
import { Pipeline } from '@temix/pipeline';
import { entities } from '@temix/db';
import { EventLog, Replayer } from '@temix/event-log';
import { PipelineStatusView } from '../views/pipelineStatus';
import { IssueCardView } from '../views/issueCard';
import { AuditCardView } from '../views/auditCard';
import { CanonicalState } from '@temix/types';

const pipeline = new Pipeline(process.env.DEEPSEEK_API_KEY!);

export const messageHandler = async (ctx: Context) => {
  if (!ctx.message || !('text' in ctx.message)) return;

  const telegramId = ctx.from!.id.toString();
  const intent = ctx.message.text;
  const username = ctx.from!.username || telegramId;

  console.log(`[HANDLER] Processing message from @${username}: "${intent}"`);

  // 1. Get or Create User & Project
  let users = await (entities.User.filter({ telegramId }) as any);
  console.log(`[HANDLER] User lookup for ${telegramId} returned:`, JSON.stringify(users));
  let user = users[0];

  if (!user) {
    console.log(`[HANDLER] New user detected, creating profile for ${telegramId}`);
    user = await entities.User.create({
      telegramId,
      email: `${ctx.from?.username || telegramId}@telegram.com`,
      full_name: `${ctx.from?.first_name || ''} ${ctx.from?.last_name || ''}`.trim() || 'Telegram User',
    });
    console.log(`[HANDLER] Created user:`, JSON.stringify(user));
  }

  let projects = await (entities.Project.filter({ ownerId: user.id }) as any);
  let project = projects[0];

  if (!project) {
    console.log(`[HANDLER] No project found for user ${user.id}, creating "Default Project"`);
    project = await entities.Project.create({
      name: 'Default Project',
      ownerId: user.id,
    });
    console.log(`[HANDLER] Created project:`, JSON.stringify(project));
  }

  console.log(`[HANDLER] Project Context: ${project.id} (Owner: ${user.id})`);

  // 2. Initial Feedback
  const statusMsg = await PipelineStatusView.sendInitialStatus(ctx);

  try {
    // 3. Reconstruct Canonical State
    console.log(`[HANDLER] Reconstructing canonical state for project ${project.id}...`);
    const events = EventLog.replay(project.id);
    const state: CanonicalState = await Replayer.replay(project.id, events);
    console.log(`[HANDLER] State reconstructed. Head: ${state.eventLogHead}`);

    // 4. Execute Pipeline
    console.log(`[HANDLER] Starting pipeline execution...`);
    const result = await pipeline.execute(
      {
        projectId: project.id,
        userId: user.id,
        type: 'declarative',
        content: intent,
      },
      state,
      (stage) => {
        console.log(`[PIPELINE] ${stage} complete.`);
        PipelineStatusView.updateStatus(ctx, statusMsg.message_id, stage);
      }
    );

    // 5. Handle Results
    console.log(`[HANDLER] Pipeline result: ${result.status}`);
    if (result.status === 'committed') {
      await PipelineStatusView.sendFinalSuccess(ctx, statusMsg.message_id, result.event.hash);
      console.log(`[HANDLER] Success! Event committed with hash: ${result.event.hash}`);
    } else if (result.status === 'rejected') {
      await PipelineStatusView.updateStatus(ctx, statusMsg.message_id, 'Rejected');
      await IssueCardView.send(ctx, result.issueCard);
      console.log(`[HANDLER] Rejected: ${result.issueCard.humanReadableMessage}`);
    } else if (result.status === 'awaiting_audit') {
      await PipelineStatusView.sendAwaitingAudit(ctx, statusMsg.message_id, result.auditSessionId);
      await AuditCardView.send(ctx, result.auditSessionId, result.partialResolution);
      console.log(`[HANDLER] Awaiting audit: Session ${result.auditSessionId}`);
    }

  } catch (error: any) {
    console.error('[HANDLER] Pipeline execution failed:', error);
    await ctx.reply(`❌ Pipeline execution failed: ${error.message}`);
  }
};
