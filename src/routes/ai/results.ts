import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/ai/results
 * Paginated browsing of all persisted AI invocations across features.
 * Query: ?feature=&page=&pageSize=&status=
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize || '20'), 10)));
    const where: any = {};
    if (req.query.feature) where.feature = String(req.query.feature);
    if (req.query.status) where.status = String(req.query.status);

    const [items, total] = await Promise.all([
      prisma.aiResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.aiResult.count({ where }),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.aiResult.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ success: false, message: 'not found' });
    res.json({ success: true, data: item });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
