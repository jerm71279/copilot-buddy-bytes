import { useState, useCallback } from "react";
import { useNotification } from "./useNotification";

/**
 * Centralized Form Management Hook
 * Eliminates repeated form state and validation patterns
 */

export interface FormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: (values: T) => Record<string, string>;
  resetOnSubmit?: boolean;
}

export interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface FormHandlers<T> {
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setValues: (values: Partial<T>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  reset: () => void;
}

export function useForm<T extends Record<string, any>>(
  options: FormOptions<T>
): FormState<T> & FormHandlers<T> {
  const { initialValues, onSubmit, validate, resetOnSubmit = false } = options;
  const notify = useNotification();

  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  const validateForm = useCallback((): boolean => {
    if (!validate) return true;

    const validationErrors = validate(values);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [validate, values]);

  const isValid = Object.keys(errors).length === 0;

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValuesState((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
  }, []);

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field as string]: true }));
      if (validate) {
        const validationErrors = validate(values);
        if (validationErrors[field as string]) {
          setErrors((prev) => ({
            ...prev,
            [field as string]: validationErrors[field as string],
          }));
        }
      }
    },
    [validate, values]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      // Mark all fields as touched
      const allTouched = Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {}
      );
      setTouched(allTouched);

      // Validate
      if (!validateForm()) {
        notify.error("Please fix the errors before submitting");
        return;
      }

      setIsSubmitting(true);

      try {
        await onSubmit(values);
        if (resetOnSubmit) {
          reset();
        }
      } catch (error) {
        console.error("Form submission error:", error);
        notify.error("Failed to submit form");
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm, onSubmit, resetOnSubmit, notify]
  );

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => ({ ...prev, ...newValues }));
  }, []);

  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValuesState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field as string]: error }));
  }, []);

  const reset = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setFieldValue,
    setFieldError,
    reset,
  };
}
