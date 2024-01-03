import { createDOM } from "@builder.io/qwik/testing";
import { test, expect } from "vitest";
import SortableColumns from "../examples/sortable-columns";
import { data as mockData } from "../examples/data";
import { ColumnDefs } from "../UseTable";
import isObject from "lodash.isobject";

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

export const columnDefs: ColumnDefs<(typeof mockData)[0]> = [
  {
    accessorKey: "displayName",
    id: "displayName",
    header: header("name"),
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
];

test(`[SortableColumns Component]: Should contain table head cells in correct order`, async () => {
  const { screen, render } = await createDOM();

  await render(<SortableColumns />);
  // @ts-ignore
  const theads = columnDefs.map((def) =>
    "displayName" === def.accessorKey
      ? "name"
      : "licensePlate" === def.accessorKey
        ? "license"
        : def.accessorKey,
  );

  const nodes = screen.querySelectorAll(
    "thead tr td",
  ) as ArrayLike<HTMLTableColElement>;

  for (let i = 0; i < nodes.length; i++) {
    expect(nodes[i].textContent?.toLowerCase().trim()).toBe(theads[i]);
  }
});

test(`[SortableColumns Component]: Should contain table cells in correct order`, async () => {
  const { screen, render } = await createDOM();
  await render(<SortableColumns />);

  const nodes = screen.querySelectorAll(
    "[data-test-id]",
  ) as ArrayLike<HTMLTableColElement>;

  let nodeCount = 0;

  for (let i = 0; i < mockData.length; i++) {
    const values = Object.values(mockData[i]).slice(1, 0);

    for (let j = 0; j < values.length; j++) {
      expect(nodes[nodeCount].textContent).toBe(values[j]);
      nodeCount++;
    }
  }
});
