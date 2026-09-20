"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { linkText, treeData, type NodeType, type TreeNode } from "@/app/lib/tree";

/* ---------- traversal algorithms ---------- */
// BFS uses a queue: visit every node at depth N before any at depth N+1.
function bfsOrder(root: TreeNode): string[] {
  const order: string[] = [];
  const queue: TreeNode[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    order.push(node.id);
    for (const child of node.children ?? []) queue.push(child);
  }
  return order;
}

// DFS (pre-order) plunges down one branch to a leaf before backtracking.
function dfsOrder(root: TreeNode): string[] {
  const order: string[] = [];
  const walk = (node: TreeNode) => {
    order.push(node.id);
    for (const child of node.children ?? []) walk(child);
  };
  walk(root);
  return order;
}

/* ---------- visual config ---------- */
const NODE_STYLE: Record<NodeType, { r: number; fill: string; font: number }> = {
  root: { r: 9, fill: "#4338ca", font: 14 },
  category: { r: 7, fill: "#0369a1", font: 13 },
  item: { r: 5.5, fill: "#047857", font: 12 },
  detail: { r: 4, fill: "#a8a29e", font: 11 },
};

const VISITED = "#c2410c";
const LINK_IDLE = "#e9e0d0";
const LABEL_IDLE = "#57503f";
const LABEL_VISITED = "#241f1a";

const SIBLING_GAP = 30;
const DEPTH_GAP_MAX = 300;
const STEP_MS = 320;
/* Rough room for a label sitting to the right of its node, used when fitting. */
const LABEL_ALLOWANCE = 230;
const FIT_PAD = 24;

