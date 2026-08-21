/*
  # Nahrazení všech videí MUX přehrávačem

  1. Změny:
    - Všechny video_url v tabulce courses nahrazeny MUX player URL
    - Video URL formát: https://player.mux.com/{playback_id}
  
  2. Účel:
    - Náhrada Vimeo za MUX pro všechna videa
    - Jednotný formát pro všechny lekce
*/

UPDATE courses 
SET video_url = 'https://player.mux.com/6SbGYqx4wjJScC86cMY8SXddw00aoQKMBUTITjfFl01jA?metadata-video-title=L1%2C+Ty%CC%81den1%2C+Den+3+-+test+&video-title=L1%2C+Ty%CC%81den1%2C+Den+3+-+test+'
WHERE video_url IS NOT NULL;
