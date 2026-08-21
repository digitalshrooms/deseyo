/*
  # Nahrada default MUX videa novym playback ID

  1. Zmeny:
    - Vsechna video_url v tabulce courses nahrazena novym MUX playback ID

  2. Ucel:
    - Aktualizace defaultniho videa pro vsechny lekce
*/

UPDATE courses
SET video_url = 'https://player.mux.com/EhSTQq5o005fUeTIzHqJ8EdxOW70101U301GQXzM51Xiemg'
WHERE video_url IS NOT NULL;
