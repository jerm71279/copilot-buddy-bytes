/**
 * Design System Utilities
 * Centralized formatting and display logic for consistent UX
 * CONSOLIDATES: formatStatus, formatCategory, formatStatusLabel
 */

/**
 * Format status text (replace underscores with spaces, capitalize)
 * REPLACES: clientPortalUtils.formatStatus, roadmap-utils.formatStatusLabel
 */
export const formatStatus = (status: string): string => {
  return status.replace(/_/g, " ");
};

/**
 * Format status for uppercase display (badges, labels)
 */
export const formatStatusLabel = (status: string): string => {
  return status.replace(/_/g, " ").toUpperCase();
};

/**
 * Format category text (replace underscores with spaces, capitalize)
 */
export const formatCategory = (category: string): string => {
  return category.replace(/_/g, " ");
};

/**
 * Format date for consistent display
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString();
};

/**
 * Format date with time
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString();
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Pluralize text based on count
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};
