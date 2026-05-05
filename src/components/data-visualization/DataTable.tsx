import React from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type SortingState,
  type ColumnFiltersState,
  type ColumnDef,
} from '@tanstack/react-table'

export interface TableData {
  id: string
  [key: string]: unknown
}

interface DataTableProps<T extends TableData> {
  data: T[]
  columns: ColumnDef<T, unknown>[]
  searchable?: boolean
  sortable?: boolean
  paginated?: boolean
  pageSize?: number
  className?: string
  onRowClick?: (row: T) => void
}

export function DataTable<T extends TableData>({
  data,
  columns,
  searchable = true,
  sortable = true,
  paginated = true,
  pageSize = 10,
  className = '',
  onRowClick,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: pageSize,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    ...(sortable && { enableSorting: true }),
    ...(paginated && { enablePagination: true }),
  })

  return (
    <div className={`w-full ${className}`}>
      {/* Global Search */}
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full max-w-sm"
            placeholder="검색..."
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-semibold text-card-foreground uppercase tracking-wider cursor-pointer hover:bg-muted transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                      {sortable && header.column.getCanSort() && (
                        <span className="text-xs">
                          {header.column.getIsSorted() === 'asc' ? '↑' : ''}
                          {header.column.getIsSorted() === 'desc' ? '↓' : ''}
                          {!header.column.getIsSorted() ? '↕' : ''}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-background divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`hover:bg-muted ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && (
        <div className="flex items-center justify-between mt-4 px-4 py-3 bg-background border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              {table.getState().pagination.pageIndex + 1} /{' '}
              {table.getPageCount()} 페이지
            </span>
            <span>전체 {data.length}개 항목</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              이전
            </button>
            <button
              className="px-3 py-1 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
