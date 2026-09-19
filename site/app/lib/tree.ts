import rawTree from "@/data/tree.json";

export type NodeType = "root" | "category" | "item" | "detail";

export interface ContactLink {
  /** Accessible name, e.g. "LinkedIn". */
  label: string;
  href: string;
}

export interface TreeNode {
  id: string;
  label: string;
  type: NodeType;
  org?: string;
  date?: string;
  tags?: string[];
  /** Optional external URL. Always rendered as a new-tab link. */
  link?: string;
  /** Contact links, carried by the root node. */
  contacts?: ContactLink[];
  children?: TreeNode[];
}

export const treeData = rawTree as unknown as TreeNode;

/** Link text that stays readable on screen and useful once printed. */
export function linkText(href: string): string {
  return href
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}
