import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../../components/admin/AdminLayout";
import useAdminGuard from "../../../components/admin/useAdminGuard";
import { useToast } from "../../../components/ToastProvider";
import { clearSession, api } from "../../../lib/api";
import { formatDateTime, getNextOffset, isAdminAuthError } from "../../../lib/admin";

const PAGE_LIMIT = 25;

export default function AdminUsersPage() {
  const router = useRouter();
  const { ready, token } = useAdminGuard();
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
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
      .getAdminUsers(token, { q: appliedSearch, limit: PAGE_LIMIT, offset })
      .then((data) => {
        if (!active) {
          return;
        }

        setUsers(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        const message = requestError.message || "Failed to load users";
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
  }, [appliedSearch, offset, ready, router, toast, token]);

  function handleSubmit(event) {
    event.preventDefault();
    setOffset(0);
    setAppliedSearch(searchInput.trim());
  }

  const hasNextPage = offset + PAGE_LIMIT < total;

  if (!ready) {
    return <main className="page-shell"><section className="empty-state">Checking admin access...</section></main>;
  }

  return (
    <>
      <Head>
        <title>Admin Users | Events Community</title>
      </Head>

      <AdminLayout
        title="Users"
        description="Review registered members, sign-in method, admin status, and how active each account has been."
      >
        <section className="filter-card">
          <form className="admin-filter-grid admin-filter-grid-compact" onSubmit={handleSubmit}>
            <input
              className="field"
              type="text"
              placeholder="Search by full name or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit" className="button button-primary">
              Search
            </button>
          </form>
        </section>

        {error ? <section className="status-banner error-state">{error}</section> : null}

        <section className="admin-table-card">
          {loading ? (
            <div className="empty-state">Loading users...</div>
          ) : users.length > 0 ? (
            <>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Provider</th>
                      <th>Joined</th>
                      <th>Registrations</th>
                      <th>Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>
                          <Link href={`/admin/users/${user.id}`} className="admin-table-link">
                            {user.full_name}
                          </Link>
                          <span>{user.email}</span>
                        </td>
                        <td>{user.auth_provider || "local"}</td>
                        <td>{formatDateTime(user.created_at)}</td>
                        <td>{user.registrations_count}</td>
                        <td>{user.is_admin ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="admin-pagination">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={offset === 0}
                  onClick={() => setOffset(getNextOffset(offset, PAGE_LIMIT, "prev"))}
                >
                  Previous
                </button>
                <span className="result-count">Page {Math.floor(offset / PAGE_LIMIT) + 1}</span>
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={!hasNextPage}
                  onClick={() => setOffset(getNextOffset(offset, PAGE_LIMIT, "next"))}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">No users matched the current search.</div>
          )}
        </section>
      </AdminLayout>
    </>
  );
}
