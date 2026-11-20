# Proposal

## Why

`vuesp-dashboard-core` задаёт общую модель dashboard и команд для UI и hub, но
его контракт живёт только в README и тестах. Нужен baseline, чтобы изменения
dashboard-семантики проходили через спеки.

## What Changes

- Добавляются две baseline-спеки:
  - `dashboard-resolution` — пути, аргументы, `get`/`getTo`, тип сущности;
  - `dashboard-commands` — `set`, нормализация команд.
- Код библиотеки не меняется.

## Capabilities

### New Capabilities

- `dashboard-resolution`: безопасное чтение состояния и вычисление отображения.
- `dashboard-commands`: построение команд устройства из `set`.

### Modified Capabilities

Нет.

## Impact

- Только `openspec/`.
- Потребители: `vuesp-components`, `vuesp-hub`, `vuesp`.
