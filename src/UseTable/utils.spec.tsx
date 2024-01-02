import { it, expect, describe } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import {
  normalizeSortValue,
  sortHelper,
  deriveHeaders,
  getValueFromColumnDef,
  getCellValue,
  deriveColumnsFromColumnDefs,
} from "./utils";
import { component$ } from "@builder.io/qwik";
import { flexRender } from "./flex-render";
import { ColumnDef } from "./types";

describe("normalizeSortValue test", () => {
  it("should return a string when a number is passed in", () => {
    expect(normalizeSortValue(1)).toBe("1");
  });

  it("should return a string when a string is passed in", () => {
    expect(normalizeSortValue("hello")).toBe("hello");
  });

  it("should return a lowercase string", () => {
    expect(normalizeSortValue("HELLO")).toBe("hello");
  });

  it("should return an empty string when a falsey value is passed in", () => {
    expect(normalizeSortValue(undefined)).toBe("");
    // @ts-ignore
    expect(normalizeSortValue(null)).toBe("");
    // @ts-ignore
    expect(normalizeSortValue(false)).toBe("");
  });

  it("should throw an error if argument is not falsey, string, or number", () => {
    // @ts-ignore
    expect(() => normalizeSortValue([])).toThrowError(
      "normalizeSortValue requires value to be coercive to a string.",
    );
    // @ts-ignore
    expect(() => normalizeSortValue({})).toThrowError(
      "normalizeSortValue requires value to be coercive to a string.",
    );
  });
});

describe("sortHelper test", () => {
  it("when first arg is undefined, should return a SortBy object where the key is the passed in columnDefId and value is asc", () => {
    expect(sortHelper(undefined, "hello")).toEqual({ hello: "asc" });
  });

  it("when SortBy key and columnDefId match, the opposite value (asc/desc) should be returned", () => {
    expect(sortHelper({ hello: "asc" }, "hello")).toEqual({ hello: "desc" });

    expect(sortHelper({ hello: "desc" }, "hello")).toEqual({ hello: "asc" });
  });

  it("when SortBy key and columnDefId are different, the return key should be the columnDefId with a value that defaults to asc", () => {
    expect(sortHelper({ world: "desc" }, "hello")).toEqual({ hello: "asc" });
  });
});

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

describe("deriveHeaders test", () => {
  it("should return cell values that correspond with the ColumnDef header property types (string and func)", () => {
    expect(
      deriveHeaders(
        [
          {
            accessorKey: "displayName",
            id: "displayName",
            header: "Name",
          },
          {
            accessorKey: "make",
            id: "make",
            header: (props) => SortHeader({ ...props, heading: "Make" }),
          },
        ],
        { make: "asc" },
      ),
    ).toEqual([
      { id: "displayName", cell: "Name" },
      { id: "make", cell: expect.any(Function) },
    ]);
  });

  it("cell values should be rendered to the DOM", async () => {
    const headers = deriveHeaders(
      [
        {
          accessorKey: "displayName",
          id: "displayName",
          header: "Name",
        },
        {
          accessorKey: "make",
          id: "make",
          header: (props) => SortHeader({ ...props, heading: "Make" }),
        },
      ],
      { make: "asc" },
    );

    const TestPage = component$(() => (
      <div>
        {headers.map((header) => (
          <span id={header.id}>{flexRender(header.cell)}</span>
        ))}
      </div>
    ));

    const { screen, render } = await createDOM();

    await render(<TestPage />);

    const nameDiv = screen.querySelector("#displayName") as HTMLElement;

    const makeDiv = screen.querySelector("#make") as HTMLElement;

    expect(nameDiv).toBeDefined();

    expect(makeDiv).toBeDefined();

    expect(nameDiv.textContent).toBe("Name");

    expect(makeDiv.textContent).toContain("Make");
  });
});

const defaultData = [
  {
    id: "24242",
    displayName: "Alex's Car",
    make: "Ford",
    model: "Taurus",
    year: "2001",
  },
  {
    id: "24242dfsdsffff",
    displayName: "Brian's Car",
    make: "Chevrolet",
    model: "Cavelier",
    year: "1998",
  },
  {
    id: "sdfsdfw32r",
    displayName: "Chris' Car",
    make: "Lexus",
    model: "CT-200h",
    year: "2014",
  },
];

