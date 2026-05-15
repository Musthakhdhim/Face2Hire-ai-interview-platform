import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axiosClient from '../../services/axiosClient';
import API from '../../services/endpoints';
import type { AxiosError } from 'axios';

interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  acceptTermsAndConditions: boolean;
}

interface ErrorResponse {
  message?: string;
  data?: string[] | Record<string, unknown>;
}

export interface User {
  id: number | null;
  name: string;
  email: string | null;
  role: string;               
  profileImageUrl?: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  pendingSignup: { name: string; email: string; role: string } | null;
  pendingResetEmail: string | null;
  isLoading: boolean;
  error: string | null;
  otpVerified: boolean;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('accessToken'),
  pendingSignup: null,
  pendingResetEmail: null,
  isLoading: false,
  error: null,
  otpVerified: false,
};

const getErrorMessage = (error: unknown): string => {
  if (!error || typeof error !== 'object') return 'An unexpected error occurred';
  
  const axiosError = error as AxiosError<ErrorResponse>;
  if (axiosError.response?.data) {
    const data = axiosError.response.data;
    if (Array.isArray(data.data) && data.data.length > 0) {
      return data.data.join(', ');
    }
    if (data.message) {
      return data.message;
    }
  }
  return 'An unexpected error occurred';
};

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(API.AUTH.REGISTER, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(API.AUTH.VERIFY_OTP, { email, otp });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(API.AUTH.LOGIN, { email, password });
      const { jwt, role, userName, email: userEmail, id, refreshToken } = response.data.data;
      localStorage.setItem('accessToken', jwt);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      const user = { id, name: userName, email: userEmail, role };
      localStorage.setItem('user', JSON.stringify(user));
      return { jwt, role, userName, email: userEmail, id, refreshToken };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(API.AUTH.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const verifyForgotOtp = createAsyncThunk(
  'auth/verifyForgotOtp',
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(API.AUTH.VERIFY_FORGOT_OTP, { email, otp });
      return { email, success: response.data.success };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ email, password, confirmPassword }: { email: string; password: string; confirmPassword: string }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(API.AUTH.RESET_PASSWORD, { email, password, confirmPassword });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async ({ email, type }: { email: string; type: string }, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post(API.AUTH.RESEND_OTP, { email, type });
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    clearError(state) {
      state.error = null;
    },
    setPendingSignup(state, action: PayloadAction<{ name: string; email: string; role: string }>) {
      state.pendingSignup = action.payload;
    },
    clearPendingSignup(state) {
      state.pendingSignup = null;
    },
    setPendingResetEmail(state, action: PayloadAction<string>) {
      state.pendingResetEmail = action.payload;
    },
    clearPendingReset(state) {
      state.pendingResetEmail = null;
      state.otpVerified = false;
    },
    setOAuthUser(state, action: PayloadAction<{ token: string; refreshToken?: string; role: string; email?: string; name?: string }>) {
      const { token, refreshToken, role, email, name } = action.payload;
      const displayName = name || (email ? email.split('@')[0] : 'User');
      state.user = {
        id: null,
        name: displayName,
        email: email || null,
        role: role,
      };
      state.token = token;
      localStorage.setItem('accessToken', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(state.user));
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingSignup = action.payload.data;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.pendingSignup = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = {
          id: action.payload.id,
          name: action.payload.userName,
          email: action.payload.email,
          role: action.payload.role,
        };
        state.token = action.payload.jwt;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.pendingResetEmail = action.payload.data?.email;
      })
      .addCase(verifyForgotOtp.fulfilled, (state, action) => {
        state.otpVerified = true;
        state.pendingResetEmail = action.payload.email;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.otpVerified = false;
        state.pendingResetEmail = null;
      });
  },
});

export const {
  logout,
  clearError,
  setPendingSignup,
  clearPendingSignup,
  setPendingResetEmail,
  clearPendingReset,
  setOAuthUser,
  updateUser,
} = authSlice.actions;

export default authSlice.reducer;

export type RootState = {
  auth: AuthState;
};