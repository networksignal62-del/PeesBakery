'use client'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="min-h-screen bg-[#fffbf5] flex flex-col items-center justify-center px-4 text-center">
    <h1 className="text-3xl font-bold text-[#0f1419]">This page could not load</h1>
    <p className="text-[#5c6466] mt-3">Please try again. If the problem continues, call +232 75 361494.</p>
    <button type="button" onClick={reset} className="mt-6 rounded-xl bg-[#014325] px-6 py-3 text-white font-semibold">Try again</button>
  </main>
}
