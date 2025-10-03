// AppRouter.tsx (Recommended Fix)
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UKChatApp from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage";
import { useEffect, useState } from "react";
import { pb } from "./lib/pocketbase";

const NotFound: React.FC = () => <h1>404 - Page Not Found</h1>;

const AppRouter: React.FC = () => {
  // Initialize state based on the current auth status for the initial render
  const [authenticated, setAuthenticated] = useState(pb.authStore.isValid);

  // Acknowledge that the component will re-render when 'authenticated' changes.

  useEffect(() => {
    // PocketBase provides an on-change event listener for the authStore
    const unsubscribe = pb.authStore.onChange(() => {
      // The isValid property is the most reliable way to check
      setAuthenticated(pb.authStore.isValid);
    });

    // Clean up the subscription when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []); // Empty dependency array: run once on mount

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={authenticated ? <UKChatApp /> : <AuthPage />}
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
