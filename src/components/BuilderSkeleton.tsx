/** Layout-matching placeholder: shown by loading.tsx and until the client-only editor has mounted. */
export function BuilderSkeleton() {
  return (
    <div className="flex h-dvh flex-col" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading the email builder…</span>
      <div className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton ml-auto h-8 w-24" />
        <div className="skeleton h-8 w-20" />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px]">
        <div className="hidden space-y-3 border-r border-border p-3 lg:block">
          <div className="skeleton h-9" />
          <div className="skeleton h-9" />
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
        </div>
        <div className="bg-stage p-3">
          <div className="skeleton mx-auto h-[70%] max-w-[640px]" />
        </div>
        <div className="hidden space-y-3 border-l border-border p-3 lg:block">
          <div className="skeleton h-8" />
          <div className="skeleton h-10" />
          <div className="skeleton h-10" />
          <div className="skeleton h-24" />
        </div>
      </div>
    </div>
  );
}
