function Card({ title, value, description, actionLabel, onAction }) {
  return (
    <div className="panel p-6 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-ev-deep/70">{title}</p>
          <p className="text-2xl font-semibold text-ev-gunmetal">{value}</p>
        </div>
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="text-xs font-medium text-ev-teal hover:text-ev-deep"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      {description ? <p className="text-sm text-ev-deep/60">{description}</p> : null}
    </div>
  );
}

export default Card;
