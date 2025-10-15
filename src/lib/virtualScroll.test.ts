import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useVirtualScroll, useVirtualGrid } from './virtualScroll';

describe('virtual scroll utilities', () => {
  describe('useVirtualScroll', () => {
    it('should calculate visible items based on scroll position', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
          overscan: 2,
        })
      );

      expect(result.current.virtualItems.length).toBeGreaterThan(0);
      expect(result.current.virtualItems.length).toBeLessThan(items.length);
      expect(result.current.totalHeight).toBe(5000); // 100 items * 50px
    });

    it('should include start position and size for each item', () => {
      const items = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 100,
          containerHeight: 500,
          overscan: 1,
        })
      );

      const firstItem = result.current.virtualItems[0];
      expect(firstItem).toBeDefined();
      expect(firstItem.index).toBeGreaterThanOrEqual(0);
      expect(firstItem.start).toBeDefined();
      expect(firstItem.size).toBe(100);
      expect(firstItem.data).toBeDefined();
    });

    it('should apply overscan for smooth scrolling', () => {
      const items = Array.from({ length: 50 }, (_, i) => `Item ${i}`);
      const { result: withOverscan } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
          overscan: 5,
        })
      );

      const { result: withoutOverscan } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
          overscan: 0,
        })
      );

      // With overscan should render more items
      expect(withOverscan.current.virtualItems.length).toBeGreaterThanOrEqual(
        withoutOverscan.current.virtualItems.length
      );
    });

    it('should provide scrollToIndex function', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
        })
      );

      expect(result.current.scrollToIndex).toBeDefined();
      expect(typeof result.current.scrollToIndex).toBe('function');
    });

    it('should provide container ref', () => {
      const items = Array.from({ length: 20 }, (_, i) => `Item ${i}`);
      const { result } = renderHook(() =>
        useVirtualScroll(items, {
          itemHeight: 50,
          containerHeight: 500,
        })
      );

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull(); // Not attached in test
    });
  });

  describe('useVirtualGrid', () => {
    it('should calculate grid layout with correct dimensions', () => {
      const items = Array.from({ length: 100 }, (_, i) => `Item ${i}`);
      const { result } = renderHook(() =>
        useVirtualGrid(items, {
          itemHeight: 200,
          itemWidth: 250,
          containerWidth: 1000,
          containerHeight: 800,
          columnGap: 16,
          rowGap: 16,
        })
      );

      expect(result.current.virtualItems.length).toBeGreaterThan(0);
      expect(result.current.totalHeight).toBeGreaterThan(0);
      expect(result.current.totalWidth).toBeGreaterThan(0);
    });

    it('should calculate correct number of columns', () => {
      const items = Array.from({ length: 20 }, (_, i) => `Item ${i}`);
      const { result } = renderHook(() =>
        useVirtualGrid(items, {
          itemHeight: 200,
          itemWidth: 300,
          containerWidth: 1000,
          containerHeight: 800,
          columnGap: 10,
        })
      );

      // 1000 / (300 + 10) ≈ 3 columns
      const columns = Math.floor(1000 / (300 + 10));
      expect(result.current.totalWidth).toBe(columns * (300 + 10));
    });

    it('should include row, column, x, and y positions', () => {
      const items = Array.from({ length: 12 }, (_, i) => `Item ${i}`);
      const { result } = renderHook(() =>
        useVirtualGrid(items, {
          itemHeight: 100,
          itemWidth: 100,
          containerWidth: 400,
          containerHeight: 600,
          columnGap: 10,
          rowGap: 10,
        })
      );

      const firstItem = result.current.virtualItems[0];
      expect(firstItem).toBeDefined();
      expect(firstItem.row).toBeDefined();
      expect(firstItem.col).toBeDefined();
      expect(firstItem.x).toBeDefined();
      expect(firstItem.y).toBeDefined();
      expect(firstItem.data).toBeDefined();
    });

    it('should respect gap spacing in calculations', () => {
      const items = Array.from({ length: 50 }, (_, i) => `Item ${i}`);
      const { result: withGap } = renderHook(() =>
        useVirtualGrid(items, {
          itemHeight: 100,
          itemWidth: 100,
          containerWidth: 400,
          containerHeight: 600,
          columnGap: 20,
          rowGap: 20,
        })
      );

      const { result: withoutGap } = renderHook(() =>
        useVirtualGrid(items, {
          itemHeight: 100,
          itemWidth: 100,
          containerWidth: 400,
          containerHeight: 600,
          columnGap: 0,
          rowGap: 0,
        })
      );

      expect(withGap.current.totalHeight).toBeGreaterThan(withoutGap.current.totalHeight);
    });

    it('should provide container ref for grid', () => {
      const items = Array.from({ length: 20 }, (_, i) => `Item ${i}`);
      const { result } = renderHook(() =>
        useVirtualGrid(items, {
          itemHeight: 100,
          itemWidth: 100,
          containerWidth: 500,
          containerHeight: 600,
        })
      );

      expect(result.current.containerRef).toBeDefined();
      expect(result.current.containerRef.current).toBeNull(); // Not attached in test
    });
  });
});
