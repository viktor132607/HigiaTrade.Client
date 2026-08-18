import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

const emptyState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

const isJwtExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));

    if (!payload.exp) {
      return true;
    }

    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const getInitialState = (): AuthState => {
  if (typeof window === "undefined") {
    return emptyState;
  }

  const token = window.localStorage.getItem("token");
  const userStr = window.localStorage.getItem("user");

  if (!token || !userStr || isJwtExpired(token)) {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    return emptyState;
  }

  try {
    const user = JSON.parse(userStr) as User;

    return {
      user,
      token,
      isAuthenticated: true,
    };
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    return emptyState;
  }
};

const initialState: AuthState = getInitialState();

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(state.token);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(action.payload));
      }
    },

    setToken: (state, action: PayloadAction<string>) => {
      if (isJwtExpired(action.payload)) {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;

        if (typeof window !== "undefined") {
          window.localStorage.removeItem("token");
          window.localStorage.removeItem("user");
        }

        return;
      }

      state.token = action.payload;
      state.isAuthenticated = Boolean(state.user);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("token", action.payload);
      }
    },

    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      const { user, token } = action.payload;

      if (isJwtExpired(token)) {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;

        if (typeof window !== "undefined") {
          window.localStorage.removeItem("token");
          window.localStorage.removeItem("user");
        }

        return;
      }

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      if (typeof window !== "undefined") {
        window.localStorage.setItem("user", JSON.stringify(user));
        window.localStorage.setItem("token", token);
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("user");
      }
    },
  },
});

export const { setUser, setToken, loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;