import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { loginSchema } from "@/features/auth/schemas/login.schema";
import { login as loginApi } from "@/features/auth/api/auth.api";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getErrorMessage } from "@/lib/error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginForm() {
  const navigate = useNavigate();
  const { setAccessToken, setUser } = useAuthStore();
  const [loginMethod, setLoginMethod] = useState<"email" | "username">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      email: "",
      username: undefined as string | undefined,
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        const payload =
          loginMethod === "email"
            ? { email: values.email, password: values.password }
            : { username: values.username, password: values.password };

        const data = await loginApi(payload);
        setUser(data.user);
        setAccessToken(data.accessToken);

        toast.success(
          `Welcome back, ${data.user.username || data.user.firstName}!`,
        );
        navigate(data.user.role === "admin" ? "/orders" : "/");
      } catch (err: any) {
        const errorMsg = getErrorMessage(err, "Invalid credentials.");
        setServerError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleTabChange = (val: string | null) => {
    if (!val) return;
    const method = val as "email" | "username";
    setLoginMethod(method);
    setServerError(null);
    if (method === "email") {
      formik.setFieldValue("username", undefined);
      formik.setFieldValue("email", "");
      formik.setFieldTouched("username", false);
    } else {
      formik.setFieldValue("email", undefined);
      formik.setFieldValue("username", "");
      formik.setFieldTouched("email", false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-sm sm:shadow-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in to your account to continue shopping
        </CardDescription>
      </CardHeader>

      <CardContent>
        {serverError && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive font-medium">
            {serverError}
          </div>
        )}

        <div className="mb-4">
          <Tabs
            value={loginMethod}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="username">Username</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <form
          id="login-form"
          className="space-y-4"
          onSubmit={formik.handleSubmit}
        >
          {loginMethod === "email" ? (
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                {...formik.getFieldProps("email")}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@kafkashop.com"
                disabled={formik.isSubmitting}
                aria-invalid={Boolean(
                  formik.touched.email && formik.errors.email,
                )}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-xs font-medium text-destructive">
                  {formik.errors.email}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                {...formik.getFieldProps("username")}
                id="username"
                type="text"
                autoComplete="username"
                placeholder="admin"
                disabled={formik.isSubmitting}
                aria-invalid={Boolean(
                  formik.touched.username && formik.errors.username,
                )}
              />
              {formik.touched.username && formik.errors.username && (
                <p className="text-xs font-medium text-destructive">
                  {formik.errors.username}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                {...formik.getFieldProps("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={formik.isSubmitting}
                className="pr-10"
                aria-invalid={Boolean(
                  formik.touched.password && formik.errors.password,
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="text-xs font-medium text-destructive">
                {formik.errors.password}
              </p>
            )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-2">
        <Button
          form="login-form"
          className="w-full"
          type="submit"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
