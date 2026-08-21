/*
  # Setup Admin User for Simple Login

  1. Changes
    - Delete any existing admin users
    - Create clean admin_users table entries
    - Admin can now login via simple email/password through edge function
  
  2. Security
    - Admin authentication is now managed via admin-login edge function
    - No Supabase Auth dependency for admin panel
*/

DELETE FROM public.admin_users WHERE email = 'admin@deseyo.cz';

INSERT INTO public.admin_users (email, password_hash, role)
VALUES ('admin@deseyo.cz', 'admin123', 'admin')
ON CONFLICT (email) DO UPDATE SET password_hash = 'admin123';
