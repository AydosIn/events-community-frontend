import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../components/admin/AdminLayout";
import useAdminGuard from "../../components/admin/useAdminGuard";
import { useToast } from "../../components/ToastProvider";
import { clearSession, api } from "../../lib/api";
import { isAdminAuthError } from "../../lib/admin";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { ready, token } = useAdminGuard();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    api
      .getAdminOverview(token)
      .then((data) => {
        if (active) {
          setOverview(data);
        }
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        const message = requestError.message || "Failed to load admin overview";
        if (isAdminAuthError(message)) {
          clearSession();
          router.replace("/login");
          return;
        }

        setError(message);
        toast.error(message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [ready, router, toast, token]);

  if (!ready) {
    return <main className="page-shell"><section className="empty-state">Checking admin access...</section></main>;
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard | Events Community</title>
      </Head>

      <AdminLayout
        title="Dashboard"
        description="Track the health of the platform, then jump straight into registrations, opportunities, or users."
        actions={
          <>
            <Link href="/admin/registrations" className="button button-primary">
              View registrations
            </Link>
            <Link href="/admin/opportunities" className="button button-secondary">
              Manage opportunities
            </Link>
          </>
        }
      >
        {error ? <section className="status-banner error-state">{error}</section> : null}

        <section className="stats-grid">
          <article className="stats-card">
            <span>Users</span>
            <strong>{loading ? "..." : overview?.users_count ?? 0}</strong>
          </article>
          <article className="stats-card">
            <span>Opportunities</span>
            <strong>{loading ? "..." : overview?.opportunities_count ?? 0}</strong>
          </article>
          <article className="stats-card">
            <span>Registrations</span>
            <strong>{loading ? "..." : overview?.registrations_count ?? 0}</strong>
          </article>
        </section>

        <section className="feature-grid">
          <article className="highlight-card">
            <span className="section-label">Priority workflow</span>
            <h3>Registration oversight</h3>
            <p>See who joined what, search by person, and keep an eye on activity as usage grows.</p>
            <Link href="/admin/registrations" className="button button-secondary">
              Open registrations
            </Link>
          </article>
          <article className="highlight-card">
            <span className="section-label">Content control</span>
            <h3>Opportunity management</h3>
            <p>Create, update, or remove opportunities without editing seed data or opening the database.</p>
            <Link href="/admin/opportunities" className="button button-secondary">
              Open opportunities
            </Link>
          </article>
          <article className="highlight-card">
            <span className="section-label">User visibility</span>
            <h3>User directory</h3>
            <p>Review registered members, see auth provider information, and open each user’s activity history.</p>
            <Link href="/admin/users" className="button button-secondary">
              Open users
            </Link>
          </article>
        </section>
      </AdminLayout>
    </>
  );
}
