import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginRequest } from '@/types/Auth.d';
import {
  loginService,
  loginWithGGService,
  logoutService,
} from '@/services/authServices';
import { sessionService } from '@/services/sessionServices';
import type { IUserUpdate, User } from '@/types/User';
import { getUserById, updateAvt, updateProfile } from '@/services/userServices';

/** sessionStorage owns the persisted session; every login path goes through this helper. */
const persistSession = (result: { token: string; refreshToken: string; user: User }) => {
  sessionService.setSession(result.token, result.refreshToken, result.user);
};

const initialState: AuthState = {
  isAuth: false,
  user: null,
  token: null,
  expiryTime: null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (dataLogin: LoginRequest, { rejectWithValue }) => {
    try {
      const res = await loginService(dataLogin);
      if (res.code === 1000) persistSession(res.result);
      return res;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Đăng nhập thất bại');
    }
  }
);
export const loginUserWithGG = createAsyncThunk(
  'auth/loginUserWithGG',
  async (ggToken: string, { rejectWithValue }) => {
    try {
      const res = await loginWithGGService(ggToken);
      if (res?.code === 1000) persistSession(res.result);
      return res;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Đăng nhập thất bại');
    }
  }
);

/**
 * Refresh the signed-in profile from the server (role/permissions/name/avatar) and keep
 * sessionStorage in sync. A failed refresh keeps the current session instead of logging out.
 */
export const refreshCurrentUser = createAsyncThunk<User, void, { rejectValue: string }>(
  'auth/refreshCurrentUser',
  async (_, thunkAPI) => {
    const current = (thunkAPI.getState() as { auth: AuthState }).auth.user;
    if (!current?.id) return thunkAPI.rejectWithValue('Chưa đăng nhập');
    try {
      const res = await getUserById(current.id);
      // A logout or a different login during the request must not resurrect the previous profile.
      if (!sessionService.getToken() || String(sessionService.getUser()?.id) !== String(current.id)) {
        return thunkAPI.rejectWithValue('Phiên đăng nhập đã thay đổi');
      }
      if (res.code !== 1000 || !res.result) {
        return thunkAPI.rejectWithValue(res.message || 'Không tải được hồ sơ');
      }
      return res.result;
    } catch (err: unknown) {
      return thunkAPI.rejectWithValue(err instanceof Error ? err.message : 'Không tải được hồ sơ');
    }
  }
);

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    const token = sessionService.getToken() ?? '';
    const refreshToken = sessionService.getRefreshToken() ?? undefined;
    sessionService.clearSession();
    try {
      await logoutService(token, refreshToken);
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Đã xóa phiên đăng nhập trên thiết bị này; máy chủ chưa phản hồi.');
    }
  }
);

export const uploadProfile = createAsyncThunk(
  'auth/uploadProfile',
  async (arg: { data: IUserUpdate; userId: number | undefined }, thunkAPI) => {
    try {
      // Gọi service API của bạn
      const response = await updateProfile(arg.data, arg.userId);

      if (response.code === 1000) {
        // Re-read the server profile so menus/guards see the latest role and permissions.
        await thunkAPI.dispatch(refreshCurrentUser());
        return response.result;
      } else {
        // Nếu API trả về lỗi có cấu trúc
        return thunkAPI.rejectWithValue(response.message || 'Cập nhật thông tin thất bại');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        return thunkAPI.rejectWithValue(err.message);
      }
      return thunkAPI.rejectWithValue('Đã xảy ra lỗi không xác định');
    }
  }
);

export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (arg: { data: IUserUpdate; userId: number | undefined }, thunkAPI) => {
    try {
      // Gọi service API của bạn
      const response = await updateAvt(arg.data, arg.userId);

      if (response.code === 1000) {
        // Re-read the server profile so the new avatar and role data are authoritative.
        await thunkAPI.dispatch(refreshCurrentUser());
        return response.result;
      } else {
        // Nếu API trả về lỗi có cấu trúc
        return thunkAPI.rejectWithValue(response.message || 'Upload avatar thất bại');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        return thunkAPI.rejectWithValue(err.message);
      }
      return thunkAPI.rejectWithValue('Đã xảy ra lỗi không xác định');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    sessionRefreshed(state, action: PayloadAction<import('@/types/Auth').LoginResponse['result']>) {
      state.isAuth = true;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.expiryTime = action.payload.expiryTime;
    },
    sessionExpired() { return { ...initialState }; },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        // A 2xx response with a non-success code must not open a session.
        const result = action.payload?.code === 1000 ? action.payload.result : null;
        if (!result) {
          state.error = action.payload?.message || 'Đăng nhập thất bại';
          return;
        }
        state.isAuth = true;
        state.user = result.user;
        state.token = result.token;
        state.expiryTime = result.expiryTime;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Đăng nhập thất bại';
      })
      .addCase(loginUserWithGG.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUserWithGG.fulfilled, (state, action) => {
        state.loading = false;
        const result = action.payload?.code === 1000 ? action.payload.result : null;
        if (!result) {
          state.error = action.payload?.message || 'Đăng nhập thất bại';
          return;
        }
        state.isAuth = true;
        state.user = result.user;
        state.token = result.token;
        state.expiryTime = result.expiryTime;
      })
      .addCase(loginUserWithGG.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Đăng nhập thất bại';
      })
      // Profile revalidation: keep the current session on failure instead of logging out.
      .addCase(refreshCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuth = true;
        sessionService.updateCurrentUser(action.payload.id, action.payload);
      })
      // Logout
      .addCase(logoutUser.pending, () => ({ ...initialState }))
      .addCase(uploadProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Khi upload thành công
      .addCase(uploadProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        if (state.user && String(state.user.id) === String(action.payload.id)) {
          state.user = action.payload;
        }
      })
      // Khi upload thất bại
      .addCase(uploadProfile.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : 'Cập nhật thông tin thất bại';
      })
      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        uploadAvatar.fulfilled,
        (state, action) => {
          state.loading = false;
          if (state.user && String(state.user.id) === String(action.meta.arg.userId)) {
            // So sánh nếu action.payload là object kiểu { originalFileName, url }
            state.user.avatar = action.payload.url;
          }
        }
      )
      // Khi upload thất bại
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : 'Upload avatar thất bại';
      });
  },
});

export const { sessionRefreshed, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
