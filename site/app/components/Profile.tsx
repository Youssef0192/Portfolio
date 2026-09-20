"use client";

import { useSyncExternalStore } from "react";
import Avatar from "@/app/components/Avatar";
import Tree from "@/app/components/Tree";
import {
  categories,
  isPlain,
  linkText,
  treeData,
  type TreeNode,
} from "@/app/lib/tree";

const TREE_TAB = "tree";

const tabs = [
  ...categories.map((category) => ({
    id: category.id,
    label: category.label,
  })),
  { id: TREE_TAB, label: "The tree" },
];

/* Outbound links always get their own tab. */
function OutboundLink({
  href,
  title,
  className,
}: {
  href: string;
  title?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={title ? `${title}: ${linkText(href)}` : undefined}
      className={className}
    >
      {linkText(href)} ↗
    </a>
  );
}

function Entry({ node }: { node: TreeNode }) {
  const details = node.children ?? [];

  return (
    <article className="rounded-xl border border-rule bg-card p-5 transition-shadow hover:shadow-[0_2px_16px_rgba(36,31,26,0.06)]">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-lg text-ink">{node.label}</h3>
        {node.date && (
          <span className="font-mono text-xs text-ink-faint">{node.date}</span>
        )}
      </header>

      {node.org && <p className="mt-0.5 text-sm text-accent">{node.org}</p>}

      {details.length > 0 && (
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-ink-soft">
          {details.map((detail) => (
            <li key={detail.id} className="flex gap-2.5">
              <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
              {detail.label}
            </li>
          ))}
        </ul>
      )}

      {node.tags && node.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {node.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-paper-sunk px-2.5 py-0.5 font-mono text-[11px] text-ink-soft"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {node.link && (
        <p className="mt-3">
          <OutboundLink
            href={node.link}
            className="font-mono text-xs text-accent underline underline-offset-2 hover:opacity-70"
          />
        </p>
      )}
    </article>
  );
}

/* The URL fragment is the tab state, so /#projects deep-links and the back
   button steps through tabs. */
function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const readHash = () => window.location.hash.slice(1);
const serverHash = () => "";

export default function Profile() {
  const hash = useSyncExternalStore(subscribeToHash, readHash, serverHash);
  const active = tabs.some((tab) => tab.id === hash)
    ? hash
    : tabs[0]?.id ?? TREE_TAB;

  const activeCategory = categories.find((category) => category.id === active);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      {/* Header */}
      <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
        <Avatar src={treeData.photo} name={treeData.label} />

        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink-faint">
            Hi, I&apos;m
          </p>
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
            {treeData.label}
          </h1>
          {treeData.bio && (
            <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
              {treeData.bio}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href="/cv/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-accent px-4 py-1.5 font-mono text-xs text-white transition-opacity hover:opacity-85"
            >
              read my cv ↗
            </a>
            {(treeData.contacts ?? []).map((contact) => (
              <OutboundLink
                key={contact.href}
                href={contact.href}
                title={contact.label}
                className="font-mono text-xs text-ink-faint underline underline-offset-2 transition-colors hover:text-accent"
              />
            ))}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav
        role="tablist"
        aria-label="Sections"
        className="mt-12 flex flex-wrap gap-1 border-b border-rule"
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              className={`-mb-px border-b-2 px-3.5 py-2.5 text-sm transition-colors ${
                selected
                  ? "border-accent font-medium text-ink"
                  : "border-transparent text-ink-faint hover:text-ink"
              }`}
            >
              {tab.label}
            </a>
          );
        })}
      </nav>

      {/* Panels */}
      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        className="mt-8"
      >
        {active === TREE_TAB ? (
          <div>
            <p className="mb-4 text-sm leading-relaxed text-ink-soft">
              The same CV, as a tree you can walk. Hit{" "}
              <span className="font-mono text-xs text-ink">run</span> to watch
              breadth-first or depth-first traversal expand it a node at a time,
              or click any node to open it yourself.
            </p>
            {/* The tree wants more width than a column of prose. */}
            <div className="h-[34rem] overflow-hidden rounded-xl border border-rule bg-card lg:-mx-24 lg:h-[40rem] xl:-mx-48">
              <Tree />
            </div>
          </div>
        ) : activeCategory && (activeCategory.children ?? []).length > 0 ? (
          (activeCategory.children ?? []).every(isPlain) ? (
            <ul className="flex flex-wrap gap-2.5">
              {(activeCategory.children ?? []).map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-full border border-rule bg-card px-4 py-2 font-display text-lg text-ink"
                >
                  {entry.label}
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-4">
              {(activeCategory.children ?? []).map((entry) => (
                <Entry key={entry.id} node={entry} />
              ))}
            </div>
          )
        ) : (
          <p className="rounded-xl border border-dashed border-rule px-5 py-10 text-center text-sm text-ink-faint">
            Still writing this one.
          </p>
        )}
      </div>
    </div>
  );
}
