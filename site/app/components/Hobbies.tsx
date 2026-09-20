"use client";

import { useEffect, useState } from "react";
import HobbyIcon from "@/app/components/HobbyIcon";
import type { TreeNode } from "@/app/lib/tree";

/** How long each photo stays up before the slideshow advances. */
const SLIDE_MS = 5000;

/** Pick a hobby by its icon, then watch its photos go by. */
export default function Hobbies({ hobbies }: { hobbies: TreeNode[] }) {
  const [active, setActive] = useState(0);
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const hobby = hobbies[active];
  const images = hobby?.images ?? [];
  const count = images.length;

  /* Auto-advance, unless the pointer is resting on the slideshow, the
     keyboard focus is inside it, or the visitor asked for less motion. */
  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(
      () => setSlide((current) => (current + 1) % count),
      SLIDE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [paused, count, slide]);

  if (!hobby) return null;

  const step = (delta: number) => setSlide((current) => (current + delta + count) % count);

  return (
    <div>
      {/* Icons — one per hobby. */}
      <div className="flex flex-wrap gap-2.5">
        {hobbies.map((entry, index) => {
          const selected = index === active;
          return (
            <button
              key={entry.id}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                /* A new hobby starts at its first photo. */
                setActive(index);
                setSlide(0);
              }}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-colors ${
                selected
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-rule bg-card text-ink-soft hover:border-accent/40 hover:text-ink"
              }`}
            >
              <HobbyIcon name={entry.icon} className="size-5 shrink-0" />
              <span className="font-display text-base">{entry.label}</span>
            </button>
          );
        })}
      </div>

      {/* Slideshow for whichever hobby is selected. */}
      <div
        aria-roledescription="carousel"
        aria-label={`${hobby.label} photos`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        className="mt-6 overflow-hidden rounded-xl border border-rule bg-card"
      >
        <div className="relative aspect-[4/3] bg-paper-sunk sm:aspect-[16/9]">
          {count === 0 ? (
            <div className="flex size-full flex-col items-center justify-center gap-3 text-ink-faint">
              <HobbyIcon name={hobby.icon} className="size-12" />
              <p className="font-mono text-xs">photos coming soon</p>
            </div>
          ) : (
            images.map((image, index) => (
              /* eslint-disable-next-line @next/next/no-img-element -- static export, no image loader */
              <img
                key={image.src}
                src={image.src}
                alt={image.alt ?? `${hobby.label} — photo ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                aria-hidden={index !== slide}
                className={`absolute inset-0 size-full object-cover transition-opacity duration-500 ${
                  index === slide ? "opacity-100" : "opacity-0"
                }`}
              />
            ))
          )}

          {count > 1 && (
            <>
              <SlideButton side="left" label="Previous photo" onClick={() => step(-1)} />
              <SlideButton side="right" label="Next photo" onClick={() => step(1)} />
            </>
          )}
        </div>

        <footer className="flex items-center justify-between gap-4 border-t border-rule px-4 py-3">
          <p className="font-mono text-xs text-ink-faint">
            {hobby.label}
            {count > 0 && ` · ${slide + 1}/${count}`}
          </p>

          {count > 1 && (
            <div className="flex gap-1.5">
              {images.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  aria-label={`Photo ${index + 1}`}
                  aria-current={index === slide}
                  onClick={() => setSlide(index)}
                  className={`size-2 rounded-full transition-colors ${
                    index === slide ? "bg-accent" : "bg-rule hover:bg-ink-faint"
                  }`}
                />
              ))}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

function SlideButton({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`absolute top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/85 text-ink shadow-[0_1px_8px_rgba(36,31,26,0.18)] transition-opacity hover:opacity-100 sm:opacity-70 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <span aria-hidden className="font-mono text-sm leading-none">
        {side === "left" ? "‹" : "›"}
      </span>
    </button>
  );
}
