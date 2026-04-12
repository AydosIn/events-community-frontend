import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Breadcrumbs from "../components/Breadcrumbs";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { useToast } from "../components/ToastProvider";
import { api, getStoredSession, setSession } from "../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const session = getStoredSession();
    if (session.token) {
      router.replace("/");
    }
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
      .register(form)
      .then(() => {
        toast.success("Account created successfully.");
        router.push("/login?registered=1");
      })
      .catch((requestError) => {
        const message = requestError.message || "Registration failed";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function handleGoogleCredential(credential) {
    setError("");
    setLoading(true);

    api
      .googleAuth(credential)
      .then((data) => {
        setSession(data.access_token, data.full_name || "Community Member");
        toast.success("Account created with Google.");
        router.push("/");
      })
      .catch((requestError) => {
        const message = requestError.message || "Google sign-up failed";
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
        <title>Register | Events Community</title>
      </Head>

      <main className="page-shell">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Sign up" }]} />

        <section className="auth-page">
          <div className="auth-panel">
            <span className="section-label">Sign up</span>
            <h1>Create your account</h1>
            <p>Enter your details below and create your account.</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                Full name
                <input
                  name="full_name"
                  type="text"
                  placeholder="Your full name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />
              </label>

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
                  placeholder="Choose a password"
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
                  {loading ? "Creating account..." : "Sign up"}
                </button>
                {error ? <p className="form-error">{error}</p> : null}
              </div>
            </form>

            <div className="auth-divider" aria-hidden="true">
              <span>or</span>
            </div>

            <GoogleAuthButton onCredential={handleGoogleCredential} disabled={loading} text="continue_with" />

            <p className="auth-link">
              Already have an account? <Link href="/login">Login</Link>
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
