import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabase";
import AuthPage from "./auth/AuthPage";
import Dashboard from "./dashboard/Dashboard";

import "../styles/fonts.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
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

  return isLoggedIn ? <Dashboard /> : <AuthPage />;
}

export default App;