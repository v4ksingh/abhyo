-- Run this SQL to add the new staff roles to the users ENUM column
ALTER TABLE users 
MODIFY COLUMN role 
ENUM('superadmin','admin','accountant','content_manager','teacher','institute','student','instructor') 
NOT NULL DEFAULT 'student';

-- Verify the change
DESCRIBE users;
