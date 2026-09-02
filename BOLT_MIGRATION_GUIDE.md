# Migrace dat z Bolt do Supabase

Tato aplikace má automatickou migraci dat z Bolt databáze do Supabase. Vše probíhá bez složitého nastavení.

## Jak migrovat data

### Způsob 1: Pomocí tlačítka v aplikaci (doporučeno)

1. Přihlásit se do aplikace
2. V **pravém dolním rohu** vidíš **modré tlačítko s ikonou upload**
3. Klikni na něj
4. **Vklej JSON export** tvých dat z Bolt databáze do textového pole
5. Klikni na **"Importovat data"**
6. Aplikace se automaticky restartuje a data jsou v Supabase

### Způsob 2: Pomocí AdminData stránky

1. Přihlásit se do aplikace
2. Jdi na `/admin/data`
3. Vklej JSON export dat
4. Klikni na **"Importovat data"**
5. Hotovo!

## Jak exportovat data z Bolt

Pokud máš v Bolt databázi data (v localStorage), můžeš je exportovat jako JSON:

1. Otevři DevTools (`F12`)
2. Jdi na **Console** tab
3. Zadej:
```javascript
const data = JSON.parse(localStorage.getItem('bolt_db') || '{}');
console.log(JSON.stringify(data, null, 2));
```
4. Zkopíruj výstup
5. Vklej do import formuláře

Nebo pomocí AdminData stránky klikni na **"Exportovat Bolt data (JSON)"** a data se stahy jako soubor.

## Jaká data se migrují

Migrace automaticky přepíše tato data do Supabase:

- **Uživatelé** (users) - profily, plány, progres
- **Kurzy** (courses) - všechny lekce a kurzy
- **Lekce** (lesson_completions) - které lekce jsi absolvoval
- **Komentáře** (comments) - diskuze v aplikaci
- **Události** (user_events) - tvůj progress a aktivita
- **Forum** (forum_posts) - příspěvky z komunity

## Jak to funguje

1. Při prvním importu se data uloží do localStorage pod klíčem `bolt_db`
2. Při startu aplikace (AuthContext) se automaticky spustí migrace
3. Všechna data se přepíšou do Supabase pomocí `upsert` (vytvoření nebo aktualizace)
4. Status migrace se uloží tak aby se migracija neopakovala
5. Bolt data se vymažou z localStorage po úspěšné migraci

## Opakovaný import

Pokud chceš importovat data znovu:

1. Jdi na `/admin/data`
2. Klikni na **"Vymazat status migrace"**
3. Importuj data znovu

## Technické detaily

### Soubory migrace

- `src/services/boltMigration.ts` - Migrační služba
- `src/hooks/useBoltData.ts` - Hook pro přístup k Bolt datům
- `src/components/BoltDataImporter.tsx` - UI komponenta pro import
- `src/pages/AdminData.tsx` - Administrační stránka

### Jak migrace funguje

```typescript
// Uživatel vloží JSON do formuláře
const data = JSON.parse(jsonText);

// Data se uloží do localStorage
BoltMigrationService.setBoltData(data);

// Spustí se migrace
await BoltMigrationService.migrateData();
```

Migrace:
1. Iteruje přes všechny uživatele a vloží je do `users` tabulky
2. Iteruje přes všechny kurzy a vloží je do `courses` tabulky
3. Iteruje přes všechny ostatní tabulky a migruje data
4. Pokud dojde k chybě, zobrazí se upozornění ale ostatní data se přesto migrují

## Bezpečnost

- Žádná data nejsou odesílána externě
- Vše probíhá lokálně v prohlížeči a pak přímo do tvého Supabase projektu
- Migrační status se uloží v localStorage aby se migrace neopakovala bez nutnosti
- Po migraci se Bolt data vymažou z localStorage

## Řešení problémů

### Chyba: "Chyba při importu dat"
- Zkontroluj že vkládáš validní JSON
- Pokud máš opravdu dost dat, rozdělil si je na menší části a importuj postupně

### Data se nemigrují
- Zkontroluj console (DevTools) pro detaily chyby
- Vyzkoušej vymazat status migrace a importuj znovu
- Ujisti se že máš správný Supabase klíč v `.env`

### Nemohu najít tlačítko pro import
- Tlačítko se zobrazuje pro všechny uživatele (přihlášené i nepřihlášené)
- Je to **modré tlačítko s ikonou upload v pravém dolním rohu**
- Pokud ho nevidíš, zkontroluj DevTools pro chyby

## Dotazy?

Pokud máš nějaké otázky nebo problémy s migrací, kontaktuj podporu.
