/** Everything the share sheet and the story studio need from a post. */
export type SharePost = {
  id: string;
  title: string | null;
  body: string;
  authorName: string;
  authorAvatar?: string;
  authorVerified?: boolean;
};
