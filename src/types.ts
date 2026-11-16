export type TDashboardEvaluator = (body: string, scope: Record<string, unknown>) => unknown;

export interface IDashboardListItem {
  name: string;
  value: string;
}

export interface IDashboardItemOptions {
  disabled?: number;
  min?: number;
  max?: number;
  step?: number;
  items?: IDashboardListItem[];
  unit?: string;
}

export interface IDashboardItem {
  id: string;
  name: string;
  type: string;
  entityType?: string;
  icon?: string;
  opts?: IDashboardItemOptions;
  args: string[];
  get?: string;
  getTo?: string;
  set?: string;
  meta?: Record<string, unknown>;
}

export interface IResolvedDashboardItem extends IDashboardItem {
  value: unknown;
  valueTo: unknown;
  entityType: string;
}

export interface IDeviceCommand {
  key: string | number;
  object: Record<string, unknown>;
}

export type TDashboardCommandResult = IDeviceCommand | IDeviceCommand[] | null;
