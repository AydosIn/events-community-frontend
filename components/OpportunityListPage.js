import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import Breadcrumbs from "./Breadcrumbs";
import OpportunityCard from "./OpportunityCard";
import { useToast } from "./ToastProvider";
import { api, clearSession, getStoredSession } from "../lib/api";
import { buildLoginUrl, getOpportunityListPath } from "../lib/navigation";
import { getFirstError, validateRegistrationForm } from "../lib/validation";

function isAuthError(message) {
  return (
    message === "Not authenticated" ||
    message === "Invalid token" ||
    message === "User not found"
  );
}

const initialRegistrationForm = {
  first_name: "",
  last_name: "",
  age: "",
  phone_number: "",
  telegram_username: "",
};

function formatType(type) {
  if (!type) {
    return "Opportunity";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
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
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [registeringId, setRegisteringId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [registrationForm, setRegistrationForm] = useState(initialRegistrationForm);
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
    setLoadFailed(false);
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
          setLoadFailed(true);
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
  }, [appliedRegion, reloadKey, toast, type]);

  useEffect(() => {
    if (!router.isReady || !token || !router.query.join || opportunities.length === 0) {
      return;
    }

    const joinId = Number(router.query.join);
    if (!Number.isInteger(joinId)) {
      return;
    }

    const opportunity = opportunities.find((item) => item.id === joinId);
    if (!opportunity || registeredIds.includes(joinId)) {
      return;
    }

    setSelectedOpportunity(opportunity);
    setRegistrationForm(initialRegistrationForm);
    setError("");
    setSuccessMessage("");
  }, [opportunities, registeredIds, router.isReady, router.query.join, token]);

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

  function handleOpenRegister(opportunity) {
    if (!token) {
      clearSession();
      router.push(
        buildLoginUrl({
          nextPath: getOpportunityListPath(type),
          joinId: opportunity.id,
        }),
      );
      return;
    }

    setSelectedOpportunity(opportunity);
    setRegistrationForm(initialRegistrationForm);
    setError("");
    setSuccessMessage("");
  }

  function handleCloseRegister() {
    setSelectedOpportunity(null);
    setRegistrationForm(initialRegistrationForm);
  }

  function handleRegistrationChange(event) {
    const { name, value } = event.target;
    setRegistrationForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleRegisterSubmit(event) {
    event.preventDefault();

    if (!token) {
      clearSession();
      router.push(
        buildLoginUrl({
          nextPath: getOpportunityListPath(type),
          joinId: selectedOpportunity?.id,
        }),
      );
      return;
    }

    if (!selectedOpportunity) {
      return;
    }

    const validation = validateRegistrationForm(registrationForm);
    if (!validation.valid) {
      const message = getFirstError(validation.errors);
      setError(message);
      toast.error(message);
      return;
    }

    setError("");
    setSuccessMessage("");
    setRegisteringId(selectedOpportunity.id);

    api
      .registerForOpportunity(
        {
          opportunity_id: selectedOpportunity.id,
          ...validation.values,
        },
        token,
      )
      .then(() => {
        setRegisteredIds((current) =>
          current.includes(selectedOpportunity.id)
            ? current
            : [...current, selectedOpportunity.id],
        );
        const message = `Saved. You are registered for ${selectedOpportunity.title}.`;
        setSuccessMessage(message);
        toast.success(message);
        handleCloseRegister();
      })
      .catch((requestError) => {
        if (isAuthError(requestError.message)) {
          clearSession();
          toast.error("Your session expired. Please log in again.");
          router.push(
            buildLoginUrl({
              nextPath: getOpportunityListPath(type),
              joinId: selectedOpportunity?.id,
            }),
          );
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

        <section className="filter-panel">
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
        {loadFailed ? (
          <section className="status-banner">
            <button type="button" className="button button-secondary" onClick={() => setReloadKey((value) => value + 1)}>
              Try again
            </button>
          </section>
        ) : null}

        <section id="opportunity-results" className="section-block">
          <div className="section-heading">
            <div>
              <span className="section-label">Available now</span>
              <h2>Choose where you want to get involved</h2>
            </div>
            <p>
              Live backend data appears directly on the page so people can browse and join without jumping through extra steps.
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
                  onOpenRegister={handleOpenRegister}
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

        {selectedOpportunity ? (
          <section className="join-modal-backdrop" role="presentation" onClick={handleCloseRegister}>
            <div
              className="join-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="join-modal-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="join-modal-header">
                <div className="meta-block">
                  <span className={`opportunity-badge opportunity-type-${selectedOpportunity.type}`}>
                    {formatType(selectedOpportunity.type)}
                  </span>
                  <h2 id="join-modal-title">Join {selectedOpportunity.title}</h2>
                  <p>Fill in your details to reserve your spot.</p>
                </div>
                <button
                  type="button"
                  className="join-modal-close"
                  onClick={handleCloseRegister}
                  aria-label="Close join form"
                >
                  ×
                </button>
              </div>

              <form className="join-form" onSubmit={handleRegisterSubmit}>
                <div className="join-form-grid">
                  <label>
                    First name
                    <input
                      name="first_name"
                      value={registrationForm.first_name}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </label>

                  <label>
                    Last name
                    <input
                      name="last_name"
                      value={registrationForm.last_name}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </label>

                  <label>
                    Phone number
                    <input
                      name="phone_number"
                      value={registrationForm.phone_number}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </label>

                  <label>
                    Age
                    <input
                      name="age"
                      type="number"
                      min="1"
                      value={registrationForm.age}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </label>

                  <label className="join-form-full">
                    Telegram username
                    <input
                      name="telegram_username"
                      placeholder="@username"
                      value={registrationForm.telegram_username}
                      onChange={handleRegistrationChange}
                      required
                    />
                  </label>
                </div>

                <div className="join-form-actions">
                  <button type="button" className="button button-secondary" onClick={handleCloseRegister}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="button button-primary"
                    disabled={registeringId === selectedOpportunity.id}
                  >
                    {registeringId === selectedOpportunity.id ? "Joining..." : "Confirm join"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
