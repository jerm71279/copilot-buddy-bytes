import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { markPerformance, measurePerformance, getMemoryUsage } from './monitoring';

describe('monitoring utilities', () => {
  beforeEach(() => {
    // Mock performance API
    global.performance = {
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByName: vi.fn(() => [{ duration: 123.45 }]),
      memory: {
        usedJSHeapSize: 10485760, // 10 MB in bytes
        totalJSHeapSize: 20971520, // 20 MB
        jsHeapSizeLimit: 104857600, // 100 MB
      },
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('markPerformance', () => {
    it('should create performance mark when available', () => {
      markPerformance('test-mark');
      expect(performance.mark).toHaveBeenCalledWith('test-mark');
    });

    it('should handle missing performance API gracefully', () => {
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      expect(() => markPerformance('test-mark')).not.toThrow();
      
      global.performance = originalPerformance;
    });
  });

  describe('measurePerformance', () => {
    it('should measure duration between marks', () => {
      const duration = measurePerformance('test-measure', 'start', 'end');
      
      expect(performance.measure).toHaveBeenCalledWith('test-measure', 'start', 'end');
      expect(performance.getEntriesByName).toHaveBeenCalledWith('test-measure');
      expect(duration).toBe(123.45);
    });

    it('should return 0 when measurement fails', () => {
      vi.mocked(performance.measure).mockImplementation(() => {
        throw new Error('Measurement failed');
      });
      
      const duration = measurePerformance('test-measure', 'start', 'end');
      expect(duration).toBe(0);
    });

    it('should handle missing performance API', () => {
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      const duration = measurePerformance('test-measure', 'start', 'end');
      expect(duration).toBe(0);
      
      global.performance = originalPerformance;
    });
  });

  describe('getMemoryUsage', () => {
    it('should return memory usage in MB', () => {
      const memory = getMemoryUsage();
      
      expect(memory).toEqual({
        usedJSHeapSize: '10.00 MB',
        totalJSHeapSize: '20.00 MB',
        jsHeapSizeLimit: '100.00 MB',
      });
    });

    it('should return null when memory API unavailable', () => {
      const originalMemory = (performance as any).memory;
      delete (performance as any).memory;
      
      const memory = getMemoryUsage();
      expect(memory).toBeNull();
      
      (performance as any).memory = originalMemory;
    });

    it('should handle missing performance API', () => {
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      const memory = getMemoryUsage();
      expect(memory).toBeNull();
      
      global.performance = originalPerformance;
    });
  });
});
