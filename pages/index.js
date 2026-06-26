import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

import { api, getStoredSession } from "../lib/api";

const howItWorks = [
  {
    title: "Discover opportunities",
    description: "Browse clubs, projects, and workshops happening in Nukus and across Karakalpakstan.",
  },
  {
    title: "Create your account",
    description: "Register once so you can log in, track what you joined, and come back later.",
  },
  {
    title: "Join and participate",
    description: "Choose the opportunity that fits you and register directly through the platform.",
  },
];

export default function HomePage() {
  const [opportunities, setOpportunities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    const session = getStoredSession();
    setIsLoggedIn(Boolean(session.token));
  }, []);

  useEffect(() => {
    let active = true;

    api
      .checkHealth()
      .then(() => {
        if (active) {
          setApiStatus(true);
        }
      })
      .catch(() => {
        if (active) {
          setApiStatus(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    api
      .getOpportunities()
      .then((data) => {
        if (active) {
          setOpportunities(data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (active) {
          setOpportunities([]);
          setError(requestError.message || "Failed to load opportunities");
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
  }, []);

  const counts = opportunities.reduce(
    (accumulator, item) => {
      if (item.type === "club") accumulator.club += 1;
      if (item.type === "project") accumulator.project += 1;
      if (item.type === "workshop") accumulator.workshop += 1;
      return accumulator;
    },
    { club: 0, project: 0, workshop: 0 },
  );

  const featuredOpportunities = opportunities.slice(0, 3);
  const categoryLinks = [
    {
      href: "/clubs",
      label: "Clubs",
      title: "Find communities around your interests",
      description: "Student clubs, local groups, and recurring activities you can join.",
      count: loading ? "Loading..." : `${counts.club} available now`,
    },
    {
      href: "/projects",
      label: "Projects",
      title: "See what young people are building",
      description: "Collaborative initiatives and student-led ideas looking for members.",
      count: loading ? "Loading..." : `${counts.project} available now`,
    },
    {
      href: "/workshops",
      label: "Workshops",
      title: "Learn practical skills together",
      description: "Hands-on sessions that build skills, confidence, and experience.",
      count: loading ? "Loading..." : `${counts.workshop} available now`,
    },
  ];

  return (
    <>
      <Head>
        <title>Events Community</title>
      </Head>

      <main className="page-shell page-stack">
        <section className="hero hero-centered">
          <div className="hero-intro">
            <span className="eyebrow">For students and young builders</span>
            <span
              className="api-status"
              aria-label={`API status: ${apiStatus === null ? "checking" : apiStatus ? "online" : "offline"}`}
            >
              <span
                className={`api-status-dot ${
                  apiStatus === null ? "is-pending" : apiStatus ? "is-up" : "is-down"
                }`}
                aria-hidden="true"
              />
              API status
            </span>
            <div className="hero-copy hero-copy-centered">
              <h1>Discover clubs, projects, and workshops in Karakalpakstan.</h1>
              <p className="hero-subtitle">
                Events Community helps school students, gap year learners, and young people in
                Karakalpakstan find opportunities they can actually join, with a clear path from
                browsing to registration.
              </p>
            </div>
          </div>

          <div className="hero-actions">
            <Link href="/clubs" className="button button-primary">
              Explore opportunities
            </Link>
            <Link href={isLoggedIn ? "/projects" : "/register"} className="button button-secondary">
              {isLoggedIn ? "See projects" : "Sign up"}
            </Link>
          </div>

          <div className="hero-strip" aria-label="Platform highlights">
            <div className="hero-stat">
              <strong>{loading ? "..." : counts.club + counts.project + counts.workshop}</strong>
              <span>live opportunities</span>
            </div>
            <div className="hero-stat">
              <strong>Nukus</strong>
              <span>and wider Karakalpakstan</span>
            </div>
            <div className="hero-stat">
              <strong>Simple</strong>
              <span>browse, sign up, and join flow</span>
            </div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="section-label">Browse by category</span>
              <h2>Start with what you want to join</h2>
            </div>
            <p>
              The most important goal is clarity: find a category fast, understand what it is,
              and move into the join flow without confusion.
            </p>
          </div>

          <div className="category-list">
            {categoryLinks.map((category) => (
              <Link href={category.href} className="category-row" key={category.href}>
                <div className="category-row-main">
                  <span className="section-label">{category.label}</span>
                  <h3>{category.title}</h3>
                </div>
                <p>{category.description}</p>
                <strong>{category.count}</strong>
              </Link>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="section-label">How it works</span>
              <h2>A simple path from browsing to joining</h2>
            </div>
          </div>

          <div className="steps-grid">
            {howItWorks.map((step, index) => (
              <article key={step.title} className="step-card">
                <span className="section-label">Step {index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="section-label">Why this platform</span>
              <h2>Made to feel clear, trustworthy, and useful</h2>
            </div>
          </div>

          <div className="feature-grid">
            <article className="info-card">
              <h3>Local opportunities</h3>
              <p>Focus on clubs, projects, and workshops relevant to young people in Karakalpakstan.</p>
            </article>
            <article className="info-card">
              <h3>Easy registration</h3>
              <p>Create an account, log in, and register for opportunities with a stable, simple flow.</p>
            </article>
          </div>
        </section>

        {error ? <section className="status-banner error-state">{error}</section> : null}

        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="section-label">Featured opportunities</span>
              <h2>What people can join right now</h2>
            </div>
          </div>

          {loading ? (
            <section className="empty-state">Loading opportunities...</section>
          ) : featuredOpportunities.length > 0 ? (
            <section className="opportunity-grid">
              {featuredOpportunities.map((opportunity) => (
                <article key={opportunity.id} className="opportunity-card">
                  <div className="opportunity-top">
                    <span className={`opportunity-badge opportunity-type-${opportunity.type}`}>
                      {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                    </span>
                    <span className="meta-pill">{opportunity.region_name || "Karakalpakstan"}</span>
                  </div>

                  <div className="meta-block">
                    <h3 className="opportunity-title">{opportunity.title}</h3>
                    <p className="opportunity-description">{opportunity.description}</p>
                  </div>

                  <div className="opportunity-footer">
                    <div className="meta-block">
                      <span className="meta-title">Category</span>
                      <span className="meta-value">
                        {opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                      </span>
                    </div>
                    <div className="opportunity-footer-actions">
                      <Link href={`/${opportunity.type}s`} className="button button-secondary">
                        View {opportunity.type}s
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <section className="empty-state">
              No opportunities are available yet. Once the backend has entries, they will appear here.
            </section>
          )}
        </section>
      </main>
    </>
  );
}
