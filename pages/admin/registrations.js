import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../components/admin/AdminLayout";
import useAdminGuard from "../../components/admin/useAdminGuard";
import { useToast } from "../../components/ToastProvider";
import { clearSession, api } from "../../lib/api";
import { formatDateTime, getNextOffset, isAdminAuthError, ADMIN_LOGIN_PATH } from "../../lib/admin";

const PAGE_LIMIT = 25;
const DEFAULT_TYPE = "all";

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const { ready, token } = useAdminGuard();
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [typeFilter, setTypeFilter] = useState(DEFAULT_TYPE);
  const [offset, setOffset] = useState(0);
  const [registrations, setRegistrations] = useState([]);
  const [total, setTotal] = useState(0);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const toast = useToast();

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const nextType = typeof router.query.type === "string" ? router.query.type : "";
    setTypeFilter(["club", "project", "workshop"].includes(nextType) ? nextType : DEFAULT_TYPE);
  }, [router.isReady, router.query.type]);

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    api
      .getAdminOpportunities(token, { limit: 100, offset: 0 })
      .then((data) => {
        setOpportunities(data.items || []);
      })
      .catch(() => {
        setOpportunities([]);
      });
  }, [ready, token]);

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    api
      .getAdminRegistrations(token, {
        q: appliedSearch,
        opportunity_id: opportunityId || undefined,
        type: typeFilter !== DEFAULT_TYPE ? typeFilter : undefined,
        limit: PAGE_LIMIT,
        offset,
      })
      .then((data) => {
        if (!active) {
          return;
        }

        setRegistrations(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((requestError) => {
        if (!active) {
          return;
        }

        const message = requestError.message || "Failed to load registrations";
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
  }, [appliedSearch, offset, opportunityId, ready, reloadKey, router, toast, token, typeFilter]);

  function handleExport() {
    setExporting(true);

    api
      .exportAdminRegistrations(token, {
        q: appliedSearch,
        opportunity_id: opportunityId || undefined,
        type: typeFilter !== DEFAULT_TYPE ? typeFilter : undefined,
      })
      .then(() => {
        toast.success("Registrations exported.");
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to export registrations";
        if (isAdminAuthError(message)) {
          clearSession();
          router.replace(ADMIN_LOGIN_PATH);
          return;
        }

        toast.error(message);
      })
      .finally(() => {
        setExporting(false);
      });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setOffset(0);
    setAppliedSearch(searchInput.trim());
  }

  function handleClear() {
    setSearchInput("");
    setAppliedSearch("");
    setOpportunityId("");
    setTypeFilter(DEFAULT_TYPE);
    setOffset(0);
  }

  function handleDelete(registration) {
    const confirmed = window.confirm(
      `Remove ${registration.user_name} from "${registration.opportunity_title}"?`,
    );
    if (!confirmed) {
      return;
    }

    setDeletingId(registration.id);

    api
      .deleteAdminRegistration(token, registration.id)
      .then(() => {
        toast.success("Registration removed.");
        setRegistrations((current) => current.filter((item) => item.id !== registration.id));
        setTotal((current) => Math.max(0, current - 1));
      })
      .catch((requestError) => {
        const message = requestError.message || "Failed to delete registration";
        if (isAdminAuthError(message)) {
          clearSession();
          router.replace(ADMIN_LOGIN_PATH);
          return;
        }

        toast.error(message);
      })
      .finally(() => {
        setDeletingId(null);
      });
  }

  const hasNextPage = offset + PAGE_LIMIT < total;

  if (!ready) {
    return <main className="page-shell"><section className="empty-state">Checking admin access...</section></main>;
  }

  return (
    <>
      <Head>
        <title>Admin Registrations | Events Community</title>
      </Head>

      <AdminLayout
        title="Registrations"
        description="Search registration activity by person or opportunity, then open each member record for updates."
      >
        <section className="filter-card">
          <form className="admin-filter-grid" onSubmit={handleSubmit}>
            <input
              className="field"
              type="text"
              placeholder="Search by user name, email, or opportunity title"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <select
              className="field"
              value={opportunityId}
              onChange={(event) => {
                setOpportunityId(event.target.value);
                setOffset(0);
              }}
            >
              <option value="">All opportunities</option>
              {opportunities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <select
              className="field"
              value={typeFilter}
              onChange={(event) => {
                setTypeFilter(event.target.value);
                setOffset(0);
              }}
            >
              <option value="all">All types</option>
              <option value="club">Clubs</option>
              <option value="project">Projects</option>
              <option value="workshop">Workshops</option>
            </select>
            <button type="submit" className="button button-primary">
              Search
            </button>
            <button type="button" className="button button-secondary" onClick={handleExport} disabled={exporting}>
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
            <button type="button" className="button button-secondary" onClick={handleClear}>
              Clear
            </button>
          </form>

          {error ? (
            <section className="status-banner error-state">
              <p>{error}</p>
              <button type="button" className="button button-secondary" onClick={() => setReloadKey((value) => value + 1)}>
                Try again
              </button>
            </section>
          ) : null}
          <div className="filter-status-row">
            <p className="section-copy">
              {loading ? "Loading registrations..." : `Showing ${registrations.length} of ${total} registrations.`}
            </p>
          </div>
        </section>

        <section className="admin-table-card">
          {loading ? (
            <div className="empty-state">Loading registration activity...</div>
          ) : registrations.length > 0 ? (
            <>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Opportunity</th>
                      <th>Type</th>
                      <th>Region</th>
                      <th>Profile</th>
                      <th>Registered</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.user_name}</strong>
                          <span>{item.user_email}</span>
                        </td>
                        <td>
                          <strong>{item.opportunity_title}</strong>
                          <span>ID #{item.opportunity_id}</span>
                        </td>
                        <td className="admin-table-transform">{item.opportunity_type}</td>
                        <td>{item.region_name}</td>
                        <td>
                          <strong>{[item.first_name, item.last_name].filter(Boolean).join(" ") || "Unknown"}</strong>
                          <span>{item.phone_number || item.telegram_username || "No contact info"}</span>
                        </td>
                        <td>{formatDateTime(item.created_at)}</td>
                        <td>
                          <div className="admin-action-group">
                            <Link href={`/admin/registrations/${item.id}`} className="button button-secondary">
                              View
                            </Link>
                            <Link
                              href={`/admin/registrations/${item.id}?mode=edit`}
                              className="button button-secondary"
                            >
                              Edit
                            </Link>
                            <button
                              type="button"
                              className="button button-ghost admin-danger-button"
                              onClick={() => handleDelete(item)}
                              disabled={deletingId === item.id}
                            >
                              {deletingId === item.id ? "Deleting..." : "Delete"}
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
            <div className="empty-state">No registrations matched the current filters.</div>
          )}
        </section>
      </AdminLayout>
    </>
  );
}
