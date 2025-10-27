/**
 * useStandardToast Hook
 * Standardized toast notification patterns
 * Eliminates 100+ inconsistent toast usage patterns
 */

import { toast } from "sonner";

interface ToastOptions {
  description?: string;
  duration?: number;
}

export function useStandardToast() {
  return {
    success: (message: string, options?: ToastOptions) => {
      toast.success(message, {
        description: options?.description,
        duration: options?.duration || 3000,
      });
    },

    error: (message: string, options?: ToastOptions) => {
      toast.error(message, {
        description: options?.description,
        duration: options?.duration || 4000,
      });
    },

    info: (message: string, options?: ToastOptions) => {
      toast.info(message, {
        description: options?.description,
        duration: options?.duration || 3000,
      });
    },

    warning: (message: string, options?: ToastOptions) => {
      toast.warning(message, {
        description: options?.description,
        duration: options?.duration || 3000,
      });
    },

    // Common patterns
    loading: (message: string = "Loading...") => {
      return toast.loading(message);
    },

    dismiss: (toastId: string | number) => {
      toast.dismiss(toastId);
    },

    // Common success messages
    created: (entityName: string) => {
      toast.success(`${entityName} created successfully`);
    },

    updated: (entityName: string) => {
      toast.success(`${entityName} updated successfully`);
    },

    deleted: (entityName: string) => {
      toast.success(`${entityName} deleted successfully`);
    },

    // Common error messages
    loadFailed: (entityName: string) => {
      toast.error(`Failed to load ${entityName}`);
    },

    saveFailed: (entityName: string) => {
      toast.error(`Failed to save ${entityName}`);
    },

    deleteFailed: (entityName: string) => {
      toast.error(`Failed to delete ${entityName}`);
    },
  };
}
