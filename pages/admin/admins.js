import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../components/admin/AdminLayout";
import ConfirmDeleteModal from "../../components/admin/ConfirmDeleteModal";
import useAdminGuard from "../../components/admin/useAdminGuard";
import { useToast } from "../../components/ToastProvider";
import { api, clearSession } from "../../lib/api";
import { ADMIN_LOGIN_PATH, formatDateTime, isAdminAuthError } from "../../lib/admin";

const emptyForm = {
  email: "",
};

export default function AdminAdminsPage() {
  const router = useRouter();
  const { ready, token } = useAdminGuard();
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [revokeTarget, setRevokeTarget] = useState(null);
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
        email: form.email.trim(),
      })
      .then(() => {
        toast.success("Admin email added.");
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
    setRevokeTarget(admin);
  }

  function confirmRevoke() {
    if (!revokeTarget) {
      return;
    }

    setSaving(true);

    api
      .deleteAdminAdmin(token, revokeTarget.email)
      .then(() => {
        toast.success("Admin access removed.");
        setRevokeTarget(null);
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
        description="Manage which email addresses can access this admin panel after normal login."
      >
        <section className="admin-grid">
          <article className="filter-card admin-form-card">
            <div className="section-heading">
              <div>
                <span className="section-label">New admin</span>
                <h2>Add admin email</h2>
              </div>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
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

              <button type="submit" className="button button-primary" disabled={saving}>
                {saving ? "Saving..." : "Add admin email"}
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
                            <strong>{admin.full_name || "Pending login"}</strong>
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

      <ConfirmDeleteModal
        open={Boolean(revokeTarget)}
        title="Remove admin access"
        description={`This will remove admin panel access for ${revokeTarget?.email}.`}
        confirmLabel="Remove admin"
        confirmText={revokeTarget?.email || ""}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={confirmRevoke}
        loading={saving}
      />
    </>
  );
}
