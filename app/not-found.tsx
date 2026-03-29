import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <p className="text-6xl font-bold text-muted-foreground/20 mb-4">404</p>
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Page not found
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          This page doesn&apos;t exist or you may not have access to it.
        </p>
        <Link
          href="/"
          className="inline-flex text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
