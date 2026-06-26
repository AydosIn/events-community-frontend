import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../components/admin/AdminLayout";
import useAdminGuard from "../../components/admin/useAdminGuard";
import { useToast } from "../../components/ToastProvider";
import { api, clearSession } from "../../lib/api";
import { ADMIN_LOGIN_PATH, formatDateTime, isAdminAuthError } from "../../lib/admin";

const emptyForm = {
  full_name: "",
  email: "",
  password: "",
};

export default function AdminAdminsPage() {
  const router = useRouter();
  const { ready, token } = useAdminGuard();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  function handleAuthFailure(message) {
    if (isAdminAuthError(message)) {
      clearSession();
      router.replace(ADMIN_LOGIN_PATH);
      return true;
    }

    return false;
  }

  function loadAdmins() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    api
      .getAdminAdmins(token)
      .then((data) => {
        setAdmins(data.items || []);
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to load admins";
        if (handleAuthFailure(message)) {
          return;
        }

        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    loadAdmins();
  }, [ready, token]);

  function handleChange(event) {
    const { name, value } = event.target;
    setError("");
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    api
      .createAdminAdmin(token, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      .then(() => {
        toast.success("Admin created.");
        setForm(emptyForm);
        loadAdmins();
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to create admin";
        if (handleAuthFailure(message)) {
          return;
        }

        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setSaving(false);
      });
  }

  function handleRevoke(admin) {
    const confirmed = window.confirm(`Remove admin access for ${admin.email}?`);
    if (!confirmed) {
      return;
    }

    setSaving(true);

    api
      .deleteAdminAdmin(token, admin.id)
      .then(() => {
        toast.success("Admin access removed.");
        loadAdmins();
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to remove admin access";
        if (handleAuthFailure(message)) {
          return;
        }

        toast.error(message);
      })
      .finally(() => {
        setSaving(false);
      });
  }

  if (!ready) {
    return <main className="page-shell"><section className="empty-state">Checking admin access...</section></main>;
  }

  return (
    <>
      <Head>
        <title>Admins | Events Community</title>
      </Head>

      <AdminLayout
        title="Admins"
        description="Create and manage the people who can access this admin panel."
      >
        <section className="admin-grid">
          <article className="filter-card admin-form-card">
            <div className="section-heading">
              <div>
                <span className="section-label">New admin</span>
                <h2>Create admin account</h2>
              </div>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                Full name
                <input
                  className="field"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Email
                <input
                  className="field"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Password
                <input
                  className="field"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </label>

              <button type="submit" className="button button-primary" disabled={saving}>
                {saving ? "Saving..." : "Create admin"}
              </button>

              {error ? <p className="form-error">{error}</p> : null}
            </form>
          </article>

          <article className="filter-card">
            <div className="section-heading">
              <div>
                <span className="section-label">Current admins</span>
                <h2>Admin access list</h2>
              </div>
            </div>

            <div className="admin-table-card admin-table-card-inline">
              {loading ? (
                <div className="empty-state">Loading admins...</div>
              ) : admins.length > 0 ? (
                <div className="admin-table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admins.map((admin) => (
                        <tr key={admin.id}>
                          <td>
                            <strong>{admin.full_name}</strong>
                          </td>
                          <td>{admin.email}</td>
                          <td>{formatDateTime(admin.created_at)}</td>
                          <td>
                            <button
                              type="button"
                              className="button button-ghost admin-danger-button"
                              onClick={() => handleRevoke(admin)}
                              disabled={saving}
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">No admins found.</div>
              )}
            </div>
          </article>
        </section>
      </AdminLayout>
    </>
  );
}
