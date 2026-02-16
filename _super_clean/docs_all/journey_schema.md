-- contacts
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  phone text,
  email text,
  relationship text,
  category text check (category in ('Evangelism','New Believer','Mature Believer','Family','Other')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  comm_preferences jsonb
);
create index on contacts(user_id);

-- templates
create table if not exists journey_templates (
  id text primary key,
  name text not null,
  interval_days int not null,
  send_times text[] not null,
  is_system boolean not null default true,
  user_id uuid references auth.users(id) on delete cascade
);

create table if not exists template_steps (
  id uuid primary key default gen_random_uuid(),
  template_id text not null references journey_templates(id) on delete cascade,
  step_index int not null,
  title text,
  body text,
  scripture text,
  link text,
  channel text check (channel in ('sms','email')) not null
);
create unique index on template_steps(template_id, step_index);

-- enrollments
create table if not exists contact_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  template_id text not null references journey_templates(id) on delete cascade,
  start_date date not null default current_date,
  current_index int not null default 0,
  status text not null check (status in ('in_progress','completed','paused')) default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, contact_id, template_id)
);
create index on contact_enrollments(user_id, status);

-- deliveries (schedule + completion)
create table if not exists step_deliveries (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references contact_enrollments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  step_index int not null,
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  channel text check (channel in ('sms','email')),
  body_snapshot text,
  link text,
  scripture text,
  status text not null check (status in ('scheduled','sent','skipped')) default 'scheduled'
);
create index step_deliveries_due_idx on step_deliveries(user_id, scheduled_at) where sent_at is null and status = 'scheduled';
create index on step_deliveries(enrollment_id, step_index);

-- Bundles
create table if not exists journey_bundles (
  id text primary key,
  name text not null,
  description text,
  is_system boolean not null default true,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bundle -> Templates (many-to-many)
create table if not exists journey_bundle_templates (
  bundle_id text not null references journey_bundles(id) on delete cascade,
  template_id text not null references journey_templates(id) on delete cascade,
  primary key (bundle_id, template_id)
);

-- Bundle -> Habit campaign ids (string identifiers you already use in-app)
create table if not exists journey_bundle_habits (
  bundle_id text not null references journey_bundles(id) on delete cascade,
  habit_campaign_id text not null,
  primary key (bundle_id, habit_campaign_id)
);


create table public.tasks (
  task_id uuid not null default gen_random_uuid (),
  task_alternatives text null,
  due_date timestamp with time zone null,
  modifier_required boolean null,
  task_modifier text null,
  display_task text null,
  recurring_type public.recurring_type_enum null,
  recurring_details text null,
  forecast_date date null,
  forecast_priority text null,
  seasonal_tag text null,
  frequency_tag text null,
  estimated_time_min integer null,
  auto_assign boolean null,
  task_status text null,
  user_notes text null,
  task text null,
  start_priority_number integer null,
  end_priority_number integer null,
  priority_start_days_before integer null,
  folder_id uuid null,
  module_id uuid null,
  project_id uuid null,
  start_date timestamp with time zone null,
  mode text null,
  start_level text null,
  target_level integer null,
  target_freq integer null,
  freq_type text null,
  ramp_duration text null,
  task_type text null,
  icon_key text null,
  unit text null,
  activedays jsonb null,
  habit_time_slot jsonb null,
  user_id uuid null,
  constraint tasks_pkey primary key (task_id),
  constraint tasks_user_task_key unique (user_id, task),
  constraint tasks_folder_id_fkey foreign KEY (folder_id) references folders (folder_id),
  constraint tasks_module_id_fkey foreign KEY (module_id) references modules (module_id),
  constraint tasks_project_id_fkey foreign KEY (project_id) references projects (project_id),
  constraint tasks_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists tasks_user_id_idx on public.tasks using btree (user_id) TABLESPACE pg_default;

create index IF not exists tasks_mode_idx on public.tasks using btree (mode) TABLESPACE pg_default;

create index IF not exists idx_tasks_recurring_type on public.tasks using btree (recurring_type) TABLESPACE pg_default;

create index IF not exists idx_tasks_due_date on public.tasks using btree (due_date) TABLESPACE pg_default;

create table public.habit_templates (
  id uuid not null default gen_random_uuid (),
  name text not null,
  icon_key text null,
  unit text null,
  start_level text null,
  target_level integer null,
  ramp_duration text null,
  activedays jsonb null,
  habit_time_slot jsonb null,
  category text null,
  is_system boolean not null default true,
  user_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint habit_templates_pkey primary key (id),
  constraint habit_templates_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.template_steps (
  id uuid not null default gen_random_uuid (),
  template_id text not null,
  step_index integer not null,
  title text null,
  body text null,
  scripture text null,
  link text null,
  channel text null,
  prompt text null,
  questions text null,
  cta text null,
  track_prompts jsonb null,
  scripture_link text null,
  block_order text[] null,
  is_edit boolean default false,
  constraint template_steps_pkey primary key (id),
  constraint template_steps_template_id_fkey foreign KEY (template_id) references journey_templates (id) on delete CASCADE,
  constraint template_steps_channel_check check (
    (channel = any (array['sms'::text, 'email'::text]))
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists template_steps_template_id_step_index_idx on public.template_steps using btree (template_id, step_index) TABLESPACE pg_default;

create table public.journey_drafts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  template_id text null,
  title text not null default ''::text,
  description text not null default ''::text,
  depth_mode text null,
  sections jsonb not null default '[]'::jsonb,
  responses jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint journey_drafts_pkey primary key (id),
  constraint journey_drafts_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_journey_drafts_user on public.journey_drafts using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_journey_drafts_updated on public.journey_drafts using btree (updated_at desc) TABLESPACE pg_default;

create trigger journey_drafts_set_updated_at BEFORE
update on journey_drafts for EACH row
execute FUNCTION set_updated_at ();