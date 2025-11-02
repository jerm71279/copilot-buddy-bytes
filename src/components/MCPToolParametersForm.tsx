import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ParameterSchema {
  type: string;
  description?: string;
  required?: boolean;
  default?: any;
}

interface MCPToolParametersFormProps {
  parameters: Record<string, ParameterSchema>;
  onSubmit: (values: Record<string, any>) => void;
  onCancel: () => void;
  isExecuting: boolean;
}

export function MCPToolParametersForm({
  parameters,
  onSubmit,
  onCancel,
  isExecuting,
}: MCPToolParametersFormProps) {
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    Object.entries(parameters).forEach(([key, schema]) => {
      initial[key] = schema.default ?? '';
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors: Record<string, string> = {};
    Object.entries(parameters).forEach(([key, schema]) => {
      if (schema.required && !values[key]) {
        newErrors[key] = `${key} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(values);
  };

  const renderInput = (key: string, schema: ParameterSchema) => {
    const value = values[key];
    const error = errors[key];

    switch (schema.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={!!value}
              onCheckedChange={(checked) =>
                setValues({ ...values, [key]: checked })
              }
            />
            <Label htmlFor={key}>{key}</Label>
          </div>
        );

      case 'number':
      case 'integer':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>
              {key}
              {schema.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={key}
              type="number"
              value={value}
              onChange={(e) =>
                setValues({ ...values, [key]: e.target.value })
              }
              placeholder={schema.description}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        );

      case 'object':
      case 'array':
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>
              {key}
              {schema.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              id={key}
              value={value}
              onChange={(e) =>
                setValues({ ...values, [key]: e.target.value })
              }
              placeholder={`JSON ${schema.type}${schema.description ? ': ' + schema.description : ''}`}
              rows={4}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={key}>
              {key}
              {schema.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              id={key}
              type="text"
              value={value}
              onChange={(e) =>
                setValues({ ...values, [key]: e.target.value })
              }
              placeholder={schema.description}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        );
    }
  };

  const hasRequiredParams = Object.values(parameters).some(
    (schema) => schema.required
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {hasRequiredParams && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fields marked with * are required
          </AlertDescription>
        </Alert>
      )}

      {Object.entries(parameters).map(([key, schema]) => (
        <div key={key}>
          {schema.description && schema.type !== 'boolean' && (
            <p className="text-sm text-muted-foreground mb-2">
              {schema.description}
            </p>
          )}
          {renderInput(key, schema)}
        </div>
      ))}

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isExecuting} className="flex-1">
          {isExecuting ? 'Executing...' : 'Execute'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isExecuting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
