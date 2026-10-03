export const ROADMAP_STATUS_LABELS = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

export const ITEM_TYPE_LABELS = {
  learning: "Learn",
  practice: "Practice",
  project: "Project",
  assessment: "Assessment",
};

export function formatStatus(status) {
  return ROADMAP_STATUS_LABELS[status] || status || "Unknown";
}

export function formatItemType(type) {
  return ITEM_TYPE_LABELS[type] || type || "Task";
}

export function statusTone(status) {
  if (status === "active") return "teal";
  if (status === "completed") return "blue";
  if (status === "draft") return "amber";
  if (status === "archived") return "neutral";
  return "neutral";
}

export function priorityTone(priority) {
  if (priority === "high") return "red";
  if (priority === "medium") return "amber";
  return "neutral";
}

export function itemTypeTone(type) {
  if (type === "learning") return "blue";
  if (type === "practice") return "teal";
  if (type === "project") return "amber";
  return "neutral";
}

export function countRoadmapItems(phases = []) {
  return phases.reduce((total, phase) => total + (phase.items?.length || 0), 0);
}

export function countCompletedItems(phases = []) {
  return phases.reduce(
    (total, phase) => total + (phase.items || []).filter((item) => item.status === "completed").length,
    0
  );
}

export function totalEstimatedHours(phases = []) {
  return phases.reduce(
    (total, phase) =>
      total + (phase.items || []).reduce((sum, item) => sum + Number(item.estimated_hours || 0), 0),
    0
  );
}
