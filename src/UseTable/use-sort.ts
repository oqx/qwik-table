import { type QRL, useTask$, type Signal } from "@builder.io/qwik";
import { SortBy, type ColumnDefs, type TableData } from "./types";
import isObject from "lodash.isobject";
import { getValueFromColumnDef, normalizeSortValue } from "./utils";

/**
 * @summary Sorts table columns based on state.sortedBy key/value pair.
 *
 * @param store Table state.
 *
 * @param internalState The table's copy of the data passed in by the consumer.
 *
 * @param data The data passed in by the consumer.
 *
 * @param getColumnDefs$ A function that returns {ColumnDefs}.
 */
export const useSort = <TData extends TableData>({
  sortBy,
  internalState,
  data,
  getColumnDefs$,
}: {
  sortBy: Signal<SortBy>;
  internalState: Signal<TData[] | undefined | null>;
  data: Signal<TData[] | undefined | null>;
  getColumnDefs$: QRL<() => ColumnDefs<TData>>;
}) => {
  useTask$(async ({ track }) => {
    track(() => sortBy.value);

    if (!data.value) return;

    const columnDefs = await getColumnDefs$();

    if (!sortBy.value) return;

    const [columnDefId, order] = isObject(sortBy.value)
      ? Object.entries(sortBy.value).flat()
      : [undefined, undefined];

    if (!columnDefId) return;

    const columnDef = columnDefs?.find((col) => col.id === columnDefId);
    /**
     *  Retrieves values using accessors and sorts columns based on said values.
     */
    const newState = data.value.sort((a, b) => {
      const aValue = normalizeSortValue(getValueFromColumnDef(columnDef, a));

      const bValue = normalizeSortValue(getValueFromColumnDef(columnDef, b));

      if (order === "asc") {
        return aValue.localeCompare(bValue);
      }

      return bValue.localeCompare(aValue);
    });

    internalState.value = [...newState];
  });
};
