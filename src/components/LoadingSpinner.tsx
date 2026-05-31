export default function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
        <div className="absolute inset-1 animate-spin-slow rounded-full border-2 border-dashed border-teal-300/60" />
      </div>
      <p className="mt-5 text-sm font-semibold text-brand-700">{label}</p>
    </div>
  );
}
