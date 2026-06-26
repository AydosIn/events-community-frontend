import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { useToast } from "../../components/ToastProvider";
import { api, clearSession, getStoredSession, setSession } from "../../lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const session = getStoredSession();

    if (!session.token) {
      setCheckingSession(false);
      return;
    }

    api
      .getMe(session.token)
      .then((user) => {
        if (user.is_admin) {
          setSession(session.token, {
            full_name: user.full_name,
            is_admin: true,
          });
          router.replace("/admin");
          return;
        }

        clearSession();
        setCheckingSession(false);
      })
      .catch(() => {
        clearSession();
        setCheckingSession(false);
      });
  }, [router]);

  function handleChange(event) {
    setError("");
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    api
      .login({ email: form.email, password: form.password })
      .then((data) => {
        if (!data.is_admin) {
          clearSession();
          const message = "Admin access required";
          setError(message);
          toast.error(message);
          return;
        }

        const fallbackName = form.email.split("@")[0] || "Admin";
        setSession(data.access_token, {
          full_name: data.full_name || fallbackName,
          is_admin: true,
        });
        toast.success("Admin access granted.");
        router.push("/admin");
      })
      .catch((requestError) => {
        const message = requestError.message || "Login failed";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  if (checkingSession) {
    return (
      <main className="page-shell">
        <section className="empty-state">Checking admin access...</section>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Login | Events Community</title>
      </Head>

      <main className="page-shell">
        <section className="auth-page">
          <div className="auth-panel">
            <span className="section-label">Admin access</span>
            <h1>Sign in to admin</h1>
            <p>Enter your admin email and password to access the dashboard.</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />
              </label>

              <div className="form-actions">
                <button
                  type="submit"
                  className="button button-primary button-block"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
                {error ? <p className="form-error">{error}</p> : null}
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
