import isNumber from "lodash.isnumber";
import isString from "lodash.isstring";
import type {
  TableData,
  ColumnDef,
  SortBy,
  StoreHeaderDef,
  StoreColumn,
} from "./types";
import { Signal, noSerialize } from "@builder.io/qwik";
import isObject from "lodash.isobject";

/**
 * Converts values to a string or lowercases strings.
 *
 * @param value
 */
export const normalizeSortValue = (value: string | number | undefined) => {
  if (!value) return "";
  if (isString(value)) return value.toLowerCase();
  if (isNumber(value)) return value.toString();

  throw TypeError(
    "normalizeSortValue requires value to be coercive to a string.",
  );
};

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

const createIdFromString = (str: string | undefined) =>
  str ? str.replace(/\W/g, "_").toLowerCase() : undefined;

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
