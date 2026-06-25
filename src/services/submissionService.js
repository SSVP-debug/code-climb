import { apiFetch } from "./api";

export async function getSubmissions(problemSlug = null) {
  
  let url = "/api/submissions";

  if (problemSlug) {
    url += `?problemSlug=${encodeURIComponent(problemSlug)}`;
  }

  return apiFetch(url);
}

export async function createSubmission(data) {
  

  return apiFetch("/api/submissions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}