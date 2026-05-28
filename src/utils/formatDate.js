export function formatDate(date) {
  return new Date(date).toLocaleDateString(
    "en-GB"
  );
}