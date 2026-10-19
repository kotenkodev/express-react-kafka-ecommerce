import { useAuthStore } from "@/features/auth/store/authStore";
import { router } from "@/router";
import axios, { InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

interface CustomAxiosConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL + "/api",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

let refreshPromise: Promise<string> | null = null;

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosConfig;
    const status = error.response?.status;

    if (!error.response && error.code !== "ERR_CANCELED") {
      toast.error(
        "Network error. Unable to reach server. Please check your internet connection.",
        { id: "network-error" },
      );
      return Promise.reject(error);
    }

    if (status && status >= 500) {
      toast.error(
        "Server error. Something went wrong on our end. Please try again later.",
        { id: "server-error" },
      );
      return Promise.reject(error);
    }

    const isAuthError = status === 401 || status === 403;
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    if (isAuthError && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            const res = await axios.post(
              `${instance.defaults.baseURL}/auth/refresh`,
              {},
              { withCredentials: true },
            );
            const newAccessToken = res.data.accessToken;
            useAuthStore.getState().setAccessToken(newAccessToken);
            return newAccessToken;
          })().finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return instance(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setAccessToken(null);
        toast.error("Your session has expired. Please log in again.", {
          id: "session-expired",
        });
        router.navigate("/login");
        return Promise.reject(refreshError);
      }
    }

    if (status === 401 && originalRequest._retry && !isAuthEndpoint) {
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setAccessToken(null);
      toast.error("Your session has expired. Please log in again.", {
        id: "session-expired",
      });
      router.navigate("/login");
    }

    return Promise.reject(error);
  },
);

export default instance;
