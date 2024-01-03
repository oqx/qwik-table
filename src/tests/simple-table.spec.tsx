import { createDOM } from "@builder.io/qwik/testing";
import { test, expect } from "vitest";
import SimpleTable from "../examples/simple-table";
import { mockData } from "../examples/simple-table";

export const columnDefs = [
  {
    accessorKey: "firstName",
    id: "firstName",
    header: "First name",
  },
  {
    accessorKey: "lastName",
    id: "lastName",
    header: "Last name",
  },
  {
    accessorKey: "phone",
    id: "phone",
    header: "Phone",
  },
];

test(`[SimpleTable Component]: Should contain table head cells in correct order`, async () => {
  const { screen, render } = await createDOM();

  await render(<SimpleTable />);

  const theads = columnDefs.map((def) => def.header as string);

  const nodes = screen.querySelectorAll(
    "thead tr td",
  ) as ArrayLike<HTMLTableColElement>;

  for (let i = 0; i < nodes.length; i++) {
    expect(nodes[i].textContent).toBe(theads[i]);
  }
});

test(`[SimpleTable Component]: Should contain table cells in correct order`, async () => {
  const { screen, render } = await createDOM();
  await render(<SimpleTable />);

  const nodes = screen.querySelectorAll(
    "[data-test-id]",
  ) as ArrayLike<HTMLTableColElement>;

  let nodeCount = 0;

  for (let i = 0; i < mockData.length; i++) {
    const values = Object.values(mockData[i]).slice(1, -3);

    for (let j = 0; j < values.length; j++) {
      expect(nodes[nodeCount].textContent).toBe(values[j]);
      nodeCount++;
    }
  }
});
