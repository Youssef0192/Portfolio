import type { Metadata } from "next";
import Link from "next/link";
import { categories, linkText, treeData, type TreeNode } from "@/app/lib/tree";
import CvActions from "./CvActions";

export const metadata: Metadata = {
  title: `${treeData.label} — CV`,
  description: `Curriculum vitae of ${treeData.label}.`,
};

/* An empty section would print as a stray heading. */
const sections = categories.filter((c) => (c.children ?? []).length > 0);
const contacts = treeData.contacts ?? [];

/* Every outbound link on the CV opens in its own tab so the CV stays put. */
function ExternalLink({
  href,
  label,
  title,
}: {
  href: string;
  label?: string;
  title?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title ? `${title}: ${linkText(href)}` : undefined}
      className="font-mono text-xs text-accent underline underline-offset-2 hover:opacity-70 print:text-ink-soft print:no-underline"
    >
      {label ?? linkText(href)} ↗
    </a>
  );
}

function Entry({ node }: { node: TreeNode }) {
  const details = node.children ?? [];

  return (
    <article className="break-inside-avoid">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="text-[15px] font-semibold text-ink">
          {node.label}
        </h3>
        {node.date && (
          <span className="font-mono text-xs text-ink-faint">{node.date}</span>
        )}
      </header>

      {node.org && (
        <p className="mt-0.5 text-[13px] italic text-ink-soft">{node.org}</p>
      )}

      {details.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-ink-soft marker:text-ink-faint">
          {details.map((detail) => (
            <li key={detail.id}>{detail.label}</li>
          ))}
        </ul>
      )}

      {node.tags && node.tags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {node.tags.map((tag) => (
            <li
              key={tag}
              className="rounded bg-paper-sunk px-2 py-0.5 font-mono text-[11px] text-ink-soft print:border print:border-rule print:bg-transparent"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {node.link && (
        <p className="mt-2">
          <ExternalLink href={node.link} />
        </p>
      )}
    </article>
  );
}

export default function CvPage() {
  return (
    <main className="min-h-screen bg-paper-sunk px-4 py-10 print:bg-white print:p-0">
      {/* Toolbar — screen only, never printed. */}
      <nav className="mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="rounded-full border border-rule bg-paper px-4 py-1.5 font-mono text-xs text-ink-faint transition-colors hover:text-ink"
        >
          ← back
        </Link>
        <CvActions />
      </nav>

      {/* The CV itself, rendered as a sheet of paper. */}
      <div className="mx-auto max-w-3xl rounded-xl bg-card px-10 py-12 shadow-[0_4px_30px_rgba(36,31,26,0.10)] print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <header className="border-b border-rule pb-4">
          <h1 className="font-display text-3xl text-ink">
            {treeData.label}
          </h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-faint">
            Curriculum Vitae
          </p>
          {contacts.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {contacts.map((contact) => (
                <li key={contact.href}>
                  <ExternalLink href={contact.href} title={contact.label} />
                </li>
              ))}
            </ul>
          )}
        </header>

        {sections.map((category) => (
          <section key={category.id} className="mt-7">
            <h2 className="font-mono text-xs uppercase tracking-widest text-ink-faint">
              {category.label}
            </h2>
            <div className="mt-3 space-y-5">
              {(category.children ?? []).map((entry) => (
                <Entry key={entry.id} node={entry} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
