export default function ErrorBanner({
  message,
}) {
  if (!message) return null;

  return (
    <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-xl">
      {message}
    </div>
  );
}