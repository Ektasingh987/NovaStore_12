import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productsService } from '../../services/products.service';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await productsService.getProducts(params);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch products');
    }
  }
);

export const fetchProductById = createAsyncThunk(
  'products/fetchProductById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await productsService.getProductById(id);
      return response.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch product details');
    }
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await productsService.createProduct(formData);
      return response.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to create product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await productsService.updateProduct(id, formData);
      return response.data.product;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await productsService.deleteProduct(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete product');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    meta: {
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    currentProduct: null,
    loading: false,
    detailLoading: false,
    submitting: false,
    error: null,
  },
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearProductError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data?.products || [];
        state.meta = action.payload.meta || state.meta;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch details
      .addCase(fetchProductById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // Create
      .addCase(createProduct.pending, (state) => {
        state.submitting = true;
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Update
      .addCase(updateProduct.pending, (state) => {
        state.submitting = true;
      })
      .addCase(updateProduct.fulfilled, (state) => {
        state.submitting = false;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Delete
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item._id !== action.payload);
        state.meta.totalItems = Math.max(0, state.meta.totalItems - 1);
      });
  },
});

export const { clearCurrentProduct, clearProductError } = productsSlice.actions;
export default productsSlice.reducer;
