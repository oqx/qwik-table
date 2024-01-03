import { type QRL, useTask$, type Signal } from "@builder.io/qwik";
import { SortBy, type ColumnDefs, type TableData } from "./types";
import { sortByChar } from "./utils";

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

    const newState = sortByChar({
      columnDefs,
      sortBy: sortBy.value,
      data: data.value,
    });

    if (!newState) return;

    internalState.value = [...newState];
  });
};
