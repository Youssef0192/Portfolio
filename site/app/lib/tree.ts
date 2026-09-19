import rawTree from "@/data/tree.json";

export type NodeType = "root" | "category" | "item" | "detail";

export interface TreeNode {
  id: string;
  label: string;
  type: NodeType;
  org?: string;
  date?: string;
  tags?: string[];
  /** Optional external URL. Always rendered as a new-tab link. */
  link?: string;
  children?: TreeNode[];
}

export const treeData = rawTree as unknown as TreeNode;
