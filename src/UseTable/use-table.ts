import { useSignal, useTask$, useVisibleTask$ } from "@builder.io/qwik";
import type {
  TableData,
  TableOptions,
  StoreColumn,
  StoreHeaderDef,
  SortBy,
} from "./types";
import { applySortListeners } from "./utils";
import { useSort } from "./use-sort";
import { useTableCreator } from "./use-table-creator";

/**
     * @summary A headless table generator. Creates header columns and body
     * rows and columns. Also exposes a sort feature if the data attr
     * data-usetable-sort={columnDefId} is added to an element that
     * is intended to sort on click.
     * 
     * @example 
     * const table = useTable()
     * 
     * return (
     *  <table>
          <thead>
            <tr>
              {table.headerGroups?.map((header) => (
                <td key={header.id}>
                  <button data-usetable-sort={header.id} type="button">
                    {flexRender(header.header)}
                  </button>
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rowGroups?.map((row) => (
              <tr key={i + 'row'}>
                {row.map((cell) => (
                  <td key={cell.id}>{cell.value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>)
     */
export const useTable = <TData extends TableData>({
  data,
  fallback = "--",
  /**
   * Passes in {ColumnDefs} as a QRL in order to expose its functions
   * on the client.
   */
  getColumnDefs$,
}: TableOptions<TData>) => {
  const internalState = useSignal<TData[] | undefined | null>(data.value);

  /**
   * Stores the ID of the column by which the table
   * is sorted, along with the sort order. 
   * 
   * See the value here: {@link SortBy}
   */
  const sortBy = useSignal<SortBy>();

  /**
   * Array of arrays that represent table rows and columns. This
   * is the result of {@link TData} and {@link getColumnDefs$}.
   */
  const rowGroups = useSignal<StoreColumn[][]>();

    /**
   * Array of table header ({@link StoreHeaderDef}) columns.
   */
  const headerGroups = useSignal<StoreHeaderDef[]>();

  useTask$(({ track }) => {
    track(() => data.value);

    internalState.value = data.value;
  });

  /**
   * Applies click listeners for sorting to elements with the
   * data-usetable-sort={columnDefId} attr.
   */
  /* eslint-disable-next-line qwik/no-use-visible-task */
  useVisibleTask$(({ cleanup }) => {
    const destroy = applySortListeners(sortBy);

    cleanup(destroy);
  });

  /**
   * Creates arrays of rows and columns.
   */
  useTableCreator({
    sortBy: sortBy,
    internalState,
    data,
    getColumnDefs$,
    fallback,
    rowGroups,
    headerGroups,
  });

  /**
   * Sorts internalState when sortBy signal changes, which
   * then triggers the table to be recreated.
   */
  useSort({sortBy, internalState, data, getColumnDefs$});

  return { rowGroups, headerGroups, sortBy };
};
