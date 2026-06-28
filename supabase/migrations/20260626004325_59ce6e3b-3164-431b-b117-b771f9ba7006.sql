
-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  age INT,
  role TEXT,
  company TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =========================
-- USER STATS (gamification)
-- =========================
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_tasks_completed INT NOT NULL DEFAULT 0,
  total_habits_completed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_stats TO authenticated;
GRANT ALL ON public.user_stats TO service_role;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stats" ON public.user_stats FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- TASKS
-- =========================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo', -- todo | in_progress | done
  priority TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | urgent
  due_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  completed_at TIMESTAMPTZ,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tasks" ON public.tasks FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX tasks_user_status_idx ON public.tasks(user_id, status);
CREATE INDEX tasks_user_due_idx ON public.tasks(user_id, due_date);

-- =========================
-- EVENTS (Agenda)
-- =========================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  all_day BOOLEAN NOT NULL DEFAULT false,
  category TEXT,
  color TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own events" ON public.events FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX events_user_starts_idx ON public.events(user_id, starts_at);

-- =========================
-- HABITS
-- =========================
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Flame',
  color TEXT DEFAULT '#00B3FF',
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily | weekly
  target_per_period INT NOT NULL DEFAULT 1,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits" ON public.habits FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;
GRANT ALL ON public.habit_logs TO service_role;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habit logs" ON public.habit_logs FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX habit_logs_user_date_idx ON public.habit_logs(user_id, log_date);

-- =========================
-- NOTES
-- =========================
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Sem título',
  content TEXT,
  folder TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes" ON public.notes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- GOALS
-- =========================
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- annual | monthly | weekly | custom
  progress INT NOT NULL DEFAULT 0, -- 0-100
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- active | completed | paused
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goals" ON public.goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================
-- updated_at trigger
-- =========================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_stats_updated BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_habits_updated BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_goals_updated BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================
-- Auto create profile + stats on signup
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
