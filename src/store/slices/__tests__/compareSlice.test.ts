import { describe, expect, it } from "vitest";
import reducer, {
  addToCompare, clearCompare, hydrateCompare, MAX_COMPARE_ITEMS,
  normalizeCompareItems, removeFromCompare, toggleCompare,
} from "../compareSlice";

describe("compare selection", () => {
  const p = ["a", "b", "c", "d", "e"];
  it("hydrates unique, non-empty saved selections with a four-product limit", () => {
    expect(normalizeCompareItems(["a", "a", "", null, ...p.slice(1)])).toEqual(p.slice(0, 4));
    expect(normalizeCompareItems({ items: p })).toEqual([]);
    const state = reducer(undefined, hydrateCompare(["a", "b", "a"]));
    expect(state.items).toEqual(["a", "b"]);
    expect(state.hydrated).toBe(true);
  });
  it("adds, toggles, removes and clears selections", () => {
    let state = reducer(undefined, hydrateCompare([]));
    state = reducer(state, addToCompare("a"));
    state = reducer(state, toggleCompare("b"));
    state = reducer(state, addToCompare("a"));
    expect(state.items).toEqual(["a", "b"]);
    state = reducer(state, toggleCompare("a"));
    expect(state.items).toEqual(["b"]);
    state = reducer(state, removeFromCompare("b"));
    expect(state.items).toEqual([]);
  });
  it("refuses a fifth item but permits replacement after a removal", () => {
    let state = reducer(undefined, hydrateCompare([]));
    for (const id of p) state = reducer(state, addToCompare(id));
    expect(state.items).toEqual(p.slice(0, MAX_COMPARE_ITEMS));
    state = reducer(state, toggleCompare("e"));
    expect(state.items).toHaveLength(4);
    state = reducer(state, removeFromCompare("a"));
    state = reducer(state, addToCompare("e"));
    expect(state.items).toEqual(["b", "c", "d", "e"]);
    state = reducer(state, clearCompare());
    expect(state.items).toEqual([]);
  });
});
