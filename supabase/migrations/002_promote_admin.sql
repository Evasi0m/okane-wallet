-- รันไฟล์นี้แยกต่างหาก (หลัง 001 สำเร็จแล้ว)
-- เปลี่ยนอีเมลให้ตรงกับบัญชีที่ login แอป Okane แล้ว

UPDATE profiles
SET is_admin = true
WHERE email = 'jarasrawee.jb@gmail.com';

-- ตรวจผล
SELECT id, email, is_admin
FROM profiles
WHERE email = 'jarasrawee.jb@gmail.com';
