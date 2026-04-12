import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Breadcrumbs from "./Breadcrumbs";
import OpportunityCard from "./OpportunityCard";
import { useToast } from "./ToastProvider";
import { api, clearSession, getStoredSession } from "../lib/api";

function isAuthError(message) {
  return (
    message === "Not authenticated" ||
    message === "Invalid token" ||
    message === "User not found"
  );
}

export default function OpportunityListPage({ type, title, description }) {
  const router = useRouter();
  const [regionInput, setRegionInput] = useState("");
  const [appliedRegion, setAppliedRegion] = useState("");
  const [opportunities, setOpportunities] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const toast = useToast();

  useEffect(() => {
    function syncClientState() {
      const session = getStoredSession();
      setIsLoggedIn(Boolean(session.token));
      setToken(session.token || "");
    }

    syncClientState();
    window.addEventListener("storage", syncClientState);
    window.addEventListener("authChange", syncClientState);

    return () => {
      window.removeEventListener("storage", syncClientState);
      window.removeEventListener("authChange", syncClientState);
    };
  }, []);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    api
      .getOpportunities(appliedRegion, type)
      .then((data) => {
        if (active) {
          setOpportunities(data);
        }
      })
      .catch((requestError) => {
        if (active) {
          const message = requestError.message || "Failed to load opportunities";
          setError(message);
          setOpportunities([]);
          toast.error(message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [appliedRegion, toast, type]);

  useEffect(() => {
    let active = true;

    if (!token) {
      setRegisteredIds([]);
      return () => {
        active = false;
      };
    }

    api
      .getMyRegistrations(token)
      .then((data) => {
        if (active) {
          setRegisteredIds(data.registered_ids || []);
        }
      })
      .catch((requestError) => {
        if (active) {
          if (isAuthError(requestError.message)) {
            clearSession();
            router.push("/login");
          }

          setRegisteredIds([]);
        }
      });

    return () => {
      active = false;
    };
  }, [router, token]);

  function handleRegister(opportunityId) {
    if (!token) {
      clearSession();
      router.push("/login");
      return;
    }

    setError("");
    setSuccessMessage("");
    setRegisteringId(opportunityId);

    api
      .registerForOpportunity(opportunityId, token)
      .then(() => {
        setRegisteredIds((current) =>
          current.includes(opportunityId) ? current : [...current, opportunityId],
        );
        const message = "Saved. You are registered for this opportunity.";
        setSuccessMessage(message);
        toast.success(message);
      })
      .catch((requestError) => {
        if (isAuthError(requestError.message)) {
          clearSession();
          toast.error("Your session expired. Please log in again.");
          router.push("/login");
          return;
        }

        const message = requestError.message || "Registration failed";
        setError(message);
        toast.error(message);
      })
      .finally(() => {
        setRegisteringId(null);
      });
  }

  function handleSearch(event) {
    event.preventDefault();
    const nextRegion = regionInput.trim();
    setAppliedRegion(nextRegion);
    toast.info(nextRegion ? `Showing ${title.toLowerCase()} for ${nextRegion}.` : `Showing all ${title.toLowerCase()}.`);
  }

  function handleClearFilter() {
    setRegionInput("");
    setAppliedRegion("");
    toast.info("Filter cleared.");
  }

  const resultLabel = loading
    ? "Loading results..."
    : `${opportunities.length} ${opportunities.length === 1 ? "result" : "results"}`;

  return (
    <>
      <Head>
        <title>{title} | Events Community</title>
      </Head>

      <main className="page-shell listing-layout">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: title }]} />

        <section className="hero">
          <span className="eyebrow">{title}</span>
          <div className="hero-copy">
            <h1>{title} in Karakalpakstan</h1>
            <p className="hero-subtitle">{description}</p>
          </div>
          <div className="hero-actions">
            <a href="#opportunity-results" className="button button-primary">
              Browse {title.toLowerCase()}
            </a>
            {!isLoggedIn ? (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => router.push("/register")}
              >
                Create account
              </button>
            ) : null}
          </div>
        </section>

        <section className="filter-card">
          <div className="filter-bar">
            <div>
              <span className="section-label">Find by region</span>
              <p className="section-copy">
                Search opportunities by region name or leave it empty to see everything available.
              </p>
            </div>
            <span className="result-count">{resultLabel}</span>
          </div>

          <form className="filter-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Try Nukus, Khodjeyli, Beruniy..."
              value={regionInput}
              onChange={(event) => setRegionInput(event.target.value)}
            />
            <button type="submit" className="button button-primary">
              Search
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={handleClearFilter}
              disabled={!appliedRegion && !regionInput}
            >
              Clear
            </button>
          </form>

          <div className="filter-status-row">
            <p className="section-copy">
              {appliedRegion
                ? `Showing ${title.toLowerCase()} for ${appliedRegion}.`
                : `Showing all available ${title.toLowerCase()} from the current backend data.`}
            </p>
            {!isLoggedIn ? (
              <span className="login-hint">Sign in to join any opportunity</span>
            ) : (
              <span className="login-hint">Your registered items are marked automatically</span>
            )}
          </div>
        </section>

        {successMessage ? <section className="status-banner success-state">{successMessage}</section> : null}
        {error ? <section className="status-banner error-state">{error}</section> : null}

        <section id="opportunity-results" className="section-block">
          <div className="section-heading">
            <div>
              <span className="section-label">Available now</span>
              <h2>Choose where you want to get involved</h2>
            </div>
            <p>
              Each card uses live API data and keeps the join flow simple for this MVP demo.
            </p>
          </div>

          {loading ? (
            <section className="empty-state">Loading opportunities from the backend...</section>
          ) : opportunities.length > 0 ? (
            <section className="opportunity-grid">
              {opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  isLoggedIn={isLoggedIn}
                  isRegistered={registeredIds.includes(opportunity.id)}
                  onRegister={handleRegister}
                  isSubmitting={registeringId === opportunity.id}
                />
              ))}
            </section>
          ) : (
            <section className="empty-state">
              {appliedRegion
                ? `No ${title.toLowerCase()} were found for "${appliedRegion}" yet. Try another region or clear the filter.`
                : `No ${title.toLowerCase()} are available right now. Please check back later.`}
            </section>
          )}
        </section>
      </main>
    </>
  );
}
