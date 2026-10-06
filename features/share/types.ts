/** Everything the share sheet and the story studio need from a post. */
export type SharePost = {
  id: string;
  title: string | null;
  body: string;
  authorName: string;
  authorAvatar?: string;
  authorVerified?: boolean;
  /** Content (not a narrative): share counter and bookmark go to `/content/{id}`. */
  kind?: "content";
  /** Page to link to; defaults to `/posts/{id}`. */
  href?: string;
  bookmarked?: boolean;
};
