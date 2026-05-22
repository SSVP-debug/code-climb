function HeatmapSection() {

  return (
    <div className="mt-10 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">

      <h2 className="text-2xl font-semibold mb-6">
        Activity Heatmap
      </h2>

      <div className="grid grid-cols-7 gap-3">

        {Array.from({ length: 35 }).map(
          (_, index) => (

            <div
              key={index}
              className="w-10 h-10 rounded-lg bg-zinc-800 hover:bg-green-500 transition"
            ></div>

          )
        )}

      </div>

    </div>
  );
}

export default HeatmapSection;