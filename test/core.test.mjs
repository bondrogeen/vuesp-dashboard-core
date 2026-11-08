import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildDashboardCommands,
  deriveEntityType,
  getDataValue,
  normalizeDashboardCommands,
  normalizeFunctionBody,
  resolveDashboardItem,
} from '../dist/index.js';

const evaluator = (body, v, a, b, c) => new Function('v', 'a', 'b', 'c', body)(v, a, b, c);

const relay = {
  id: 'relay',
  name: 'Relay',
  type: 'button',
  entityType: 'switch',
  args: ['ports.12.value', 'ports.12'],
  getTo: "v ? 'ON' : 'OFF'",
  set: '({ ...a, value: v, command: 2 })',
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
    get: 'v / 10',
    getTo: '`${v} C`',
  };
  const result = resolveDashboardItem(item, state, evaluator);
  assert.equal(result.value, 2.3);
  assert.equal(result.valueTo, '2.3 C');
  assert.equal(result.entityType, 'sensor');
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
