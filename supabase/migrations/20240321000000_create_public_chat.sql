DROP TABLE IF EXISTS public.public_chat_messages CASCADE;

-- Create public chat messages table
create table public_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  attachment_url text,
  attachment_type text,
  audio_url text,
  message_type text check (message_type in ('text', 'image', 'audio')),
  is_edited boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for better performance
create index public_chat_messages_created_at_idx on public_chat_messages(created_at desc);
create index public_chat_messages_user_id_idx on public_chat_messages(user_id);
create index public_chat_messages_type_idx on public_chat_messages(message_type);

-- Enable RLS
alter table public_chat_messages enable row level security;

-- Create policies
create policy "Anyone can read public chat messages"
  on public_chat_messages for select
  using (true);

create policy "Authenticated users can insert messages"
  on public_chat_messages for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update their own messages"
  on public_chat_messages for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on public_chat_messages for delete
  using (auth.uid() = user_id);

-- Create a secure view that joins messages with user information
create or replace view public_chat_messages_with_users as
select 
  m.id,
  m.user_id,
  m.message,
  m.attachment_url,
  m.attachment_type,
  m.is_edited,
  m.created_at,
  m.updated_at,
  u.email,
  u.raw_user_meta_data as user_metadata
from public_chat_messages m
left join auth.users u on m.user_id = u.id;

-- Grant permissions
grant select on public_chat_messages_with_users to authenticated;
grant select on public_chat_messages_with_users to anon;

-- Create function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updating updated_at
create trigger update_public_chat_messages_updated_at
  before update on public_chat_messages
  for each row
  execute function update_updated_at_column();

-- Create calls table
create type call_type as enum ('audio', 'video');
create type call_status as enum ('initiated', 'ongoing', 'ended', 'missed');

create table public_chat_calls (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  call_type call_type not null,
  status call_status not null default 'initiated',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  room_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for better performance
create index chat_calls_caller_id_idx on public_chat_calls(caller_id);
create index chat_calls_receiver_id_idx on public_chat_calls(receiver_id);
create index chat_calls_status_idx on public_chat_calls(status);

-- Enable RLS
alter table public_chat_calls enable row level security;

-- Create policies
create policy "Users can view their own calls"
  on public_chat_calls for select
  using (auth.uid() = caller_id or auth.uid() = receiver_id);

create policy "Users can initiate calls"
  on public_chat_calls for insert
  with check (auth.uid() = caller_id);

create policy "Users can update their own calls"
  on public_chat_calls for update
  using (auth.uid() = caller_id or auth.uid() = receiver_id)
  with check (auth.uid() = caller_id or auth.uid() = receiver_id);

-- Create function to update updated_at timestamp
create trigger update_chat_calls_updated_at
  before update on public_chat_calls
  for each row
  execute function update_updated_at_column(); 