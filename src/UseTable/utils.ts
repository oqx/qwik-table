import isString from "lodash.isstring";
import type {
  TableData,
  ColumnDef,
  SortBy,
  StoreHeaderDef,
  StoreColumn,
  ColumnDefs,
} from "./types";
import { Signal, noSerialize } from "@builder.io/qwik";
import isObject from "lodash.isobject";

/**
 * Converts value to a string or lowercases strings.
 *
 * @param value
 */
export const normalizeStringValue = (value: string | undefined) => {
  if (!value) return "";
  if (isString(value)) return value.toLowerCase();

  throw TypeError(
    "normalizeStringValue requires value to be coercive to a string.",
  );
};

/**
 * Converts values to a string or lowercases strings.
 *
 * @param value
 */
export const normalizeStringValues = (
  a: string | undefined,
  b: string | undefined,
) => [normalizeStringValue(a), normalizeStringValue(b)];

/**
 * @summary Creates a {@link SortBy} object, which determines which
 * column the table is sorted by, and also whether ascending or descending
 * order.
 *
 * @param sortBy Existing {@link SortBy} object, or undefined.
 *
 * @param columnDefId ID of the column that determines sort order.
 */
export const sortHelper = (sortBy: SortBy, columnDefId: string): SortBy => {
  if (!sortBy) {
    return {
      [columnDefId]: "asc",
    };
  }
  if (sortBy[columnDefId]) {
    if (sortBy[columnDefId] === "asc") {
      return {
        [columnDefId]: "desc",
      };
    }
  }
  return {
    [columnDefId]: "asc",
  };
};

/**
 * @summary Applies event listeners that change the SortBy value
 * on click.
 *
 * @param sortedBy
 *
 * @returns
 */
export const applySortListeners = (sortedBy: Signal<SortBy | undefined>) => {
  if (typeof window === "undefined") {
    return () => null;
  }
  if (!sortedBy) {
    console.warn(
      "useTable -> applySortListeners: sortBy key/value pair undefined.",
    );
    return () => null;
  }

  const sorters = document.querySelectorAll("[data-usetable-sort]");

  if (!sorters || !sorters.length) return () => null;

  const onClick = (e: MouseEvent) => {
    if (e.target) {
      const columnDefId = (e.target as HTMLElement).dataset["usetableSort"];

      if (columnDefId) {
        sortedBy.value = sortHelper(sortedBy.value, columnDefId);
      }
    }
  };

  sorters.forEach((el) =>
    (el as HTMLElement).addEventListener("click", onClick),
  );

  return () => {
    sorters.forEach((el) =>
      (el as HTMLElement).removeEventListener("click", onClick),
    );
  };
};

/**
 * @summary Creates header value by either executing a JSXNode and
 * passing in the HeaderArgs type, or attaching a string.
 * @param col
 *
 * @param state
 */
export const deriveHeaders = <TData extends TableData>(
  columns: ColumnDef<TData>[],
  sortedBy: SortBy,
): StoreHeaderDef[] => {
  const cols = [];

  for (const col of columns) {
    const header = col.header;

    if (typeof header === "function") {
      const [[key, order]] = sortedBy
        ? Object.entries(sortedBy ?? {})
        : [[undefined, undefined]];

      const cell = noSerialize(() =>
        header({
          isSortedBy: key === col.id,
          sortOrder: order,
          id: col.id,
        }),
      );

      cols.push({ cell, id: col.id });

      continue;
    }

    if (typeof header !== "undefined") {
      cols.push({ cell: header, id: col.id });

      continue;
    }
  }
  return cols;
};

export const getValueFromColumnDef = <TData extends TableData>(
  column: ColumnDef<TData> | undefined,
  state: TData,
): TData[keyof TData] | undefined => {
  if (!column) return;

  if (!state || !isObject(state)) {
    throw new TypeError(
      `getValueFromColumnDef: Expected a "data" state object, instead received ${typeof state}.`,
    );
  }

  if (column.accessorKey && column.accessorKey in state) {
    return state[column.accessorKey];
  } else if (column.accessorKey && !(column.accessorKey in state)) {
    throw new Error(
      `accessorKey "${String(
        column.accessorKey,
      )}" does not exist in "data" state.`,
    );
  }

  if (typeof column.accessorFn === "function") {
    return column.accessorFn(state) as any;
  }

  throw new Error(
    "Could not retrieve value from ColumnDef. This could be due to a ColumnDef missing an accessorKey or accessorFn property.",
  );
};

/**
 * @summary Creates cell value by either executing a JSXNode and
 * passing in the value property, or attaching a string.
 * @param col
 *
 * @param state
 */
export const getCellValue = <TData extends TableData>(
  col: ColumnDef<TData>,
  state: TData,
) => {
  const cell = col?.cell;

  const value = getValueFromColumnDef(col, state);

  if (typeof cell === "function") {
    return noSerialize(() => cell({ value }));
  }

  return value;
};

/**
 * @summary Simple function for creating an ID on the fly.
 *
 * @param str
 */
const createIdFromString = (str: string | undefined) =>
  str ? str.replace(/\W/g, "_").toLowerCase() : undefined;

/**
 * @summary Creates cell value by either executing a JSXNode and
 * passing in the value property, or attaching a string.
 * @param col
 *
 * @param state
 *
 * @param prefixId
 *
 * @param fallback
 */
