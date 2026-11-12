export type DashboardEvaluator = (body: string, scope: Record<string, unknown>) => unknown;

export interface DashboardListItem {
  name: string;
  value: string;
}

export interface DashboardItemOptions {
  disabled?: number;
  min?: number;
  max?: number;
  step?: number;
  items?: DashboardListItem[];
  unit?: string;
}

export interface DashboardItem {
  id: string;
  name: string;
  type: string;
  entityType?: string;
  icon?: string;
  opts?: DashboardItemOptions;
  args: string[];
  get?: string;
  getTo?: string;
  set?: string;
  meta?: Record<string, unknown>;
}

export interface ResolvedDashboardItem extends DashboardItem {
  value: unknown;
  valueTo: unknown;
  entityType: string;
}

export interface DeviceCommand {
  key: string | number;
  object: Record<string, unknown>;
}

export type DashboardCommandResult = DeviceCommand | DeviceCommand[] | null;
