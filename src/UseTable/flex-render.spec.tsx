import { it, expect, describe } from "vitest";
import { flexRender } from "./flex-render";
import { noSerialize } from "@builder.io/qwik";

describe("flexRender test", () => {
  it("should return a string if arg is a string", () => {
    expect(flexRender("hello")).toBe("hello");
  });

  it("should return render a JSXNode", () => {
    expect(flexRender(noSerialize(() => <div>hello</div>))).toEqual(
      expect.objectContaining({
        flags: 3,
        immutableProps: null,
        key: "lc_0",
        props: {},
        type: "div",
      }),
    );
  });

  it("should return a number if arg is a number", () => {
    expect(flexRender(12)).toBe(12);
  });

  it("should throw error if arg cannot be executed as JSXNode func", () => {
    // @ts-ignore
    expect(() => flexRender([12, "123"])).toThrowError();
  });
});
