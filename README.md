# Persönliche App

Modulare, persönliche Web-App. Läuft statisch auf GitHub Pages, Daten liegen im Browser. Optional: eigener Push- und Sync-Dienst (Cloudflare Worker, `worker/`) für Erinnerungen bei geschlossener App und Ende-zu-Ende-verschlüsselten Abgleich zwischen Geräten.

## Veröffentlichen

Automatisch über GitHub Actions (`.github/workflows/deploy.yml`, Pages-Quelle: *GitHub Actions*):

- Push auf einen Branch `claude/**` → wird automatisch in `main` übernommen, der Branch gelöscht und die App veröffentlicht.
- Push auf `main` → App wird veröffentlicht.
- Verlauf und Status: Tab *Actions* im Repo.

App: https://mistwe-chefe.github.io/mistwe-mobile/

iPhone: In Safari öffnen → *Teilen → Zum Home-Bildschirm* → App über das Icon starten → Benachrichtigungen erlauben.

## Push & Sync einrichten (einmalig)

Anleitung: [`worker/README.md`](worker/README.md). Danach in der App: *Einstellungen → Push & Sync*.

## Neue Version

Nur `index.html` ersetzen (außer Infrastrukturdateien ändern sich ausdrücklich). Daten bleiben erhalten; vor jedem Versionswechsel legt die App automatisch einen Schnappschuss an.

Architektur: siehe Projektdokument `ARCHITEKTUR.md`.
