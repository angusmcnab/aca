import { useState } from "react";
import { supabase } from "./supabase";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import { FcGoogle } from "react-icons/fc"; // Google Icon

export default function Auth() {
  const [mode, setMode] = useState("login");

  const handleOAuthLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) console.error("Google OAuth error:", error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-xl border border-gray-200">
        <h2 className="text-center text-3xl font-bold text-gray-900 tracking-tight">
          {mode === "login" ? "Sign In to CleanerApp" : "Register for CleanerApp"}
        </h2>

        {/* Google Sign-In Button */}
        <button
          onClick={handleOAuthLogin}
          className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-300 hover:border-gray-400 shadow-sm text-sm font-medium text-gray-700 rounded-md transition"
        >
          <FcGoogle className="text-xl" />
          Sign in with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 text-gray-400 text-sm">
          <div className="flex-1 h-px bg-gray-200" />
          or
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Conditional Form */}
        {mode === "login" ? <LoginForm /> : <RegisterForm />}

        {/* Toggle */}
        <div className="text-center text-sm text-gray-500 pt-4">
          {mode === "login" ? (
            <>
              New here?{" "}
              <button
                className="text-blue-600 hover:underline"
                onClick={() => setMode("register")}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="text-blue-600 hover:underline"
                onClick={() => setMode("login")}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
