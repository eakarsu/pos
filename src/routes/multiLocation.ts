import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';

/**
 * Multi-Location Inventory Sync — central HQ dashboard with real-time stock view
 * across stores. Lean v0: in-memory location registry + sync state.
 *
 * Endpoints:
 *   POST /api/v1/multi-location/register    — register a store
 *   POST /api/v1/multi-location/sync        — push current stock from a store
 *   GET  /api/v1/multi-location/snapshot    — aggregated HQ view
 *   POST /api/v1/multi-location/transfer    — request inventory transfer
 */
const router = Router();

interface StoreSnapshot {
  storeId: string;
  storeName: string;
  region?: string;
  inventory: Record<string, number>;
  lastSyncedAt: string;
}

interface TransferRequest {
  id: string;
  fromStore: string;
  toStore: string;
  sku: string;
  quantity: number;
  status: 'pending' | 'approved' | 'shipped' | 'received';
  createdAt: string;
}

const stores = new Map<string, StoreSnapshot>();
const transfers = new Map<string, TransferRequest>();

router.post('/register', authenticate, (req: AuthRequest, res: Response) => {
  const { storeId, storeName, region } = req.body || {};
  if (!storeId || !storeName) {
    return res.status(400).json({ success: false, message: 'storeId and storeName required' });
  }
  stores.set(storeId, {
    storeId,
    storeName,
    region,
    inventory: {},
    lastSyncedAt: new Date().toISOString(),
  });
  res.json({ success: true, store: stores.get(storeId) });
});

router.post('/sync', authenticate, (req: AuthRequest, res: Response) => {
  const { storeId, inventory } = req.body || {};
  const store = stores.get(storeId);
  if (!store) return res.status(404).json({ success: false, message: 'store not registered' });
  store.inventory = inventory || {};
  store.lastSyncedAt = new Date().toISOString();
  stores.set(storeId, store);
  res.json({ success: true, store });
});

router.get('/snapshot', authenticate, (_req: AuthRequest, res: Response) => {
  const totals: Record<string, number> = {};
  stores.forEach((s) => {
    Object.entries(s.inventory).forEach(([sku, qty]) => {
      totals[sku] = (totals[sku] || 0) + Number(qty || 0);
    });
  });
  res.json({
    success: true,
    storeCount: stores.size,
    aggregatedTotals: totals,
    stores: Array.from(stores.values()),
  });
});

router.post('/transfer', authenticate, (req: AuthRequest, res: Response) => {
  const { fromStore, toStore, sku, quantity } = req.body || {};
  if (!fromStore || !toStore || !sku || !quantity) {
    return res.status(400).json({ success: false, message: 'fromStore, toStore, sku, quantity required' });
  }
  const id = `xfer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const t: TransferRequest = {
    id,
    fromStore,
    toStore,
    sku,
    quantity: Number(quantity),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  transfers.set(id, t);
  res.json({ success: true, transfer: t });
});

export default router;
