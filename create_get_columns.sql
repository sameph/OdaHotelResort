create or replace function public.get_columns(tbl text)
returns table(col varchar)
language sql
security definer
as $$
  select column_name::varchar
  from information_schema.columns
  where table_schema = 'public' and table_name = tbl;
$$;
