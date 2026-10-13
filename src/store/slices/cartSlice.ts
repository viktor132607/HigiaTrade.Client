import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface CartItem {
  mainImageUrl: string | undefined;
  id: string;
  title: string;
  regularPrice: number;
  quantity: number;
  imageUrl: string;
  discountPercentage?: number;
  discountedPrice?: number;
  packagingOptionId?: string;
  packagingLabel?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
}

const initialState: CartState = {
  items: [],
  total: 0,
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id && item.packagingOptionId === action.payload.packagingOptionId
      );
      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      state.total = state.items.reduce(
        (sum, item) => sum + (item.discountedPrice || item.regularPrice) * item.quantity,
        0
      );
    },
    removeItem: (state, action: PayloadAction<string | { id: string; packagingOptionId?: string }>) => {
      const productId = typeof action.payload === "string" ? action.payload : action.payload.id;
      const packageId = typeof action.payload === "string" ? undefined : action.payload.packagingOptionId;
      state.items = state.items.filter((item) => item.id !== productId || item.packagingOptionId !== packageId);
      state.total = state.items.reduce(
        (sum, item) => sum + (item.discountedPrice || item.regularPrice) * item.quantity,
        0
      );
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string; packagingOptionId?: string; quantity: number }>
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id && item.packagingOptionId === action.payload.packagingOptionId);
      if (item) {
        item.quantity = action.payload.quantity;
        state.total = state.items.reduce(
          (sum, item) => sum + (item.discountedPrice || item.regularPrice) * item.quantity,
          0
        );
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