export const deriveColumnsFromColumnDefs = <TData extends TableData>(
  col: ColumnDef<TData>,
  state: TData,
  prefixId: string,
  fallback: string,
): StoreColumn => {
  const value = getValueFromColumnDef(col, state);

  const id = col.id ?? `${prefixId}-${createIdFromString(value) ?? fallback}`;

  const cell = getCellValue(col, state);

  return {
    value: value ?? fallback,
    id,
    cell: cell ?? fallback,
  };
};

/**
 * @summary Checks if date constructor returned a valid
 * date, rather than 'Invalid Date'.
 *
 * @param d
 */
const isValidDate = (d: unknown) => {
  // @ts-ignore
  return d instanceof Date && !isNaN(d);
};

/**
 * @summary Checks if date is a date object or a date string.
 * If it's a mm-dd-yyyy string, it replaces hyphens with forward
 * slashes to make it compatible with safari.
 *
 * @param value
 */
export const parseDateString = (value: unknown) => {
  if (value instanceof Date) return value;

  try {
    if (typeof value === "string") {
      let date = value;

      if (/\d{1,2}-\d{1,2}-\d{2,4}/.test(date)) {
        date = value.replaceAll("-", "/");
      }
      const dateObj = new Date(date);

      if (isValidDate(dateObj)) {
        return dateObj;
      }
    }
  } catch (err) {
    return;
  }
};

export const isDate = (value: unknown): boolean =>
  value instanceof Date || !!parseDateString(value);

const isNumber = (value: unknown): boolean =>
  typeof value === "number" ||
  (typeof value === "string" && !Number.isNaN(+value));

/**
 * @summary Retrieves number values from the arguments
 *
 * @param a
 *
 * @param b
 */
const normalizeNumberValues = (a: number | string, b: number | string) => [
  +a,
  +b,
];

/**
 * @summary Retrieves date objects from the arguments.
 *
 * @param a
 *
 * @param b
 */
export const normalizeDateValues = (a: unknown, b: unknown) => [
  parseDateString(a),
  parseDateString(b),
];

/**
 * @summary Determines what the types are of the two items
 * being compared.
 *
 * @param a
 *
 * @param b
 */
const getSortType = (a: unknown, b: unknown) => {
  if (isDate(a) && isDate(b)) {
    return "date";
  } else if (isNumber(a) && isNumber(b)) {
    return "number";
  }
  return "string";
};

/**
 * @summary Handles the edge case where one or more values are
 * undefined.
 *
 * @param a First sort value.
 *
 * @param b Second sort value.
 *
 * @param order 'asc' | 'desc'
 */
const deriveOrderFromUndefined = (a: unknown, b: unknown, order: string) => {
  if (order === "asc" && a && !b) {
    return 1;
  }

  if (order === "asc" && !a && b) {
    return -1;
  }

  if (order === "desc" && a && !b) {
    return -1;
  }

  if (order === "desc" && !a && b) {
    return 1;
  }
};

/**
 * @summary Compares dates, returning a sort value for the
 * Array.sort callback.
 *
 * @param a First sort value.
 *
 * @param b Second sort value.
 *
 * @param order 'asc' | 'desc'
 */
export const sortByDates = (a: Date, b: Date, order: string) => {
  const [_a, _b] = normalizeDateValues(a, b);

  const undefinedOrder = deriveOrderFromUndefined(_a, _b, order);

  if (undefinedOrder) return undefinedOrder;

  if (order === "asc") {
    return _a!.getTime() - _b!.getTime();
  }
  return _b!.getTime() - _a!.getTime();
};

/**
 * @summary Compares numbers, returning a sort value for the
 * Array.sort callback.
 *
 * @param a First sort value.
 *
 * @param b Second sort value.
 *
 * @param order 'asc' | 'desc'
 */
export const sortByNumbers = (
  a: string | number,
  b: string | number,
  order: string,
) => {
  const [_a, _b] = normalizeNumberValues(a, b);

  const undefinedOrder = deriveOrderFromUndefined(_a, _b, order);

  if (undefinedOrder) return undefinedOrder;

  if (order === "asc") {
    return _a - _b;
  }
  return _b - _a;
};

/**
 * @summary Compares strings, returning a sort value for the
 * Array.sort callback.
 *
 * @param a First sort value.
 *
 * @param b Second sort value.
 *
 * @param order 'asc' | 'desc'
 */
export const sortByStrings = (
  a: string | undefined,
  b: string | undefined,
  order: string,
) => {
  const [_a, _b] = normalizeStringValues(a, b);

  const undefinedOrder = deriveOrderFromUndefined(_a, _b, order);

  if (undefinedOrder) return undefinedOrder;

  if (order === "asc") {
    return _a.localeCompare(_b);
  }

  return _b.localeCompare(_a);
};

const SORT_MAP = {
  string: sortByStrings,
  date: sortByDates,
  number: sortByNumbers,
};

/**
 * @summary Sorts columns by string, date, and number.
 */
export const sortByValue = <TData extends TableData>({
  columnDefs,
  sortBy,
  data,
}: {
  columnDefs: ColumnDefs<TData>;
  sortBy: SortBy;
  data: TData[];
}) => {
  const [columnDefId, order] = isObject(sortBy)
    ? Object.entries(sortBy).flat()
    : [undefined, "asc"];

  if (!columnDefId) return;

  const columnDef = columnDefs?.find((col) => col.id === columnDefId);
  /**
   *  Retrieves values using accessors and sorts columns based on said values.
   */
  return data.sort((a, b) => {
    const first = getValueFromColumnDef(columnDef, a);

    const second = getValueFromColumnDef(columnDef, b);

    const sortType = getSortType(first, second);

    return SORT_MAP[sortType](first as any, second as any, order);
  });
};
