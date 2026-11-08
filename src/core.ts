import { getParamsData } from './paths.js';
import type {
  DashboardCommandResult,
  DashboardEvaluator,
  DashboardItem,
  DeviceCommand,
  ResolvedDashboardItem,
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

export const deriveEntityType = (item: DashboardItem): string =>
  item.entityType || ENTITY_TYPE_BY_WIDGET[item.type] || 'custom';

export const normalizeFunctionBody = (body: string | undefined): string | null => {
  if (!body) return null;
  return body.includes('return') ? body : `return ${body}`;
};

const evaluateBody = (
  body: string | undefined,
  evaluate: DashboardEvaluator,
  v: unknown,
  a: unknown,
  b: unknown,
  c: unknown,
): unknown => {
  const normalized = normalizeFunctionBody(body);
  return normalized ? evaluate(normalized, v, a, b, c) : undefined;
};

export const resolveDashboardItem = (
  item: DashboardItem,
  state: unknown,
  evaluate: DashboardEvaluator,
): ResolvedDashboardItem => {
  const args = getParamsData(item, state);
  const raw = args[0] ?? '';

  const value = item.get ? evaluateBody(item.get, evaluate, raw, args[1], args[2], args[3]) : raw;
  const valueTo = item.getTo ? evaluateBody(item.getTo, evaluate, value, args[1], args[2], args[3]) : value;

  return {
    ...item,
    value,
    valueTo,
    entityType: deriveEntityType(item),
  };
};

export const buildDashboardCommands = (
  item: DashboardItem,
  newValue: unknown,
  state: unknown,
  evaluate: DashboardEvaluator,
): unknown => {
  if (!item.set) return null;

  const args = getParamsData(item, state);
  return evaluateBody(item.set, evaluate, newValue, args[1], args[2], args[3]);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isDeviceCommand = (value: unknown): value is DeviceCommand => {
  if (!isRecord(value)) return false;
  if (typeof value.key !== 'string' && typeof value.key !== 'number') return false;
  return isRecord(value.object);
};

export const normalizeDashboardCommands = (value: unknown): DeviceCommand[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(isDeviceCommand);
  return isDeviceCommand(value) ? [value] : [];
};

// Compatibility aliases for callers that used vuesp-components names.
export const getStateItem = resolveDashboardItem;
export const setStateItem = buildDashboardCommands;

export type { DashboardCommandResult };
