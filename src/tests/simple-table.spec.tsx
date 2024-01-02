import { createDOM } from "@builder.io/qwik/testing";
import { test, expect } from "vitest";
import SimpleTable from "../examples/simple-table";
import { data } from "../examples/data";

test(`[SimpleTable Component]: Should contain table head cells in correct order`, async () => {
  const { screen, render } = await createDOM();
  await render(<SimpleTable />);

  const theads = ["Name", "Make", "Model", "Year"];

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

  for (let i = 0; i < data.length; i++) {
    const values = Object.values(data[i]).slice(1, -3);

    for (let j = 0; j < values.length; j++) {
      expect(nodes[nodeCount].textContent).toBe(values[j]);
      nodeCount++;
    }
  }
});