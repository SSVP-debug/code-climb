function RecommendationSection({
  recommendation,
}) {

  return (
    <div className="mt-10 bg-[var(--surface)] p-6 rounded-2xl border border-[var(--border)]">

      <h2 className="text-2xl font-semibold mb-4">
        Recommended Next Focus
      </h2>

      <p className="text-[var(--foreground)] text-lg">
        {recommendation}
      </p>

    </div>
  );
}

export default RecommendationSection;