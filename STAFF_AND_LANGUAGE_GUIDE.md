# Staff accounts and languages

## 1. Apply the database changes

Run the Supabase migrations, including `20260826000000_staff_roles.sql` and
`20260909000000_enforce_staff_access.sql`, with the Supabase CLI:

```bash
npx supabase db push
```

You can also run the two files in the Supabase SQL Editor, in filename order.

## 1a. Configure secure payment pricing

Set these **server-only** deployment secrets (do not prefix the service key
with `VITE_` and never expose it in the browser):

```bash
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CHAPA_SECRET_KEY=your_chapa_secret_key
```

Before each Chapa checkout, the server fetches the selected room's current
database price and recalculates the reservation total. This makes the room
card, booking summary, stored reservation, and Chapa amount use one rate.
Extras are also recalculated server-side. Update the hotel-controlled extras
in `src/lib/booking-pricing.ts` when their prices change.

## 2. Create the two staff users

In **Supabase Dashboard → Authentication → Users**, create an email/password
account for each person. Then, in the SQL Editor, assign their role (replace
the email addresses):

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
where email = 'admin@yourhotel.com';

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'receptionist')
where email = 'reception@yourhotel.com';
```

Each user must sign out and sign back in after a role change.

## Access matrix

| Area | Admin | Receptionist |
| --- | --- | --- |
| Dashboard, bookings, guests, messages | Yes | Yes |
| Change booking/message status | Yes | Yes |
| Rooms, offers, gallery, analytics | Yes | No |

The permissions are enforced in Supabase Row Level Security, not only hidden
in the menu. Never place a Supabase service-role key in the website.

## Languages

The switcher in the site header now updates the shared language provider and
the public page heroes and footer on every public route, as well as the
existing home-page content. The choice persists in the browser. Add future
copy to `src/lib/i18n.tsx` and render it with `const { t } = useLang()` so it
automatically participates in all five languages.
