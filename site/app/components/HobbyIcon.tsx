/** Line icons for the hobby tabs, drawn in currentColor so they pick up the
 *  selected/unselected text colour of the button they sit in. */

const paths: Record<string, React.ReactNode> = {
  fishing: (
    <>
      <path d="M17.5 12c0 2.8-3.4 5-7.5 5s-7.5-2.2-7.5-5S5.9 7 10 7s7.5 2.2 7.5 5Z" />
      <path d="m17.5 12 4-3.5v7l-4-3.5Z" />
      <path d="M6.6 10.6h.01" />
    </>
  ),
  cooking: (
    <>
      <path d="M3.5 11h17v3.2a4.8 4.8 0 0 1-4.8 4.8H8.3a4.8 4.8 0 0 1-4.8-4.8V11Z" />
      <path d="M20.5 12.5H22M3.5 12.5H2" />
      <path d="M9 7.8c0-1.3 1-1.5 1-2.8M14 7.8c0-1.3 1-1.5 1-2.8" />
    </>
  ),
  skiing: (
    <>
      <path d="M6.2 5.4c.5-1.4 1.6-1.9 3-1.3L17.4 20" />
      <path d="M17.8 5.4c-.5-1.4-1.6-1.9-3-1.3L6.6 20" />
    </>
  ),
  hiking: (
    <>
      <path d="M1.8 19.4h20.4L14.4 5.6l-3.8 6.7-2.3-2.9-6.5 10Z" />
    </>
  ),
};

export default function HobbyIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  const shape = (name && paths[name]) ?? <circle cx="12" cy="12" r="7" />;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {shape}
    </svg>
  );
}
