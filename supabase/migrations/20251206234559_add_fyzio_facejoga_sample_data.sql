/*
  # Add Fyzio and Facejóga Sample Data

  1. Sample Data
    - Fyzio yoga videos with body part tags (záda, ramena, kolena, kyčle, krk, nohy, celé tělo)
    - Faceyoga videos with area, level, and situation tags
    - Short and office lessons for Time/Office modes

  2. Tags System
    - body_part:* - fyzio parts (záda, ramena, kolena, kyčle, krk, nohy, celé_tělo)
    - physio_approach - fyzio therapeutic approach
    - face_full - full face routines
    - face_area:* - face areas (čelo, oči, tváře, dolní_část, krk)
    - face_level:* - L1 (Jumpstart) or L2 (Demand)
    - face_situation:* - ráno, večer, před_meetingem, po_náročném_dni
    - short_lesson - for Time mode (10-15 min)
    - office - for Office mode
*/

-- Insert Fyzio yoga lessons (body parts)
INSERT INTO courses (stable_id, title, description, category, content_type, video_url, thumbnail_url, duration, tags, plan_relevance, order_index, is_premium)
VALUES
  -- Záda
  ('fyzio_zada_1', 'Uvolnění zad po sezení', 'Jemné protažení a posílení páteře pro ty, kdo sedí celý den', 'Fyzio jóga', 'physioyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800', 20, ARRAY['body_part:záda', 'physio_approach'], ARRAY['L1', 'L2', 'Restart'], 1, false),
  ('fyzio_zada_2', 'Zdravá páteř – 15 min', 'Prevence bolesti zad, posílení hlubokých svalů', 'Fyzio jóga', 'physioyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800', 15, ARRAY['body_part:záda', 'physio_approach', 'short_lesson'], ARRAY['L1', 'L2'], 2, false),
  
  -- Ramena
  ('fyzio_ramena_1', 'Ramena po PC práci', 'Uvolnění napětí v ramenou a šíji', 'Fyzio jóga', 'physioyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&w=800', 12, ARRAY['body_part:ramena', 'physio_approach', 'office'], ARRAY['L1', 'L2', 'Restart'], 3, false),
  ('fyzio_ramena_2', 'Mobilita ramen', 'Zlepšení rozsahu pohybu v ramenních kloubech', 'Fyzio jóga', 'physioyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800', 18, ARRAY['body_part:ramena', 'physio_approach'], ARRAY['L2'], 4, false),
  
  -- Kyčle
  ('fyzio_kycle_1', 'Otevření kyčlí', 'Uvolnění tuhých kyčlí po dlouhém sezení', 'Fyzio jóga', 'physioyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800', 20, ARRAY['body_part:kyčle', 'physio_approach'], ARRAY['L1', 'L2'], 5, false),
  
  -- Kolena
  ('fyzio_kolena_1', 'Posílení kolen', 'Stabilizace a prevence zranění kolen', 'Fyzio jóga', 'physioyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&w=800', 15, ARRAY['body_part:kolena', 'physio_approach'], ARRAY['L2'], 6, false),
  
  -- Krk
  ('fyzio_krk_1', 'Uvolnění krku – 10 min', 'Rychlá úleva od napětí v krční páteři', 'Fyzio jóga', 'physioyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=800', 10, ARRAY['body_part:krk', 'physio_approach', 'short_lesson', 'office'], ARRAY['L1', 'L2', 'Restart'], 7, false),
  
  -- Nohy
  ('fyzio_nohy_1', 'Lehkost nohou', 'Zlepšení cirkulace a odstranění únavy', 'Fyzio jóga', 'physioyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/4056535/pexels-photo-4056535.jpeg?auto=compress&cs=tinysrgb&w=800', 15, ARRAY['body_part:nohy', 'physio_approach'], ARRAY['L1', 'L2'], 8, false),
  
  -- Celé tělo
  ('fyzio_celetelo_1', 'Full body fyzio – 25 min', 'Komplexní fyzio přístup pro celé tělo', 'Fyzio jóga', 'physioyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/4498606/pexels-photo-4498606.jpeg?auto=compress&cs=tinysrgb&w=800', 25, ARRAY['body_part:celé_tělo', 'physio_approach'], ARRAY['L2'], 9, false);

