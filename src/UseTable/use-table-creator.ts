import { type QRL, type Signal, useTask$ } from "@builder.io/qwik";
import type {
  ColumnDefs,
  SortBy,
  StoreColumn,
  StoreHeaderDef,
  TableData,
} from "./types";
import { deriveColumnsFromColumnDefs, deriveHeaders } from "./utils";

/**
 * @summary Contains all the logic for creating table rows and columns.
 */
export const useTableCreator = <TData extends TableData>({
  internalState,
  sortBy,
  data,
  getColumnDefs$,
  fallback,
  rowGroups,
  headerGroups,
}: {
  sortBy: Signal<SortBy | undefined>;
  internalState: Signal<TData[] | undefined | null>;
  data: Signal<TData[] | undefined | null>;
  getColumnDefs$: QRL<() => ColumnDefs<TData>>;
  rowGroups: Signal<StoreColumn[][] | undefined>;
  headerGroups: Signal<StoreHeaderDef[] | undefined>;
  fallback: string;
}) => {
  /**
   * Creates arrays of rows and columns.
   */
  useTask$(async ({ track }) => {
    track(() => internalState.value);

    if (!internalState.value || !data.value) {
      return;
    }

    const columnDefs = await getColumnDefs$();

    if (!columnDefs) return;

    const rows: StoreColumn[][] = [];

    /**
     * Uses internalState as it can be modified/sorted.
     */
    for (let i = 0; i < internalState.value.length; i++) {
      for (let j = 0; j < columnDefs.length; j++) {
        const column = deriveColumnsFromColumnDefs(
          columnDefs[j],
          data.value[i],
          `${i}-${j}`,
          fallback,
        );

        if (!rows[i]) {
          rows[i] = [];
        }
        rows[i].push(column);
      }
    }

    const headers = deriveHeaders(columnDefs, sortBy.value);

    rowGroups.value = rows;

    headerGroups.value = headers;
  });
};
