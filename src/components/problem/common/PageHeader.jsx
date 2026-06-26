function PageHeader({ title, description, meta }) {
  return (
    <div className="flex items-end justify-between mb-6">

      <div>
        <h1 className="text-4xl font-bold">{title}</h1>
        {description && (
          <p className="text-zinc-400 mt-1">{description}</p>
        )}
      </div>

      {meta && (
        <div className="text-right">
          <p className="text-lg font-semibold">{meta.primary}</p>
          <p className="text-sm text-zinc-500">{meta.secondary}</p>
        </div>
      )}

    </div>
  );
}

export default PageHeader;
