import { useState, useEffect, useRef, useCallback } from 'react';

interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render above/below viewport
}

interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number;
    start: number;
    size: number;
    data: T;
  }>;
  totalHeight: number;
  scrollToIndex: (index: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Virtual scrolling hook for rendering large lists efficiently
 * Only renders items visible in the viewport
 * 
 * @example
 * const { virtualItems, totalHeight, containerRef } = useVirtualScroll({
 *   items: data,
 *   itemHeight: 50,
 *   containerHeight: 600,
 * });
 * 
 * return (
 *   <div ref={containerRef} style={{ height: containerHeight, overflow: 'auto' }}>
 *     <div style={{ height: totalHeight, position: 'relative' }}>
 *       {virtualItems.map(({ index, start, data }) => (
 *         <div key={index} style={{ position: 'absolute', top: start, height: itemHeight }}>
 *           {data.name}
 *         </div>
 *       ))}
 *     </div>
 *   </div>
 * );
 */
export const useVirtualScroll = <T>(
  items: T[],
  options: VirtualScrollOptions
): VirtualScrollResult<T> => {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const virtualItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    virtualItems.push({
      index: i,
      start: i * itemHeight,
      size: itemHeight,
      data: items[i],
    });
  }

  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = index * itemHeight;
      }
    },
    [itemHeight]
  );

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    containerRef,
  };
};

/**
 * Virtual grid hook for 2D grids (e.g., image galleries)
 */
interface VirtualGridOptions {
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  columnGap?: number;
  rowGap?: number;
}

export const useVirtualGrid = <T>(
  items: T[],
  options: VirtualGridOptions
) => {
  const {
    itemWidth,
    itemHeight,
    containerWidth,
    containerHeight,
    columnGap = 0,
    rowGap = 0,
  } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const columns = Math.floor(containerWidth / (itemWidth + columnGap));
  const rows = Math.ceil(items.length / columns);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
      setScrollLeft(containerRef.current.scrollLeft);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + rowGap)));
  const endRow = Math.min(
    rows - 1,
    Math.ceil((scrollTop + containerHeight) / (itemHeight + rowGap))
  );

  const virtualItems = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < items.length) {
        virtualItems.push({
          index,
          row,
          col,
          x: col * (itemWidth + columnGap),
          y: row * (itemHeight + rowGap),
          data: items[index],
        });
      }
    }
  }

  return {
    virtualItems,
    totalHeight: rows * (itemHeight + rowGap),
    totalWidth: columns * (itemWidth + columnGap),
    containerRef,
  };
};
