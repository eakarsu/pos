import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, ExclamationTriangleIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../utils/SettingsContext';
import SortableHeader from '../components/SortableHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import DetailPanel from '../components/DetailPanel';
import BulkUpdateModal from '../components/BulkUpdateModal';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  quantity: number;
  reservedQty: number;
  location?: string;
  batchNumber?: string;
  expirationDate?: string;
  lastUpdated: string;
  product?: {
    id: string;
    name: string;
    sku: string;
    price: number;
    minStock: number;
    reorderPoint: number;
    category?: { name: string };
    supplier?: { name: string };
  };
  variant?: {
    id: string;
    name: string;
    value: string;
  };
  movements?: Array<{
    id: string;
    type: string;
    quantity: number;
    reason?: string;
    createdAt: string;
    user?: { firstName: string; lastName: string };
  }>;
}

const Inventory: React.FC = () => {
  const { settings } = useSettings();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sort state
  const [sortField, setSortField] = useState('lastUpdated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean; title: string; message: string;
    variant: 'danger' | 'warning' | 'info'; onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Detail panel state
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // Bulk update modal state
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [bulkUpdateLoading, setBulkUpdateLoading] = useState(false);

  // Adjustment form state
  const [adjustmentData, setAdjustmentData] = useState({
    productId: '', variantId: '', quantity: '', reason: '', batchNumber: ''
  });

  const fetchInventory = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        sortBy: sortField,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(showLowStock && { lowStock: 'true' })
      });

      const response = await fetch(`/api/v1/inventory?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.data.inventoryItems);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, showLowStock, sortField, sortOrder]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, searchTerm, showLowStock, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(inventoryItems.map(i => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/inventory/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...adjustmentData, quantity: parseInt(adjustmentData.quantity) })
      });

      if (response.ok) {
        fetchInventory();
        setShowAdjustmentModal(false);
        resetAdjustmentForm();
        toast.success('Adjustment applied');
      }
    } catch (error) {
      console.error('Error creating adjustment:', error);
    }
  };

  const resetAdjustmentForm = () => {
    setAdjustmentData({ productId: '', variantId: '', quantity: '', reason: '', batchNumber: '' });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Selected Inventory Items',
      message: `Are you sure you want to delete ${selectedIds.size} inventory item(s)? This will also delete their movement history.`,
      variant: 'danger',
      onConfirm: async () => {
        setConfirmLoading(true);
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch('/api/v1/inventory/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ids: Array.from(selectedIds) })
          });
          if (response.ok) {
            setSelectedIds(new Set());
            fetchInventory();
            toast.success(`${selectedIds.size} items deleted`);
          }
        } catch (error) {
          console.error('Error bulk deleting:', error);
        } finally {
          setConfirmLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleBulkUpdate = async (field: string, value: string) => {
    setBulkUpdateLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/v1/inventory/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ids: Array.from(selectedIds), updates: { field, value } })
      });
      if (response.ok) {
        setSelectedIds(new Set());
        setShowBulkUpdateModal(false);
        fetchInventory();
        toast.success(`${selectedIds.size} items updated`);
      }
    } catch (error) {
      console.error('Error bulk updating:', error);
    } finally {
      setBulkUpdateLoading(false);
    }
  };

  const handleRowClick = async (item: InventoryItem) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/v1/inventory/${item.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDetailItem(data.data.inventoryItem);
        setShowDetailPanel(true);
      }
    } catch (error) {
      console.error('Error fetching inventory detail:', error);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    const available = item.quantity - item.reservedQty;
    const lowStockThreshold = settings.pos.lowStockThreshold;
    const minStock = item.product?.minStock || lowStockThreshold;
    const reorderPoint = item.product?.reorderPoint || Math.floor(lowStockThreshold / 2);

    if (available <= 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (available <= reorderPoint) return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
    if (available <= minStock) return { status: 'low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const bulkUpdateFields = [
    { value: 'location', label: 'Location', type: 'text' as const },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <button
          onClick={() => setShowAdjustmentModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
          Stock Adjustment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{inventoryItems.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
          <p className="text-2xl font-bold text-yellow-600">
            {inventoryItems.filter(item => {
              const available = item.quantity - item.reservedQty;
              const threshold = item.product?.minStock || settings.pos.lowStockThreshold;
              return available <= threshold;
            }).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">
            {inventoryItems.filter(item => (item.quantity - item.reservedQty) <= 0).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">
            ${inventoryItems.reduce((sum, item) => sum + (item.quantity * (item.product?.price || 0)), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="lowStock"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="lowStock" className="ml-2 block text-sm text-gray-900">Show only low stock items</label>
          </div>
          <button
            onClick={() => { setSearchTerm(''); setShowLowStock(false); setCurrentPage(1); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-blue-700 font-medium">{selectedIds.size} item(s) selected</span>
          <div className="flex space-x-2">
            <button onClick={() => setShowBulkUpdateModal(true)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">Update Selected</button>
            <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700">Delete Selected</button>
            <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Clear</button>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input type="checkbox" checked={inventoryItems.length > 0 && selectedIds.size === inventoryItems.length} onChange={handleSelectAll} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <SortableHeader label="Available" field="quantity" currentSortField={sortField} currentSortOrder={sortOrder} onSort={handleSort} />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserved</th>
                <SortableHeader label="Location" field="location" currentSortField={sortField} currentSortOrder={sortOrder} onSort={handleSort} />
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <SortableHeader label="Last Updated" field="lastUpdated" currentSortField={sortField} currentSortOrder={sortOrder} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventoryItems.map((item) => {
                const stockStatus = getStockStatus(item);
                const available = item.quantity - item.reservedQty;

                return (
                  <tr key={item.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(item)}>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => handleSelectOne(item.id)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.product?.name}</div>
                      {item.variant && <div className="text-sm text-gray-500">{item.variant.name}: {item.variant.value}</div>}
                      <div className="text-sm text-gray-500">{item.product?.category?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.product?.sku}</div>
                      {item.batchNumber && <div className="text-sm text-gray-500">Batch: {item.batchNumber}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${stockStatus.color}`}>{available}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.reservedQty}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{item.location || 'Default'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                        {(stockStatus.status === 'out' || stockStatus.status === 'critical') && <ExclamationTriangleIcon className="h-3 w-3 mr-1" />}
                        {stockStatus.status === 'out' ? 'Out of Stock' :
                         stockStatus.status === 'critical' ? 'Critical' :
                         stockStatus.status === 'low' ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
            </p>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">Next</button>
            </nav>
          </div>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Adjustment</h3>
              <form onSubmit={handleAdjustment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product ID *</label>
                  <input type="text" required value={adjustmentData.productId} onChange={(e) => setAdjustmentData({ ...adjustmentData, productId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter product ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Adjustment *</label>
                  <input type="number" required value={adjustmentData.quantity} onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter quantity (+ or -)" />
                  <p className="text-xs text-gray-500 mt-1">Use positive numbers to add stock, negative to remove</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <select required value={adjustmentData.reason} onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select reason</option>
                    <option value="Stock Count">Stock Count</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Expired">Expired</option>
                    <option value="Lost">Lost</option>
                    <option value="Found">Found</option>
                    <option value="Return">Return</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                  <input type="text" value={adjustmentData.batchNumber} onChange={(e) => setAdjustmentData({ ...adjustmentData, batchNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional batch number" />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { setShowAdjustmentModal(false); resetAdjustmentForm(); }} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Apply Adjustment</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      <DetailPanel
        isOpen={showDetailPanel}
        onClose={() => setShowDetailPanel(false)}
        title={detailItem?.product?.name || 'Inventory Details'}
        onEdit={detailItem ? () => {
          setAdjustmentData({
            productId: detailItem.product?.id || '',
            variantId: detailItem.variant?.id || '',
            quantity: '',
            reason: '',
            batchNumber: detailItem.batchNumber || ''
          });
          setShowAdjustmentModal(true);
          setShowDetailPanel(false);
        } : undefined}
      >
        {detailItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Product</p>
                <p className="text-sm text-gray-900">{detailItem.product?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">SKU</p>
                <p className="text-sm text-gray-900">{detailItem.product?.sku}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Quantity</p>
                <p className="text-sm font-bold text-gray-900">{detailItem.quantity}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Reserved</p>
                <p className="text-sm text-gray-900">{detailItem.reservedQty}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Available</p>
                <p className={`text-sm font-bold ${getStockStatus(detailItem).color}`}>
                  {detailItem.quantity - detailItem.reservedQty}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Location</p>
                <p className="text-sm text-gray-900">{detailItem.location || 'Default'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Category</p>
                <p className="text-sm text-gray-900">{detailItem.product?.category?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Supplier</p>
                <p className="text-sm text-gray-900">{detailItem.product?.supplier?.name || 'N/A'}</p>
              </div>
              {detailItem.batchNumber && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Batch Number</p>
                  <p className="text-sm text-gray-900">{detailItem.batchNumber}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-500">Last Updated</p>
                <p className="text-sm text-gray-900">{new Date(detailItem.lastUpdated).toLocaleString()}</p>
              </div>
            </div>

            {detailItem.movements && detailItem.movements.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Movement History</h4>
                <div className="space-y-2">
                  {detailItem.movements.map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            movement.type === 'IN' ? 'bg-green-100 text-green-800' :
                            movement.type === 'OUT' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {movement.type}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {movement.reason || 'No reason'} - {new Date(movement.createdAt).toLocaleString()}
                        </p>
                        {movement.user && (
                          <p className="text-xs text-gray-400">By: {movement.user.firstName} {movement.user.lastName}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DetailPanel>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        isLoading={confirmLoading}
      />

      <BulkUpdateModal
        isOpen={showBulkUpdateModal}
        onClose={() => setShowBulkUpdateModal(false)}
        onSubmit={handleBulkUpdate}
        fields={bulkUpdateFields}
        selectedCount={selectedIds.size}
        isLoading={bulkUpdateLoading}
        entityName="Inventory Items"
      />
    </div>
  );
};

export default Inventory;
