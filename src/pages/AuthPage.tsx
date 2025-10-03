import { useState } from "react";
import { MessageSquare, UserPlus, LogIn } from "lucide-react";
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

// --- POCKETBASE SIMULATION (In a real app, you would configure and import your client) ---

/**
 * NOTE: In a production environment, this 'pb' object would be imported
 * from your PocketBase setup file. This structure simulates the PocketBase
 * client methods used for this component, ensuring they match our defined types.
 */

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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full mb-4 shadow-lg transition duration-300 transform hover:scale-105">
            <MessageSquare className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
            {currentTitle}
          </h1>
          <p className="text-sm text-gray-500">{currentSubtitle}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm font-medium transition duration-300 ease-in-out transform hover:scale-[1.01]">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-4">
          {/* username  Field (Only for Signup) */}
          {!isLoginView && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                defaultValue={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                
                onKeyPress={(e) => e.key === "Enter" && handleSignup()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                placeholder="Confirm your password"
                disabled={isLoading}
              />
            </div>
          )}
          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (uok.ac.rw)
            </label>
            <input
              type="email"
              defaultValue={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="your.email@uok.ac.rw"
              disabled={isLoading}
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              defaultValue={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyPress={(e) =>
                e.key === "Enter" &&
                (isLoginView ? handleLogin() : handleSignup())
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {/* Password Confirm Field (Only for Signup) */}
          {!isLoginView && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                defaultValue={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  setError(null);
                }}
                onKeyPress={(e) => e.key === "Enter" && handleSignup()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                placeholder="Confirm your password"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Main Action Button */}
          <button
            onClick={isLoginView ? handleLogin : handleSignup}
            className="w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition duration-200 transform hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
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
        <p className="text-center text-sm text-gray-500 mt-6">
          {isLoginView ? "Don't have an account?" : "Already have an account?"}
          <button
            onClick={() => {
              setIsLoginView(!isLoginView);
              setError(null);
              setEmail("");
              setPassword("");
              setPasswordConfirm("");
            }}
            className="text-blue-600 font-semibold ml-1 hover:text-blue-800 transition duration-150 focus:outline-none"
            disabled={isLoading}
          >
            {isLoginView ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}
