/*
# Update D5 onboarding content: remove video, keep open-ended question only

## Purpose
Day 5 should be a pure text question with no video. Set video_id to empty string
so the modal skips the video player entirely and shows only the open-ended question.

## Changes
- UPDATE onboarding_daily_content SET video_id = '' WHERE day_number = 5
*/

UPDATE onboarding_daily_content
SET video_id = ''
WHERE day_number = 5;
