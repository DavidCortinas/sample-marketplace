import { useAuthStore } from "../stores/authStore";
import { Form, useActionData, useNavigate, useSubmit, Link } from "@remix-run/react";
import { useEffect, useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { User } from "../types/user";
import { useSearchParams } from "@remix-run/react";
import { useTheme } from "../hooks/useTheme"; // Add this import

export interface ActionData {
  success: boolean;
  error?: string;
  access?: string;
  refresh?: string;
  user?: User;
  onboarding_required?: boolean;
}

export interface LoginFormProps {
  actionData: ActionData | undefined;
  isLoading: boolean;
  errorMessage: string;
  isLogin: boolean;
  setIsLogin: React.Dispatch<React.SetStateAction<boolean>>;
}

function LoginForm({ isLoading, errorMessage, isLogin, setIsLogin }: LoginFormProps) {
  const navigate = useNavigate();
  const submit = useSubmit();
  const setTokens = useAuthStore(state => state.setTokens)
  const actionData = useActionData() as ActionData | undefined;
  const [emailError, setEmailError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const message = searchParams.get("message");
  const { isDarkMode } = useTheme();

  const validatePasswords = () => {
    if (!isLogin && password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  useEffect(() => {
    if (actionData?.success && actionData?.access && actionData?.refresh) {
      setTokens(actionData.access, actionData.refresh);
      if (isLogin) {
        if (actionData.onboarding_required) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/discover', { replace: true });
        }
      } else {
        setIsLogin(true);
      }
    }
  }, [actionData, navigate, isLogin, setIsLogin, setTokens]);

  const validateEmail = (email: string): string | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }
    return null;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validatePasswords()) {
      return;
    }
    const formData = new FormData(event.currentTarget);
    submit(formData, { method: "post", action: isLogin ? "/login" : "/register" });
  };

  return (
      <div className={`p-8 rounded-lg shadow-lg w-full max-w-md ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-black' 
          : 'bg-gradient-to-br from-orange-400 to-pink-500'
      } transition-colors duration-300`}>
        <div className="bg-white dark:bg-gray-800 dark:bg-opacity-95 bg-opacity-90 p-6 rounded-md shadow-md">
        <h1 className="text-3xl font-bold mb-2 text-center text-gray-800 dark:text-gray-200">AUDAFACT</h1>
        <p className="text-center text-gray-600 dark:text-gray-300 mb-2">
          {isLogin 
            ? "Unlock your stash of music, breaks, loops and more..." 
            : "Start your journey to discover music, loops, breaks, and other sounds for your next project..."}
        </p>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
          {"Dive into a world of undiscovered audio gems"}
        </p>

        {/* Google Auth Form */}
        <Form method="post" action="/auth/google">
          <button
            type="submit"
            className="btn-primary w-full text-center block mb-4 flex items-center justify-center relative dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <div className="google-logo-wrapper absolute left-2">
              <div className="google-logo-background">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" className="google-logo">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
              </div>
            </div>
            <span className="flex-grow text-center">
              {isLogin ? "Sign in with Google" : "Sign up with Google"}
            </span>
          </button>
        </Form>

        <div className="relative mb-4">
          <hr className="border-t border-gray-300 dark:border-gray-600" />
          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400 text-sm">
            or
          </span>
        </div>

        <Form 
          method="post" 
          action={isLogin ? "/api/login" : "/api/register"}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input type="hidden" name="isLogin" value={isLogin ? "true" : "false"} />
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              className="input-field dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              required
              onChange={(e) => setEmailError(validateEmail(e.target.value))}
            />
            {emailError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{emailError}</p>}
          </div>
          <div className="relative">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              className="input-field dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 pr-10"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200 mt-6"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                className="input-field dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          )}
          {passwordError && <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>}
          <button
            type="submit"
            className="btn-secondary w-full dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            disabled={isLoading}
          >
            {isLoading ? "Polishing gems..." : (isLogin ? "Enter with Email" : "Register with Email")}
          </button>
        </Form>
        
        {actionData?.message && (
          <p className={`mt-4 text-center text-sm ${actionData.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {actionData.message}
          </p>
        )}
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
            type="button"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
        {errorMessage && (
          <p className="text-red-600 dark:text-red-400 text-sm italic mt-2">{errorMessage}</p>
        )}
        {error && (
          <p className="text-red-600 dark:text-red-400 text-center text-sm italic mt-2">
            {message || getErrorMessage(error)}
          </p>
        )}
      </div>
    </div>
  );
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'account_exists':
      return 'An account with this email already exists. Please log in with your email and password.';
    case 'token_exchange_failed':
      return 'Failed to exchange token. Please try again.';
    case 'google_auth_failed':
      return 'Google authentication failed. Please try again or use another login method.';
    default:
      return 'An error occurred. Please try again.';
  }
}

export { LoginForm };
