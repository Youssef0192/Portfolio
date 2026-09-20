"use client";

export default function CvActions() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-full border border-rule bg-paper px-4 py-1.5 font-mono text-xs text-ink-soft transition-colors hover:text-ink"
    >
      print / save pdf
    </button>
  );
}
