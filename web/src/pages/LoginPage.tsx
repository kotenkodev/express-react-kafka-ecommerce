import { Link, Navigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/features/auth/store/authStore";
import LoginForm from "@/features/auth/components/LoginForm";
import PageMeta from "@/components/PageMeta";

export default function LoginPage() {
  const { accessToken, user } = useAuthStore();

  if (accessToken) {
    return <Navigate to={user?.role === "admin" ? "/orders" : "/"} replace />;
  }

  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-muted/30 px-4 py-8 sm:py-12">
      <PageMeta
        title="Sign In"
        description="Sign in to your KafkaShop account to access fast order checkout, saved carts, and real-time delivery tracking."
      />
      <div className="w-full max-w-md flex flex-col items-center my-auto">
        <Link
          to="/"
          className="flex items-center gap-2.5 mb-6 text-foreground font-semibold text-xl tracking-tight transition-opacity hover:opacity-85"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <span>KafkaShop</span>
        </Link>

        <LoginForm />

        <p className="mt-6 max-w-xs text-center text-xs text-muted-foreground sm:max-w-sm">
          By continuing, you agree to our{" "}
          <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="underline underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
            Privacy Policy
          </span>
          .
        </p>
      </div>
    </div>
  );
}
