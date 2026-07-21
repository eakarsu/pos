import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';

export async function appendOperationalAudit(
  tx: Prisma.TransactionClient,
  input: {
    locationId: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    outcome: string;
    metadata?: Record<string, unknown>;
  },
) {
  const previous = await tx.operationalAudit.findFirst({
    where: { locationId: input.locationId },
    orderBy: { sequence: 'desc' },
    select: { sequence: true, eventHash: true },
  });
  const sequence = (previous?.sequence ?? 0n) + 1n;
  const previousHash = previous?.eventHash ?? 'GENESIS';
  const createdAt = new Date();
  const material = {
    locationId: input.locationId,
    sequence: sequence.toString(),
    actorId: input.actorId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    outcome: input.outcome,
    metadata: input.metadata ?? {},
    previousHash,
    createdAt: createdAt.toISOString(),
  };
  return tx.operationalAudit.create({
    data: {
      ...material,
      sequence,
      metadata: material.metadata as Prisma.InputJsonValue,
      eventHash: createHash('sha256').update(JSON.stringify(material)).digest('hex'),
      createdAt,
    },
  });
}
