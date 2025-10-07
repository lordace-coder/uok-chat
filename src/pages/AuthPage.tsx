import { useState } from "react";
import { MessageSquare, UserPlus, LogIn, Sparkles } from "lucide-react";
import { pb } from "../lib/pocketbase";

// --- TYPESCRIPT INTERFACES ---

// Interface for a user record returned by PocketBase
interface PocketBaseRecord {
  id: string;
  email: string;
  // Add other user fields as necessary
}

// Interface for successful authentication data
interface PocketBaseAuthData {
  token: string;
  record: PocketBaseRecord;
}

// Interface for the detailed error response from PocketBase
interface PocketBaseError {
  message: string;
  response?: {
    code: number;
    // data contains field-specific error messages
    data: {
      [key: string]: {
        code: string;
        message: string;
      };
    };
  };
}

// --- UTILITY FUNCTION ---

// Utility to parse the complex PocketBase error structure into a single string
const parsePbError = (err: any): string => {
  try {
    const pbError = err as PocketBaseError;
    if (pbError.response && pbError.response.data) {
      // Find the first error message in the response data object
      const fields = Object.values(pbError.response.data);
      if (fields.length > 0 && fields[0].message) {
        if (
          fields[0].message.toLocaleLowerCase().includes("value must be unique")
        ) {
          return "Account with this email already exists";
        }
        return fields[0].message; // e.g., "Invalid email or password."
      }
    }
    return pbError.message || "An unknown error occurred.";
  } catch {
    return "An unknown error occurred.";
  }
};

// Main application component
export default function App() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoginView, setIsLoginView] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const authData: PocketBaseAuthData = await pb
        .collection("users")
        .authWithPassword(email, password);
    } catch (err) {
      console.error("Login error:", err);
      setError(parsePbError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !passwordConfirm || !name) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const newUser: PocketBaseRecord = await pb.collection("users").create({
        email,
        password,
        passwordConfirm,
        name,
      });

      // Attempt to immediately log the user in after successful registration
      await pb.collection("users").authWithPassword(email, password);
    } catch (err) {
      console.error("Signup error:", err);
      setError(parsePbError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const currentIcon = isLoginView ? (
    <LogIn className="w-6 h-6 text-white" />
  ) : (
    <UserPlus className="w-6 h-6 text-white" />
  );
  const currentTitle = isLoginView
    ? "Sign In to UK Student Chat"
    : "Create UK Chat Account";
  const currentSubtitle = isLoginView
    ? "Access your university community."
    : "Join the University of Kigali network.";
  const currentButtonText = isLoginView ? "Sign In" : "Sign Up";

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-pink-200 flex items-center justify-center p-4 font-inter relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      <div
        className="absolute bottom-20 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"
        style={{ animationDelay: "4s" }}
      ></div>

      <div className="bg-white/80 backdrop-blur-lg border border-pink-200/50 rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-500 rounded-2xl mb-4 shadow-lg transition duration-300 transform hover:scale-110 hover:rotate-3">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 bg-clip-text text-transparent">
              {currentTitle}
            </h1>
            <Sparkles className="w-5 h-5 text-pink-500 animate-pulse" />
          </div>
          <p className="text-sm text-gray-600 font-medium">{currentSubtitle}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-300 text-rose-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium transition duration-300 ease-in-out transform hover:scale-[1.02] shadow-sm">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          {/* username Field (Only for Signup) */}
          {!isLoginView && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSignup()}
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 bg-white/50 backdrop-blur-sm hover:border-pink-300"
                placeholder="Enter your username"
                disabled={isLoading}
              />
            </div>
          )}
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email (uok.ac.rw)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 bg-white/50 backdrop-blur-sm hover:border-pink-300"
              placeholder="your.email@uok.ac.rw"
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                (isLoginView ? handleLogin() : handleSignup())
              }
              className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 bg-white/50 backdrop-blur-sm hover:border-pink-300"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {/* Password Confirm Field (Only for Signup) */}
          {!isLoginView && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  setError(null);
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSignup()}
                className="w-full px-4 py-3 border-2 border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition duration-200 bg-white/50 backdrop-blur-sm hover:border-pink-300"
                placeholder="Confirm your password"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={isLoginView ? handleLogin : handleSignup}
            className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white py-3.5 rounded-xl font-bold hover:from-pink-600 hover:via-rose-600 hover:to-purple-600 transition duration-300 transform hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isLoginView ? "Signing In..." : "Registering..."}
              </>
            ) : (
              <>
                {currentButtonText}
                {isLoginView ? (
                  <LogIn className="w-5 h-5" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
              </>
            )}
          </button>
        </div>

        {/* Switch Mode Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError(null);
              setEmail("");
              setPassword("");
              setPasswordConfirm("");
              setName("");
            }}
            className="text-pink-600 font-bold ml-1 hover:text-pink-700 transition duration-150 focus:outline-none hover:underline decoration-2 underline-offset-2"
            disabled={isLoading}
          >
            {isLoginView ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
