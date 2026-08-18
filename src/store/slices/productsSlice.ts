import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Product {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  regularPrice: number;
  quantity: number;
  categoryId: string;
}

interface ProductsState {
  items: Product[];
  categories: string[];
  loading: boolean;
  error: string | null;
  selectedCategory: string | null;
  searchQuery: string;
}

const initialState: ProductsState = {
  items: [],
  categories: [],
  loading: false,
  error: null,
  selectedCategory: null,
  searchQuery: '',
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
      state.categories = [...new Set(action.payload.map(product => product.categoryId))];
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    }
  },
});

export const {
  setProducts,
  setLoading,
  setError,
  setSelectedCategory,
  setSearchQuery,
} = productsSlice.actions;

export default productsSlice.reducer; 