import { useState } from "react";

export default function InterestsStep({ catalog, catalogLoading, catalogError, selected, onToggle, maxInterests }) {
  const [customValue, setCustomValue] = useState("");

  function addCustom() {
    const trimmed = customValue.trim();
    if (!trimmed) return;
    onToggle(trimmed);
    setCustomValue("");
  }

  return (
    <div className="sf-onboarding__fields">
      <p className="sf-onboarding__hint">
        Pick up to {maxInterests} areas you&apos;re interested in ({selected.length}/{maxInterests}{" "}
        selected).
      </p>

      {catalogLoading && <p className="sf-onboarding__hint">Loading interests…</p>}
      {catalogError && !catalogLoading && (
        <p className="sf-onboarding__hint">
          Couldn&apos;t load the interest catalog — you can still add your own below.
        </p>
      )}

      {!catalogLoading && catalog.length > 0 && (
        <div className="sf-onboarding__chips">
          {catalog.map((interest) => {
            const isSelected = selected.includes(interest.name);
            return (
              <button
                type="button"
                key={interest.id}
                className={`sf-onboarding__chip ${isSelected ? "is-selected" : ""}`}
                onClick={() => onToggle(interest.name)}
              >
                {interest.name}
              </button>
            );
          })}
        </div>
      )}

      <label className="sf-auth-form__field">
        <span>Something else not listed?</span>
        <div className="sf-onboarding__custom-row">
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Add a custom interest"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <button type="button" className="sf-btn sf-btn--secondary sf-btn--md" onClick={addCustom}>
            Add
          </button>
        </div>
      </label>

      {selected.length > 0 && (
        <div className="sf-onboarding__selected">
          {selected.map((name) => (
            <button
              type="button"
              key={name}
              className="sf-badge sf-badge--blue sf-onboarding__selected-badge"
              onClick={() => onToggle(name)}
              title="Remove"
            >
              {name} ×
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
