import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import AuthPage from "./auth/AuthPage";
import Dashboard from "./dashboard/Dashboard";

import "../styles/fonts.css";

// VITE_USE_MOCK=true renders the dashboard with synthetic data and no login.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (USE_MOCK) {
      setCheckingAuth(false);
      return;
    }

    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(Boolean(user));
      setCheckingAuth(false);
    }

    checkUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
      setCheckingAuth(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  if (checkingAuth) {
    return <p>Loading...</p>;
  }

  return USE_MOCK || isLoggedIn ? <Dashboard /> : <AuthPage />;
}

export default App;