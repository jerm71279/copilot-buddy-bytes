import { memo, useMemo, useCallback } from 'react';

/**
 * Memoization utilities for React performance optimization
 */

/**
 * Deep comparison for React.memo
 * Use when props contain objects/arrays that should be compared by value
 */
export const deepCompare = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
};

/**
 * Shallow comparison for React.memo
 * More performant than deep compare, use when props are primitives or stable references
 */
export const shallowCompare = <T extends Record<string, any>>(
  prevProps: T,
  nextProps: T
): boolean => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) return false;

  return prevKeys.every(
    (key) => prevProps[key] === nextProps[key]
  );
};

/**
 * Create a memoized component with custom comparison
 * 
 * @example
 * const MemoizedComponent = createMemoComponent(MyComponent, shallowCompare);
 */
export const createMemoComponent = <P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  compare: (prev: P, next: P) => boolean = shallowCompare
) => {
  return memo(Component, compare);
};

/**
 * Memoize expensive computations
 * 
 * @example
 * const sortedData = useMemoizedValue(
 *   () => data.sort((a, b) => a.value - b.value),
 *   [data]
 * );
 */
export const useMemoizedValue = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};

/**
 * Memoize callback functions
 * 
 * @example
 * const handleClick = useMemoizedCallback(
 *   (id: string) => console.log(id),
 *   []
 * );
 */
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps) as T;
};

/**
 * HOC to automatically memoize a component
 * 
 * @example
 * const MyComponent = withMemo(({ data }) => <div>{data}</div>);
 */
export const withMemo = <P extends Record<string, any>>(
  Component: React.ComponentType<P>
) => {
  return memo(Component);
};

/**
 * Memoize array transformations
 */
export const useMemoizedArray = <T, R>(
  array: T[],
  transform: (item: T) => R
): R[] => {
  return useMemo(() => array.map(transform), [array, transform]);
};

/**
 * Memoize filtered data
 */
export const useMemoizedFilter = <T>(
  array: T[],
  predicate: (item: T) => boolean
): T[] => {
  return useMemo(() => array.filter(predicate), [array, predicate]);
};
