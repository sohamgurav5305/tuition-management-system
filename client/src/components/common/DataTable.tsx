import React, { useState, useMemo, ReactNode } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  cell?: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: keyof T;
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
  onRowClick?: (row: T) => void;
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
  onRowClick,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(itemsPerPage);
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredData = useMemo(() => {
    let result = data;

    if (searchTerm.trim()) {
      const words = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        // Helper to extract human-meaningful text strings from records and relations
        const extractSearchableText = (val: any): string[] => {
          if (val === null || val === undefined) return [];

          if (typeof val === 'string') {
            const trimmed = val.trim();
            if (!trimmed) return [];
            if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return [];
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) return [];
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

        result = data.filter((item: any) => {
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

          return words.every((word) => combinedItemText.includes(word));
        });
      }
    }

    // Apply sorting if a sort column is selected
    if (sortColumnIndex !== null && columns[sortColumnIndex]) {
      const col = columns[sortColumnIndex];
      const sortKey = col.sortKey || (typeof col.accessor === 'string' ? (col.accessor as keyof T) : undefined);

      if (sortKey) {
        result = [...result].sort((a: any, b: any) => {
          const valA = a[sortKey];
          const valB = b[sortKey];

          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDirection === 'asc' ? valA - valB : valB - valA;
          }

          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });
      }
    }

    return result;
  }, [data, searchTerm, searchableFields, sortColumnIndex, sortDirection, columns]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const handleHeaderClick = (idx: number) => {
    const col = columns[idx];
    const isSortable = col.sortable !== false && (col.sortKey || typeof col.accessor === 'string');
    if (!isSortable) return;

    if (sortColumnIndex === idx) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumnIndex(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumnIndex(idx);
      setSortDirection('asc');
    }
  };

  if (isLoading) {
    return <LoadingSkeleton count={6} />;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
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
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 select-none">
            <tr>
              {columns.map((col, idx) => {
                const isSortable = col.sortable !== false && (col.sortKey || typeof col.accessor === 'string');
                const isSorted = sortColumnIndex === idx;

                return (
                  <th
                    key={idx}
                    onClick={() => isSortable && handleHeaderClick(idx)}
                    className={`px-5 py-3.5 whitespace-nowrap ${col.className || ''} ${
                      isSortable ? 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors' : ''
                    }`}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="text-slate-400 dark:text-slate-500">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {paginatedData.length > 0 ? (
              paginatedData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
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
        <div className="px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)}
            </span>
            <span>to</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {Math.min(filteredData.length, currentPage * pageSize)}
            </span>
            <span>of</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{filteredData.length}</span>
            <span>records</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              title="First Page"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              title="Previous Page"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              title="Next Page"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              title="Last Page"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
