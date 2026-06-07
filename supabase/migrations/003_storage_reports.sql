-- Supabase Storage bucket for PDF reports
-- Create bucket "reports" (private) in Supabase dashboard or run:

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

create policy "Users read own report files"
  on storage.objects for select
  using (
    bucket_id = 'reports'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Service role uploads bypass RLS via admin client
