# pa-push – Push- und Sync-Dienst

Cloudflare Worker für die Persönliche App: Push-Erinnerungen bei geschlossener App und Ende-zu-Ende-verschlüsselter Sync zwischen Geräten. Der Server sieht nur Zeitpunkte, IDs und den Erledigt-Status, keine Inhalte. Architektur: Abschnitte 8–10.

## Einmalige Einrichtung (ca. 15 Minuten)

Voraussetzung: Node.js auf dem Rechner, Cloudflare-Konto.

```bash
cd worker
npm install
npx wrangler login
```

1. **Datenbank anlegen**
   ```bash
   npx wrangler d1 create pa-db
   ```
   Die ausgegebene `database_id` in `wrangler.jsonc` eintragen.

2. **VAPID-Schlüssel erzeugen**
   ```bash
   node scripts/vapid-keys.mjs
   ```
   Den **öffentlichen** Schlüssel in `wrangler.jsonc` bei `VAPID_PUBLIC_KEY` eintragen. Den **privaten** Schlüssel im nächsten Schritt als Secret setzen. Er gehört nie ins Repo.

3. **Secrets setzen**
   ```bash
   npx wrangler secret put VAPID_PRIVATE_KEY   # Wert aus Schritt 2
   npx wrangler secret put SETUP_SECRET        # selbst gewählte, lange Zeichenkette – gut aufbewahren
   ```

4. **Prüfen:** `ALLOWED_ORIGIN` in `wrangler.jsonc` ist `https://mistwe-chefe.github.io`. Änderungen an `wrangler.jsonc` committen.

5. **Deployen**
   ```bash
   npm run deploy      # = D1-Migrationen anwenden + wrangler deploy
   ```
   Die ausgegebene Adresse notieren, z. B. `https://pa-push.<konto>.workers.dev`.

   Alternativ automatisch bei jedem Push: Cloudflare-Dashboard → *Workers & Pages → Create → Import a repository*, Root-Verzeichnis `worker`, Deploy-Befehl `npx wrangler d1 migrations apply pa-db --remote && npx wrangler deploy`, Pfadfilter `worker/**`.

6. **In der App:** *Einstellungen → Push & Sync* → Server-Adresse eintragen → *Neu einrichten* → `SETUP_SECRET`, neues Sync-Passwort (mind. 12 Zeichen), Gerätename → *Push auf diesem Gerät aktivieren* → *Test-Push*.

7. **Weitere Geräte (z. B. iPhone):** App über *Teilen → Zum Home-Bildschirm* installieren, vom Icon öffnen → *Einstellungen → Push & Sync* → *Mit bestehendem Konto verbinden* → Sync-Passwort → *Push aktivieren*.

## Regeln

- Erst den Worker deployen, dann das Frontend. API-Änderungen nur abwärtskompatibel (`/v1` bleibt).
- Neue D1-Migration = neue Datei `migrations/0002_….sql`. Bestehende Migrationen nie ändern.
- Die Eskalationsregel steht in `src/schedule.js` **und** in `index.html` (Kern: Schedule). Änderungen immer an beiden Stellen, dann `npm test`.

## Fehlersuche Push

In der App: *Einstellungen → Push & Sync → Push-Diagnose* und *Test-Push*.

| Anzeige | Bedeutung / Abhilfe |
|---|---|
| Server-Takt ⚠️ | Der Cron läuft nicht. Im Cloudflare-Dashboard beim Worker unter *Settings → Triggers* prüfen, ob `* * * * *` eingetragen ist. |
| ❌ 403 BadJwtToken | Apple lehnt den Absender ab. Secret setzen: `npx wrangler secret put VAPID_CONTACT` mit Wert `mailto:deine@adresse` (ohne Leerzeichen/Klammern). Bleibt es bei 403, prüfen, ob `VAPID_PUBLIC_KEY` und das Secret `VAPID_PRIVATE_KEY` zusammengehören. |
| ❌ 410 / 404 | Abo ungültig. In der App „Push hier deaktivieren“ und wieder aktivieren. |
| ✅ 201, aber nichts erscheint | iPhone: Fokus/„Nicht stören“ aus? *Einstellungen → Mitteilungen → (App)* erlaubt? |
| Diagnose: Migration 0002 fehlt | `npx wrangler d1 migrations apply pa-db --remote` ausführen. |

## Tests

```bash
npm test        # Eskalations-Testtabelle (10.2), Ruhezeiten, Web-Push-Verschlüsselung und VAPID
npm run dev     # lokal mit lokaler D1 (Secrets in .dev.vars, nicht im Repo)
```

## Kosten

Der Gratis-Tarif von Cloudflare Workers reicht: 1 440 Cron-Aufrufe pro Tag plus Sync-Aufrufe, ein gebündelter Push pro Gerät und Minute.

## API (Kurzfassung)

| Route | Zweck |
|---|---|
| `GET /v1/config` | `{ apiVersion, vapidPublicKey, accountExists }` |
| `GET /v1/kdf` | Salt und Iterationen der Schlüsselableitung |
| `POST /v1/setup` | Konto + erstes Gerät (`setupSecret`; mit `reset: true` Konto ersetzen) |
| `POST /v1/login` | Weiteres Gerät (`loginKey`) |
| `GET/POST /v1/sync` | Änderungen holen (`?since=`) bzw. hochladen |
| `PUT/DELETE /v1/subscription` | Push-Abo dieses Geräts |
| `POST /v1/reminders/{m}/{id}/ack` | Aus der Benachrichtigung: `done` / `snooze` |
| `PUT /v1/settings` | Zeitzone, Ruhezeiten |
| `POST /v1/test-push` | Test-Push an alle Geräte |
| `GET /v1/devices`, `DELETE /v1/devices/{id}` | Geräteverwaltung |
| `POST /v1/account/rekey` | Sync-Passwort ändern |
