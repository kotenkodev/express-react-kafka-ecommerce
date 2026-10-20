import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "./providers";

export default function App() {
  const { initAuth } = useAuthStore();
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster />
    </QueryProvider>
  );
}
