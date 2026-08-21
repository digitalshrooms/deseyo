/*
  # Seed Sample Courses

  1. Sample Data
    - Add sample courses for each category
    - Mix of free and premium content
    
  2. Categories
    - Úvodní cesta
    - Jóga a tělo
    - Meditace a mindfulness
    - Energie a čakry
    - Osobní růst
    - Spánek a sny
    - Tajemství duše
*/

INSERT INTO courses (title, description, category, video_url, thumbnail_url, duration, is_premium, order_index) VALUES
  -- Úvodní cesta
  ('Vítejte v Deseyo', 'Úvodní lekce o platformě a jak začít svou cestu k vnitřní rovnováze', 'Úvodní cesta', 'https://example.com/video1.mp4', 'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800', 15, false, 1),
  ('Základy jógy pro začátečníky', 'Naučte se základní pozice a dechová cvičení', 'Úvodní cesta', 'https://example.com/video2.mp4', 'https://images.pexels.com/photos/3822844/pexels-photo-3822844.jpeg?auto=compress&cs=tinysrgb&w=800', 20, false, 2),
  
  -- Jóga a tělo
  ('Ranní probuzení těla', 'Energizující jóga pro ranní praxi', 'Jóga a tělo', 'https://example.com/video3.mp4', 'https://images.pexels.com/photos/3822864/pexels-photo-3822864.jpeg?auto=compress&cs=tinysrgb&w=800', 30, true, 1),
  ('Jóga pro páteř', 'Posílení a protažení zad', 'Jóga a tělo', 'https://example.com/video4.mp4', 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800', 25, true, 2),
  ('Večerní relaxace', 'Uvolnění napětí po náročném dni', 'Jóga a tělo', 'https://example.com/video5.mp4', 'https://images.pexels.com/photos/3822621/pexels-photo-3822621.jpeg?auto=compress&cs=tinysrgb&w=800', 20, false, 3),
  
  -- Meditace a mindfulness
  ('Meditace pro začátečníky', 'Základy meditační praxe', 'Meditace a mindfulness', 'https://example.com/video6.mp4', 'https://images.pexels.com/photos/3822517/pexels-photo-3822517.jpeg?auto=compress&cs=tinysrgb&w=800', 10, false, 1),
  ('Dechová cvičení', 'Pranayama pro klid mysli', 'Meditace a mindfulness', 'https://example.com/video7.mp4', 'https://images.pexels.com/photos/3822683/pexels-photo-3822683.jpeg?auto=compress&cs=tinysrgb&w=800', 15, true, 2),
  
  -- Energie a čakry
  ('Úvod do čaker', 'Poznání energetických center těla', 'Energie a čakry', 'https://example.com/video8.mp4', 'https://images.pexels.com/photos/3822726/pexels-photo-3822726.jpeg?auto=compress&cs=tinysrgb&w=800', 20, true, 1),
  ('Otevření srdečního čakry', 'Práce s energií lásky a soucitu', 'Energie a čakry', 'https://example.com/video9.mp4', 'https://images.pexels.com/photos/3822755/pexels-photo-3822755.jpeg?auto=compress&cs=tinysrgb&w=800', 25, true, 2),
  
  -- Osobní růst
  ('Nalezení svého účelu', 'Objevte své životní poslání', 'Osobní růst', 'https://example.com/video10.mp4', 'https://images.pexels.com/photos/3822647/pexels-photo-3822647.jpeg?auto=compress&cs=tinysrgb&w=800', 30, true, 1),
  ('Práce s emocemi', 'Jak porozumět svým emocím', 'Osobní růst', 'https://example.com/video11.mp4', 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800', 20, false, 2),
  
  -- Spánek a sny
  ('Yoga Nidra', 'Jógový spánek pro hlubokou relaxaci', 'Spánek a sny', 'https://example.com/video12.mp4', 'https://images.pexels.com/photos/3822509/pexels-photo-3822509.jpeg?auto=compress&cs=tinysrgb&w=800', 35, true, 1),
  ('Večerní rituál pro kvalitní spánek', 'Příprava těla a mysli na odpočinek', 'Spánek a sny', 'https://example.com/video13.mp4', 'https://images.pexels.com/photos/3822583/pexels-photo-3822583.jpeg?auto=compress&cs=tinysrgb&w=800', 15, false, 2),
  
  -- Tajemství duše
  ('Cesta k sobě samému', 'Hlubinné poznání vlastního já', 'Tajemství duše', 'https://example.com/video14.mp4', 'https://images.pexels.com/photos/3822648/pexels-photo-3822648.jpeg?auto=compress&cs=tinysrgb&w=800', 40, true, 1),
  ('Meditace s mantrou', 'Síla posvátných zvuků', 'Tajemství duše', 'https://example.com/video15.mp4', 'https://images.pexels.com/photos/3822688/pexels-photo-3822688.jpeg?auto=compress&cs=tinysrgb&w=800', 25, true, 2);