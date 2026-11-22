# Changelog

## 1.5.0 – 2026-11-22

- Modul Ernährung: Textfeld für Lebensmittel. Der Text landet direkt im temporären Claude-Chat, dort nur noch abschicken.
- Claude antwortet im festen Format `KCAL v1` (eine Zeile pro Lebensmittel `Name; Menge; kcal`, am Ende `SUMME; kcal`). Die Antwort wird in der App eingefügt, eingelesen und für den gewählten Tag übernommen oder dazugerechnet. Maßgeblich ist die nachgerechnete Summe der Positionen.
- Eingegebene Lebensmittel bleiben als Entwurf erhalten, auch wenn die App beim Wechsel zu Claude neu startet.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert.

## 1.4.0 – 2026-11-22

- Neues Modul **Ernährung** (`ernaehrung`): Gewicht und Kalorien pro Tag eintragen (auch für vergangene Tage), kcal lassen sich dazurechnen.
- Verlauf als Diagramme (7 Tage, 30 Tage, 90 Tage, 1 Jahr, alles) mit Kennzahlen, Zielen (kcal/Tag, Zielgewicht) und Eintragstabelle. Die Einträge werden wie die ToDos verschlüsselt zwischen Geräten synchronisiert.
- Knopf „kcal mit Claude schätzen“ öffnet einen neuen temporären Claude-Chat mit vorbereitetem Prompt.
- Kern: neue Symbole (Waage, Pfeil links, externer Link).

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert.

## 1.3.1 – 2026-11-22

- App-Symbol unter neuen Dateinamen (`icons/*-v2.png`): iOS hatte beim Hinzufügen zum Home-Bildschirm noch das alte `apple-touch-icon.png` aus dem Zwischenspeicher verwendet. Die alten Dateien bleiben (mit neuem Motiv) für ältere Versionen erhalten.
- `sw.js` (SW_VERSION 1.3.1): neue Symbol-Dateien im Offline-Speicher und in Benachrichtigungen.

Geänderte Dateien: `index.html`, `sw.js`, `manifest.webmanifest`, neu: `icons/icon-192-v2.png`, `icons/icon-512-v2.png`, `icons/icon-maskable-512-v2.png`, `icons/apple-touch-icon-v2.png`.

## Symbol – 2026-11-22

- Neues App-Symbol: Taschenmesser (roter Griff mit weißem Kreuz) in allen Größen. App-Version bleibt 1.3.0, Daten unverändert.
- iPhone: Das Symbol auf dem Home-Bildschirm ändert sich erst, wenn die App neu hinzugefügt wird.

Geänderte Dateien: `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png`, `icons/apple-touch-icon.png`.

## 1.3.0 – 2026-11-22

- Kern: schlichte Linien-Symbole (SVG, `currentColor`) statt Emojis – Navigation, Einstellungen, ToDo-Liste, Hinweise, Toasts. Benachrichtigungen ohne Emojis.
- Kern: `ctx.ui.icon(name)` für Module; Modul-`icon` ist jetzt ein Symbolname (unbekannte Namen werden als Text gezeigt).
- Kern: `ctx.reminders.set/preview` akzeptieren `intervalMin` (frei in Minuten, hat Vorrang vor der Stufen-ID). Abwärtskompatibel, Worker unverändert (er nutzt bereits `stageMin`).
- Modul `todos`: Intervall frei in Tagen/Stunden/Minuten, Standard 2 Stunden (einstellbar über das Einstellungs-Symbol im Modul). Bestehende ToDos behalten ihr Intervall.
- Modul `todos`: neues optionales Feld `intervalMin` im Datensatz (keine Migration nötig, Schema bleibt 1).
- Modul `start`: nur noch Schaltflächen zu den Modulen.
- `sw.js` (SW_VERSION 1.3.0): Benachrichtigungen ohne Emojis.

Geänderte Dateien: `index.html`, `sw.js`.

## 1.2.0 – 2026-11-22

Bedienung des ToDo-Moduls überarbeitet.

- Modul `todos`: Aktive ToDos stehen oben, Erledigte eingeklappt darunter. Neues ToDo über den Knopf „＋ Neues ToDo“ unten; das Fenster liegt über dem Modul.
- Modul `todos`: Bereich „Erinnert“ entfernt. Das Öffnen des Moduls gilt als gesehen (Zähler in der Navigation geht zurück).
- Modul `todos`: Eigene Einstellungen (Standard-Stufe, Abstand bei Überfälligkeit) direkt im Modul über ⚙️. Der Tab „Einstellungen“ enthält nur noch modulübergreifende Einstellungen.
- Antippen einer Benachrichtigung öffnet das ToDo-Modul (nicht mehr das Bearbeiten-Fenster). Links `#/todos/<id>` markieren das ToDo in der Liste.
- Kern: lokaler Namensindex (`meta.notifyTitles`, bleibt auf dem Gerät), damit Mitteilungen den ToDo-Namen zuverlässig zeigen. Bis zu 5 Einzelmitteilungen, darüber Sammelmitteilung mit Namen im Titel.
- `sw.js` (SW_VERSION 1.2.0): nutzt den Namensindex, Antippen öffnet das Modul.

Geänderte Dateien: `index.html`, `sw.js`. Keine Schema-Änderung, Worker unverändert.

