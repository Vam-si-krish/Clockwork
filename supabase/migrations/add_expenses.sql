create table if not exists expenses (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users on delete cascade not null,
  amount      decimal(10,2) not null,
  category    text not null default 'other',
  description text,
  merchant    text,
  date        date not null default current_date,
  created_at  timestamptz default now()
);

alter table expenses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'expenses' and policyname = 'own expenses'
  ) then
    execute 'create policy "own expenses" on expenses
      for all using (auth.uid() = user_id)
      with check (auth.uid() = user_id)';
  end if;
end $$;
