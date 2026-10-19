import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerSchema } from "@/features/auth/schemas/register.schema";
import { register as registerApi } from "@/features/auth/api/auth.api";
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

export default function RegisterForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      passwordConfirm: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setServerError(null);
      try {
        await registerApi({
          username: values.username,
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          password: values.password,
          passwordConfirm: values.passwordConfirm,
        });

        toast.success("Account created successfully! Please sign in.");
        navigate("/login");
      } catch (err: any) {
        const errorMsg = getErrorMessage(err, "Failed to create account.");
        setServerError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card className="w-full max-w-md shadow-sm sm:shadow-md">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to register on our store
        </CardDescription>
      </CardHeader>

      <CardContent>
        {serverError && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive font-medium">
            {serverError}
          </div>
        )}

        <form
          id="register-form"
          className="space-y-4"
          onSubmit={formik.handleSubmit}
        >
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              {...formik.getFieldProps("username")}
              id="username"
              type="text"
              autoComplete="username"
              placeholder="johndoe"
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

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              {...formik.getFieldProps("email")}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="john@example.com"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                {...formik.getFieldProps("firstName")}
                id="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="John"
                disabled={formik.isSubmitting}
                aria-invalid={Boolean(
                  formik.touched.firstName && formik.errors.firstName,
                )}
              />
              {formik.touched.firstName && formik.errors.firstName && (
                <p className="text-xs font-medium text-destructive">
                  {formik.errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                {...formik.getFieldProps("lastName")}
                id="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Doe"
                disabled={formik.isSubmitting}
                aria-invalid={Boolean(
                  formik.touched.lastName && formik.errors.lastName,
                )}
              />
              {formik.touched.lastName && formik.errors.lastName && (
                <p className="text-xs font-medium text-destructive">
                  {formik.errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                {...formik.getFieldProps("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
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

          <div className="space-y-1.5">
            <Label htmlFor="passwordConfirm">Confirm Password</Label>
            <div className="relative">
              <Input
                {...formik.getFieldProps("passwordConfirm")}
                id="passwordConfirm"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={formik.isSubmitting}
                className="pr-10"
                aria-invalid={Boolean(
                  formik.touched.passwordConfirm &&
                    formik.errors.passwordConfirm,
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus:outline-none"
                tabIndex={-1}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmed password"
                    : "Show confirmed password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {formik.touched.passwordConfirm &&
              formik.errors.passwordConfirm && (
                <p className="text-xs font-medium text-destructive">
                  {formik.errors.passwordConfirm}
                </p>
              )}
          </div>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-2">
        <Button
          form="register-form"
          className="w-full"
          type="submit"
          disabled={formik.isSubmitting}
        >
          {formik.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
