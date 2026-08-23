create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title_tr text not null default '',
  title_en text not null default '',
  content_tr text not null default '',
  content_en text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  show_in_header boolean not null default true,
  show_in_footer boolean not null default true,
  menu_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index pages_public_navigation_idx on public.pages(status, menu_order, created_at);

alter table public.pages enable row level security;
revoke all on table public.pages from anon, authenticated;
grant select on table public.pages to anon;
grant select, insert, update, delete on table public.pages to authenticated;

create policy "Visitors read published pages"
on public.pages for select to anon
using (status = 'published');

create policy "Admins read all pages"
on public.pages for select to authenticated
using ((select public.is_admin()));

create policy "Admins create pages"
on public.pages for insert to authenticated
with check ((select public.is_admin()) and created_by = (select auth.uid()));

create policy "Admins update pages"
on public.pages for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Admins delete pages"
on public.pages for delete to authenticated
using ((select public.is_admin()));

insert into public.pages (slug, title_tr, title_en, content_tr, content_en, status, menu_order)
values
  ('hakkinda', 'Hakkında', 'About', '## Biz kimiz\n\nKısa ve güncel teknoloji notlarını açık anlatım, güvenilir kaynaklar ve yararlı bağlamla sunuyoruz.', '## Who we are\n\nWe publish concise and current technology notes with clear reporting, reliable sources, and useful context.', 'published', 10),
  ('iletisim', 'İletişim', 'Contact', '## Bize ulaşın\n\nSoru, öneri ve geri bildirimleriniz için iletişim bilgilerini bu sayfada paylaşabilirsiniz.', '## Get in touch\n\nYou can publish your contact details here for questions, suggestions, and feedback.', 'published', 20)
on conflict (slug) do nothing;
