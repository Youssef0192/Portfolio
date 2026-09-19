"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { treeData, type NodeType, type TreeNode } from "@/app/lib/tree";

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
  root: { r: 9, fill: "#818cf8", font: 14 },
  category: { r: 7, fill: "#38bdf8", font: 13 },
  item: { r: 5.5, fill: "#34d399", font: 12 },
  detail: { r: 4, fill: "#64748b", font: 11 },
};

const SIBLING_GAP = 34;
const DEPTH_GAP = 300;
const STEP_MS = 320;

export default function Tree() {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const [size, setSize] = useState({ width: 1200, height: 800 });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<TreeNode | null>(null);
  const [mode, setMode] = useState<"bfs" | "dfs">("bfs");
  const [visitedIndex, setVisitedIndex] = useState<number | null>(null);
  const [transform, setTransform] = useState(d3.zoomIdentity);

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

  /* Track viewport size so the tree re-centres on resize. */
  useEffect(() => {
    const update = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* D3 does the layout maths; React renders the result. */
  const root = useMemo(() => {
    const hierarchy = d3.hierarchy<TreeNode>(treeData, (d) =>
      collapsed.has(d.id) ? undefined : d.children
    );
    d3.tree<TreeNode>().nodeSize([SIBLING_GAP, DEPTH_GAP])(hierarchy);
    return hierarchy as d3.HierarchyPointNode<TreeNode>;
  }, [collapsed]);

  const nodes = useMemo(() => root.descendants(), [root]);
  const links = useMemo(() => root.links(), [root]);

  /* Centre the tree on first paint and whenever the viewport changes. */
  useEffect(() => {
    const xs = nodes.map((n) => n.x);
    const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
    setTransform(
      d3.zoomIdentity.translate(140, size.height / 2 - mid)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.height]);

  /* Pan and zoom. */
  useEffect(() => {
    if (!svgRef.current) return;
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 2.5])
      .on("zoom", (event) => setTransform(event.transform));
    d3.select(svgRef.current).call(zoom);
  }, []);

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
    setSelected(null);
    setCollapsed(new Set());
    setVisitedIndex(0);
  }, []);

  const resetTree = useCallback(() => {
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
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      {/* Controls */}
      <div className="absolute left-6 top-6 z-10 flex items-center gap-2">
        <div className="flex overflow-hidden rounded border border-slate-700">
          {(["bfs", "dfs"] as const).map((m) => (
            <button
              key={m}
              onClick={() => !running && setMode(m)}
              disabled={running}
              className={`px-3 py-1.5 font-mono text-xs uppercase transition-colors ${
                mode === m
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              } disabled:opacity-40`}
            >
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={runTraversal}
          disabled={running}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-300 hover:text-white disabled:opacity-40"
        >
          {running ? "running…" : "run"}
        </button>
        <button
          onClick={resetTree}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-400 hover:text-white"
        >
          reset
        </button>
        <a
          href="/cv/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded border border-indigo-500/60 bg-indigo-500/10 px-3 py-1.5 font-mono text-xs text-indigo-300 transition-colors hover:bg-indigo-500/20 hover:text-white"
        >
          cv ↗
        </a>
      </div>

      {/* Traversal status */}
      {running && (
        <div className="absolute bottom-6 left-6 z-10 font-mono text-xs text-slate-500">
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
                stroke={active ? "#6366f1" : "#1e293b"}
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
                    stroke="#818cf8"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                )}
                <circle
                  r={style.r}
                  fill={isVisited ? "#6366f1" : style.fill}
                  stroke={isCollapsed ? "#e2e8f0" : "#0f172a"}
                  strokeWidth={isCollapsed ? 2 : 1.5}
                  className="transition-all duration-300"
                />
                <text
                  x={style.r + 10}
                  dy="0.32em"
                  fontSize={style.font}
                  fill={isVisited ? "#e2e8f0" : "#94a3b8"}
                  className="select-none transition-colors duration-300"
                >
                  {node.data.label}
                  {hasChildren && isCollapsed && (
                    <tspan fill="#475569"> +{node.data.children!.length}</tspan>
                  )}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Detail panel */}
      {selected && (
        <div className="absolute right-6 top-6 z-10 w-80 rounded-lg border border-slate-800 bg-slate-900/95 p-4 backdrop-blur">
          <div className="mb-3 flex items-start justify-between gap-3">
            <h2 className="text-sm font-medium leading-snug text-slate-100">
              {selected.label}
            </h2>
            <button
              onClick={() => setSelected(null)}
              className="shrink-0 text-xs text-slate-600 hover:text-slate-300"
            >
              ✕
            </button>
          </div>
          {selected.org && (
            <p className="text-xs text-slate-400">{selected.org}</p>
          )}
          {selected.date && (
            <p className="mt-0.5 font-mono text-xs text-slate-600">
              {selected.date}
            </p>
          )}
          {selected.tags && selected.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400"
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
              className="mt-3 inline-block font-mono text-[11px] text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
            >
              {selected.link.replace(/^https?:\/\//, "")} ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}