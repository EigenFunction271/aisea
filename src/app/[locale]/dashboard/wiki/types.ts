export type WikiPageType = "guide" | "reference" | "resource" | "section";
export type WikiPageStatus =
  | "draft"
  | "pending_review"
  | "live"
  | "rejected"
  | "needs_update";
export type WikiLinkType = "tool" | "paper" | "repo" | "video" | "other";

export type WikiTreeNode = {
  id: string;
  slug: string;
  title: string;
  type: WikiPageType;
  status: WikiPageStatus;
  parent_id: string | null;
  sort_order: number;
  has_children: boolean;
};

export type WikiPageDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string | null;
  type: WikiPageType;
  status: WikiPageStatus;
  parent_id: string | null;
  author_id: string;
  co_author_ids: string[];
  created_at: string;
  updated_at: string;
};

export type WikiAttachment = {
  id: string;
  filename: string;
  storage_path: string;
  bucket: "wiki-public" | "wiki-private";
  file_size_bytes: number;
  mime_type: string;
};

export type WikiLink = {
  id: string;
  url: string;
  title: string;
  description: string;
  link_type: WikiLinkType;
};

export type WikiAuthor = {
  username: string;
  name: string;
  city: string;
  is_wiki_contributor: boolean;
  approved_article_count: number;
};
