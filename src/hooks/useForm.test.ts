import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useForm } from './useForm';

// Mock dependencies
vi.mock('./useNotification', () => ({
  useNotification: () => ({
    error: vi.fn(),
  }),
}));

interface TestFormValues {
  name: string;
  email: string;
  age: number;
}

describe('useForm', () => {
  const initialValues: TestFormValues = {
    name: '',
    email: '',
    age: 0,
  };

  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with initial values', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit })
    );

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isValid).toBe(true);
    expect(result.current.isDirty).toBe(false);
  });

  it('should handle field changes', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit })
    );

    act(() => {
      result.current.handleChange('name', 'John Doe');
    });

    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.isDirty).toBe(true);
  });

  it('should handle field blur', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit })
    );

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.touched.email).toBe(true);
  });

  it('should validate on blur when validator is provided', () => {
    const validate = (values: TestFormValues) => {
      const errors: Record<string, string> = {};
      if (!values.email) errors.email = 'Email is required';
      return errors;
    };

    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit, validate })
    );

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.errors.email).toBe('Email is required');
  });

  it('should clear error when field changes', () => {
    const validate = (values: TestFormValues) => {
      const errors: Record<string, string> = {};
      if (!values.email) errors.email = 'Email is required';
      return errors;
    };

    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit, validate })
    );

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.errors.email).toBe('Email is required');

    act(() => {
      result.current.handleChange('email', 'test@example.com');
    });

    expect(result.current.errors.email).toBeUndefined();
  });

  it('should submit form with valid data', async () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit })
    );

    act(() => {
      result.current.handleChange('name', 'John');
      result.current.handleChange('email', 'john@example.com');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: 'John',
      email: 'john@example.com',
      age: 0,
    });
  });

  it('should not submit form with validation errors', async () => {
    const validate = (values: TestFormValues) => {
      const errors: Record<string, string> = {};
      if (!values.name) errors.name = 'Name is required';
      return errors;
    };

    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit, validate })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.name).toBe('Name is required');
  });

  it('should mark all fields as touched on submit', async () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.touched.name).toBe(true);
    expect(result.current.touched.email).toBe(true);
    expect(result.current.touched.age).toBe(true);
  });

  it('should reset form when resetOnSubmit is true', async () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit, resetOnSubmit: true })
    );

    act(() => {
      result.current.handleChange('name', 'John');
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.isDirty).toBe(false);
  });

  it('should provide setValues function', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit })
    );

    act(() => {
      result.current.setValues({ name: 'Jane', email: 'jane@example.com' });
    });

    expect(result.current.values.name).toBe('Jane');
    expect(result.current.values.email).toBe('jane@example.com');
  });

  it('should provide setFieldValue function', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit })
    );

    act(() => {
      result.current.setFieldValue('age', 25);
    });

    expect(result.current.values.age).toBe(25);
  });

  it('should provide setFieldError function', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit })
    );

    act(() => {
      result.current.setFieldError('email', 'Custom error');
    });

    expect(result.current.errors.email).toBe('Custom error');
    expect(result.current.isValid).toBe(false);
  });

  it('should provide reset function', () => {
    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: mockOnSubmit })
    );

    act(() => {
      result.current.handleChange('name', 'John');
      result.current.setFieldError('email', 'Error');
    });

    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  it('should handle async submit errors', async () => {
    const failingSubmit = vi.fn().mockRejectedValue(new Error('Submit failed'));

    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: failingSubmit })
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('should set isSubmitting during submission', async () => {
    let resolveSubmit: () => void;
    const delayedSubmit = vi.fn(() => new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    }));

    const { result } = renderHook(() =>
      useForm({ initialValues, onSubmit: delayedSubmit })
    );

    act(() => {
      result.current.handleSubmit();
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(true);
    });

    act(() => {
      resolveSubmit!();
    });

    await waitFor(() => {
      expect(result.current.isSubmitting).toBe(false);
    });
  });
});
