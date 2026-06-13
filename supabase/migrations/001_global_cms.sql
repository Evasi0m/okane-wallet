-- Okane Wallet — Global CMS schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

-- 1. Admin flag on profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Global icons (replaces per-user overrides for INDEX.* / IC.* / published ICON_LIST.*)
CREATE TABLE IF NOT EXISTS global_icons (
  icon_key text PRIMARY KEY,
  svg_content text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Editable UI strings
CREATE TABLE IF NOT EXISTS app_strings (
  string_key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. App-wide metadata singleton
CREATE TABLE IF NOT EXISTS app_meta (
  id text PRIMARY KEY DEFAULT 'default',
  updated_at timestamptz NOT NULL DEFAULT now(),
  default_theme text DEFAULT 'light',
  feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  assets jsonb NOT NULL DEFAULT '{}'::jsonb
);

INSERT INTO app_meta (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- 5. Asset registry (URLs point to Supabase Storage or external CDN)
CREATE TABLE IF NOT EXISTS app_assets (
  asset_key text PRIMARY KEY,
  public_url text NOT NULL,
  mime_type text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Helper: is current user an admin?
CREATE OR REPLACE FUNCTION public.is_okane_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- RLS
ALTER TABLE global_icons ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_strings ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_assets ENABLE ROW LEVEL SECURITY;

-- Public read (DROP IF EXISTS = รันซ้ำได้)
DROP POLICY IF EXISTS "global_icons_public_read" ON global_icons;
DROP POLICY IF EXISTS "app_strings_public_read" ON app_strings;
DROP POLICY IF EXISTS "app_meta_public_read" ON app_meta;
DROP POLICY IF EXISTS "app_assets_public_read" ON app_assets;
CREATE POLICY "global_icons_public_read" ON global_icons FOR SELECT USING (true);
CREATE POLICY "app_strings_public_read" ON app_strings FOR SELECT USING (true);
CREATE POLICY "app_meta_public_read" ON app_meta FOR SELECT USING (true);
CREATE POLICY "app_assets_public_read" ON app_assets FOR SELECT USING (true);

-- Admin write
DROP POLICY IF EXISTS "global_icons_admin_write" ON global_icons;
DROP POLICY IF EXISTS "app_strings_admin_write" ON app_strings;
DROP POLICY IF EXISTS "app_meta_admin_write" ON app_meta;
DROP POLICY IF EXISTS "app_assets_admin_write" ON app_assets;
CREATE POLICY "global_icons_admin_write" ON global_icons FOR ALL USING (public.is_okane_admin()) WITH CHECK (public.is_okane_admin());
CREATE POLICY "app_strings_admin_write" ON app_strings FOR ALL USING (public.is_okane_admin()) WITH CHECK (public.is_okane_admin());
CREATE POLICY "app_meta_admin_write" ON app_meta FOR ALL USING (public.is_okane_admin()) WITH CHECK (public.is_okane_admin());
CREATE POLICY "app_assets_admin_write" ON app_assets FOR ALL USING (public.is_okane_admin()) WITH CHECK (public.is_okane_admin());

-- Storage bucket (create in Dashboard if SQL fails — Storage → New bucket → app-assets, public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "app_assets_storage_public_read" ON storage.objects;
CREATE POLICY "app_assets_storage_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'app-assets');

DROP POLICY IF EXISTS "app_assets_storage_admin_write" ON storage.objects;
CREATE POLICY "app_assets_storage_admin_write" ON storage.objects
  FOR ALL USING (bucket_id = 'app-assets' AND public.is_okane_admin())
  WITH CHECK (bucket_id = 'app-assets' AND public.is_okane_admin());

-- Grant anon/authenticated read on tables
GRANT SELECT ON global_icons, app_strings, app_meta, app_assets TO anon, authenticated;
GRANT ALL ON global_icons, app_strings, app_meta, app_assets TO authenticated;

-- ตั้ง admin แยกไฟล์: supabase/migrations/002_promote_admin.sql