export default function Tree() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const [size, setSize] = useState({ width: 900, height: 512 });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [mode, setMode] = useState<"bfs" | "dfs">("bfs");
  const [visitedIndex, setVisitedIndex] = useState<number | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  /* Once the reader pans or zooms, stop re-fitting under them. */
  const readerTookOver = useRef(false);

  /* Start collapsed below the category level so the first view is readable. */
  useEffect(() => {
    const initial = new Set<string>();
    for (const category of treeData.children ?? []) {
      for (const item of category.children ?? []) {
        if (item.children?.length) initial.add(item.id);
      }
    }
    setCollapsed(initial);
  }, []);

  /* Track the container's box so the tree fits whatever panel holds it. */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  /* Columns tighten on narrow panels so four levels still fit. */
  const depthGap = Math.max(
    150,
    Math.min(DEPTH_GAP_MAX, (size.width - LABEL_ALLOWANCE - FIT_PAD * 2) / 3)
  );

  /* D3 does the layout maths; React renders the result. */
  const root = useMemo(() => {
    const hierarchy = d3.hierarchy<TreeNode>(treeData, (d) =>
      collapsed.has(d.id) ? undefined : d.children
    );
    d3.tree<TreeNode>().nodeSize([SIBLING_GAP, depthGap])(hierarchy);
    return hierarchy as d3.HierarchyPointNode<TreeNode>;
  }, [collapsed, depthGap]);

  const nodes = useMemo(() => root.descendants(), [root]);
  const links = useMemo(() => root.links(), [root]);

  /* Pan and zoom. Driving React state from d3 keeps one source of truth for
     the transform, so programmatic fits and reader gestures can't disagree. */
  useEffect(() => {
    if (!svgRef.current) return;
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2.5])
      .on("zoom", (event) => {
        // sourceEvent is null when the fit below sets the transform itself.
        if (event.sourceEvent) readerTookOver.current = true;
        setTransform(event.transform);
      });
    zoomRef.current = zoom;
    d3.select(svgRef.current).call(zoom);
  }, []);

  /* Fit whatever is currently expanded inside the panel, so nothing sits off
     the edge as the traversal opens nodes. */
  useEffect(() => {
    const svg = svgRef.current;
    const zoom = zoomRef.current;
    if (!svg || !zoom || readerTookOver.current) return;
    if (size.width === 0 || size.height === 0 || nodes.length === 0) return;

    const minX = Math.min(...nodes.map((n) => n.x));
    const maxX = Math.max(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxY = Math.max(...nodes.map((n) => n.y));
    const contentW = maxY - minY + LABEL_ALLOWANCE;
    const contentH = Math.max(maxX - minX, 1);

    /* Floor the fit: past this, labels stop being readable and panning is the
       better answer than shrinking further. */
    const k = Math.max(
      0.65,
      Math.min(
        1,
        (size.width - FIT_PAD * 2) / contentW,
        (size.height - FIT_PAD * 2) / contentH
      )
    );

    d3.select(svg).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(
          (size.width - contentW * k) / 2 - minY * k,
          (size.height - contentH * k) / 2 - minX * k
        )
        .scale(k)
    );
  }, [nodes, size]);

  /* The traversal order over the FULL tree, not just what's visible. */
  const traversal = useMemo(
    () => (mode === "bfs" ? bfsOrder(treeData) : dfsOrder(treeData)),
    [mode]
  );

  /* Step the animation forward, expanding nodes as the algorithm reaches them. */
  useEffect(() => {
    if (visitedIndex === null) return;
    if (visitedIndex >= traversal.length) {
      setVisitedIndex(null);
      return;
    }
    const currentId = traversal[visitedIndex];
    setCollapsed((prev) => {
      if (!prev.has(currentId)) return prev;
      const next = new Set(prev);
      next.delete(currentId);
      return next;
    });
    const timer = setTimeout(() => setVisitedIndex((i) => (i ?? 0) + 1), STEP_MS);
    return () => clearTimeout(timer);
  }, [visitedIndex, traversal]);

  const visitedSet = useMemo(() => {
    if (visitedIndex === null) return new Set<string>();
    return new Set(traversal.slice(0, visitedIndex + 1));
  }, [visitedIndex, traversal]);

  const currentId = visitedIndex !== null ? traversal[visitedIndex] : null;
  const running = visitedIndex !== null;

  const runTraversal = useCallback(() => {
    readerTookOver.current = false;
    setSelected(null);
    setCollapsed(new Set());
    setVisitedIndex(0);
  }, []);

  const resetTree = useCallback(() => {
    readerTookOver.current = false;
    setVisitedIndex(null);
    setSelected(null);
    const initial = new Set<string>();
    for (const category of treeData.children ?? []) {
      for (const item of category.children ?? []) {
        if (item.children?.length) initial.add(item.id);
      }
    }
    setCollapsed(initial);
  }, []);

  const toggleNode = (node: TreeNode) => {
    if (!node.children?.length) return;
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(node.id) ? next.delete(node.id) : next.add(node.id);
      return next;
    });
  };

  const linkPath = d3
    .linkHorizontal<d3.HierarchyPointLink<TreeNode>, d3.HierarchyPointNode<TreeNode>>()
    .x((d) => d.y)
    .y((d) => d.x);

  return (
    <div ref={wrapRef} className="relative size-full overflow-hidden bg-card">
      {/* Controls */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <div className="flex overflow-hidden rounded border border-rule">
          {(["bfs", "dfs"] as const).map((m) => (
            <button
              key={m}
              onClick={() => !running && setMode(m)}
              disabled={running}
              className={`px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
                mode === m
                  ? "bg-accent text-white"
                  : "bg-paper text-ink-faint hover:text-ink"
              } disabled:opacity-40`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={runTraversal}
          disabled={running}
          className="rounded border border-rule bg-paper px-3 py-1.5 font-mono text-xs text-ink-soft hover:text-ink disabled:opacity-40"
        >
          {running ? "running…" : "run"}
        </button>
        <button
          onClick={resetTree}
          className="rounded border border-rule bg-paper px-3 py-1.5 font-mono text-xs text-ink-faint hover:text-ink"
        >
          reset
        </button>
      </div>

      {/* Traversal status */}
      {running && (
        <div className="absolute bottom-4 left-4 z-10 font-mono text-xs text-ink-faint">
          {mode.toUpperCase()} · visiting {visitedIndex! + 1} / {traversal.length}
        </div>
      )}

      {/* Tree */}
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        className="cursor-grab active:cursor-grabbing"
      >
        <g
          ref={gRef}
          transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
        >
          {links.map((link) => {
            const active =
              visitedSet.has(link.source.data.id) &&
              visitedSet.has(link.target.data.id);
            return (
              <path
                key={`${link.source.data.id}-${link.target.data.id}`}
                d={linkPath(link) ?? undefined}
                fill="none"
                stroke={active ? VISITED : LINK_IDLE}
                strokeWidth={active ? 1.8 : 1.2}
                className="transition-all duration-300"
              />
            );
          })}

          {nodes.map((node) => {
            const style = NODE_STYLE[node.data.type];
            const hasChildren = !!node.data.children?.length;
            const isCollapsed = collapsed.has(node.data.id);
            const isVisited = visitedSet.has(node.data.id);
            const isCurrent = currentId === node.data.id;

            return (
              <g
                key={node.data.id}
                transform={`translate(${node.y},${node.x})`}
                className="cursor-pointer"
                onClick={() => {
                  setSelected(node.data);
                  toggleNode(node.data);
                }}
              >
                {isCurrent && (
                  <circle
                    r={style.r + 7}
                    fill="none"
                    stroke={VISITED}
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                )}
                <circle
                  r={style.r}
                  fill={isVisited ? VISITED : style.fill}
                  stroke={isCollapsed ? "#241f1a" : "#ffffff"}
                  strokeWidth={isCollapsed ? 2 : 1.5}
                  className="transition-all duration-300"
                />
                <text
                  x={style.r + 10}
                  dy="0.32em"
                  fontSize={style.font}
                  fill={isVisited ? LABEL_VISITED : LABEL_IDLE}
                  /* Halo so link lines don't strike through the text. */
                  stroke="#ffffff"
                  strokeWidth={3}
                  paintOrder="stroke"
                  className="select-none transition-colors duration-300"
                >
                  {node.data.label}
                  {hasChildren && isCollapsed && (
                    <tspan fill="#a8a29e"> +{node.data.children!.length}</tspan>
                  )}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Detail panel */}
      {selected && (
        <div className="absolute right-4 top-4 z-10 w-72 rounded-lg border border-rule bg-paper/95 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-sm font-medium leading-snug text-ink">
              {selected.label}
            </h2>
            <button
              onClick={() => setSelected(null)}
              className="shrink-0 text-xs text-ink-faint hover:text-ink"
            >
              ✕
            </button>
          </div>
          {selected.org && (
            <p className="text-xs text-accent">{selected.org}</p>
          )}
          {selected.date && (
            <p className="mt-0.5 font-mono text-xs text-ink-faint">
              {selected.date}
            </p>
          )}
          {selected.tags && selected.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-paper-sunk px-2 py-0.5 font-mono text-[11px] text-ink-soft"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {selected.link && (
            <a
              href={selected.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-mono text-[11px] text-accent underline underline-offset-2 hover:opacity-70"
            >
              {linkText(selected.link)} ↗
            </a>
          )}
          {selected.contacts?.map((contact) => (
            <a
              key={contact.href}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${contact.label}: ${linkText(contact.href)}`}
              className="mt-3 block font-mono text-[11px] text-accent underline underline-offset-2 hover:opacity-70"
            >
              {linkText(contact.href)} ↗
            </a>
          ))}
        </div>
      )}
    </div>
  );
}