/*
  # Update Course Categories
  
  1. Changes
    - Update course categories to match Dashboard category names
    - Meditace -> Meditace a mindfulness
    - Jóga & tělo -> Jóga a tělo
    - Energie -> Energie a čakry
    - Add courses for missing categories
  
  2. New Courses
    - Add courses for "Úvodní cesta" category
    - Add courses for "Spánek a sny" category
    - Add courses for "Tajemství duše" category
*/

-- Update existing category names
UPDATE courses SET category = 'Meditace a mindfulness' WHERE category = 'Meditace';
UPDATE courses SET category = 'Jóga a tělo' WHERE category = 'Jóga & tělo';
UPDATE courses SET category = 'Energie a čakry' WHERE category = 'Energie';

-- Add courses for Úvodní cesta (Basic plan - free)
INSERT INTO courses (title, description, category, video_url, thumbnail_url, duration, is_premium, order_index) VALUES
('Vítejte na cestě', 'První kroky k vnitřnímu klidu', 'Úvodní cesta', 'https://example.com/video-intro1.mp4', 'https://images.pexels.com/photos/2885578/pexels-photo-2885578.jpeg', 10, false, 1),
('Co je mindfulness', 'Základy všímavosti a přítomnosti', 'Úvodní cesta', 'https://example.com/video-intro2.mp4', 'https://images.pexels.com/photos/3822621/pexels-photo-3822621.jpeg', 15, false, 2),
('Základy meditace', 'Jak začít s meditací', 'Úvodní cesta', 'https://example.com/video-intro3.mp4', 'https://images.pexels.com/photos/3822616/pexels-photo-3822616.jpeg', 20, false, 3);

-- Add courses for Spánek a sny
INSERT INTO courses (title, description, category, video_url, thumbnail_url, duration, is_premium, order_index) VALUES
('Relaxace před spánkem', 'Uklidněte mysl pro kvalitní spánek', 'Spánek a sny', 'https://example.com/video-sleep1.mp4', 'https://images.pexels.com/photos/3771069/pexels-photo-3771069.jpeg', 15, true, 1),
('Lucidní snění', 'Uvědomělé snění a kontrola snů', 'Spánek a sny', 'https://example.com/video-sleep2.mp4', 'https://images.pexels.com/photos/3771115/pexels-photo-3771115.jpeg', 25, true, 2),
('Regenerace ve spánku', 'Hluboký odpočinek a obnova', 'Spánek a sny', 'https://example.com/video-sleep3.mp4', 'https://images.pexels.com/photos/3771091/pexels-photo-3771091.jpeg', 20, true, 3);

-- Add courses for Tajemství duše
INSERT INTO courses (title, description, category, video_url, thumbnail_url, duration, is_premium, order_index) VALUES
('Vnitřní moudrost', 'Objevte svou duchovní podstatu', 'Tajemství duše', 'https://example.com/video-soul1.mp4', 'https://images.pexels.com/photos/3822865/pexels-photo-3822865.jpeg', 30, true, 1),
('Karmic healing', 'Očista karmických vzorců', 'Tajemství duše', 'https://example.com/video-soul2.mp4', 'https://images.pexels.com/photos/3822850/pexels-photo-3822850.jpeg', 35, true, 2),
('Spojení s vyšším já', 'Komunikace s duchovním vedením', 'Tajemství duše', 'https://example.com/video-soul3.mp4', 'https://images.pexels.com/photos/3822868/pexels-photo-3822868.jpeg', 40, true, 3);