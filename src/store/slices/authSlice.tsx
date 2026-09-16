import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, LoginRequest } from '@/types/Auth.d';
import {
  loginService,
  loginWithGGService,
  logoutService,
  refreshTokenService,
} from '@/services/authServices';
import { sessionService } from '@/services/sessionServices';
import type { IUserUpdate, User } from '@/types/User';
import { updateAvt, updateProfile } from '@/services/userServices';

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
      return res;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Đăng nhập thất bại');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const res = await refreshTokenService(sessionService.getToken() || '');
      return res;
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Refresh token thất bại');
    }
  }
);

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await logoutService(sessionService.getToken() ?? '');
      sessionService.clearSession();
    } catch (err: unknown) {
      if (err instanceof Error) return rejectWithValue(err.message);
      return rejectWithValue('Đăng xuất thành công');
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
        return response.result;
      } else {
        // Nếu API trả về lỗi có cấu trúc
        return thunkAPI.rejectWithValue('Cập nhật thông tin thất bại');
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
        return response.result;
      } else {
        // Nếu API trả về lỗi có cấu trúc
        return thunkAPI.rejectWithValue('Upload avatar thất bại');
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.user = action.payload?.result.user;
        state.token = action.payload?.result.token;
        state.expiryTime = action.payload?.result.expiryTime;
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
        state.isAuth = true;
        state.user = action.payload?.result.user;
        state.token = action.payload?.result.token;
        state.expiryTime = action.payload?.result.expiryTime;
      })
      .addCase(loginUserWithGG.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Đăng nhập thất bại';
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuth = false;
        state.user = null;
        state.token = null;
        state.expiryTime = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = typeof action.payload === 'string' ? action.payload : 'Đăng xuất thất bại';
      })

      //refresh
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.result.token;
        state.expiryTime = action.payload.result.expiryTime;
        state.user = action.payload.result.user;
        state.isAuth = true;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuth = false;
        state.token = null;
        state.user = null;
        state.expiryTime = null;
      })
      //
      .addCase(uploadProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // Khi upload thành công
      .addCase(uploadProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        if (state.user) {
          state.user = action.payload;
        }
      })
      // Khi upload thất bại
      .addCase(uploadProfile.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : 'Cập nhật thông tin thất bại';
      })
      //
      .addCase(uploadAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        uploadAvatar.fulfilled,
        (state, action: PayloadAction<User | { originalFileName: string; url: string }>) => {
          state.loading = false;
          if (state.user) {
            // So sánh nếu action.payload là object kiểu { originalFileName, url }
            if ('url' in action.payload && 'originalFileName' in action.payload) {
              state.user.avatar = action.payload.url;
            } else {
              // Nếu là User, thì dùng avatar từ user
              state.user.avatar = action.payload.avatar;
            }
          }
        }
      )
      // Khi upload thất bại
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string' ? action.payload : 'Upload avatar thất bại';
      });

    //
  },
});

export default authSlice.reducer;

// export const { updateUser, updateUserAvatar } = authSlice.actions;
