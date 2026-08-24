import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const STORAGE_KEY = "hygiaTradeCompareProducts";
const MAX_COMPARE_ITEMS = 4;

const loadInitialItems = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string").slice(0, MAX_COMPARE_ITEMS)
      : [];
  } catch {
    return [];
  }
};

const persist = (items: string[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

interface CompareState {
  items: string[];
}

const initialState: CompareState = {
  items: loadInitialItems(),
};

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    addToCompare: (state, action: PayloadAction<string>) => {
      if (state.items.includes(action.payload) || state.items.length >= MAX_COMPARE_ITEMS) return;
      state.items.push(action.payload);
      persist(state.items);
    },
    removeFromCompare: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((id) => id !== action.payload);
      persist(state.items);
    },
    toggleCompare: (state, action: PayloadAction<string>) => {
      if (state.items.includes(action.payload)) {
        state.items = state.items.filter((id) => id !== action.payload);
      } else if (state.items.length < MAX_COMPARE_ITEMS) {
        state.items.push(action.payload);
      }
      persist(state.items);
    },
    clearCompare: (state) => {
      state.items = [];
      persist(state.items);
    },
  },
});

export { MAX_COMPARE_ITEMS };
export const { addToCompare, removeFromCompare, toggleCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
