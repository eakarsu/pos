import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface BulkUpdateField {
  value: string;
  label: string;
  type: 'text' | 'select' | 'boolean';
  options?: { value: string; label: string }[];
}

interface BulkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (field: string, value: string) => void;
  fields: BulkUpdateField[];
  selectedCount: number;
  isLoading?: boolean;
  entityName: string;
}

const BulkUpdateModal: React.FC<BulkUpdateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fields,
  selectedCount,
  isLoading = false,
  entityName,
}) => {
  const [selectedField, setSelectedField] = useState('');
  const [fieldValue, setFieldValue] = useState('');

  if (!isOpen) return null;

  const currentField = fields.find(f => f.value === selectedField);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedField && fieldValue !== '') {
      onSubmit(selectedField, fieldValue);
    }
  };

  const handleClose = () => {
    setSelectedField('');
    setFieldValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={!isLoading ? handleClose : undefined} />
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl sm:w-full sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Bulk Update {entityName}</h3>
                <button type="button" onClick={handleClose} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Will update <span className="font-semibold text-gray-700">{selectedCount}</span> {entityName.toLowerCase()}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field to update</label>
                  <select
                    value={selectedField}
                    onChange={(e) => { setSelectedField(e.target.value); setFieldValue(''); }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select field...</option>
                    {fields.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {currentField && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New value</label>
                    {currentField.type === 'boolean' ? (
                      <select
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select...</option>
                        <option value="true">Yes / Active</option>
                        <option value="false">No / Inactive</option>
                      </select>
                    ) : currentField.type === 'select' && currentField.options ? (
                      <select
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select...</option>
                        {currentField.options.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isLoading || !selectedField || fieldValue === ''}
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:ml-3 sm:w-auto disabled:opacity-50"
              >
                {isLoading ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BulkUpdateModal;
