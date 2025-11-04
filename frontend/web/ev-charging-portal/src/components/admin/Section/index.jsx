export default function Section({ title, actions, children }) {
  return (
    <section className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}
