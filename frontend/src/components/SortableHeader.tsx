import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SortableHeaderProps {
  label: string;
  field: string;
  currentSortField: string;
  currentSortOrder: 'asc' | 'desc';
  onSort: (field: string) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  field,
  currentSortField,
  currentSortOrder,
  onSort,
}) => {
  const isActive = currentSortField === field;

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <div className="flex flex-col">
          <ChevronUpIcon
            className={`h-3 w-3 ${isActive && currentSortOrder === 'asc' ? 'text-blue-600' : 'text-gray-300'}`}
          />
          <ChevronDownIcon
            className={`h-3 w-3 -mt-1 ${isActive && currentSortOrder === 'desc' ? 'text-blue-600' : 'text-gray-300'}`}
          />
        </div>
      </div>
    </th>
  );
};

export default SortableHeader;
