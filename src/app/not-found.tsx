import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-muted">That page doesn&apos;t exist. The builder lives on the home page.</p>
      <Link href="/" className="btn btn-primary w-fit">
        Back to the builder
      </Link>
    </main>
  );
}
