/*
  # Extend Users for Plan Tracking
  
  1. Changes to users table
    - Add current_plan (Restart, L1, L2)
    - Add current_week (which week of the plan)
    - Add plan_start_date (when the plan started)
    - Add last_activity_date (last completed lesson/ritual)
    - Add total_days_this_week (for MED tracking)
  
  2. Important Notes
    - These fields enable the system to show proper "Dnešní lekce"
    - Track user progress through plans
    - Calculate MED status automatically
*/

DO $$
BEGIN
  -- Add current_plan column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'current_plan'
  ) THEN
    ALTER TABLE users ADD COLUMN current_plan text DEFAULT 'Restart' CHECK (current_plan IN ('Restart', 'L1', 'L2'));
  END IF;
  
  -- Add current_week column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'current_week'
  ) THEN
    ALTER TABLE users ADD COLUMN current_week integer DEFAULT 1;
  END IF;
  
  -- Add current_day column (1-7 for week days)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'current_day'
  ) THEN
    ALTER TABLE users ADD COLUMN current_day integer DEFAULT 1;
  END IF;
  
  -- Add plan_start_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'plan_start_date'
  ) THEN
    ALTER TABLE users ADD COLUMN plan_start_date timestamptz DEFAULT now();
  END IF;
  
  -- Add last_activity_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_activity_date'
  ) THEN
    ALTER TABLE users ADD COLUMN last_activity_date timestamptz;
  END IF;
END $$;

-- Update existing users to have default plan settings
UPDATE users 
SET 
  current_plan = 'Restart',
  current_week = 1,
  current_day = 1,
  plan_start_date = created_at
WHERE current_plan IS NULL;