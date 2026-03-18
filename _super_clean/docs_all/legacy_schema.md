create table public.folders (
  folder_id uuid not null default gen_random_uuid (),
  folder_name text not null,
  constraint folders_pkey primary key (folder_id),
  constraint folders_folder_name_key unique (folder_name)
) TABLESPACE pg_default;


create table public.modules (
  module_id uuid not null default gen_random_uuid (),
  module_name text not null,
  folder_id uuid null,
  constraint module_pkey primary key (module_id),
  constraint module_unique_per_folder unique (folder_id, module_name),
  constraint modules_module_name_key unique (module_name)
) TABLESPACE pg_default;

create table public.categories (
  category_id uuid not null default gen_random_uuid (),
  category_name text not null,
  module_id uuid null,
  constraint categories_pkey primary key (category_id),
  constraint category_unique_per_module unique (module_id, category_name),
  constraint categories_module_id_fkey foreign KEY (module_id) references modules (module_id)
) TABLESPACE pg_default;

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
  category_id uuid null,
  start_date timestamp with time zone null,
  mode text null,
  constraint tasks_pkey primary key (task_id),
  constraint tasks_category_id_fkey foreign KEY (category_id) references categories (category_id),
  constraint tasks_folder_id_fkey foreign KEY (folder_id) references folders (folder_id),
  constraint tasks_module_id_fkey foreign KEY (module_id) references modules (module_id)
) TABLESPACE pg_default;

create index IF not exists idx_tasks_recurring_type on public.tasks using btree (recurring_type) TABLESPACE pg_default;

create index IF not exists idx_tasks_due_date on public.tasks using btree (due_date) TABLESPACE pg_default;