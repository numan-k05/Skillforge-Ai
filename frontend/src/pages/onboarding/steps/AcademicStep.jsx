export default function AcademicStep({ form, update }) {
  return (
    <div className="sf-onboarding__fields">
      <label className="sf-auth-form__field">
        <span>University</span>
        <input
          type="text"
          value={form.university}
          onChange={(e) => update("university", e.target.value)}
          placeholder="e.g. FAST-NUCES"
          autoComplete="organization"
        />
      </label>

      <label className="sf-auth-form__field">
        <span>Degree</span>
        <input
          type="text"
          value={form.degree}
          onChange={(e) => update("degree", e.target.value)}
          placeholder="e.g. BS Computer Science"
        />
      </label>

      <label className="sf-auth-form__field">
        <span>Semester</span>
        <input
          type="number"
          min="1"
          max="20"
          value={form.semester}
          onChange={(e) => update("semester", e.target.value)}
        />
      </label>

      <label className="sf-auth-form__field">
        <span>Country</span>
        <input
          type="text"
          value={form.country}
          onChange={(e) => update("country", e.target.value)}
          placeholder="e.g. Pakistan"
          autoComplete="country-name"
        />
      </label>
    </div>
  );
}
