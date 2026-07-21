import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(authorize('ADMIN', 'MANAGER', 'CASHIER'));

// Historical sales remain readable for reports and receipt lookup.
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, status, userId } = req.query;
    const pageNumber = Math.max(1, Number(page));
    const limitNumber = Math.min(100, Math.max(1, Number(limit)));
    const where: any = {};
    if (startDate && endDate) where.createdAt = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
    if (status) where.status = status;
    if (userId) where.userId = userId as string;
    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: { customer: true, user: { select: { id: true, firstName: true, lastName: true, username: true } }, items: { include: { product: true, variant: true } }, payments: true },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sale.count({ where }),
    ]);
    res.json({ success: true, data: { sales, pagination: { page: pageNumber, limit: limitNumber, total, pages: Math.ceil(total / limitNumber) } } });
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const sale = await prisma.sale.findUnique({ where: { id: req.params.id }, include: { customer: true, user: { select: { id: true, firstName: true, lastName: true, username: true } }, items: { include: { product: true, variant: true } }, payments: true, returns: true } });
    if (!sale) throw new AppError('Sale not found', 404);
    res.json({ success: true, data: { sale } });
  } catch (error) { next(error); }
});

router.post('/', (_req, res) => res.status(410).json({ success: false, code: 'LEGACY_SALE_WRITE_RETIRED', message: 'Use /api/v1/operations/checkouts; client-priced direct sales are retired.' }));
router.patch('/:id/status', (_req, res) => res.status(410).json({ success: false, code: 'LEGACY_SALE_STATUS_RETIRED', message: 'Use the manager-approved operations refund and reconciliation workflows.' }));

export default router;
