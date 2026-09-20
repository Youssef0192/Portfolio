"use client";

import { useEffect, useState } from "react";
import { initials } from "@/app/lib/tree";

/**
 * Shows /public/profile.jpg once it exists. Until then it shows initials.
 *
 * The photo is probed before it is rendered rather than rendered with an
 * onError fallback: a missing file fails to load before React hydrates, so
 * the error handler never runs and the broken image's alt text shows instead.
 */
export default function Avatar({ src, name }: { src?: string; name: string }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;
    const probe = new window.Image();
    probe.onload = () => setLoaded(true);
    probe.src = src;
    return () => {
      probe.onload = null;
    };
  }, [src]);

  return (
    <div className="size-28 shrink-0 overflow-hidden rounded-full bg-accent-soft ring-4 ring-card ring-offset-2 ring-offset-rule sm:size-32">
      {loaded && src ? (
        // eslint-disable-next-line @next/next/no-img-element -- static export, no image loader
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <div
          role="img"
          aria-label={name}
          className="flex size-full items-center justify-center font-display text-3xl text-accent"
        >
          {initials(name)}
        </div>
      )}
    </div>
  );
}
