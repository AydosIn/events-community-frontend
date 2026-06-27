import { useEffect, useState } from "react";

export default function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel,
  confirmText,
  onCancel,
  onConfirm,
  loading = false,
}) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (open) {
      setInputValue("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const canConfirm = inputValue === confirmText;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canConfirm || loading) {
      return;
    }

    onConfirm();
  }

  return (
    <section className="join-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="join-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="join-modal-header">
          <div className="meta-block">
            <span className="section-label">Confirm action</span>
            <h2 id="confirm-delete-title">{title}</h2>
            <p>{description}</p>
          </div>
          <button type="button" className="join-modal-close" onClick={onCancel} aria-label="Close">
            ×
          </button>
        </div>

        <form className="join-form" onSubmit={handleSubmit}>
          <label className="join-form-full">
            Type <strong>{confirmText}</strong> to confirm
            <input
              className="field"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              autoComplete="off"
              required
            />
          </label>

          <div className="join-form-actions">
            <button type="button" className="button button-secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="button button-ghost admin-danger-button"
              disabled={!canConfirm || loading}
            >
              {loading ? "Working..." : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
