import { supabase } from "@/integrations/supabase/client";

/** XP needed to reach a given level. Curve: level n needs n*100 XP cumulative. */
export function xpForLevel(level: number) {
  return level * 100;
}
export function levelFromXp(xp: number) {
  // level grows roughly as sqrt of xp
  return Math.max(1, Math.floor(Math.sqrt(xp / 50)) + 1);
}
export function progressInLevel(xp: number) {
  const level = levelFromXp(xp);
  const currentBase = xpForLevel(level - 1);
  const nextBase = xpForLevel(level);
  const span = nextBase - currentBase || 1;
  const into = Math.max(0, xp - currentBase);
  return { level, into, span, percent: Math.min(100, Math.round((into / span) * 100)) };
}

export function streakEmoji(streak: number) {
  if (streak <= 0) return "";
  const count = Math.min(streak, 5);
  return "🔥".repeat(count);
}

/** Award XP and update streak. Streak rule:
 *  - same day => no change
 *  - yesterday => +1
 *  - else => reset to 1
 */
export async function awardXp(userId: string, amount: number, kind: "task" | "habit") {
  const today = new Date().toISOString().slice(0, 10);
  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!stats) return;

  let newStreak = stats.current_streak ?? 0;
  if (stats.last_activity_date !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (stats.last_activity_date === yesterday) newStreak += 1;
    else newStreak = 1;
  }

  const newXp = (stats.xp ?? 0) + amount;
  const newLevel = levelFromXp(newXp);
  const longest = Math.max(stats.longest_streak ?? 0, newStreak);

  await supabase
    .from("user_stats")
    .update({
      xp: newXp,
      level: newLevel,
      current_streak: newStreak,
      longest_streak: longest,
      last_activity_date: today,
      total_tasks_completed: (stats.total_tasks_completed ?? 0) + (kind === "task" ? 1 : 0),
      total_habits_completed: (stats.total_habits_completed ?? 0) + (kind === "habit" ? 1 : 0),
    })
    .eq("user_id", userId);
}
