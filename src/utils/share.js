export async function share({ title, text, url }) {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch {
      // User cancelled.
    }
  }

  await navigator.clipboard.writeText(url);

  alert("Link copied to clipboard.");
}