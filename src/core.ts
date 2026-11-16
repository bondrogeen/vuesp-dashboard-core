import { getParamsData } from './paths.js';
import type {
  TDashboardCommandResult,
  TDashboardEvaluator,
  IDashboardItem,
  IDeviceCommand,
  IResolvedDashboardItem,
} from './types.js';

const ENTITY_TYPE_BY_WIDGET: Record<string, string> = {
  button: 'switch',
  dimmer: 'number',
  info: 'sensor',
  date: 'sensor',
  list: 'select',
  input: 'text',
  chart: 'custom',
};

export const deriveEntityType = (item: IDashboardItem): string =>
  item.entityType || ENTITY_TYPE_BY_WIDGET[item.type] || 'custom';

export const normalizeFunctionBody = (body: string | undefined): string | null => {
  if (!body) return null;
  return body.includes('return') ? body : `return ${body}`;
};

const evaluateBody = (
  body: string | undefined,
  evaluate: TDashboardEvaluator,
  scope: Record<string, unknown>,
): unknown => {
  const normalized = normalizeFunctionBody(body);
  return normalized ? evaluate(normalized, scope) : undefined;
};

const metricScope = (args: unknown[]): Record<string, unknown> => ({
  a: args[0],
  b: args[1],
  c: args[2],
  d: args[3],
});

export const resolveDashboardItem = (
  item: IDashboardItem,
  state: unknown,
  evaluate: TDashboardEvaluator,
): IResolvedDashboardItem => {
  const args = getParamsData(item, state);
  const scope = metricScope(args);
  const raw = args[0] ?? '';

  const value = item.get ? evaluateBody(item.get, evaluate, scope) : raw;
  const valueTo = item.getTo ? evaluateBody(item.getTo, evaluate, { v: value, ...scope }) : value;

  return {
    ...item,
    value,
    valueTo,
    entityType: deriveEntityType(item),
  };
};

export const buildDashboardCommands = (
  item: IDashboardItem,
  newValue: unknown,
  state: unknown,
  evaluate: TDashboardEvaluator,
): unknown => {
  if (!item.set) return null;

  const args = getParamsData(item, state);

  return evaluateBody(item.set, evaluate, { v: newValue, ...metricScope(args) });
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isDeviceCommand = (value: unknown): value is IDeviceCommand => {
  if (!isRecord(value)) return false;
  if (typeof value.key !== 'string' && typeof value.key !== 'number') return false;
  return isRecord(value.object);
};

export const normalizeDashboardCommands = (value: unknown): IDeviceCommand[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(isDeviceCommand);
  return isDeviceCommand(value) ? [value] : [];
};

// Compatibility aliases for callers that used vuesp-components names.
export const getStateItem = resolveDashboardItem;
export const setStateItem = buildDashboardCommands;

export type { TDashboardCommandResult };
