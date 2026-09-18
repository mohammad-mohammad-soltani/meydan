import type { KeyboardEvent, ReactNode } from "react";
import { AdminEmptyState } from "./AdminStateViews";
import { tableCellClass, tableHeadClass } from "./styles";

export type AdminColumn<T> = {
  /** Stable key, also used as the React key when a row key is not supplied. */
  key: string;
  header: string;
  /** Cell renderer; receives the row and its index. */
  render: (row: T, index: number) => ReactNode;
  /** Applied to both the header cell and the body cell. */
  className?: string;
  /**
   * Hidden below `md`, where the row becomes a stacked card. Use it for
   * secondary columns (ids, owner, timestamps) that would otherwise crowd the
   * card layout.
   */
  hideOnMobile?: boolean;
  /**
   * Marks the cell that identifies the row. In the card layout it becomes the
   * heading and every other column is rendered as a labelled field beneath it.
   */
  primary?: boolean;
};

/** Shared column definitions render a semantic desktop table and labelled mobile cards. */
export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  rowClassName,
  emptyTitle = "موردی پیدا نشد.",
  emptyDescription,
  emptyIcon,
  caption,
}: {
  columns: Array<AdminColumn<T>>;
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  caption?: string;
}) {
  if (rows.length === 0) {
    return (
      <AdminEmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
      />
    );
  }

  const primaryColumn = columns.find((column) => column.primary) ?? columns[0];
  const cardColumns = columns.filter(
    (column) => column.key !== primaryColumn.key,
  );

  return (
    <>
      {/* Wide screens: a genuine table. */}
      <div className="admin-table-desktop hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-right">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className={tableHeadClass}>
            <tr className="border-b border-divider">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-3 py-2.5 font-black ${column.className ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-divider">
            {rows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                {...interactiveProps(onRowClick, row)}
                className={`admin-table-row align-middle ${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row) ?? ""}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`${tableCellClass} ${column.className ?? ""}`}
                  >
                    {column.render(row, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Narrow screens: one card per row, driven by the same columns. */}
      <ul className="admin-table-cards md:hidden">
        {rows.map((row, index) => (
          <li
            key={rowKey(row, index)}
            {...interactiveProps(onRowClick, row)}
            className={`admin-table-mobile-card px-3 py-3 ${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row) ?? ""}`}
          >
            <div className="min-w-0">{primaryColumn.render(row, index)}</div>
            {cardColumns.length ? (
              <dl className="mt-2.5 grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1.5">
                {cardColumns
                  .filter((column) => !column.hideOnMobile)
                  .map((column) => (
                    <div key={column.key} className="contents">
                      <dt className="text-[10px] font-black text-muted-foreground">
                        {column.header}
                      </dt>
                      <dd className="min-w-0 text-[11px] text-foreground-secondary">
                        {column.render(row, index)}
                      </dd>
                    </div>
                  ))}
              </dl>
            ) : null}
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * Row-level click affordances shared by both layouts, so a row behaves the same
 * whether it is rendered as a `<tr>` or as a card.
 */
function interactiveProps<T>(
  onRowClick: ((row: T) => void) | undefined,
  row: T,
): {
  onClick?: () => void;
  tabIndex?: number;
  onKeyDown?: (event: KeyboardEvent) => void;
} {
  if (!onRowClick) return {};
  return {
    onClick: () => onRowClick(row),
    tabIndex: 0,
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onRowClick(row);
      }
    },
  };
}
