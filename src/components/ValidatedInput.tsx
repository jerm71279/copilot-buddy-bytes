import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { sanitizeString, validateEmail, validateUrl } from '@/lib/inputValidation';

interface ValidatedInputProps {
  type?: 'text' | 'email' | 'url' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  className?: string;
  showValidation?: boolean;
}

export function ValidatedInput({
  type = 'text',
  value,
  onChange,
  maxLength = 1000,
  placeholder,
  className,
  showValidation = true
}: ValidatedInputProps) {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: true, errors: [], warnings: [] });

  useEffect(() => {
    if (!value) {
      setValidation({ isValid: true, errors: [], warnings: [] });
      return;
    }

    let result;
    switch (type) {
      case 'email':
        result = validateEmail(value);
        break;
      case 'url':
        result = validateUrl(value);
        break;
      default:
        result = sanitizeString(value, maxLength);
    }

    // Separate critical errors from warnings
    const errors = result.errors.filter(e => 
      e.includes('SQL injection') || 
      e.includes('XSS') || 
      e.includes('Path traversal') ||
      e.includes('exceeds maximum') ||
      !result.isValid
    );
    
    const warnings = result.errors.filter(e => 
      e.includes('removed') || 
      e.includes('escaped') ||
      e.includes('replaced')
    );

    setValidation({
      isValid: result.isValid && errors.length === 0,
      errors,
      warnings
    });

    // Auto-sanitize if needed
    if (result.sanitized !== value && result.sanitized) {
      onChange(result.sanitized);
    }
  }, [value, type, maxLength]);

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className="space-y-2">
      <InputComponent
        type={type === 'textarea' ? undefined : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} ${
          validation.errors.length > 0
            ? 'border-destructive focus-visible:ring-destructive'
            : validation.warnings.length > 0
            ? 'border-warning'
            : validation.isValid && value
            ? 'border-success'
            : ''
        }`}
        maxLength={maxLength}
      />

      {showValidation && (
        <>
          {validation.errors.length > 0 && (
            <Alert variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {validation.errors.map((error, i) => (
                  <div key={i}>{error}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {validation.warnings.length > 0 && validation.errors.length === 0 && (
            <Alert className="py-2 border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-xs text-warning">
                {validation.warnings.map((warning, i) => (
                  <div key={i}>{warning}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {validation.isValid && value && validation.warnings.length === 0 && (
            <div className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="h-3 w-3" />
              <span>Input validated</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
