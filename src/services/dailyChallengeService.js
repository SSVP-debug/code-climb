import { apiFetch } from "./api";

export async function completeDailyChallenge(
  slug
) {
  return apiFetch(
    "/api/daily-challenge/complete",
    {
      method: "POST",
      body: JSON.stringify({
        slug,
      }),
    }
  );
}