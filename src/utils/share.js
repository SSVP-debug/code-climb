import toast from "react-hot-toast";

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

  toast.success("Link copied to clipboard.");
}