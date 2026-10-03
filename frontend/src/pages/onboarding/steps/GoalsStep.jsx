export default function GoalsStep({ form, update }) {
  return (
    <div className="sf-onboarding__fields">
      <label className="sf-auth-form__field">
        <span>Career goal</span>
        <input
          type="text"
          value={form.careerGoal}
          onChange={(e) => update("careerGoal", e.target.value)}
          placeholder="e.g. Backend Engineer"
        />
      </label>

      <label className="sf-auth-form__field">
        <span>Hours you can commit per week</span>
        <input
          type="number"
          min="1"
          max="168"
          value={form.weeklyHoursAvailable}
          onChange={(e) => update("weeklyHoursAvailable", e.target.value)}
          placeholder="e.g. 10"
        />
      </label>

      <label className="sf-auth-form__field">
        <span>What do you want to learn or achieve?</span>
        <textarea
          rows={4}
          value={form.learningGoals}
          onChange={(e) => update("learningGoals", e.target.value)}
          placeholder="e.g. Get comfortable building backend APIs and land a summer internship."
        />
      </label>
    </div>
  );
}