-- Insert Faceyoga lessons
INSERT INTO courses (stable_id, title, description, category, content_type, video_url, thumbnail_url, duration, tags, plan_relevance, order_index, is_premium)
VALUES
  -- Full face
  ('face_full_1', 'Full face – Jemný start', 'Základní rutina pro celý obličej, vhodné pro začátečníky', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 12, ARRAY['face_full', 'face_level:L1'], ARRAY['L1', 'L2', 'Restart'], 1, false),
  ('face_full_2', 'Full face – Hlouběji', 'Intenzivnější práce s celým obličejem', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 22, ARRAY['face_full', 'face_level:L2'], ARRAY['L2'], 2, false),
  
  -- Oči
  ('face_oci_1', 'Základní péče o oči – 10 min', 'Uvolnění napětí kolem očí po práci u počítače', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 10, ARRAY['face_area:oči', 'face_level:L1', 'short_lesson'], ARRAY['L1', 'L2', 'Restart'], 3, false),
  ('face_oci_2', 'Detail očí – tonus a okolí', 'Pokročilá práce s oblastí očí', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 15, ARRAY['face_area:oči', 'face_level:L2'], ARRAY['L2'], 4, false),
  
  -- Čelo
  ('face_celo_1', 'Uvolnění čela – Jumpstart', 'Jemné uvolnění napětí v čele', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 8, ARRAY['face_area:čelo', 'face_level:L1'], ARRAY['L1', 'L2'], 5, false),
  ('face_celo_2', 'Čelo a mimické vrásky – Demand', 'Cílená práce na oblast čela', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 12, ARRAY['face_area:čelo', 'face_level:L2'], ARRAY['L2'], 6, false),
  
  -- Tváře
  ('face_tvare_1', 'Tónus tváří', 'Posílení svalů ve tváři', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 12, ARRAY['face_area:tváře', 'face_level:L1'], ARRAY['L1', 'L2'], 7, false),
  
  -- Dolní část
  ('face_dolni_1', 'Dolní část obličeje – aktivace', 'Práce s dolní částí obličeje a čelistí', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 14, ARRAY['face_area:dolní_část', 'face_level:L2'], ARRAY['L2'], 8, false),
  
  -- Krk
  ('face_krk_1', 'Krk a dekolt – základ', 'Péče o krk a oblast dekoltu', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 10, ARRAY['face_area:krk', 'face_level:L1'], ARRAY['L1', 'L2'], 9, false),
  
  -- Situační
  ('face_rano_1', 'Ráno – oteklý obličej', 'Jemné prokrvení, lymfa a dech', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 8, ARRAY['face_situation:ráno', 'face_level:L1', 'short_lesson'], ARRAY['L1', 'L2', 'Restart'], 10, false),
  ('face_vecer_1', 'Večerní uvolnění tváře', 'Relaxace obličeje po náročném dni', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 10, ARRAY['face_situation:večer', 'face_level:L1'], ARRAY['L1', 'L2'], 11, false),
  ('face_meeting_1', 'Před meetingem', 'Rychlá příprava obličeje před důležitým setkáním', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 7, ARRAY['face_situation:před_meetingem', 'face_level:L1', 'short_lesson'], ARRAY['L1', 'L2', 'Restart'], 12, false),
  ('face_narocny_1', 'Po náročném dni', 'Úleva a regenerace pro unavený obličej', 'Facejóga', 'faceyoga', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'https://images.pexels.com/photos/3764540/pexels-photo-3764540.jpeg?auto=compress&cs=tinysrgb&w=800', 12, ARRAY['face_situation:po_náročném_dni', 'face_level:L1'], ARRAY['L1', 'L2'], 13, false);
