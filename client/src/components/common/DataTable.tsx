import React, { useState, useMemo, ReactNode } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  cell?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchableFields?: (keyof T)[];
  itemsPerPage?: number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: { label: string; onClick: () => void };
  actions?: ReactNode;
  filters?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchableFields,
  itemsPerPage = 10,
  isLoading = false,
  emptyTitle = 'No records found',
  emptySubtitle = 'Try adjusting your search criteria or active filters.',
  emptyAction,
  actions,
  filters,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const words = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return data;

    // Helper to extract human-meaningful text strings from records and relations
    const extractSearchableText = (val: any): string[] => {
      if (val === null || val === undefined) return [];

      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (!trimmed) return [];
        // Ignore internal UUIDs
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return [];
        // Ignore ISO timestamps
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) return [];
        // Handle JSON arrays/objects safely
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
              return parsed.flatMap(extractSearchableText);
            }
          } catch {}
          return [];
        }
        return [trimmed.toLowerCase()];
      }

      if (typeof val === 'number') {
        return [String(val)];
      }

      if (Array.isArray(val)) {
        return val.flatMap(extractSearchableText);
      }

      if (typeof val === 'object') {
        const texts: string[] = [];
        // If it's a person with first and last name, also add full name combined
        if (val.firstName && val.lastName) {
          texts.push(`${val.firstName} ${val.lastName}`.toLowerCase());
        }

        const SAFE_PROPERTIES = [
          'firstName', 'lastName', 'name', 'title',
          'studentId', 'rollNumber', 'facultyId', 'courseId', 'batchId', 'receiptId', 'assignmentId',
          'subject', 'subjectTaught', 'phone', 'email', 'guardianName',
          'targetExam', 'qualification', 'paymentMode', 'transactionReference',
          'remarks', 'description', 'gradeLevel', 'gender', 'city', 'state'
        ];

        for (const prop of SAFE_PROPERTIES) {
          if (val[prop] !== undefined && val[prop] !== null) {
            texts.push(...extractSearchableText(val[prop]));
          }
        }

        // Include related entity primary identifiers
        if (val.course && typeof val.course === 'object') {
          if (val.course.name) texts.push(String(val.course.name).toLowerCase());
          if (val.course.courseId) texts.push(String(val.course.courseId).toLowerCase());
        }
        if (val.batch && typeof val.batch === 'object') {
          if (val.batch.name) texts.push(String(val.batch.name).toLowerCase());
          if (val.batch.batchId) texts.push(String(val.batch.batchId).toLowerCase());
        }
        if (val.faculty && typeof val.faculty === 'object') {
          if (val.faculty.firstName) texts.push(String(val.faculty.firstName).toLowerCase());
          if (val.faculty.lastName) texts.push(String(val.faculty.lastName).toLowerCase());
          if (val.faculty.facultyId) texts.push(String(val.faculty.facultyId).toLowerCase());
        }
        if (val.student && typeof val.student === 'object') {
          texts.push(...extractSearchableText(val.student));
        }

        return texts;
      }

      return [];
    };

    return data.filter((item: any) => {
      let combinedItemText: string;
      if (searchableFields && searchableFields.length > 0) {
        const fieldStrings = searchableFields.flatMap((field) => {
          const val = item[field];
          return extractSearchableText(val);
        });
        combinedItemText = fieldStrings.join(' ');
      } else {
        combinedItemText = extractSearchableText(item).join(' ');
      }

      // Every word typed by the user must match somewhere in the item's searchable text
      return words.every((word) => combinedItemText.includes(word));
    });
  }, [data, searchTerm, searchableFields]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  if (isLoading) {
    return <LoadingSkeleton count={6} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {filters && <div className="flex items-center gap-2 flex-wrap">{filters}</div>}
        </div>

        {actions && <div className="flex items-center gap-2 justify-end flex-shrink-0">{actions}</div>}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80 select-none">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`px-5 py-3.5 whitespace-nowrap ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-5 py-3.5 ${col.className || ''}`}>
                      {col.cell
                        ? col.cell(row)
                        : typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : col.accessor
                        ? (row as any)[col.accessor]
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <EmptyState
                    title={emptyTitle}
                    subtitle={emptySubtitle}
                    actionLabel={emptyAction?.label}
                    onAction={emptyAction?.onClick}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredData.length > 0 && (
        <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)}
            </span>
            <span>to</span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {Math.min(filteredData.length, currentPage * pageSize)}
            </span>
            <span>of</span>
            <span className="font-semibold text-slate-900 tabular-nums">{filteredData.length}</span>
            <span>records</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              title="First Page"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Previous Page"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-slate-800 tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Next Page"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              title="Last Page"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
