"use client";

export default function CvActions() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-300 transition-colors hover:text-white"
    >
      print / save pdf
    </button>
  );
}
