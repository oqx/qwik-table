import { it, expect, describe } from "vitest";
import { createDOM } from "@builder.io/qwik/testing";
import {
  normalizeStringValue,
  sortHelper,
  deriveHeaders,
  getValueFromColumnDef,
  getCellValue,
  deriveColumnsFromColumnDefs,
  sortByValue,
  isDate,
  parseDateString,
} from "../UseTable/utils";
import { component$ } from "@builder.io/qwik";
import { flexRender } from "../UseTable/flex-render";
import { ColumnDef, ColumnDefs } from "../UseTable/types";

describe("normalizeStringValue test", () => {
  it("should return a string when a string is passed in", () => {
    expect(normalizeStringValue("hello")).toBe("hello");
  });

  it("should return a lowercase string", () => {
    expect(normalizeStringValue("HELLO")).toBe("hello");
  });

  it("should return an empty string when a falsey value is passed in", () => {
    expect(normalizeStringValue(undefined)).toBe("");
    // @ts-ignore
    expect(normalizeStringValue(null)).toBe("");
    // @ts-ignore
    expect(normalizeStringValue(false)).toBe("");
  });

  it("should throw an error if argument is not falsey, string, or number", () => {
    // @ts-ignore
    expect(() => normalizeStringValue([])).toThrowError(
      "normalizeStringValue requires value to be coercive to a string.",
    );
    // @ts-ignore
    expect(() => normalizeStringValue({})).toThrowError(
      "normalizeStringValue requires value to be coercive to a string.",
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

describe("isDate test", () => {
  it("should return true if value is a date object", () => {
    expect(isDate(new Date())).toBeTruthy();
  });

  it("should return true if value is a parsable date string", () => {
    expect(isDate("12-10-1990")).toBeTruthy();
  });

  it("should return false if value is a not a parsable date", () => {
    expect(isDate(new Date())).toBeTruthy();
  });
});

describe("parseDateString test", () => {
  it("should return true if value is a date object", () => {
    const date = new Date();
    expect(parseDateString(date)).toEqual(date);
  });

  it("should return true if value is a parsable date string", () => {
    expect(parseDateString("12-10-1990")).toEqual(new Date("12/10/1990"));
  });

  it("should return false if value is a not a parsable date", () => {
    expect(parseDateString("fdgdfg")).toBe(undefined);
  });
});

describe("sortByValue test", () => {
  it("should sort strings by asc", () => {
    const columnDefs: ColumnDefs<(typeof defaultData)[0]> = [
      {
        accessorKey: "displayName",
        id: "displayName",
        header: "name",
      },
      {
        accessorKey: "make",
        id: "make",
        header: "make",
      },
      {
        accessorKey: "model",
        id: "model",
        header: "model",
      },
      {
        accessorKey: "year",
        id: "year",
        header: "year",
      },
    ];

    expect(
      sortByValue<(typeof defaultData)[0]>({
        columnDefs,
        data: defaultData,
        sortBy: { displayName: "asc" },
      }),
    ).toEqual(defaultData);

    expect(
      sortByValue<(typeof defaultData)[0]>({
        columnDefs,
        data: defaultData,
        sortBy: { make: "asc" },
      }),
    ).toEqual([
      {
        id: "24242dfsdsffff",
        displayName: "Brian's Car",
        make: "Chevrolet",
        model: "Cavelier",
        year: "1998",
      },
      {
        id: "24242",
        displayName: "Alex's Car",
        make: "Ford",
        model: "Taurus",
        year: "2001",
      },
      {
        id: "sdfsdfw32r",
        displayName: "Chris' Car",
        make: "Lexus",
        model: "CT-200h",
        year: "2014",
      },
    ]);
  });

  it("should sort strings by desc", () => {
    const columnDefs: ColumnDefs<(typeof defaultData)[0]> = [
      {
        accessorKey: "displayName",
        id: "displayName",
        header: "name",
      },
      {
        accessorKey: "make",
        id: "make",
        header: "make",
      },
      {
        accessorKey: "model",
        id: "model",
        header: "model",
      },
      {
        accessorKey: "year",
        id: "year",
        header: "year",
      },
    ];

    expect(
      sortByValue<(typeof defaultData)[0]>({
        columnDefs,
        data: defaultData,
        sortBy: { displayName: "desc" },
      }),
    ).toEqual([
      {
        id: "sdfsdfw32r",
        displayName: "Chris' Car",
        make: "Lexus",
        model: "CT-200h",
        year: "2014",
      },
      {
        id: "24242dfsdsffff",
        displayName: "Brian's Car",
        make: "Chevrolet",
        model: "Cavelier",
        year: "1998",
      },
      {
        id: "24242",
        displayName: "Alex's Car",
        make: "Ford",
        model: "Taurus",
        year: "2001",
      },
    ]);
  });

  it("should sort numbers by asc and desc", () => {
    const data = [
      {
        displayName: 1,
        make: 2,
        model: 3,
        year: 4,
      },
      {
        displayName: 2,
        make: 3,
        model: 4,
        year: 1,
      },
      {
        displayName: 3,
        make: 4,
        model: 1,
        year: 2,
      },
      {
        displayName: 4,
        make: 1,
        model: 2,
        year: 3,
      },
    ];

    const columnDefs: ColumnDefs<(typeof data)[0]> = [
      {
        accessorKey: "displayName",
        id: "displayName",
        header: "name",
      },
      {
        accessorKey: "make",
        id: "make",
        header: "make",
      },
      {
        accessorKey: "model",
        id: "model",
        header: "model",
      },
      {
        accessorKey: "year",
        id: "year",
        header: "year",
      },
    ];

    expect(
      sortByValue<(typeof data)[0]>({
        columnDefs,
        data,
        sortBy: { make: "asc" },
      }),
    ).toEqual([
      {
        displayName: 4,
        make: 1,
        model: 2,
        year: 3,
      },
      {
        displayName: 1,
        make: 2,
        model: 3,
        year: 4,
      },
      {
        displayName: 2,
        make: 3,
        model: 4,
        year: 1,
      },
      {
        displayName: 3,
        make: 4,
        model: 1,
        year: 2,
      },
    ]);

    expect(
      sortByValue<(typeof data)[0]>({
        columnDefs,
        data,
        sortBy: { displayName: "desc" },
      }),
    ).toEqual([
      {
        displayName: 4,
        make: 1,
        model: 2,
        year: 3,
      },
      {
        displayName: 3,
        make: 4,
        model: 1,
        year: 2,
      },
      {
        displayName: 2,
        make: 3,
        model: 4,
        year: 1,
      },
      {
        displayName: 1,
        make: 2,
        model: 3,
        year: 4,
      },
    ]);
  });

  it("should sort dates by asc and desc", () => {
    const data = [
      {
        displayName: new Date("12-12-2000"),
        make: 2,
        model: 3,
        year: 4,
      },
      {
        displayName: new Date("12-13-2000"),
        make: 3,
        model: 4,
        year: 1,
      },
      {
        displayName: new Date("12-14-2000"),
        make: 4,
        model: 1,
        year: 2,
      },
      {
        displayName: new Date("12-15-2000"),
        make: 1,
        model: 2,
        year: 3,
      },
    ];

    const columnDefs: ColumnDefs<(typeof data)[0]> = [
      {
        accessorKey: "displayName",
        id: "displayName",
        header: "name",
      },
      {
        accessorKey: "make",
        id: "make",
        header: "make",
      },
      {
        accessorKey: "model",
        id: "model",
        header: "model",
      },
      {
        accessorKey: "year",
        id: "year",
        header: "year",
      },
    ];

    expect(
      sortByValue<(typeof data)[0]>({
        columnDefs,
        data,
        sortBy: { displayName: "desc" },
      }),
    ).toEqual([
      {
        displayName: new Date("12-15-2000"),
        make: 1,
        model: 2,
        year: 3,
      },
      {
        displayName: new Date("12-14-2000"),
        make: 4,
        model: 1,
        year: 2,
      },
      {
        displayName: new Date("12-13-2000"),
        make: 3,
        model: 4,
        year: 1,
      },
      {
        displayName: new Date("12-12-2000"),
        make: 2,
        model: 3,
        year: 4,
      },
    ]);

    const dataStr = [
      {
        displayName: "12-12-2000",
        make: 2,
        model: 3,
        year: 4,
      },
      {
        displayName: "12-13-2000",
        make: 3,
        model: 4,
        year: 1,
      },
      {
        displayName: "12-14-2000",
        make: 4,
        model: 1,
        year: 2,
      },
      {
        displayName: "12-15-2000",
        make: 1,
        model: 2,
        year: 3,
      },
    ];

    const columnDefsStr: ColumnDefs<(typeof dataStr)[0]> = [
      {
        accessorKey: "displayName",
        id: "displayName",
        header: "name",
      },
      {
        accessorKey: "make",
        id: "make",
        header: "make",
      },
      {
        accessorKey: "model",
        id: "model",
        header: "model",
      },
      {
        accessorKey: "year",
        id: "year",
        header: "year",
      },
    ];

    expect(
      sortByValue<(typeof dataStr)[0]>({
        columnDefs: columnDefsStr,
        data: dataStr,
        sortBy: { displayName: "desc" },
      }),
    ).toEqual([
      {
        displayName: "12-15-2000",
        make: 1,
        model: 2,
        year: 3,
      },
      {
        displayName: "12-14-2000",
        make: 4,
        model: 1,
        year: 2,
      },
      {
        displayName: "12-13-2000",
        make: 3,
        model: 4,
        year: 1,
      },
      {
        displayName: "12-12-2000",
        make: 2,
        model: 3,
        year: 4,
      },
    ]);
  });
});
