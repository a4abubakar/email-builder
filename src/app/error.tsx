"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const clearAndRetry = () => {
    // A corrupted saved document is the most likely cause of a render crash, so offer to drop it.
    try {
      localStorage.removeItem("email-builder:doc:v1");
    } catch {
      /* ignore */
    }
    reset();
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p role="alert" className="text-muted">
        The builder hit an unexpected error. Your saved template may be the cause; you can retry, or reset the saved
        template and start fresh.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <button type="button" className="btn" onClick={clearAndRetry}>
          Reset saved template
        </button>
      </div>
    </main>
  );
}
