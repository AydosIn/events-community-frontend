import Head from "next/head";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import AdminLayout from "../../components/admin/AdminLayout";
import useAdminGuard from "../../components/admin/useAdminGuard";
import { useToast } from "../../components/ToastProvider";
import { clearSession, api } from "../../lib/api";
import { formatDateTime, getNextOffset, isAdminAuthError } from "../../lib/admin";

const PAGE_LIMIT = 25;

export default function AdminRegistrationsPage() {
  const router = useRouter();
  const { ready, token } = useAdminGuard();
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [opportunityId, setOpportunityId] = useState("");
  const [offset, setOffset] = useState(0);
  const [registrations, setRegistrations] = useState([]);
  const [total, setTotal] = useState(0);
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

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
  }, [appliedSearch, offset, opportunityId, ready, router, toast, token]);

  function handleSubmit(event) {
    event.preventDefault();
    setOffset(0);
    setAppliedSearch(searchInput.trim());
  }

  function handleClear() {
    setSearchInput("");
    setAppliedSearch("");
    setOpportunityId("");
    setOffset(0);
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
        description="Search registration activity by person or opportunity and review the most recent signups first."
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
            <button type="submit" className="button button-primary">
              Search
            </button>
            <button type="button" className="button button-secondary" onClick={handleClear}>
              Clear
            </button>
          </form>
          <div className="filter-status-row">
            <p className="section-copy">
              {loading ? "Loading registrations..." : `Showing ${registrations.length} of ${total} registrations.`}
            </p>
          </div>
        </section>

        {error ? <section className="status-banner error-state">{error}</section> : null}

        <section className="admin-table-card">
          {loading ? (
            <div className="empty-state">Loading registration activity...</div>
          ) : registrations.length > 0 ? (
            <>
              <div className="admin-table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Opportunity</th>
                      <th>Type</th>
                      <th>Region</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.user_name}</strong>
                          <span>{item.user_email}</span>
                        </td>
                        <td>{item.opportunity_title}</td>
                        <td className="admin-table-transform">{item.opportunity_type}</td>
                        <td>{item.region_name}</td>
                        <td>{formatDateTime(item.created_at)}</td>
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
