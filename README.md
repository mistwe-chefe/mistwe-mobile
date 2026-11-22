# Persönliche App

Modulare, persönliche Web-App. Läuft statisch auf GitHub Pages, Daten bleiben im Browser.

## Veröffentlichen

Automatisch über GitHub Actions (`.github/workflows/deploy.yml`, Pages-Quelle: *GitHub Actions*):

- Push auf einen Branch `claude/**` → wird automatisch in `main` übernommen, der Branch gelöscht und die App veröffentlicht.
- Push auf `main` → App wird veröffentlicht.
- Verlauf und Status: Tab *Actions* im Repo.

App: https://mistwe-chefe.github.io/mistwe-mobile/

iPhone: In Safari öffnen → *Teilen → Zum Home-Bildschirm* → App über das Icon starten → Benachrichtigungen erlauben.

## Neue Version

Nur `index.html` ersetzen (außer Infrastrukturdateien ändern sich ausdrücklich). Daten bleiben erhalten; vor jedem Versionswechsel legt die App automatisch einen Schnappschuss an.

Architektur: siehe Projektdokument `ARCHITEKTUR.md`.
