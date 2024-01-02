import type { Signal, QRL, JSXNode, NoSerialize } from "@builder.io/qwik";

export type SortBy = { [key: string]: "asc" | "desc" } | undefined;

/**
 * Values that can be serialized in the store.
 */
export type Serializable = string | number | undefined;

export type HeaderArgs = {
  isSortedBy: boolean;
  sortOrder?: "asc" | "desc";
  id?: string;
};

type HeaderFn = (props: HeaderArgs) => JSXNode | Serializable | Element;

type CellFn<T> = (info: T) => JSXNode | Serializable | Element;

export type ColumnDef<TData extends TableData> =
  | {
      /**
       * ID is used as a key and a mechanism for sorting. This
       * is required if you intend to sort columns.
       */
      id?: string;
      cell?: CellFn<{ value: TData[keyof TData] | undefined }>;
      /**
       * The header of this column.
       */
      header?: string | HeaderFn;
      /**
       * An accessor function for when data cannot be
       * retrieved from a shallow property.
       */
      accessorFn?: never;
      /**
       * A key for accessing a shallow value from an object.
       * TODO: Allow dot notation (lodash.get, for example).
       */
      accessorKey: keyof TData;
    }
  | {
      id?: string;
      cell?: CellFn<unknown>;
      header?: string | HeaderFn;
      accessorFn?: (data: TData) => string | number | undefined;
      accessorKey?: never;
    };

export type HeaderDef = {
  header: JSXNode | Serializable;
  id?: string;
};

export type ColumnDefs<TData extends TableData> = ColumnDef<TData>[];

export type TableOptions<TData extends TableData> = {
  /**
   * Passes in {ColumnDefs} as a QRL in order to expose its functions
   * on the client.
   */
  getColumnDefs$: QRL<() => ColumnDefs<TData>>;
  /**
   * The data from which table content is to be derived.
   */
  data: Signal<TData[] | undefined | null>;
  /**
   * The content that appears if a data value is null or undefined.
   */
  fallback?: string;
};

export type Column = {
  value?: JSXNode | Serializable;
  cell?: JSXNode | Serializable;
  id: string;
};

/**
 * A Column derivative that applies NoSerialize to functions in order
 * for them to be safely placed in store.
 */
export type StoreColumn = {
  value?: NoSerialize<() => JSXNode | Serializable | Element> | Serializable;
  cell?: NoSerialize<() => JSXNode | Serializable | Element> | Serializable;
  id: string;
};

/**
 * A HeaderDef derivative that applies NoSerialize to functions in order
 * for them to be safely placed in store.
 */
export type StoreHeaderDef = {
  cell: NoSerialize<() => JSXNode | Serializable | Element> | Serializable;
  id?: string;
};

export type TableData = Record<string, any>;
