import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export const COMPARE_STORAGE_KEY = "hygiaTradeCompareProducts";
export const MAX_COMPARE_ITEMS = 4;

export const normalizeCompareItems = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string =>
    typeof item === "string" && item.trim().length > 0
  ).map(item => item.trim()))].slice(0, MAX_COMPARE_ITEMS);
};

export const readCompareItems = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    return normalizeCompareItems(raw ? JSON.parse(raw) : []);
  } catch {
    return [];
  }
};

export const writeCompareItems = (items: string[]): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COMPARE_STORAGE_KEY, JSON.stringify(normalizeCompareItems(items))
    );
  } catch {
    // Storage can be unavailable in private browsing; keep the in-memory list usable.
  }
};

interface CompareState {
  items: string[];
  hydrated: boolean;
}

const initialState: CompareState = { items: [], hydrated: false };

const compareSlice = createSlice({
  name: "compare",
  initialState,
  reducers: {
    hydrateCompare: (state, action: PayloadAction<unknown>) => {
      state.items = normalizeCompareItems(action.payload);
      state.hydrated = true;
    },
    addToCompare: (state, action: PayloadAction<string>) => {
      const id = action.payload.trim();
      if (id && !state.items.includes(id) && state.items.length < MAX_COMPARE_ITEMS)
        state.items.push(id);
    },
    removeFromCompare: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(id => id !== action.payload);
    },
    toggleCompare: (state, action: PayloadAction<string>) => {
      const id = action.payload.trim();
      if (!id) return;
      if (state.items.includes(id)) {
        state.items = state.items.filter(item => item !== id);
      } else if (state.items.length < MAX_COMPARE_ITEMS) {
        state.items.push(id);
      }
    },
    clearCompare: state => { state.items = []; },
  },
});

export const {
  hydrateCompare, addToCompare, removeFromCompare, toggleCompare, clearCompare,
} = compareSlice.actions;
export default compareSlice.reducer;
