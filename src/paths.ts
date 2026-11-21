import type { IDashboardItem } from './types.js';

const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

/**
 * Resolve a dot-separated path against an untrusted state object.
 * Only own properties are read; prototype-polluting paths are rejected.
 */
export const getDataValue = (path: string, state: unknown): unknown => {
  if (typeof path !== 'string' || path.length === 0) return undefined;

  let current: unknown = state;
  for (const part of path.split('.')) {
    if (BLOCKED_KEYS.has(part)) return undefined;
    if (current === null || typeof current !== 'object') return undefined;
    // `in` goes through the Proxy `has` trap, so Vue tracks a key that does not
    // exist yet. `hasOwnProperty` alone is not reactive: it reads the property
    // descriptor, which Vue does not intercept.
    if (!(part in current)) return undefined;
    if (!Object.prototype.hasOwnProperty.call(current, part)) return undefined;
    // `get` goes through the Proxy `get` trap, so Vue tracks value changes.
    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

export const getParamsData = (item: IDashboardItem, state: unknown): unknown[] =>
  item.args.map((path) => getDataValue(path, state));
