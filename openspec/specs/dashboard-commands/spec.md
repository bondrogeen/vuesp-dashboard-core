# dashboard-commands Specification

## Purpose

Описывает построение команд устройства из `set`-выражения плитки и нормализацию результата.

## Requirements

### Requirement: Build commands from set

`buildDashboardCommands` SHALL передавать в `set` значения `v`, `a`, `b`, `c`, `d` и SHALL возвращать `null`, если `set` не задан.

#### Scenario: Set receives new value and arguments

- **WHEN** у плитки есть `set` и новое значение
- **THEN** выражение получает `v` и аргументы плитки

#### Scenario: Info tile produces no command

- **WHEN** у плитки нет `set`
- **THEN** результат равен `null`

### Requirement: Command normalization

`normalizeDashboardCommands` SHALL превращать одиночную команду в массив, сохранять массив команд и отбрасывать значения без `key` или `object`.

#### Scenario: Single command becomes an array

- **WHEN** `set` вернул один объект команды
- **THEN** нормализация возвращает массив из одной команды

#### Scenario: Invalid values are dropped

- **WHEN** результат `set` содержит объект без `key` или `object`
- **THEN** он не попадает в итоговый массив

### Requirement: No implicit execution

Ядро SHALL NOT исполнять код выражений самостоятельно; вычисление выполняет переданный evaluator.

#### Scenario: Core does not evaluate without a function

- **WHEN** вызывающая сторона не передала evaluator
- **THEN** ядро не пытается исполнить выражение самостоятельно