## 1.1.3 – 2026-11-22

- `sw.js` (SW_VERSION 1.1.3): protokolliert jeden empfangenen Push lokal und beim Server (`POST /v1/push-received`); Mitteilung erscheint spätestens nach 1,5 s, auch wenn der Schlüssel nicht schnell lesbar ist.
- Worker 1.1.1: Beim Melden eines Abos werden ältere Abos desselben Geräts entfernt (iOS verwirft Abos; vorher wurde an bis zu drei Abos gesendet). `GET /v1/status` liefert `lastReceivedAt`.
- App: meldet das Abo einmal neu; Push-Diagnose zeigt „Empfangen hier“.
- Keine Datenbank-Migration nötig (Migration 0002 ist bereits in `pa-db` angewendet).

## 1.1.2 – 2026-11-22

Fehlerbehebung Push auf dem iPhone.

- Kern: Berechtigung für Mitteilungen wird über die Push-API geprüft. iOS meldet in Home-Screen-Apps nach dem Antippen einer Benachrichtigung fälschlich „nicht gefragt“; die App fragt deshalb nicht mehr erneut.
- Kern: Ein vorhandenes Push-Abo wird beim Start und beim Zurückkehren in die App erkannt und dem Server gemeldet (alle 6 Stunden aufgefrischt).
- Worker 1.1.0: speichert die Antwort des Push-Dienstes (z. B. Apple) je Abo und den Zeitpunkt des letzten Cron-Laufs. Neue Route `GET /v1/status`, Test-Push liefert das Ergebnis je Gerät. Optionales Secret `VAPID_CONTACT` (z. B. `mailto:…`) ersetzt `VAPID_SUBJECT`.
- Modul `einstellungen`: „Push-Diagnose“ unter *Push & Sync*.
- Neue D1-Migration `worker/migrations/0002_push_status.sql`. **Worker zuerst deployen** (inkl. Migration), dann gilt die neue App.

## 1.1.1 – 2026-11-22

- Neue Stufe „1 Minute (Test)“ (ID `1m`) zum Ausprobieren von Erinnerungen und Push. Ruhezeiten gelten auch hier.
- Geändert: `index.html`, `worker/src/schedule.js` (nur Ergänzung der Stufentabelle; der Worker funktioniert auch ohne Neu-Deploy, weil die App die Minutenzahl mitschickt).

## 1.1.0 – 2026-11-22

Push bei geschlossener App und Sync zwischen Geräten.

- Neu: Push- und Sync-Dienst als Cloudflare Worker im Ordner `worker/` (Cron jede Minute, Web Push mit VAPID, D1-Datenbank). Einrichtung: `worker/README.md`.
- Kern: Crypto (PBKDF2/HKDF, AES-GCM), Api, Sync mit Outbox und Konfliktlösung, Push-Abo je Gerät. Inhalte sind Ende-zu-Ende-verschlüsselt, der Server sieht nur Zeitpunkte und Status.
- Kern: Mit erreichbarem Push-Dienst löst der Server Erinnerungen aus. Ist er länger als 15 Minuten nicht erreichbar, erinnert die App wieder lokal.
- Kern: Ruhezeiten gelten auch auf dem Server. Importierte Daten werden nach dem Neustart hochgeladen.
- `sw.js` (SW_VERSION 1.1.0): entschlüsselt Titel in Push-Benachrichtigungen, „Erledigt“/„1 Std später“ gehen direkt an den Server, Abo-Erneuerung.
- Modul `einstellungen`: Bereich „Push & Sync“ (Einrichten, Verbinden, Push aktivieren, Test-Push, Geräte, Sync-Passwort ändern, Gerät abmelden).
- Modul `start`: Hinweise zur Einrichtung von Push.
- CSP: `connect-src` erlaubt `https://*.workers.dev`. Bei eigener Domain für den Worker die CSP anpassen.

Geänderte Dateien: `index.html`, `sw.js`, neu `worker/**`. Daten aus 1.0 bleiben unverändert (keine Schema-Änderung).

## 1.0.0 – 2026-11-22

Erste Version. Lokal zuerst: alle Daten liegen im Browser (IndexedDB), kein Server nötig.

- Kern: Store (IndexedDB), Migrator, Backup (Schnappschüsse, Export/Import), Events, UI, Router, Registry, VersionGuard
- Kern: Erinnerungsdienst mit Eskalationsregel (Schedule, Testtabelle 10.2) und Ruhezeiten, lokale Benachrichtigungen mit Ton/Vibration, App-Abzeichen
- Kern: Service Worker (Offline, Aktionen „Erledigt“/„1 Std später“ in Benachrichtigungen), Web-App-Manifest, Icons
- Modul `start`: Startseite mit Kacheln und Hinweisen
- Modul `einstellungen`: Darstellung, Benachrichtigungen, Ruhezeiten, Datensicherung, Speicher, Module, Über, Diagnose
- Modul `todos`: ToDos mit Stufe, optionaler Abgabe und eskalierenden Erinnerungen bis zum Abhaken

Noch nicht enthalten (geplant für 1.1): Push-Dienst (Cloudflare Worker) für Erinnerungen bei geschlossener App, Ende-zu-Ende-verschlüsselter Sync zwischen Geräten.
