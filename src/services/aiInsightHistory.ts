import type { Prisma, PrismaClient, AiInsight } from '@prisma/client';
import { saveAI } from './aiCancellation';

async function activeActor(transaction: Prisma.TransactionClient, actorId: string) {
  const actor = await transaction.user.findUnique({ where: { id: actorId }, select: { isActive: true } });
  if (!actor?.isActive) throw Object.assign(new Error('Your account is no longer active.'), { status: 401 });
}

export function saveInsight(prisma: PrismaClient, actorId: string, type: string, input: unknown, output: unknown, signal: AbortSignal) {
  return saveAI(prisma, signal, async transaction => {
    await activeActor(transaction, actorId);
    const saved = await transaction.aiInsight.create({ data: { type, payload: JSON.stringify({ requesterId: actorId, input, output }) } });
    signal.throwIfAborted();
    await activeActor(transaction, actorId);
    return saved;
  });
}

export async function ownedInsights(prisma: PrismaClient, actorId: string, type: string, limit: unknown = 5) {
  const parsed = Number(limit);
  const take = Number.isFinite(parsed) ? Math.min(20, Math.max(1, Math.floor(parsed))) : 5;
  // Older ownerless receipts stay retained. Ownership is the top-level JSON key,
  // never a substring in the report or user-supplied review focus.
  return prisma.$queryRaw<AiInsight[]>`SELECT id, type, payload, "generatedAt" FROM ai_insights
    WHERE type=${type} AND COALESCE(payload::jsonb->>'requesterId',payload::jsonb->>'actorId')=${actorId}
    ORDER BY "generatedAt" DESC, id DESC LIMIT ${take}`;
}
