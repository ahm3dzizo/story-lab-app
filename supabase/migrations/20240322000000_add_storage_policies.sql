-- Enable storage policies for chat buckets
create policy "Authenticated users can upload chat attachments"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-attachments' and
  auth.role() = 'authenticated'
);

create policy "Anyone can view chat attachments"
on storage.objects for select
using (bucket_id = 'chat-attachments');

create policy "Authenticated users can upload chat audio"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-audio' and
  auth.role() = 'authenticated'
);

create policy "Anyone can view chat audio"
on storage.objects for select
using (bucket_id = 'chat-audio');

create policy "Authenticated users can upload chat voice"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'chat-voice' and
  auth.role() = 'authenticated'
);

create policy "Anyone can view chat voice"
on storage.objects for select
using (bucket_id = 'chat-voice');

-- Grant usage on storage schema
grant usage on schema storage to authenticated, anon;

-- Grant all on storage buckets
grant all on storage.buckets to authenticated;
grant all on storage.objects to authenticated; 