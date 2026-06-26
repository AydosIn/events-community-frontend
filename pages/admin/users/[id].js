import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import AdminLayout from "../../../components/admin/AdminLayout";
import useAdminGuard from "../../../components/admin/useAdminGuard";
import { useToast } from "../../../components/ToastProvider";
import { clearSession, api } from "../../../lib/api";
import { formatDateTime, isAdminAuthError, ADMIN_LOGIN_PATH } from "../../../lib/admin";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { ready, token } = useAdminGuard();
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!ready || !token || !id) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    api
      .getAdminUser(token, id)
      .then((data) => {
        if (active) {
          setUser(data);
        }
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        const message = requestError.message || "Failed to load user details";
        if (isAdminAuthError(message)) {
          clearSession();
          router.replace(ADMIN_LOGIN_PATH);
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
  }, [id, ready, router, toast, token]);

  if (!ready) {
    return <main className="page-shell"><section className="empty-state">Checking admin access...</section></main>;
  }

  return (
    <>
      <Head>
        <title>Admin User Detail | Events Community</title>
      </Head>

      <AdminLayout
        title={user ? user.full_name : "User detail"}
        description="Review one account in detail, including auth method and registration history."
      >
        {error ? <section className="status-banner error-state">{error}</section> : null}

        {loading ? (
          <section className="empty-state">Loading user details...</section>
        ) : user ? (
          <section className="admin-grid admin-grid-single">
            <article className="highlight-card">
              <span className="section-label">{user.is_admin ? "Admin account" : "Member account"}</span>
              <h3>{user.full_name}</h3>
              <p>{user.email}</p>
              <div className="admin-meta-list">
                <span>Provider: {user.auth_provider || "local"}</span>
                <span>Joined: {formatDateTime(user.created_at)}</span>
                <span>Last login: {formatDateTime(user.last_login_at)}</span>
                <span>Registrations: {user.registrations_count}</span>
              </div>
              <Link href="/admin/users" className="button button-secondary">
                Back to users
              </Link>
            </article>

            <article className="admin-table-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">Activity</span>
                  <h2>Registration history</h2>
                </div>
              </div>

              {user.registrations?.length > 0 ? (
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Opportunity</th>
                        <th>Type</th>
                        <th>Region</th>
                        <th>Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {user.registrations.map((registration) => (
                        <tr key={registration.registration_id}>
                          <td>{registration.opportunity_title}</td>
                          <td className="admin-table-transform">{registration.opportunity_type}</td>
                          <td>{registration.region_name}</td>
                          <td>{formatDateTime(registration.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">This user has not registered for any opportunities yet.</div>
              )}
            </article>
          </section>
        ) : null}
      </AdminLayout>
    </>
  );
}
