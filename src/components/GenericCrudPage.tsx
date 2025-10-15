import { useState } from "react";
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useDatabase } from "@/hooks/useDatabase";
import { useDataFetching } from "@/hooks/useDataFetching";
import { useNotification } from "@/hooks/useNotification";

/**
 * Generic CRUD Page Component
 * Eliminates 90% of repetitive CRUD page code
 */

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface FormField<T> {
  key: keyof T;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface GenericCrudPageProps<T extends Record<string, any>> {
  tableName: string;
  title: string;
  columns: Column<T>[];
  formFields: FormField<T>[];
  defaultValues: Partial<T>;
  requiresCustomer?: boolean;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  searchPlaceholder?: string;
}

export function GenericCrudPage<T extends Record<string, any>>({
  tableName,
  title,
  columns,
  formFields,
  defaultValues,
  requiresCustomer = true,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  searchPlaceholder = "Search...",
}: GenericCrudPageProps<T>) {
  const { customerId, requireAuth, requireCustomer: checkCustomer } = useAuth();
  const db = useDatabase<T>(tableName);
  const notify = useNotification();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Partial<T>>(defaultValues);
  const [searchTerm, setSearchTerm] = useState("");

  // Auto-fetch data
  const { data, isLoading, refresh } = useDataFetching<T>(tableName, {
    filters: requiresCustomer && customerId ? { customer_id: customerId } as any : undefined,
    autoLoad: true,
    queryOptions: { orderBy: { column: "created_at", ascending: false } },
  });

  // Check auth
  if (!requireAuth()) return null;
  if (requiresCustomer && !checkCustomer()) return null;

  const filteredData = searchTerm
    ? data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  const handleCreate = () => {
    setEditingItem(null);
    setFormData(requiresCustomer && customerId ? { ...defaultValues, customer_id: customerId } as Partial<T> : defaultValues);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: T) => {
    setEditingItem(item);
    setFormData(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    const { success } = await db.remove(id);
    if (success) refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingItem) {
      const { data } = await db.update((editingItem as any).id, formData);
      if (data) {
        setIsDialogOpen(false);
        refresh();
      }
    } else {
      const { data } = await db.create(formData);
      if (data) {
        setIsDialogOpen(false);
        refresh();
      }
    }
  };

  const renderFormField = (field: FormField<T>) => {
    const value = formData[field.key] || "";

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value as string}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })
            }
            placeholder={field.placeholder}
            required={field.required}
          />
        );

      case "select":
        return (
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={value as string}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })
            }
            required={field.required}
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <Input
            type={field.type}
            value={value as string}
            onChange={(e) =>
              setFormData({
                ...formData,
                [field.key]:
                  field.type === "number"
                    ? parseFloat(e.target.value)
                    : e.target.value,
              })
            }
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {canCreate && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Create New
            </Button>
          )}
        </div>
      </div>

      <Input
        placeholder={searchPlaceholder}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={String(col.key)}>{col.label}</TableHead>
              ))}
              {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((item) => (
              <TableRow key={(item as any).id}>
                {columns.map((col) => (
                  <TableCell key={String(col.key)}>
                    {col.render
                      ? col.render(item[col.key], item)
                      : String(item[col.key] || "")}
                  </TableCell>
                ))}
                {(canEdit || canDelete) && (
                  <TableCell>
                    <div className="flex gap-2">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete((item as any).id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Edit ${title}` : `Create ${title}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formFields.map((field) => (
              <div key={String(field.key)}>
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                {renderFormField(field)}
              </div>
            ))}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
