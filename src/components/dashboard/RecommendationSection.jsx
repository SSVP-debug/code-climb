function RecommendationSection({
  recommendation,
}) {

  return (
    <div className="mt-10 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

      <h2 className="text-2xl font-semibold mb-4">
        Recommended Next Focus
      </h2>

      <p className="text-zinc-300 text-lg">
        {recommendation}
      </p>

    </div>
  );
}

export default RecommendationSection;