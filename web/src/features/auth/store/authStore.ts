import { create } from "zustand";
import { User } from "../types";
import { persist } from "zustand/middleware";
import { getMe } from "../api/auth.api";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  initAuth: () => Promise<void>;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: true,
      setUser: (user: User) => set({ user }),
      setAccessToken: (token: string) => set({ accessToken: token }),
      initAuth: async () => {
        const { accessToken } = get();
        if (!accessToken) {
          set({ isLoading: false });
          return;
        }
        try {
          const user = await getMe();
          set({ user, isLoading: false });
        } catch {
          set({ user: null, accessToken: null, isLoading: false });
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);
