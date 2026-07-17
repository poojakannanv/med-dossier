const Pagination = ({ page, pages, onChange }) => {
  if (pages <= 1) return null;
  return (
    <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Previous
      </button>
      <span className="text-sm text-slate-500">
        Page {page} of {pages}
      </span>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