describe("getValueFromColumnDef test", () => {
  it("should derive value from state with accessorKey", () => {
    const col: ColumnDef<(typeof defaultData)[0]> = {
      accessorKey: "displayName",
      id: "displayName",
      header: "Name",
    };

    expect(getValueFromColumnDef(col, defaultData[0])).toBe("Alex's Car");
  });

  it("should throw error if accessorKey value does not exist on data", () => {
    const col: ColumnDef<(typeof defaultData)[0]> = {
      // @ts-ignore
      accessorKey: "name",
      id: "displayName",
      header: "Name",
    };

    expect(() => getValueFromColumnDef(col, defaultData[0])).toThrowError(
      `accessorKey "${String(
        col.accessorKey,
      )}" does not exist in "data" state.`,
    );
  });

  it("should throw error if accessorKey property does not exist on data", () => {
    const col: ColumnDef<(typeof defaultData)[0]> = {
      id: "displayName",
      header: "Name",
    };

    expect(() => getValueFromColumnDef(col, defaultData[0])).toThrowError(
      "Could not retrieve value from ColumnDef. This could be due to a ColumnDef missing an accessorKey or accessorFn property.",
    );
  });

  it("should pass data into accessorFn to expose an API for retrieving a value manually", () => {
    const col: ColumnDef<(typeof defaultData)[0]> = {
      id: "displayName",
      header: "Name",
      accessorFn(data) {
        return data.displayName;
      },
    };

    expect(getValueFromColumnDef(col, defaultData[0])).toBe(`Alex's Car`);
  });
});

describe("getCellValue test", () => {
  it("should pass value into cell function and execute cell", () => {
    const col: ColumnDef<(typeof defaultData)[0]> = {
      accessorKey: "displayName",
      id: "displayName",
      header: "Name",
      cell({ value }) {
        return <div id={value}>{value}</div>;
      },
    };

    expect(getCellValue(col, defaultData[0])).toEqual(expect.any(Function));
  });

  it("cell JSXNode should render to DOM", async () => {
    const col: ColumnDef<(typeof defaultData)[0]> = {
      accessorKey: "displayName",
      id: "displayName",
      header: "Name",
      cell({ value }) {
        return <div id="displayName">{value}</div>;
      },
    };

    const cell = getCellValue(col, defaultData[0]);

    const TestPage = component$(() => <section>{flexRender(cell)}</section>);

    const { screen, render } = await createDOM();

    await render(<TestPage />);

    const nameDiv = screen.querySelector("#displayName") as HTMLElement;

    expect(nameDiv).toBeDefined();

    expect(nameDiv.textContent).toBe("Alex's Car");
  });

  it("should return the ColumnDef value string on the cell property if cell is undefined", () => {
    const col: ColumnDef<(typeof defaultData)[0]> = {
      accessorKey: "displayName",
      id: "displayName",
      header: "Name",
    };

    expect(getCellValue(col, defaultData[0])).toEqual("Alex's Car");
  });
});

describe("deriveColumnsFromColumnDefs test", () => {
  it("should pass value into cell function and execute cell", () => {
    const col: ColumnDef<(typeof defaultData)[0]> = {
      accessorKey: "displayName",
      id: "displayName",
      header: "Name",
      cell({ value }) {
        return <div id={value}>{value}</div>;
      },
    };

    expect(
      deriveColumnsFromColumnDefs(col, defaultData[0], "hello", "--"),
    ).toEqual({
      value: "Alex's Car",
      id: "displayName",
      cell: expect.any(Function),
    });
  });

  it("should create an ID from prefix and value if no ID is present on ColumnDef", () => {
    const col: ColumnDef<(typeof defaultData)[0]> = {
      accessorKey: "displayName",
      header: "Name",
      cell({ value }) {
        return <div id={value}>{value}</div>;
      },
    };

    expect(
      deriveColumnsFromColumnDefs(col, defaultData[0], "hello", "--"),
    ).toEqual({
      value: "Alex's Car",
      id: "hello-alex_s_car",
      cell: expect.any(Function),
    });
  });

  it("should create an ID from prefix and fallback if no ID or value is present on ColumnDef", () => {
    const state = { ...defaultData[0] };
    state.displayName = "";
    const col: ColumnDef<typeof state> = {
      accessorKey: "displayName",
      header: "Name",
      cell({ value }) {
        return <div id={value}>{value}</div>;
      },
    };

    expect(deriveColumnsFromColumnDefs(col, state, "hello", "--")).toEqual({
      value: "",
      id: "hello---",
      cell: expect.any(Function),
    });
  });
});
