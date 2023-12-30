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

export const normalizeSortValue = (value: string | number | undefined) => {
  if (!value) return "";
  if (isString(value)) return value.toLowerCase();
  if (isNumber(value)) return value.toString();

  throw TypeError(
    "normalizeSortValue requires value to be coercive to a string.",
  );
};

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

export const applySortListeners = (sortedBy: Signal<SortBy | undefined>) => {
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
    const _header = col.header;

    if (typeof _header === "function") {
      const [[key, order]] = sortedBy
        ? Object.entries(sortedBy ?? {})
        : [[undefined, undefined]];

      const header = noSerialize(() =>
        _header({
          isSortedBy: key === col.id,
          sortOrder: order,
          id: col.id,
        }),
      );

      cols.push({ header, id: col.id });

      continue;
    }

    if (typeof _header !== "undefined") {
      cols.push({ header: _header, id: col.id });

      continue;
    }
  }
  return cols;
};

export const getValueFromColumnDef = <TData extends TableData>(
  column: ColumnDef<TData> | undefined,
  state: TData,
) => {
  if (!column) return;

  if (column.accessorKey) {
    return state[column.accessorKey];
  }

  if (typeof column.accessorFn === "function") {
    return column.accessorFn(state);
  }

  throw new Error("accessorKey does not exist in state.");
};

export const getCellValue = <TData extends TableData>(
  col: ColumnDef<TData>,
  state: TData,
) => {
  const cell = col?.cell;

  if (!cell) {
    return;
  }

  if (typeof cell === "function") {
    const value = getValueFromColumnDef(col, state);

    return noSerialize(() => cell({ value }));
  }

  return cell;
};

export const deriveColumnsFromColumnDefs = <TData extends TableData>(
  col: ColumnDef<TData>,
  state: TData,
  prefixId: string,
  fallback: string,
): StoreColumn => {
  const value = getValueFromColumnDef(col, state);

  const id = col.id ?? `${prefixId}-${value ?? fallback}`;

  const cell = getCellValue(col, state);

  return {
    value: value ?? fallback,
    id,
    cell,
  };
};
