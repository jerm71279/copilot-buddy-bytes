import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";
import type { BadgeProps } from "@/components/ui/badge";

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((row: T) => any);
  width?: string;
  className?: string;
  render?: (value: any, row: T) => React.ReactNode;
  badge?: {
    variant: (value: any, row: T) => BadgeProps["variant"];
    format?: (value: any) => string;
  };
}

export interface DataTableConfig<T> {
  title: string;
  description: string;
  icon?: LucideIcon;
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  icon: Icon,
  data,
  columns,
  isLoading = false,
  emptyMessage = "No data available",
  onRowClick,
  rowClassName
}: DataTableConfig<T>) {
  const getCellValue = (row: T, column: TableColumn<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  };

  const renderCell = (row: T, column: TableColumn<T>) => {
    const value = getCellValue(row, column);

    if (column.render) {
      return column.render(value, row);
    }

    if (column.badge) {
      const variant = column.badge.variant(value, row);
      const displayValue = column.badge.format ? column.badge.format(value) : value;
      return <Badge variant={variant}>{displayValue}</Badge>;
    }

    return value;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className={Icon ? "flex items-center gap-2" : undefined}>
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading {title.toLowerCase()}...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column, index) => (
                    <TableHead key={index} style={{ width: column.width }}>
                      {column.header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''} ${rowClassName ? rowClassName(row) : ''}`}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column, colIndex) => (
                      <TableCell
                        key={colIndex}
                        className={column.className}
                      >
                        {renderCell(row, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
