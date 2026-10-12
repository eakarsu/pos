import type { Request, Response } from 'express';
import type { Prisma, PrismaClient } from '@prisma/client';

export function aiRequestScope(req: Request, res: Response) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const close = () => { if (!res.writableFinished) abort(); };
  req.once('aborted', abort); res.once('close', close);
  if (req.aborted || res.destroyed) abort();
  return {
    signal: controller.signal,
    dispose() { req.removeListener('aborted', abort); res.removeListener('close', close); },
  };
}

export function reviewFocus(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > 2000) {
    throw Object.assign(new Error('Review focus must be text of up to 2,000 characters.'), { status: 400 });
  }
  return value.trim();
}

export async function saveAIResult(prisma: PrismaClient, data: Prisma.AiResultUncheckedCreateInput, signal: AbortSignal) {
  return saveAI(prisma, signal, transaction => transaction.aiResult.create({ data }));
}

export async function saveAI<T>(prisma: PrismaClient, signal: AbortSignal, operation: (transaction: Prisma.TransactionClient) => Promise<T>) {
  signal.throwIfAborted();
  return prisma.$transaction(async transaction => {
    signal.throwIfAborted();
    const saved = await operation(transaction);
    signal.throwIfAborted();
    return saved;
  });
}
