import type { NoSerialize, JSXChildren, JSXNode } from "@builder.io/qwik";
import type { Serializable } from "./types";

/**
 * @summary Creates a renderable value from JSXNode, string, or number, eliminating
 * the need for adding ternary statements for value checks.
 *
 * @param arg
 *
 * @returns Renderable value
 */
export const flexRender = (
  arg:
    | string
    | number
    | undefined
    | NoSerialize<() => JSXNode | Element | Serializable>,
): JSXChildren | string => {
  if (typeof arg === "function" || typeof arg === "object") {
    try {
      return (() => arg())() as JSXChildren;
    } catch (cause) {
      throw new Error(
        "Qwik Table -> flexRender: arg could not be executed as a function.",
        { cause },
      );
    }
  }
  return arg;
};
