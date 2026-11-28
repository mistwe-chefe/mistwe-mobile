# Persönliche App – Grundregeln für Claude

Verbindliche Architektur: `ARCHITEKTUR.md` im Claude-Projekt „Persönliche App“ (Variante A: App auf GitHub Pages, Push- und Sync-Dienst als Cloudflare Worker in `worker/`).

## Arbeitsweise

1. **Direkt auf `main` pushen.** Kein Branch, kein Pull Request. Jede fertige Änderung wird sofort committet und gepusht (GitHub Pages veröffentlicht automatisch).
2. **Alles mit aktualisieren**, was zur Änderung gehört:
   - `APP_VERSION` (Konstante **und** Meta-Tag `app-version`) erhöhen, interner `CHANGELOG` in `index.html` und `CHANGELOG.md` ergänzen (mit Liste der geänderten Dateien).
   - Bei Änderungen an `sw.js`: `SW_VERSION` erhöhen. Modulversion (`version`) des geänderten Moduls erhöhen.
   - Die neue `index.html` im Claude-Projekt ersetzen (`claude/index.html`), betroffene Projektdokumente nachziehen.
3. Neue Version = vollständige neue `index.html` (nie nur Ausschnitte).
4. Ändert sich der Worker: zuerst Worker deployen, dann Frontend. Worker-API nur abwärtskompatibel. Neue D1-Migration = neue Datei.
5. Kein Datenverlust: Modul-IDs nie ändern, veröffentlichte Migrationen nie ändern, Schema-Version bei Strukturänderungen erhöhen und Migration mitliefern.
6. Keine Geheimnisse und keine persönlichen Daten im Repo.
7. Eskalationsregel für Erinnerungen existiert in `index.html` (Kern: Schedule) und `worker/src/schedule.js` – immer an beiden Stellen ändern.
8. Vor dem Push prüfen: alle `<script>`-Blöcke syntaktisch fehlerfrei (`node --check`), bei Änderungen an Erinnerungen/Sync möglichst im Browser testen.

## Oberfläche

- **Untere Tab-Leiste: nur Symbole, keine Beschriftung.** Der Modulname steht nur als `aria-label`/Tooltip (und in der breiten Seitenleiste ab 900 px). Jedes neue Modul braucht deshalb ein eindeutiges, schlichtes Linien-Symbol (`ctx.ui.icon`), keine Emojis.
- Symbol des Moduls Ernährung: Apfel (`apple`). Taschenrechner: `calculator`.
- Tab-Leiste scrollt waagerecht, wenn nicht alle Symbole passen (kein Scrollbalken); das aktive Symbol wird eingeblendet.
- **Cleanes Layout:** knappe Beschriftungen, Abkürzungen, wo möglich nur Symbole (mit `aria-label`/`title`). Keine Erklär- oder Einrichtungstexte in Modulen und Einstellungen – Erklärungen gehören in **Einstellungen → Dokumentation** (bei neuen Funktionen dort ergänzen). Hinweise nur, wenn sie wirklich nötig sind (z. B. Datenverlust droht), dann einzeilig.
- Startseite: Datum + Kennzahlen (`homeStats`) oben, Hinweise, Widgets (`widget`), darunter Modul-Schaltflächen.

## Erinnerungen (Lehren aus 1.8.2–1.8.4)

- Erinnerungen nie löschen und unter derselben ID neu anlegen, um sie „zurückzusetzen“ – verschieben (`moveTo`, `snoozeUntil`) oder `reopen` verwenden. Der Server führt `last_sent_at` per MAX zusammen; ein Zurücksetzen erzeugt sonst eine Sync-Endlosschleife.
- Je Eintrag nur eine sichtbare Mitteilung (Einmal-Benachrichtigung); Mitteilungen werden geschlossen, sobald die Erinnerung gesehen, erledigt, verschoben oder gelöscht ist.
