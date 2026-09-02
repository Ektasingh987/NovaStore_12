import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersService } from '../../services/users.service';

export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await usersService.getUsers(params);
      return response;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await usersService.getUserById(id);
      return response.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user details');
    }
  }
);

export const fetchUserOrders = createAsyncThunk(
  'users/fetchUserOrders',
  async ({ id, params }, { rejectWithValue }) => {
    try {
      const response = await usersService.getUserOrders(id, params);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch user orders');
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateUserStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await usersService.updateUserStatus(id, isActive);
      return response.data.user;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update user status');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
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
    currentUser: null,
    userOrders: [],
    userOrdersMeta: null,
    loading: false,
    detailLoading: false,
    ordersLoading: false,
    updatingStatus: false,
    error: null,
  },
  reducers: {
    clearCurrentUser: (state) => {
      state.currentUser = null;
      state.userOrders = [];
    },
    clearUserError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data?.users || [];
        state.meta = action.payload.meta || state.meta;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Detail
      .addCase(fetchUserById.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload;
      })
      // User Orders
      .addCase(fetchUserOrders.pending, (state) => {
        state.ordersLoading = true;
      })
      .addCase(fetchUserOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.userOrders = action.payload.orders || [];
        state.userOrdersMeta = action.payload.meta || null;
      })
      .addCase(fetchUserOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.error = action.payload;
      })
      // Update status
      .addCase(updateUserStatus.pending, (state) => {
        state.updatingStatus = true;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.updatingStatus = false;
        state.currentUser = action.payload;
        const index = state.items.findIndex((u) => u._id === action.payload._id || u.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.updatingStatus = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentUser, clearUserError } = usersSlice.actions;
export default usersSlice.reducer;
