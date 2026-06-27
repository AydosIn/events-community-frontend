import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Breadcrumbs from "../components/Breadcrumbs";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useToast } from "../components/ToastProvider";
import { api, getStoredSession, setSession } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const session = getStoredSession();
    if (session.token) {
      router.replace("/");
      return;
    }

    if (router.query.registered === "1") {
      const message = "Your account is ready. Log in to start joining opportunities.";
      setSuccess(message);
      toast.success(message);
    }
  }, [router, router.query.registered, toast]);

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
    setSuccess("");
    setLoading(true);

    api
      .login({ email: form.email, password: form.password })
      .then((data) => {
        const fallbackName = form.email.split("@")[0] || "Community Member";
        setSession(data.access_token, {
          full_name: data.full_name || fallbackName,
          is_admin: Boolean(data.is_admin),
        });
        toast.success("Logged in successfully.");
        router.push(data.is_admin ? "/admin" : "/");
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

  function handleGoogleCredential(credential) {
    setError("");
    setSuccess("");
    setLoading(true);

    api
      .googleAuth(credential)
      .then((data) => {
        setSession(data.access_token, {
          full_name: data.full_name || "Community Member",
          is_admin: Boolean(data.is_admin),
        });
        toast.success("Signed in with Google.");
        router.push(data.is_admin ? "/admin" : "/");
      })
      .catch((requestError) => {
        const message = requestError.message || "Google sign-in failed";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <>
      <Head>
        <title>Login | Events Community</title>
      </Head>

      <main className="page-shell">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Login" }]} />

        <section className="auth-page">
          <div className="auth-panel">
            <span className="section-label">Login</span>
            <h1>Welcome back</h1>
            <p>Enter your email and password to continue.</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
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
                  {loading ? "Logging in..." : "Login"}
                </button>
                {error ? <p className="form-error">{error}</p> : null}
              </div>
            </form>

            <div className="auth-divider" aria-hidden="true">
              <span>or</span>
            </div>

            <GoogleAuthButton onCredential={handleGoogleCredential} disabled={loading} text="continue_with" />

            <p className="auth-link">
              Don&apos;t have an account? <Link href="/register">Sign up</Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
