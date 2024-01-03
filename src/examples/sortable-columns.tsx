import { $, component$, useSignal, useStyles$ } from "@builder.io/qwik";
import { ColumnDefs } from "../UseTable";
import { flexRender, useTable } from "../UseTable";
import styles from "../styles.css?inline";
import isObject from "lodash.isobject";
import { data as mockData } from "./data";

/**
 * @summary Adding a data-usetable-sort attribute to a clickable table head
 * button will expose the column to the built-in sort function.
 *
 * You can find a use case in the {@link SortHeader} component below.
 */

export default component$(() => {
  useStyles$(styles);

  const data = useSignal(JSON.parse(JSON.stringify(mockData)));

  const table = useTable({ data, getColumnDefs$ });

  return (
    <div>
      <table>
        <thead>
          <tr>
            {table.headerGroups.value?.map((header) => (
              <td key={header.id}>{flexRender(header.cell)}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rowGroups.value?.map((row, i) => (
            <tr key={i + "row"}>
              {row.map((cell) => (
                <td key={cell.id}>{flexRender(cell.cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

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
    /* Adding data-usetable-sort to an element will automatically
    add onClick sort functionality. */
    <span role="button" data-usetable-sort={id} class="th">
      {value}{" "}
      <span
        class={{
          chevron: true,
          "chevron--down": isSortedBy && sortOrder === "desc",
          "chevron--up": isSortedBy && sortOrder === "asc",
        }}
      />
    </span>
  );

const isColorValueType = (props: unknown): props is { value: string } =>
  isObject(props) && "value" in props && typeof props.value === "string";

export const getColumnDefs$ = $(
  (): ColumnDefs<(typeof mockData)[0]> => [
    {
      accessorKey: "displayName",
      id: "displayName",
      header: header("Name"),
    },
    {
      accessorKey: "make",
      id: "make",
      header: header("Make"),
    },
    {
      accessorKey: "model",
      id: "model",
      header: header("Model"),
    },
    {
      accessorKey: "year",
      id: "year",
      header: header("Year"),
    },
    {
      accessorKey: "color",
      id: "color",
      cell: (info) => {
        if (isColorValueType(info)) {
          return <div data-custom-cell={true}>{info.value} 🐣</div>;
        }
        return "--";
      },
      header: "Color",
    },
    {
      accessorKey: "vin",
      id: "vin",
      header: "VIN",
    },
    {
      accessorKey: "licensePlate",
      id: "licensePlate",
      header: "License",
    },
  ],
);
