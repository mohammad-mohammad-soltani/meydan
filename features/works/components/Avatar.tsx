import { avatarColor, initial } from "../utils";
import type { WorkUser } from "../types";

/** Round initial avatar (mock `.av`); falls back to the colour hash when there is no photo. */
export function Avatar({ user, className = "", title }: { user: Pick<WorkUser, "id" | "name" | "avatar_url">; className?: string; title?: string }) {
  return (
    <span className={`av ${className}`} style={{ background: user.avatar_url ? undefined : avatarColor(user.id) }} title={title ?? user.name}>
      {user.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatar_url} alt="" className="av-img" loading="lazy" />
      ) : (
        initial(user.name)
      )}
    </span>
  );
}

/** Person pill (avatar + name) used in facts / role rows. */
export function Person({ user, viewerId, className = "" }: { user: WorkUser; viewerId?: string; className?: string }) {
  return (
    <span className={`person ${className}`}>
      <Avatar user={user} />
      {viewerId && user.id === viewerId ? "شما" : user.name}
      {user.work_label ? <span className="u-label">{user.work_label}</span> : null}
    </span>
  );
}
