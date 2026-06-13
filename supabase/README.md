# Supabase Global CMS Setup

Run the migration in the Supabase SQL Editor:

```
supabase/migrations/001_global_cms.sql
```

Then promote your admin account (run **only** this — do not re-run `001`):

```sql
-- or use file: supabase/migrations/002_promote_admin.sql
UPDATE profiles SET is_admin = true WHERE email = 'your-admin@example.com';
SELECT id, email, is_admin FROM profiles WHERE email = 'your-admin@example.com';
```

If re-running `001` fails with `policy "... " already exists`, migration already succeeded — run the `UPDATE` above only.

Open the admin panel at `/okane-wallet/admin/` and sign in with that account.

## Tables

| Table | Purpose |
|-------|---------|
| `global_icons` | App-wide SVG overrides (`ICON_LIST.*`, `IC.*`, `INDEX.*`) |
| `app_strings` | Editable UI strings (`data-cms` keys) |
| `app_assets` | Public asset URLs |
| `app_meta` | Singleton config (`default_theme`, `assets` json) |

## Storage

Bucket `app-assets` (public read) — used by Admin → Assets.
