# Qwik Table ⚡️ [![codecov](https://codecov.io/gh/oqx/qwik-table/graph/badge.svg?token=12R5UICUAC)](https://codecov.io/gh/oqx/qwik-table) ![build](https://github.com/oqx/qwik-table/actions/workflows/release.yml/badge.svg)

A headless table hook for [Qwik](https://qwik.builder.io/), inspired by [@tanstack/table](https://github.com/TanStack/table).

- [Installation](#installation)
- [Examples](#examples)
- [useTable](#usetable)
- [useTable Parameters](#usetable-parameters)
  - [getColumnDefs$](#getcolumndefs)
  - [ColumnDef](#columndef)
    - [ColumnDef.id](#columndefid)
    - [ColumnDef.cell](#columndefcell)
    - [ColumnDef.header](#columndefheader)
    - [ColumnDef.accessorFn](#columndefaccessorfn)
    - [data](#data)
- [Usage](#usage)
  - [Creating Column Definitions](#creating-column-definitions)
  - [flexRender](#flexrender)
  - [Sorting](#sorting)
- [Attribution](#attribution)

<!-- /code_chunk_output -->

## Installation

```sh
pnpm add @oqx/qwik-table
```

```sh
npm install @oqx/qwik-table
```

```sh
yarn add @oqx/qwik-table
```

## Examples

- [CodeSandbox](https://codesandbox.io/p/github/oqx/qwik-table/main)
- [Simple Table](./src/examples/simple-table.tsx)
- [Sortable Columns](./src/examples/sortable-columns.tsx)

## useTable

`useTable` generates a data representation of a table that can be iterated through to create UI.

```tsx
export default component$<{ users: Signal<User[]> }>(({ users }) => {
  const table = useTable({ data: users, getColumnDefs$ });

  return (
    <div>
      <table>
        <thead>
          <tr>
            {table.headerGroups.value?.map((header) => (
              <td key={header.id}>{header.cell}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rowGroups.value?.map((row, i) => (
            <tr key={i + "row"}>
              {row.map((cell) => (
                <td key={cell.id}>{cell.value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
```

## useTable Parameters

### fallback

A fallback value for when a piece of data is empty. Defaults to `--`.

### getColumnDefs$

`getColumnDefs$` is a `QRL` that returns an array of [ColumnDef](/src//UseTable//types.ts#L=20), or column definitons. `QRL` is necessary since [ColumnDef](/src//UseTable//types.ts#L=20) can contain values that cannot be serialized.

### ColumnDef

`ColumnDef` is a building block that provides instructions on how to derive rows and columns from the `data` parameter. Below is a table of `ColumnDef` properties, their corresponding types, and descriptions of each.

#### ColumnDef.id

ID is a `string` used as a key and a mechanism for sorting. It's also used to derive keys for JSX iterables behind the scenes.

**Type**

```ts
string;
```

#### ColumnDef.cell

`cell` provides an API for adding HTML/JSX to a column. The `info` argument represents the `value` of the property selected from `data` via `accessorKey` or `accessorFn`.

**Type**

```ts
(info: { value: string | number | undefined }) =>
  JSXNode | Element | string | number;
```

#### ColumnDef.header

The table header is very similar to `cell`, except it received parameters that provide information about the sort order, and whether that table header's column is the active sort column.

**Type**

```ts
string | (props: {
  isSortedBy: boolean;
  sortOrder?: "asc" | "desc";
  id?: string;
}) => JSXNode | Serializable | Element
```

#### ColumnDef.accessorFn

An accessor function for when you have a more complex value, like an object, to derive data from. For example, a nested object:

```ts
const data = [
  {
    // ...
    details: {
      address: {
        city: "Minneapolis",
      },
    },
  },
];
// state will be equal to data
const getColumnDefs$ = $(() => [
  {
    id: "city",
    header: "City",
    accessorFn(state) {
      return state.details.address.city;
    },
  },
  // ...
]);
```

**Type**

```ts
(data: TData) => string | number | undefined`
```

#### data

`data` represents a `Signal` that is an array of objects. It is to be transformed into table headers, rows, and columns via `ColumnDef` definitions provided by `getColumnDefs$`.

## Usage

### Creating Column Definitions

For this example, a table of users will be created, where a user looks like:

```typescript
type User = {
  name: string;
  email: string;
  age: string;
};
```

With `User` defined, a `getColumnDefs$` QRL would look like this:

```typescript
const getColumnDefs$ = $((): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    id: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    id: "email",
    header: "Email",
  },
  {
    accessorKey: "age",
    id: "age",
    header: "Age",
  },
]);
```

Adding `ColumnDef` with a generic to the return type will allow validation of `accessorKey`.

### flexRender

`flexRender` will determine whether the value passed in is a string or a function and return a value that can be rendered in the UI.

For example, in `ColumnDef`, instead of adding a `string` to the `header` property, it can instead be a function that returns a JSXNode or element. This removes the ternary statement boilerplate you'd otherwise need.

```tsx
const header = (value: string) => () => <span>{value} 🍕</span>;

const getColumnDefs$ = $((): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    id: "name",
    header: header("Name"),
  },
  // ...
]);
```

### Sorting

Sorting can be achieved by adding `data-usetable-sort` to an element -- particularly an element assigned to `ColumnDef.header`.

Here's an example:

```tsx
const header =
  (value: string) =>
  ({
    isSortedBy,
    sortOrder,
    id,
  }: {
    isSortedBy: boolean;
    sortOrder?: "asc" | "desc";
    id?: string;
  }) => (
    // Adding data-usetable-sort to an element will automatically
    // add onClick sort functionality.
    <button data-usetable-sort={id}>
      {value}{" "}
      <span
        class={{
          chevron: true,
          "chevron--down": isSortedBy && sortOrder === "desc",
          "chevron--up": isSortedBy && sortOrder === "asc",
        }}
      />
    </button>
  );
```

A JSXNode assigned to `ColumnDef.header` will receive the following props:

```ts
type HeaderArgs = {
  // true if the column is currently the one the table is sorted by
  isSortedBy: boolean;
  // current sort order
  sortOrder?: "asc" | "desc";
  // id of the column being sorted
  id?: string;
};
```

## Attribution

Inspired by [@tanstack/table](https://github.com/TanStack/table).
