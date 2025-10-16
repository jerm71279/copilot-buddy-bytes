import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LucideIcon } from "lucide-react";

export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select';

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  value?: string | number;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export interface FormDialogConfig {
  trigger?: React.ReactNode;
  title: string;
  description: string;
  icon?: LucideIcon;
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isSubmitting?: boolean;
}

export function FormDialog({
  trigger,
  title,
  description,
  icon: Icon,
  fields,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onSubmit,
  open,
  onOpenChange,
  isSubmitting = false
}: FormDialogConfig) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, any> = {};
    
    fields.forEach(field => {
      const value = formData.get(field.name);
      data[field.name] = field.type === 'number' ? Number(value) : value;
    });

    await onSubmit(data);
  };

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      placeholder: field.placeholder,
      required: field.required,
      disabled: field.disabled,
      value: field.value,
      onChange: field.onChange ? (e: any) => field.onChange!(e.target.value) : undefined
    };

    switch (field.type) {
      case 'textarea':
        return <Textarea {...commonProps} rows={field.rows || 3} />;
      
      case 'select':
        return (
          <Select
            name={field.name}
            value={field.value as string}
            onValueChange={field.onChange}
            disabled={field.disabled}
            required={field.required}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      default:
        return <Input {...commonProps} type={field.type} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className={Icon ? "flex items-center gap-2" : undefined}>
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isSubmitting}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
