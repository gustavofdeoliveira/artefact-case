import { taskStore } from "./store";

/**
 * Fills the store with fictitious tasks so infinite scroll is visible as soon
 * as the app opens. Disable it with SEED=false.
 */
const samples = [
  "Review pull request for the reports module",
  "Update project dependencies",
  "Write tests for the sign-up flow",
  "Prepare the sprint demo",
  "Fix header alignment on mobile",
  "Document the API endpoints",
  "Set up the CI pipeline",
  "Reply to the design team's feedback",
  "Plan the migration to the new server",
  "Groom the next sprint's backlog",
  "Investigate slowness on the search page",
  "Prototype the settings screen",
];

export function seed(count = 25) {
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    taskStore.create(
      {
        titulo: `${samples[i % samples.length]} #${i + 1}`,
        descricao: i % 3 === 0 ? undefined : "Sample task generated automatically.",
      },
      // Dates one minute apart for a predictable order.
      now - (count - i) * 60_000,
    );
  }
}
