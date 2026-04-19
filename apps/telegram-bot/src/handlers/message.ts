import { Context } from 'telegraf';
import { Pipeline } from '@temix/pipeline';
import { prisma } from '@temix/db';
import { EventLog, Replayer } from '@temix/event-log';
import { PipelineStatusView } from '../views/pipelineStatus';
import { IssueCardView } from '../views/issueCard';
import { CanonicalState } from '@temix/types';

const pipeline = new Pipeline(process.env.DEEPSEEK_API_KEY!);

export const messageHandler = async (ctx: Context) => {
  if (!ctx.message || !('text' in ctx.message)) return;

  const telegramId = ctx.from!.id.toString();
  const intent = ctx.message.text;

  // 1. Get or Create User & Project
  let user = await prisma.user.findUnique({
    where: { telegramId },
    include: { projects: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { telegramId },
      include: { projects: true },
    });
  }

  let project = user.projects[0];
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Default Project',
        ownerId: user.id,
      },
    });
  }

  // 2. Initial Feedback
  const statusMsg = await PipelineStatusView.sendInitialStatus(ctx);

  try {
    // 3. Reconstruct Canonical State
    const events = EventLog.replay(project.id);
    const state: CanonicalState = await Replayer.replay(project.id, events);

    // 4. Execute Pipeline
    const result = await pipeline.execute(
      {
        projectId: project.id,
        userId: user.id,
        type: 'declarative',
        content: intent,
      },
      state,
      (stage) => PipelineStatusView.updateStatus(ctx, statusMsg.message_id, stage)
    );

    // 5. Handle Results
    if (result.status === 'committed') {
      await PipelineStatusView.sendFinalSuccess(ctx, statusMsg.message_id, result.event.hash);
    } else if (result.status === 'rejected') {
      await PipelineStatusView.updateStatus(ctx, statusMsg.message_id, 'Rejected');
      await IssueCardView.send(ctx, result.issueCard);
    } else if (result.status === 'awaiting_audit') {
      await PipelineStatusView.sendAwaitingAudit(ctx, statusMsg.message_id, result.auditSessionId);
    }

  } catch (error: any) {
    console.error('Pipeline execution failed:', error);
    await ctx.reply(`❌ Pipeline execution failed: ${error.message}`);
  }
};
