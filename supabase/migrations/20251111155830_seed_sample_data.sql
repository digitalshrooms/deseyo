/*
  # Seed Sample Data
  
  1. Sample Courses
    - Meditace courses
    - Jóga & tělo courses
    - Energie courses
    - Osobní růst courses
  
  2. Categories
    - Free courses for Basic plan
    - Premium courses for Premium/Legend plans
*/

-- Sample Meditace courses
INSERT INTO courses (title, description, category, video_url, thumbnail_url, duration, is_premium, order_index) VALUES
('Úvod do meditace', 'Naučte se základy meditace a zklidnění mysli', 'Meditace', 'https://example.com/video1.mp4', 'https://images.pexels.com/photos/3822843/pexels-photo-3822843.jpeg', 15, false, 1),
('Dechová cvičení', 'Ovládněte techniky správného dýchání pro relaxaci', 'Meditace', 'https://example.com/video2.mp4', 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg', 20, false, 2),
('Mindfulness praxe', 'Pokročilé techniky všímavosti a přítomnosti', 'Meditace', 'https://example.com/video3.mp4', 'https://images.pexels.com/photos/3822907/pexels-photo-3822907.jpeg', 25, true, 3);

-- Sample Jóga & tělo courses
INSERT INTO courses (title, description, category, video_url, thumbnail_url, duration, is_premium, order_index) VALUES
('Ranní protažení', 'Jemná jóga pro probuzení těla', 'Jóga & tělo', 'https://example.com/video4.mp4', 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg', 30, true, 1),
('Síla a rovnováha', 'Posílení jádra a zlepšení stability', 'Jóga & tělo', 'https://example.com/video5.mp4', 'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg', 35, true, 2),
('Večerní relaxace', 'Uvolnění napětí po celém dni', 'Jóga & tělo', 'https://example.com/video6.mp4', 'https://images.pexels.com/photos/4056636/pexels-photo-4056636.jpeg', 20, true, 3);

-- Sample Energie courses  
INSERT INTO courses (title, description, category, video_url, thumbnail_url, duration, is_premium, order_index) VALUES
('Energetická rovnováha', 'Harmonizace energií v těle', 'Energie', 'https://example.com/video7.mp4', 'https://images.pexels.com/photos/3822864/pexels-photo-3822864.jpeg', 25, true, 1),
('Čakrová meditace', 'Práce s energetickými centry', 'Energie', 'https://example.com/video8.mp4', 'https://images.pexels.com/photos/3822636/pexels-photo-3822636.jpeg', 30, true, 2),
('Prána a vitalita', 'Zvýšení životní energie', 'Energie', 'https://example.com/video9.mp4', 'https://images.pexels.com/photos/3822818/pexels-photo-3822818.jpeg', 20, true, 3);

-- Sample Osobní růst courses
INSERT INTO courses (title, description, category, video_url, thumbnail_url, duration, is_premium, order_index) VALUES
('Sebepoznání', 'Objevte své vnitřní já', 'Osobní růst', 'https://example.com/video10.mp4', 'https://images.pexels.com/photos/2908984/pexels-photo-2908984.jpeg', 25, true, 1),
('Cíle a motivace', 'Jak si stanovit a dosáhnout cílů', 'Osobní růst', 'https://example.com/video11.mp4', 'https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg', 30, true, 2),
('Pozitivní myšlení', 'Změňte svůj mindset k lepšímu', 'Osobní růst', 'https://example.com/video12.mp4', 'https://images.pexels.com/photos/3760263/pexels-photo-3760263.jpeg', 20, true, 3);