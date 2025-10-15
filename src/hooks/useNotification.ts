import { useToast } from "@/hooks/use-toast";

/**
 * Centralized Notification Hook
 * Provides consistent toast notifications across the application
 * Single source of truth for all user feedback
 */

export interface NotificationOptions {
  title?: string;
  description: string;
  duration?: number;
}

export function useNotification() {
  const { toast } = useToast();

  /**
   * Show success notification
   */
  const success = (message: string, title: string = "Success") => {
    toast({
      title,
      description: message,
    });
  };

  /**
   * Show error notification
   */
  const error = (message: string, title: string = "Error") => {
    toast({
      title,
      description: message,
      variant: "destructive",
    });
  };

  /**
   * Show info notification
   */
  const info = (message: string, title: string = "Info") => {
    toast({
      title,
      description: message,
    });
  };

  /**
   * Show warning notification
   */
  const warning = (message: string, title: string = "Warning") => {
    toast({
      title,
      description: message,
      variant: "destructive",
    });
  };

  /**
   * Show loading notification (returns dismiss function)
   */
  const loading = (message: string, title: string = "Loading") => {
    const { dismiss } = toast({
      title,
      description: message,
      duration: Infinity, // Stay until dismissed
    });
    return dismiss;
  };

  /**
   * Show custom notification
   */
  const custom = (options: NotificationOptions & { variant?: "default" | "destructive" }) => {
    toast({
      title: options.title || "Notification",
      description: options.description,
      variant: options.variant,
      duration: options.duration,
    });
  };

  /**
   * Common operation notifications
   */
  const operations = {
    createSuccess: (itemName: string = "Item") => success(`${itemName} created successfully`),
    createError: (itemName: string = "Item") => error(`Failed to create ${itemName.toLowerCase()}`),
    
    updateSuccess: (itemName: string = "Item") => success(`${itemName} updated successfully`),
    updateError: (itemName: string = "Item") => error(`Failed to update ${itemName.toLowerCase()}`),
    
    deleteSuccess: (itemName: string = "Item") => success(`${itemName} deleted successfully`),
    deleteError: (itemName: string = "Item") => error(`Failed to delete ${itemName.toLowerCase()}`),
    
    loadError: (itemName: string = "data") => error(`Failed to load ${itemName.toLowerCase()}`),
    
    accessDenied: () => error("Access denied: Insufficient permissions", "Access Denied"),
    
    notFound: (itemName: string = "Item") => error(`${itemName} not found`, "Not Found"),
    
    validationError: (message: string) => error(message, "Validation Error"),
    
    networkError: () => error("Network error. Please check your connection", "Network Error"),
    
    syncSuccess: (service: string) => success(`Synced with ${service} successfully`),
    syncError: (service: string) => error(`Failed to sync with ${service}`),
  };

  return {
    success,
    error,
    info,
    warning,
    loading,
    custom,
    operations,
  };
}
