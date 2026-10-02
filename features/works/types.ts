import type { ActorKind } from "@/lib/profile-route";
/** Shapes returned by the `/works` REST API (backend: Domain\Work*). */

export type WorkUser = {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
  verified?: boolean;
  verified_official?: boolean;
  profile_type?: ActorKind;
  profile_id?: string;
  /** Attribute (صفت) the managers gave this person in the current work. */
  work_label?: string | null;
};

export type WorkRole = "owner" | "admin" | "member";
export type WorkKind = "text" | "task" | "meeting" | "announcement" | "poll";
export type TaskStatus = "todo" | "doing" | "done" | "ok";
export type TaskPriority = "high" | "normal" | "low";

export type WorkMember = {
  user: WorkUser;
  role: WorkRole;
  label?: string | null;
  joined_at?: string | null;
  open_tasks: number;
  done_tasks: number;
};

export type WorkReaction = { emoji: string; count: number; mine: boolean };

export type WorkMessage = {
  id: string;
  conversation_id: string;
  client_id: string;
  can_reply: boolean;
  /** Client-only: optimistic delivery state. */
  delivery?: "sending" | "failed";
  /** Client-only: title shown on an optimistic rich message. */
  pending_title?: string;
  kind: WorkKind | "system";
  sender: WorkUser | null;
  /** Sender's standing in this work (owner / admin / member). */
  sender_role?: WorkRole | null;
  attachment?: { id: string; name: string; url: string; mime_type: string } | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  pinned: boolean;
  is_private: boolean;
  reply_to: { id: string; kind: string; title: string; body: string; sender_name: string; sender_label?: string | null } | null;
  reply_count?: number;
  reactions: WorkReaction[];
  mentions: WorkUser[];
  task?: {
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_at: string | null;
    late: boolean;
    /** Due within the next 6 hours (still open). */
    soon?: boolean;
    capacity: number;
    assignees: WorkUser[];
    volunteers: WorkUser[];
    open_slots: number | null;
    viewer_is_responsible: boolean;
    items: { id: string; title: string; done: boolean }[];
  };
  meeting?: {
    title: string;
    when: string;
    place: string;
    agenda: string;
    going: number;
    not_going: number;
    my_response: "yes" | "no" | null;
    /** Audience of a private meeting (first few). */
    invited?: WorkUser[];
  };
  announcement?: {
    title: string;
    urgent: boolean;
    seen_count: number;
    member_total: number;
    seen_by_me: boolean;
  };
  poll?: {
    question: string;
    options: { text: string; votes: number }[];
    total: number;
    my_vote: number | null;
  };
  system?: {
    action: string;
    target_user: WorkUser | null;
    target_message_id: string | null;
    target_title: string | null;
  };
};

export type WorkViewer = {
  joined: boolean;
  role: WorkRole | null;
  muted?: boolean;
  unread_count?: number;
  mention_unread?: number;
  can_post?: boolean;
  can_manage?: boolean;
  can_edit_info?: boolean;
  last_read_message_id?: string;
};

export type WorkLastMessage = {
  id: string;
  kind: WorkKind | "system";
  title: string;
  body: string;
  sender_name: string;
  created_at: string | null;
};

export type WorkGroup = {
  id: string;
  initiative_id?: string | null;
  title: string;
  description: string;
  avatar_url: string | null;
  updated_at?: string | null;
  member_count: number;
  progress?: { done: number; total: number };
  last_message?: WorkLastMessage | null;
  viewer: WorkViewer;
  counts?: Record<string, number>;
  stats?: { open_tasks: number; done_tasks: number; late_tasks: number; my_tasks: number };
  pinned?: WorkMessage | null;
};

export type WorkSummary = { my_tasks: number; late: number; mentions: number };

export const kindNames: Record<WorkKind, string> = {
  text: "پیام",
  task: "وظیفه",
  meeting: "جلسه",
  announcement: "اعلان",
  poll: "نظرسنجی",
};

export function messageTitle(m: Pick<WorkMessage, "task" | "meeting" | "announcement" | "poll" | "body">): string {
  return m.task?.title ?? m.meeting?.title ?? m.announcement?.title ?? m.poll?.question ?? m.body;
}
