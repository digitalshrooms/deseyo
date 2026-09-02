/*
  # Drop All Tables
  
  1. Actions
    - Drop all existing tables and their dependencies
    - Clean slate for new schema
  
  2. Tables to Drop
    - lesson_completions
    - comments
    - activities
    - forum_comments
    - forum_posts
    - courses
    - users
*/

-- Drop tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS lesson_completions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS forum_comments CASCADE;
DROP TABLE IF EXISTS forum_posts CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;