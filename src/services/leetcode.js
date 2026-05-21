export async function fetchLeetCodeStats(username) {
  try {
    const response = await fetch(
      `https://alfa-leetcode-api.onrender.com/${username}/solved`
    );

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("LeetCode API Error:", error);
  }
}