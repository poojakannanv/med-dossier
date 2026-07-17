const ProgressBar = ({ value = 0 }) => {
  const clamped = Math.min(Math.max(value, 0), 100);
  const colour = clamped === 100 ? 'bg-green-500' : clamped >= 50 ? 'bg-brand-500' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full min-w-[80px] overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-all ${colour}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-medium text-slate-500">{clamped}%</span>
    </div>
  );
};

export default ProgressBar;
