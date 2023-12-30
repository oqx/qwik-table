import { $, component$, useSignal, useStyles$ } from "@builder.io/qwik";
import { type ColumnDef } from "./UseTable";
import { flexRender, useTable } from "./UseTable";
import styles from "./styles.css?inline";
import isObject from "lodash.isobject";

const defaultData = [
  {
    id: "24242",
    displayName: "Alex's Car",
    make: "Ford",
    model: "Taurus",
    year: "2001",
    color: "Teal",
    licensePlate: "HAIBBY",
    vin: "ZCJ5K2S57YQ23CCG50",
  },
  {
    id: "24242dfsdsffff",
    displayName: "Brian's Car",
    make: "Chevrolet",
    model: "Cavelier",
    year: "1998",
    color: "Red",
    licensePlate: "651WTK",
    vin: "HCJ5K2S57YQ23CCG50",
  },
  {
    id: "sdfsdfw32r",
    displayName: "Chris' Car",
    make: "Lexus",
    model: "CT-200h",
    year: "2014",
    color: "Silver",
    licensePlate: "BCKNTIME",
    vin: "YTJ5K2S57YQ23CCG50",
  },
];

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
  /* Adding data-usetable-sort to an element will automatically
    add onClick sort functionality. */
  <span role="button" data-usetable-sort={id} class="th">
    {heading}{" "}
    <span
      class={{
        chevron: true,
        "chevron--down": isSortedBy && sortOrder === "desc",
        "chevron--up": isSortedBy && sortOrder === "asc",
      }}
    />
  </span>
);

const isColorValueType = (props: unknown): props is {value: string} => isObject(props) && 'value' in props && typeof props.value === 'string'

const Cell = (info: unknown) => {
  if(isColorValueType(info)) {
    return <div data-custom-cell={true}>{info.value}</div>
  }
  return '--'
}

export const getColumnDefs$ = $((): ColumnDef<(typeof defaultData)[0]>[] => [
  {
    accessorKey: "displayName",
    id: "displayName",
    header: (props) => SortHeader({ ...props, heading: "Name" }),
  },
  {
    accessorKey: "make",
    id: "make",
    header: (props) => SortHeader({ ...props, heading: "Make" }),
  },
  {
    accessorKey: "model",
    id: "model",
    header: (props) => SortHeader({ ...props, heading: "Model" }),
  },
  {
    accessorKey: "year",
    id: "year",
    header: (props) => SortHeader({ ...props, heading: "Year" }),
  },
  {
    accessorKey: "color",
    id: "color",
    cell: Cell,
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
]);

export default component$(() => {
  useStyles$(styles);

  const data = useSignal(defaultData);

  const table = useTable({ data, getColumnDefs$ });

  return (
    <div>
      <table>
        <thead>
          <tr>
            {table.headerGroups.value?.map((header) => (
              <td key={header.id}>{flexRender(header.header)}</td>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rowGroups.value?.map((row, i) => (
            <tr key={i + "row"}>
              {row.map((cell) => (
                <td key={cell.id}>{cell.cell ? flexRender(cell.cell) : cell.value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
