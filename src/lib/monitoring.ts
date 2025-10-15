/**
 * Web Vitals Monitoring
 * Tracks Core Web Vitals for performance monitoring
 */

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

/**
 * Report Web Vitals to analytics endpoint
 */
const reportWebVitals = (metric: WebVitalsMetric) => {
  // In production, send to your analytics service
  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', metric);
  }
  
  // Example: Send to analytics
  // navigator.sendBeacon('/analytics', JSON.stringify(metric));
};

/**
 * Initialize Web Vitals monitoring
 * Call this once in your app's entry point
 */
export const initWebVitals = async () => {
  if (import.meta.env.PROD) {
    try {
      const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import('web-vitals');
      
      onCLS(reportWebVitals);  // Cumulative Layout Shift
      onFCP(reportWebVitals);  // First Contentful Paint
      onLCP(reportWebVitals);  // Largest Contentful Paint
      onTTFB(reportWebVitals); // Time to First Byte
      onINP(reportWebVitals);  // Interaction to Next Paint (replaces FID)
    } catch (error) {
      console.error('Failed to load web-vitals', error);
    }
  }
};

/**
 * Custom performance marker
 */
export const markPerformance = (name: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(name);
  }
};

/**
 * Measure performance between two markers
 */
export const measurePerformance = (name: string, startMark: string, endMark: string) => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      
      if (import.meta.env.DEV) {
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
      
      return measure.duration;
    } catch (error) {
      console.error('Performance measurement failed', error);
    }
  }
  return 0;
};

/**
 * Track long tasks (tasks that block the main thread for >50ms)
 */
export const observeLongTasks = () => {
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (import.meta.env.DEV) {
            console.warn('[Long Task]', {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
          // Report to analytics in production
        }
      });
      
      observer.observe({ entryTypes: ['longtask'] });
      return observer;
    } catch (error) {
      console.error('Long task observation failed', error);
    }
  }
};

/**
 * Memory monitoring (Chrome only)
 */
export const getMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const memory = (performance as any).memory;
    if (memory) {
      return {
        usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      };
    }
  }
  return null;
};
