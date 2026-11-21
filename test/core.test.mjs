import assert from 'node:assert/strict';
import { test } from 'node:test';

import { computed, reactive } from '@vue/reactivity';

import {
  buildDashboardCommands,
  deriveEntityType,
  getDataValue,
  normalizeDashboardCommands,
  normalizeFunctionBody,
  resolveDashboardItem,
} from '../dist/index.js';

const evaluator = (body, scope) => new Function(...Object.keys(scope), body)(...Object.values(scope));

const relay = {
  id: 'relay',
  name: 'Relay',
  type: 'button',
  entityType: 'switch',
  args: ['ports.12.value', 'ports.12'],
  getTo: "v ? 'ON' : 'OFF'",
  set: '({ ...b, value: v, command: 2 })',
};

const state = {
  ports: {
    12: { key: 9, gpio: 12, value: 1, mode: 1 },
    17: { key: 9, gpio: 17, value: 23, mode: 130 },
  },
};

test('getDataValue reads own paths and rejects prototypes', () => {
  assert.equal(getDataValue('ports.12.value', state), 1);
  assert.equal(getDataValue('ports.404.value', state), undefined);
  assert.equal(getDataValue('__proto__.polluted', state), undefined);
  assert.equal(getDataValue('constructor.name', state), undefined);
});

test('getDataValue stays reactive when a key appears later', () => {
  const live = reactive({ ports: {} });
  const value = computed(() => getDataValue('ports.12.value', live));

  assert.equal(value.value, undefined);

  live.ports[12] = { value: 1 };
  assert.equal(value.value, 1);

  live.ports[12].value = 0;
  assert.equal(value.value, 0);
});

test('resolveDashboardItem updates when a missing port arrives', () => {
  const live = reactive({ ports: {} });
  const result = computed(() => resolveDashboardItem(relay, live, evaluator));

  assert.equal(result.value.value, '');

  live.ports[12] = { key: 9, gpio: 12, value: 1, mode: 1 };
  assert.equal(result.value.value, 1);
  assert.equal(result.value.valueTo, 'ON');

  live.ports[12].value = 0;
  assert.equal(result.value.value, 0);
  assert.equal(result.value.valueTo, 'OFF');
});

test('resolveDashboardItem resolves args, getTo and entity type', () => {
  const result = resolveDashboardItem(relay, state, evaluator);
  assert.equal(result.value, 1);
  assert.equal(result.valueTo, 'ON');
  assert.equal(result.entityType, 'switch');
});

test('resolveDashboardItem supports get before getTo', () => {
  const item = {
    id: 'temp',
    name: 'Temperature',
    type: 'info',
    args: ['ports.17.value'],
    get: 'a / 10',
    getTo: '`${v} C`',
  };
  const result = resolveDashboardItem(item, state, evaluator);
  assert.equal(result.value, 2.3);
  assert.equal(result.valueTo, '2.3 C');
  assert.equal(result.entityType, 'sensor');
});

test('resolveDashboardItem passes a-d to get and v+a-d to getTo', () => {
  const item = {
    id: 'sum',
    name: 'Sum',
    type: 'info',
    args: ['ports.12.value', 'ports.17.value'],
    get: 'a + b',
    getTo: '`${v} (${a}+${b})`',
  };
  const result = resolveDashboardItem(item, state, evaluator);
  assert.equal(result.value, 24);
  assert.equal(result.valueTo, '24 (1+23)');
});

test('buildDashboardCommands returns a device command', () => {
  const command = buildDashboardCommands(relay, 0, state, evaluator);
  assert.deepEqual(command, { key: 9, gpio: 12, value: 0, mode: 1, command: 2 });
});

test('normalizeDashboardCommands accepts a single command or an array', () => {
  assert.deepEqual(normalizeDashboardCommands({ key: 'PORT', object: { gpio: 12 } }), [
    { key: 'PORT', object: { gpio: 12 } },
  ]);
  assert.equal(
    normalizeDashboardCommands([
      { key: 9, object: { gpio: 12 } },
      { key: 9, object: { gpio: 13 } },
    ]).length,
    2,
  );
  assert.deepEqual(normalizeDashboardCommands(null), []);
});

test('normalizeFunctionBody adds return for expressions', () => {
  assert.equal(normalizeFunctionBody('v ? 1 : 0'), 'return v ? 1 : 0');
  assert.equal(normalizeFunctionBody('return v'), 'return v');
  assert.equal(normalizeFunctionBody(''), null);
});

test('deriveEntityType uses explicit value or widget fallback', () => {
  assert.equal(deriveEntityType({ id: 'x', name: 'x', type: 'button', args: [] }), 'switch');
  assert.equal(deriveEntityType({ id: 'x', name: 'x', type: 'dimmer', args: [] }), 'number');
  assert.equal(deriveEntityType({ id: 'x', name: 'x', type: 'custom', entityType: 'light', args: [] }), 'light');
});
