# ODA Resort Hotel - Staff, Language & Pricing Guide

## 1. Staff Users (Admin & Receptionist)

The platform supports two staff roles with different levels of access.

### Access Matrix

| Area | Admin | Receptionist |
| --- | --- | --- |
| Dashboard, bookings, guests, messages | Yes | Yes |
| Change booking/message status | Yes | Yes |
| Rooms, offers, gallery, analytics | Yes | No |

### How to Create Staff Users
1. Go to **Supabase Dashboard → Authentication → Users**.
2. Create an email/password account for each person.
3. Open the **SQL Editor** in Supabase and assign their roles by running:

```sql
-- For an admin user:
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'admin')
where email = 'admin@odaresort.com';

-- For a receptionist user:
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'receptionist')
where email = 'reception@odaresort.com';
```
*(Note: Users must sign out and sign back in for the new role to take effect.)*

This role-based access is securely enforced at the database level using Row Level Security (RLS) policies, as well as on the frontend UI (`src/routes/admin.tsx` and `src/components/admin-sidebar.tsx`).

## 2. Room Pricing & Chapa Sync

To ensure that the price tags on the room cards exactly match the amount taken to Chapa during the booking flow, the dynamic 15% tax addition during checkout has been removed. 

**What this means:**
- The price you set for a room in the admin dashboard (or Supabase) is now the **Final Price** (inclusive of all taxes).
- When a user views a room card, the price they see (`Br 5,000`) is the exact base total charged when they are redirected to the Chapa payment gateway.
- We also corrected the currency display on the homepage from `$` to `Br`.

## 3. Language Translation

The application supports 5 languages: English, Spanish, French, Amharic, and Oromiffa.

- The translation provider is located at `src/lib/i18n.tsx`.
- The site header, footer, and page heroes are now fully wired to respond to the language switcher.
- **To add or update translations:** Open `src/lib/i18n.tsx` and add your keys to the `T` or `EXTRA_T` dictionaries.
- **To use translations in a component:**
  ```tsx
  import { useLang } from "@/lib/i18n";
  
  function MyComponent() {
    const { t } = useLang();
    return <h1>{t("my.translation.key")}</h1>;
  }
  ```

## 4. Recommended Improvements

- **Database Security:** Maintained strict adherence to RLS (Row Level Security) without exposing Supabase service-role keys on the client. Roles are stored in `app_metadata` which cannot be tampered with by clients.
- **Pricing Clarity:** Unified pricing to avoid "hidden fees" during checkout, creating a seamless and transparent user experience with the Chapa payment gateway.
- **UI Enhancements:** Ensured consistent currency formatting across all pages (e.g., using `Br` instead of `$`).

