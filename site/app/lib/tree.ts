import rawTree from "@/data/tree.json";

export type NodeType = "root" | "category" | "item" | "detail";

export interface ContactLink {
  /** Accessible name, e.g. "LinkedIn". */
  label: string;
  href: string;
}

export interface HobbyImage {
  /** Path to a photo in /public. */
  src: string;
  alt?: string;
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
  /** Root only: short intro shown under the name. */
  bio?: string;
  /** Root only: path to the profile picture in /public. */
  photo?: string;
  /** Root only: contact links. */
  contacts?: ContactLink[];
  /** Hobbies only: which icon to draw, see HobbyIcon. */
  icon?: string;
  /** Hobbies only: photos for the slideshow. */
  images?: HobbyImage[];
  children?: TreeNode[];
}

export const treeData = rawTree as unknown as TreeNode;

/** Top-level sections: one tab on the front page, one section on the CV. */
export const categories = treeData.children ?? [];

/** An entry with nothing but a name — a hobby, not a job. Those read better
 *  as a compact list than as a card or a CV block of their own. */
export function isPlain(node: TreeNode): boolean {
  return (
    !node.org &&
    !node.date &&
    !node.link &&
    !(node.tags ?? []).length &&
    !(node.children ?? []).length
  );
}

/** Link text that stays readable on screen and useful once printed. */
export function linkText(href: string): string {
  return href
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

/** "Youssef Ahmed" -> "YA", used until a profile picture is dropped in. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
