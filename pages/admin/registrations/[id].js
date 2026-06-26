import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../../components/admin/AdminLayout";
import useAdminGuard from "../../../components/admin/useAdminGuard";
import { useToast } from "../../../components/ToastProvider";
import { clearSession, api } from "../../../lib/api";
import { formatDateTime, isAdminAuthError, normalizeTelegramUsername, ADMIN_LOGIN_PATH } from "../../../lib/admin";

const emptyForm = {
  first_name: "",
  last_name: "",
  age: "",
  phone_number: "",
  telegram_username: "",
};

export default function AdminRegistrationDetailPage() {
  const router = useRouter();
  const { id, mode } = router.query;
  const { ready, token } = useAdminGuard();
  const [registration, setRegistration] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    setEditing(mode === "edit");
  }, [mode, router.isReady]);

  useEffect(() => {
    if (!ready || !token || !router.isReady || !id) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    api
      .getAdminRegistration(token, id)
      .then((data) => {
        if (!active) {
          return;
        }

        setRegistration(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          age: data.age ?? "",
          phone_number: data.phone_number || "",
          telegram_username: data.telegram_username || "",
        });
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        const message = requestError.message || "Failed to load registration";
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
  }, [id, ready, router, router.isReady, toast, token]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleStartEdit() {
    setEditing(true);
    router.replace(`/admin/registrations/${id}?mode=edit`, undefined, { shallow: true });
  }

  function handleCancelEdit() {
    setEditing(false);
    setError("");
    if (registration) {
      setForm({
        first_name: registration.first_name || "",
        last_name: registration.last_name || "",
        age: registration.age ?? "",
        phone_number: registration.phone_number || "",
        telegram_username: registration.telegram_username || "",
      });
    }
    router.replace(`/admin/registrations/${id}`, undefined, { shallow: true });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    api
      .updateAdminRegistration(token, id, {
        first_name: form.first_name,
        last_name: form.last_name,
        age: Number(form.age),
        phone_number: form.phone_number,
        telegram_username: normalizeTelegramUsername(form.telegram_username),
      })
      .then((data) => {
        setRegistration(data);
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          age: data.age ?? "",
          phone_number: data.phone_number || "",
          telegram_username: data.telegram_username || "",
        });
        setEditing(false);
        toast.success("Registration updated.");
        router.replace(`/admin/registrations/${id}`, undefined, { shallow: true });
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to update registration";
        if (isAdminAuthError(message)) {
          clearSession();
          router.replace(ADMIN_LOGIN_PATH);
          return;
        }

        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setSaving(false);
      });
  }

  function handleDelete() {
    if (!registration) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${registration.user_name} from "${registration.opportunity_title}"?`,
    );
    if (!confirmed) {
      return;
    }

    setDeleting(true);

    api
      .deleteAdminRegistration(token, id)
      .then(() => {
        toast.success("Registration removed.");
        router.replace("/admin/registrations");
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to delete registration";
        if (isAdminAuthError(message)) {
          clearSession();
          router.replace(ADMIN_LOGIN_PATH);
          return;
        }

        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setDeleting(false);
      });
  }

  if (!ready) {
    return <main className="page-shell"><section className="empty-state">Checking admin access...</section></main>;
  }

  return (
    <>
      <Head>
        <title>Admin Registration Detail | Events Community</title>
      </Head>

      <AdminLayout
        title="Registration Detail"
        description="Review one registration record, confirm who joined what, and update the submitted profile details."
        actions={
          <>
            <Link href="/admin/registrations" className="button button-secondary">
              Back to registrations
            </Link>
            {!loading && registration && !editing ? (
              <button type="button" className="button button-primary" onClick={handleStartEdit}>
                Edit registration
              </button>
            ) : null}
          </>
        }
      >
        {error ? <section className="status-banner error-state">{error}</section> : null}

        {loading ? (
          <section className="empty-state">Loading registration details...</section>
        ) : registration ? (
          <section className="admin-grid">
            <article className="admin-form-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">Member context</span>
                  <h2>{registration.user_name}</h2>
                </div>
              </div>
              <div className="admin-meta-list">
                <span>Email: {registration.user_email}</span>
                <span>Opportunity: {registration.opportunity_title}</span>
                <span>Type: {registration.opportunity_type}</span>
                <span>Region: {registration.region_name}</span>
                <span>Registered: {formatDateTime(registration.created_at)}</span>
              </div>
            </article>

            <article className="filter-card admin-form-card">
              <div className="section-heading">
                <div>
                  <span className="section-label">{editing ? "Edit registration" : "Submitted profile"}</span>
                  <h2>{editing ? "Update registration details" : "Registration details"}</h2>
                </div>
              </div>

              <form className="admin-form" onSubmit={handleSubmit}>
                <label>
                  First name
                  <input
                    className="field"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    required
                  />
                </label>

                <label>
                  Last name
                  <input
                    className="field"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    required
                  />
                </label>

                <label>
                  Age
                  <input
                    className="field"
                    type="number"
                    name="age"
                    min="0"
                    value={form.age}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    required
                  />
                </label>

                <label>
                  Phone number
                  <input
                    className="field"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    required
                  />
                </label>

                <label>
                  Telegram username
                  <input
                    className="field"
                    name="telegram_username"
                    value={form.telegram_username}
                    onChange={handleChange}
                    disabled={!editing || saving}
                    required
                  />
                </label>

                <div className="inline-actions">
                  {editing ? (
                    <>
                      <button type="submit" className="button button-primary" disabled={saving}>
                        {saving ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" className="button button-secondary" onClick={handleStartEdit}>
                      Edit registration
                    </button>
                  )}
                  <button
                    type="button"
                    className="button button-ghost admin-danger-button"
                    onClick={handleDelete}
                    disabled={deleting || saving}
                  >
                    {deleting ? "Deleting..." : "Delete registration"}
                  </button>
                </div>
              </form>
            </article>
          </section>
        ) : (
          <section className="empty-state">Registration not found.</section>
        )}
      </AdminLayout>
    </>
  );
}
