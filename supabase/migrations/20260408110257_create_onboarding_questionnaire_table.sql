/*
  # Create onboarding questionnaire table

  1. New Tables
    - `onboarding_responses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `q1_body_state` (text) - tělesný stav
      - `q2_recent_state` (text) - nedávný stav
      - `q3_capacity` (text) - kapacita
      - `q4_main_need` (text) - hlavní potřeba
      - `q5_focus_area` (text) - oblast zaměření
      - `q6_best_time` (text) - preferovaný čas
      - `q7_start_style` (text) - způsob začátku
      - `q8_email_pref` (text) - e-mailové preference
      - `q9_reason_for_joining` (text, nullable) - důvod připojení (volitelné)
      - `q10_platform_frustration` (text, nullable) - frustrace s platformami (volitelné)
      - `q11_success_definition` (text, nullable) - definice úspěchu (volitelné)
      - `recommended_plan` (text) - doporučený plán (Restart/L1/L2)
      - `main_need` (text) - hlavní potřeba klienta
      - `focus_area` (text) - oblast zaměření
      - `preferred_time` (text) - preferovaný čas
      - `start_style` (text) - způsob začátku
      - `email_preference` (text) - e-mailové preference
      - `high_capacity_candidate` (boolean) - kandidát na L2
      - `restart_candidate` (boolean) - kandidát na Restart
      - `face_priority` (boolean) - priorita face jógy
      - `mindlife_priority` (boolean) - priorita Mind & Life
      - `fyzio_priority` (boolean) - priorita fyzio
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `onboarding_responses` table
    - Add policies for authenticated users to:
      - Read their own responses
      - Insert their own responses
      - Update their own responses
*/

-- Create onboarding_responses table
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Povinné otázky (1-8)
  q1_body_state text NOT NULL,
  q2_recent_state text NOT NULL,
  q3_capacity text NOT NULL,
  q4_main_need text NOT NULL,
  q5_focus_area text NOT NULL,
  q6_best_time text NOT NULL,
  q7_start_style text NOT NULL,
  q8_email_pref text NOT NULL,
  
  -- Volitelné otázky (9-11)
  q9_reason_for_joining text,
  q10_platform_frustration text,
  q11_success_definition text,
  
  -- Odvozené výstupy
  recommended_plan text NOT NULL CHECK (recommended_plan IN ('Restart', 'L1', 'L2')),
  main_need text NOT NULL,
  focus_area text NOT NULL,
  preferred_time text NOT NULL,
  start_style text NOT NULL,
  email_preference text NOT NULL,
  
  -- Odvozené štítky
  high_capacity_candidate boolean DEFAULT false,
  restart_candidate boolean DEFAULT false,
  face_priority boolean DEFAULT false,
  mindlife_priority boolean DEFAULT false,
  fyzio_priority boolean DEFAULT false,
  
  completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  -- One response per user
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users to read their own responses
CREATE POLICY "Users can read own onboarding responses"
  ON onboarding_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for authenticated users to insert their own responses
CREATE POLICY "Users can insert own onboarding responses"
  ON onboarding_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for authenticated users to update their own responses
CREATE POLICY "Users can update own onboarding responses"
  ON onboarding_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user_id ON onboarding_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_recommended_plan ON onboarding_responses(recommended_plan);
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_completed_at ON onboarding_responses(completed_at);