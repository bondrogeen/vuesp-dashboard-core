# vuesp-dashboard-core

Framework-agnostic core for resolving Vuesp dashboard items and building device commands.

The UI and the hub use the same logic. Only the JavaScript evaluator differs:

- browser UI: `new Function`;
- hub: a sandboxed evaluator with no host access (for example QuickJS).

## API

```ts
import {
  getDataValue,
  resolveDashboardItem,
  buildDashboardCommands,
  normalizeDashboardCommands,
} from 'vuesp-dashboard-core';

const item = {
  id: 'relay',
  name: 'Relay',
  type: 'button',
  args: ['ports.12.value', 'ports.12'],
  getTo: "v ? 'ON' : 'OFF'",
  set: '({ ...a, value: v, command: 2 })',
};

const state = {
  ports: {
    12: { key: 9, gpio: 12, value: 1, mode: 1 },
  },
};

// The core never executes dashboard expressions itself.
const evaluate = (body, v, a, b, c) => new Function('v', 'a', 'b', 'c', body)(v, a, b, c);

const resolved = resolveDashboardItem(item, state, evaluate);
// { ...item, value: 1, valueTo: 'ON', entityType: 'switch' }

const command = buildDashboardCommands(item, 0, state, evaluate);
// { key: 9, gpio: 12, value: 0, mode: 1, command: 2 }
```

`evaluate` receives the normalized function body and the current `v`, `a`, `b`, `c` values. A body without `return` is treated as an expression.

## Security

The core does not execute code. The caller must provide an evaluator.

- Browser: the existing `new Function` evaluator.
- Hub: a sandboxed QuickJS evaluator with no host access.

The core rejects `__proto__`, `prototype` and `constructor` paths when resolving `args`.

## Package layout

```text
src/
├── core.ts      resolve/command logic
├── paths.ts     safe path resolution
├── types.ts     public types
└── index.ts     exports
test/
└── core.test.mjs
```
