import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../components/admin/AdminLayout";
import useAdminGuard from "../../components/admin/useAdminGuard";
import { useToast } from "../../components/ToastProvider";
import { clearSession, api } from "../../lib/api";
import { getNextOffset, isAdminAuthError, ADMIN_LOGIN_PATH } from "../../lib/admin";

const PAGE_LIMIT = 25;
const emptyForm = {
  title: "",
  description: "",
  type: "club",
  region_name: "",
};

export default function AdminOpportunitiesPage() {
  const router = useRouter();
  const { ready, token } = useAdminGuard();
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
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

  function loadOpportunities() {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");

    api
      .getAdminOpportunities(token, { q: appliedSearch, limit: PAGE_LIMIT, offset })
      .then((data) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to load opportunities";
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

    loadOpportunities();
  }, [appliedSearch, offset, ready, token]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleSearch(event) {
    event.preventDefault();
    setOffset(0);
    setAppliedSearch(searchInput.trim());
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      type: item.type,
      region_name: item.region_name,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(item) {
    const confirmed = window.confirm(`Delete "${item.title}"? This also removes its registrations.`);
    if (!confirmed) {
      return;
    }

    setSaving(true);

    api
      .deleteAdminOpportunity(token, item.id)
      .then(() => {
        toast.success("Opportunity deleted.");
        if (editingId === item.id) {
          resetForm();
        }
        loadOpportunities();
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to delete opportunity";
        if (handleAuthFailure(message)) {
          return;
        }

        toast.error(message);
      })
      .finally(() => {
        setSaving(false);
      });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const request = editingId
      ? api.updateAdminOpportunity(token, editingId, form)
      : api.createAdminOpportunity(token, form);

    request
      .then(() => {
        toast.success(editingId ? "Opportunity updated." : "Opportunity created.");
        resetForm();
        setOffset(0);
        setAppliedSearch("");
        setSearchInput("");
        loadOpportunities();
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to save opportunity";
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

  const hasNextPage = offset + PAGE_LIMIT < total;

  if (!ready) {
    return <main className="page-shell"><section className="empty-state">Checking admin access...</section></main>;
  }

  return (
    <>
      <Head>
        <title>Admin Opportunities | Events Community</title>
      </Head>

      <AdminLayout
        title="Opportunities"
        description="Create and maintain the clubs, projects, and workshops that appear on the public site."
      >
        <section className="admin-grid">
          <article className="filter-card admin-form-card">
            <div className="section-heading">
              <div>
                <span className="section-label">{editingId ? "Edit item" : "New item"}</span>
                <h2>{editingId ? "Update opportunity" : "Create opportunity"}</h2>
              </div>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                Title
                <input
                  className="field"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  className="field admin-textarea"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  required
                />
              </label>

              <label>
                Type
                <select
                  className="field"
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                >
                  <option value="club">Club</option>
                  <option value="project">Project</option>
                  <option value="workshop">Workshop</option>
                </select>
              </label>

              <label>
                Region
                <input
                  className="field"
                  value={form.region_name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, region_name: event.target.value }))
                  }
                  required
                />
              </label>

              <div className="inline-actions">
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? "Saving..." : editingId ? "Save changes" : "Create opportunity"}
                </button>
                {editingId ? (
                  <button type="button" className="button button-secondary" onClick={resetForm}>
                    Cancel edit
                  </button>
                ) : null}
              </div>

              {error ? <p className="form-error">{error}</p> : null}
            </form>
          </article>

          <article className="filter-card">
            <form className="admin-filter-grid admin-filter-grid-compact" onSubmit={handleSearch}>
              <input
                className="field"
                type="text"
                placeholder="Search title, type, region, or description"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              <button type="submit" className="button button-primary">
                Search
              </button>
            </form>

            <div className="admin-table-card admin-table-card-inline">
              {loading ? (
                <div className="empty-state">Loading opportunities...</div>
              ) : items.length > 0 ? (
                <>
                  <div className="admin-table-scroll">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Region</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.title}</strong>
                              <span>{item.description}</span>
                            </td>
                            <td className="admin-table-transform">{item.type}</td>
                            <td>{item.region_name}</td>
                            <td>
                              <div className="admin-action-group">
                                <button
                                  type="button"
                                  className="button button-secondary"
                                  onClick={() => handleEdit(item)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="button button-ghost admin-danger-button"
                                  onClick={() => handleDelete(item)}
                                  disabled={saving}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
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
                <div className="empty-state">No opportunities matched the current search.</div>
              )}
            </div>
          </article>
        </section>
      </AdminLayout>
    </>
  );
}
