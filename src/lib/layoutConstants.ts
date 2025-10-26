/**
 * Layout Constants
 * Standard spacing, sizing, and layout values for consistent design
 */

// Standard Container Padding
export const CONTAINER_PADDING = {
  x: "px-4",
  y: "pb-8 pt-8",
  full: "px-4 pb-8 pt-8",
} as const;

// Standard Card Padding
export const CARD_PADDING = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

// Empty State Dimensions
export const EMPTY_STATE = {
  iconSize: "h-12 w-12",
  padding: "py-12",
  titleSize: "text-lg",
  descriptionSize: "text-base",
} as const;

// Loading Spinner Dimensions
export const SPINNER = {
  sm: { size: "h-6 w-6", border: "border-2" },
  md: { size: "h-12 w-12", border: "border-b-2" },
  lg: { size: "h-16 w-16", border: "border-b-4" },
} as const;

// Page Header Dimensions
export const PAGE_HEADER = {
  titleSize: "text-3xl md:text-4xl",
  descriptionSize: "text-base",
  spacing: "mb-6",
} as const;

// Standard Spacing Values
export const SPACING = {
  xs: "gap-2",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
} as const;

// Grid Columns
export const GRID = {
  cols2: "grid-cols-1 md:grid-cols-2",
  cols3: "grid-cols-1 md:grid-cols-3",
  cols4: "grid-cols-1 md:grid-cols-4",
} as const;

// Standard Breakpoints (matches Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
