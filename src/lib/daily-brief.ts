import { dateKey } from "./visitor-date.ts";

type BriefPost = { body: string; published_at: string | null; created_at: string };

/** Only today or yesterday can be called a daily brief. Empty translations do not count. */
export function selectDailyBrief<T extends BriefPost>(posts: T[], now = new Date()) {
  const today = dateKey(now.toISOString());
  const yesterday = dateKey(new Date(now.getTime() - 86_400_000).toISOString());
  const usable = posts.filter(post => post.body.trim());
  const todaysPosts = usable.filter(post => dateKey(post.published_at ?? post.created_at) === today);
  const isYesterday = todaysPosts.length < 4;
  return {
    isYesterday,
    posts: isYesterday ? usable.filter(post => dateKey(post.published_at ?? post.created_at) === yesterday) : todaysPosts,
  };
}
