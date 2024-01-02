import { $, component$, useSignal, useStyles$ } from "@builder.io/qwik";
import { ColumnDefs } from "../UseTable";
import { flexRender, useTable } from "../UseTable";
import styles from "../styles.css?inline";

export const getColumnDefs$ = $(
    (): ColumnDefs<(typeof mockData)[0]> => [
      {
        accessorKey: "displayName",
        id: "displayName",
        header: "Name",
      },
      {
        accessorKey: "make",
        id: "make",
        header: "Make",
      },
      {
        accessorKey: "model",
        id: "model",
        header: "Model"
      },
      {
        accessorKey: "year",
        id: "year",
        header: "Year",
      }
    ],
  );

const mockData = [
  {
    id: "ford",
    displayName: "Alex's Car",
    make: "Ford",
    model: "Taurus",
    year: "2001",
    color: "Teal",
    licensePlate: "HAIBBY",
    vin: "ZCJ5K2S57YQ23CCG50",
  },
  {
    id: "chevrolet",
    displayName: "Brian's Car",
    make: "Chevrolet",
    model: "Cavelier",
    year: "1998",
    color: "Red",
    licensePlate: "651WTK",
    vin: "HCJ5K2S57YQ23CCG50",
  },
  {
    id: "lexus",
    displayName: "Chris' Car",
    make: "Lexus",
    model: "CT-200h",
    year: "2014",
    color: 12,
    licensePlate: "BCKNTIME",
    vin: "YTJ5K2S57YQ23CCG50",
  },
];

export default component$(() => {
  useStyles$(styles);

  const data = useSignal(mockData);

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
                <td key={cell.id}>
                  <div data-test-id={cell.value}>
                    {flexRender(cell.cell)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
