# dashboard-resolution Specification

## Purpose

Описывает безопасное чтение состояния dashboard, вычисление значений плитки и определение типа сущности.

## Requirements

### Requirement: Safe state paths

`getDataValue` SHALL читать только собственные свойства объекта по точечному пути и SHALL возвращать `undefined` для пустого пути, не-объекта или запрещённых сегментов `__proto__`, `prototype`, `constructor`.

#### Scenario: Own property is read

- **WHEN** путь указывает на собственное свойство состояния
- **THEN** возвращается его значение

#### Scenario: Prototype pollution is blocked

- **WHEN** путь содержит `__proto__`, `prototype` или `constructor`
- **THEN** возвращается `undefined`

#### Scenario: Missing path is safe

- **WHEN** путь не существует или промежуточное значение не объект
- **THEN** возвращается `undefined` без исключения

### Requirement: Argument scope

Аргументы плитки SHALL разрешаться в массив значений и передаваться в выражения как `a`, `b`, `c`, `d`; отсутствующие аргументы SHALL быть `undefined`.

#### Scenario: Four arguments are available

- **WHEN** у плитки заданы четыре пути аргументов
- **THEN** выражение получает `a`, `b`, `c`, `d` с соответствующими значениями

### Requirement: Resolve item value and display

`resolveDashboardItem` SHALL вычислять `value` через `get` (или брать первый аргумент), `valueTo` через `getTo` с `v = value`, и SHALL возвращать плитку с вычисленными полями.

#### Scenario: get and getTo are applied

- **WHEN** у плитки заданы `get` и `getTo`
- **THEN** результат содержит вычисленные `value` и `valueTo`

#### Scenario: Expression without return is normalized

- **WHEN** тело выражения не содержит `return`
- **THEN** оно вычисляется как выражение

### Requirement: Entity type derivation

Тип сущности SHALL браться из `entityType`, если он задан, иначе из соответствия типа плитки (`button` → `switch`, `dimmer` → `number`, `info`/`date` → `sensor`, `list` → `select`, `input` → `text`, `chart` → `custom`), иначе `custom`.

#### Scenario: Explicit type wins

- **WHEN** у плитки задан `entityType`
- **THEN** он используется без изменений

#### Scenario: Widget type maps to entity type

- **WHEN** `entityType` не задан
- **THEN** тип определяется по типу плитки или становится `custom`

### Requirement: Evaluator errors reach the caller

Ошибки evaluator SHALL пробрасываться вызывающей стороне, чтобы UI или hub могли изолировать сломанную плитку.

#### Scenario: Broken expression fails the item

- **WHEN** evaluator выбрасывает ошибку
- **THEN** `resolveDashboardItem` не скрывает её и не подменяет значение
