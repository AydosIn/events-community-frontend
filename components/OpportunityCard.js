import { memo } from "react";

function formatType(type) {
  if (!type) {
    return "Opportunity";
  }

  return type.charAt(0).toUpperCase() + type.slice(1);
}

function getRegion(opportunity) {
  return opportunity.region_name || "Karakalpakstan";
}

function OpportunityCard({
  opportunity,
  isLoggedIn,
  isRegistered,
  onOpenRegister,
  isSubmitting,
}) {
  return (
    <article className="opportunity-card">
      <div className="opportunity-top">
        <span className={`opportunity-badge opportunity-type-${opportunity.type}`}>
          {formatType(opportunity.type)}
        </span>
        <span className="meta-pill">{getRegion(opportunity)}</span>
      </div>

      <div className="meta-block">
        <h3 className="opportunity-title">{opportunity.title}</h3>
        <p className="opportunity-description">{opportunity.description || "No description provided yet."}</p>
      </div>

      <div className="opportunity-meta">
        <span className="meta-pill">Type: {formatType(opportunity.type)}</span>
        <span className="meta-pill">Region: {getRegion(opportunity)}</span>
      </div>

      <div className="opportunity-footer">
        <div className="meta-block">
          <span className="meta-title">Ready to join?</span>
          <span className="meta-value">
            {isRegistered
              ? "You are already registered."
              : isLoggedIn
                ? "Reserve your spot in a few seconds."
                : "Log in to register for this opportunity."}
          </span>
        </div>

        <div className="opportunity-footer-actions">
          {isRegistered ? (
            <span className="registered-badge">Registered</span>
          ) : isLoggedIn ? (
            <button
              type="button"
              className="button button-primary"
              onClick={() => onOpenRegister(opportunity)}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              aria-label={`Join ${opportunity.title}`}
            >
              {isSubmitting ? "Joining..." : "Join now"}
            </button>
          ) : (
            <span className="login-hint">Login required</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default memo(OpportunityCard);
