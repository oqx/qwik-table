- [Qwik Table ⚡️](#qwik-table-️)
  - [Commands](#commands)
    - [pnpm dev](#pnpm-dev)
  - [useTable](#usetable)
    - [Arguments](#arguments)
      - [getColumnDefs$](#getcolumndefs)
      - [data](#data)
  - [Usage](#usage)
    - [Creating Column Definitions](#creating-column-definitions)
    - [Using useTable](#using-usetable)
  - [Advanced Usage](#advanced-usage)
    - [flexRender](#flexrender)
    - [Sorting](#sorting)

# Qwik Table ⚡️

A headless table hook for [Qwik](https://qwik.builder.io/), inspired by [@tanstack/table](https://github.com/TanStack/table).

## Commands

### pnpm dev

Runs project locally.

## useTable

`useTable` generates a data representation of a table that can be iterated through to create UI.

### Arguments

#### getColumnDefs$

`getColumnDefs$` is a `QRL` that returns an array of [ColumnDef](/src//UseTable//types.ts#L=20), or column definitons. `QRL` is necessary since [ColumnDef](/src//UseTable//types.ts#L=20) can contain values that cannot be serialized. `getColumnDefs$` is a building block that provides instructions on how to derive rows and columns from the `data` argument. Below is a table of `ColumnDef` properties, their corresponding types, and descriptions of each.

| Property    | Type                                                                           | Description                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| id          | `string`                                                                       | ID is used as a key and a mechanism for sorting. This is required if you intend to sort columns.                                                                           |
| cell        | `( info :   unknown )  =>  JSXNode  \|  Serializable  \|  Element`             | `cell` provides an API for adding HTML/JSX to a column. The `info` argument represents the `value` of the property selected from `data` via `accessorKey` or `accessorFn`. |
| header      | `string \| ( props :  HeaderArgs)  =>  JSXNode  \|  Serializable  \|  Element` | The table header value of the column.                                                                                                                                      |
| accessorFn  | `( data :  TData)  =>   string   \|   number   \|   undefined`                 | An accessor function for when data cannot be retrieved from a shallow property.                                                                                            |
| accessorKey | `keyof  TData`                                                                 | A key for accessing a shallow value from an object.                                                                                                                        |     |

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

### Using useTable

```tsx
export default component$<{ users: Signal<User[]> }>(({ users }) => {
  const table = useTable({ data: users, getColumnDefs$ });

  return (
    <div>
      <table>
        <thead>
          <tr>
            {table.headerGroups.value?.map((header) => (
              <td key={header.id}>{header.header}</td>
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

## Advanced Usage

### flexRender

`flexRender` will determine whether the value passed in is a string or a function and return a value that can be rendered in the UI.

For example, in `ColumnDef`, instead of adding a `string` to the `header` property, it can instead be a function that returns a JSXNode or element.

```tsx
const SortHeader = ({
  isSortedBy,
  sortOrder,
  heading,
  id,
}: {
  isSortedBy: boolean;
  sortOrder?: "asc" | "desc";
  heading: string;
  id?: string;
}) => (
  // Adding data-usetable-sort to an element will automatically
  // add onClick sort functionality.
  <button data-usetable-sort={id}>
    {heading}{" "}
    <span
      class={{
        chevron: true,
        "chevron--down": isSortedBy && sortOrder === "desc",
        "chevron--up": isSortedBy && sortOrder === "asc",
      }}
    />
  </button>
);

const getColumnDefs$ = $((): ColumnDef<User>[] => [
  {
    accessorKey: "name",
    id: "name",
    header: (props) => SortHeader({ ...props, heading: "Name" }),
  },
  // ...
]);
```

### Sorting

Sorting can be achieved by adding `data-usetable-sort` to an element -- particularly an element assigned to `ColumnDef.header` (see the SortHeader example above). A JSXNode assigned to `ColumnDef.header` will receive the following props:

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
