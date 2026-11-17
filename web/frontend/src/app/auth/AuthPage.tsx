import { useState } from "react";
import { signInUser, signUpUser } from "../data/auth";
import "./AuthPage.css";

type AuthMode = "login" | "signup";

// Public demo login (see web/backend/database/migrations/2026-11-17_demo_account.sql).
// These are deliberately public — the account is read-only and its password
// cannot be changed from a session. Leave them unset and the button disappears.
const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL as string | undefined;
const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD as string | undefined;
const DEMO_ENABLED = Boolean(DEMO_EMAIL && DEMO_PASSWORD);

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        await signUpUser(email, password, displayName);
        setMessage(
          "Account created successfully. Check your email if confirmation is enabled."
        );
      } else {
        await signInUser(email, password);
        setMessage("Logged in successfully.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Authentication failed";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // A real sign-in through Supabase Auth with the demo credentials — the same
  // path as the form, so it proves the login works rather than skipping it.
  async function handleDemoLogin() {
    if (!DEMO_EMAIL || !DEMO_PASSWORD) return;
    setMode("login");
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setLoading(true);
    setMessage("");

    try {
      await signInUser(DEMO_EMAIL, DEMO_PASSWORD);
      setMessage("Logged in successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Demo login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg auth-bg-1" />
      <div className="auth-bg auth-bg-2" />
      <div className="auth-bg auth-bg-3" />

      <div className="auth-shell">
        <section className="auth-brand-panel">
          <div className="brand-badge">
            <div className="brand-icon">🌿</div>
            <span>Plant Doctor Pro</span>
          </div>

          <div className="brand-copy">
            <p className="eyebrow">SMART PLANT MONITORING</p>
            <h1>
              Keep your plants
              <br />
              healthy, balanced,
              <br />
              and thriving.
            </h1>
            <p className="brand-description">
              Monitor moisture, light, temperature, humidity, and tilt all in
              one calm dashboard designed for better plant care.
            </p>
          </div>

          <div className="brand-stats">
            <div className="brand-stat-card">
              <span className="stat-label">Live Monitoring</span>
              <strong>24/7</strong>
            </div>
            <div className="brand-stat-card">
              <span className="stat-label">Health Tracking</span>
              <strong>Multi-factor</strong>
            </div>
            <div className="brand-stat-card">
              <span className="stat-label">Care Guidance</span>
              <strong>AI-assisted</strong>
            </div>
          </div>
        </section>

        <section className="auth-card">
          <div className="auth-card-header">
            <p className="eyebrow">
              {mode === "login" ? "WELCOME BACK" : "CREATE ACCOUNT"}
            </p>
            <h2>{mode === "login" ? "Sign in" : "Join Plant Doctor Pro"}</h2>
            <p className="auth-subtitle">
              {mode === "login"
                ? "Log in to continue monitoring your plants."
                : "Create an account to start tracking plant health."}
            </p>
          </div>

          <div className="auth-toggle">
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => {
                setMode("signup");
                setMessage("");
              }}
            >
              Sign Up
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div className="form-group">
                <label htmlFor="displayName">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {DEMO_ENABLED && mode === "login" && (
            <div className="auth-demo">
              <div className="auth-demo-divider">
                <span>or</span>
              </div>
              <button
                type="button"
                className="auth-demo-btn"
                onClick={handleDemoLogin}
                disabled={loading}
              >
                Try the demo account
              </button>
              <p className="auth-demo-note">
                Read-only, with simulated sensor data.
                <br />
                <code>{DEMO_EMAIL}</code> / <code>{DEMO_PASSWORD}</code>
              </p>
            </div>
          )}

          {message && (
            <div
              className={`auth-message ${
                message.toLowerCase().includes("success") ||
                message.toLowerCase().includes("logged in") ||
                message.toLowerCase().includes("account created")
                  ? "success"
                  : "error"
              }`}
            >
              {message}
            </div>
          )}

          <div className="auth-footer-note">
            <span>Plant stress tracking • Smart suggestions • Clean insights</span>
          </div>
        </section>
      </div>
    </div>
  );
}