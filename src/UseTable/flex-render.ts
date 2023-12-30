import type { NoSerialize, JSXChildren, JSXNode } from "@builder.io/qwik";
import type { Serializable } from "./types";

export const flexRender = (
  arg:
    | string
    | number
    | undefined
    | NoSerialize<() => JSXNode | Element | Serializable>,
): JSXChildren | string => {
  if (typeof arg === "function" || typeof arg === "object") {
    return (() => arg())() as JSXChildren;
  }
  return arg;
};
