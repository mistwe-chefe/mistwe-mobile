# Changelog

## 1.0.0 – 2026-11-22

Erste Version. Lokal zuerst: alle Daten liegen im Browser (IndexedDB), kein Server nötig.

- Kern: Store (IndexedDB), Migrator, Backup (Schnappschüsse, Export/Import), Events, UI, Router, Registry, VersionGuard
- Kern: Erinnerungsdienst mit Eskalationsregel (Schedule, Testtabelle 10.2) und Ruhezeiten, lokale Benachrichtigungen mit Ton/Vibration, App-Abzeichen
- Kern: Service Worker (Offline, Aktionen „Erledigt“/„1 Std später“ in Benachrichtigungen), Web-App-Manifest, Icons
- Modul `start`: Startseite mit Kacheln und Hinweisen
- Modul `einstellungen`: Darstellung, Benachrichtigungen, Ruhezeiten, Datensicherung, Speicher, Module, Über, Diagnose
- Modul `todos`: ToDos mit Stufe, optionaler Abgabe und eskalierenden Erinnerungen bis zum Abhaken

Noch nicht enthalten (geplant für 1.1): Push-Dienst (Cloudflare Worker) für Erinnerungen bei geschlossener App, Ende-zu-Ende-verschlüsselter Sync zwischen Geräten.
