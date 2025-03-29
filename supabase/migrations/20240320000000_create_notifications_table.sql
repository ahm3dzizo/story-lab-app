create type notification_type as enum ('info', 'warning', 'error', 'success');
create type notification_source as enum ('task', 'message', 'employee', 'client', 'system');

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type notification_type not null default 'info',
  title text not null,
  message text not null,
  is_read boolean not null default false,
  source notification_source not null default 'system',
  reference_id text,
  reference_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create index for faster queries
create index notifications_user_id_idx on notifications(user_id);
create index notifications_created_at_idx on notifications(created_at desc);
create index notifications_is_read_idx on notifications(is_read);

-- Add RLS policies
alter table notifications enable row level security;

create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "System can insert notifications"
  on notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id)
  with check (true);

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_notifications_updated_at
  before update on notifications
  for each row
  execute function update_updated_at_column(); 