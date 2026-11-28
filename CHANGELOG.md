# Changelog

## 1.14.0 – 2026-11-28

- **Einstellungen als Menü:** Statt einer langen Seite eine Liste mit sieben Punkten, jeweils mit kurzem Status: Push & Sync (aus/an, Push), Benachrichtigungen (Status, Ruhezeit), Darstellung, Daten & Speicher (letzter Export), Module (x von y aktiv), Dokumentation, Über & Diagnose (Version). Jeder Punkt öffnet eine eigene Unterseite (`#/einstellungen/<bereich>`) mit Zurück-Pfeil; Daten & Speicher sowie Über & Diagnose fassen je zwei Bereiche zusammen. Der doppelte Kartentitel entfällt auf Unterseiten mit nur einem Bereich.
- Hinweise „Sync einrichten/verbinden“ (Startseite, Banner) öffnen direkt Push & Sync.
- Einstellungen 1.2.0 (Hook `onRoute`), neues Symbol `chevron-right`.

Geänderte Dateien: `index.html`, `CHANGELOG.md`, `CLAUDE.md`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.13.1 – 2026-11-28

- Kern: Schönheitsfehler bei Uhrzeit-/Datumsfeldern auf dem iPhone behoben. Safari gibt diesen Feldern eine eigene Mindestbreite und Höhe; dadurch ragte im Wecker das Feld „Ab“ unter „Anzahl“ und war höher als die Nachbarfelder, in den Einstellungen ragte „Bis“ der Ruhezeiten aus der Karte. Jetzt: `appearance: none`, `min-width: 0`, feste Höhe, Text linksbündig; Spalten mit `minmax(0, …)` bzw. `flex: 1 1 0`.
- Wecker 1.2.1: alle drei Felder gleich hoch.

Geänderte Dateien: `index.html`, `CHANGELOG.md`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.13.0 – 2026-11-28

- **Startseite: Mini-Übersicht Ernährung** direkt unter dem ToDo-Fenster: heutiges Gewicht, heute zugeführte kcal (bei gesetztem kcal-Ziel als „x / Ziel“) und Eiweiß. Antippen öffnet das Modul Ernährung. Aktualisiert sich bei jeder Änderung und beim Tageswechsel.
- **Startseite: weniger Schaltflächen.** ToDos, Tägliche Ziele, Ernährung und Einkaufen haben keine Schaltfläche mehr (erreichbar über Tab-Leiste, ToDo-Fenster, Mini-Übersicht bzw. Kennzahlen oben rechts). Wecker und Taschenrechner bleiben.
- Kern/Start 1.3.0: Moduloption `homeTile: false`. Modulversionen: Ernährung 1.5.0 (Widget), ToDos 1.6.1, Tägliche Ziele 1.1.1, Einkaufen 1.0.1. Dokumentation → Ernährung ergänzt.

Geänderte Dateien: `index.html`, `CHANGELOG.md`, `CLAUDE.md`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.12.2 – 2026-11-28

- **Updates zuverlässig erkennen und laden:** Die Update-Prüfung holt `index.html?u=<Zeit>` mit `cache: 'no-store'` und stößt `registration.update()` an. Bisher konnte auf dem iPhone bzw. über das GitHub-Pages-CDN noch die alte Datei zurückkommen, sodass keine neue Version erkannt wurde.
- **„Neu laden“ umgeht alle Caches:** Ohne wartenden Service Worker lädt die App jetzt `…?u=<Zeit>` statt `location.reload()` (das lieferte oft wieder die alte Version, in der Home-Bildschirm-App gab es keinen anderen Weg). Der Parameter wird beim Start sofort aus der Adresse entfernt.
- Einstellungen → Über: „Updates prüfen“ meldet „Neue Version x (Neu laden)“, „Aktuell (x)“ oder „Prüfung fehlgeschlagen“; zusätzlicher Knopf „Neu laden“. Dokumentation → Updates.
- Service Worker 1.8.0: Nicht-Navigations-Anfragen mit Query (Cache-Buster) gehen direkt ans Netz und werden nicht gecacht.

Geänderte Dateien: `index.html`, `sw.js`, `CHANGELOG.md`. Worker und Manifest unverändert. Keine Datenänderung.

## 1.12.1 – 2026-11-28

- **Taschenrechner ohne Scrollen:** Das Modul misst den freien Platz zwischen Kopfzeile und Tab-Leiste und passt sich an. Zuerst ändert sich die Displayhöhe (120–240 px), reicht das nicht, werden die Tasten flacher (bis 60 %), zuletzt das Display (min. 92 px). Neu berechnet bei Größenänderung und Drehen. Seitenabstände auf der Rechner-Seite verkleinert.

Geänderte Dateien: `index.html`, `CHANGELOG.md`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.12.0 – 2026-11-28

- **Neues Modul Einkaufen** (`einkaufen`, Symbol `cart`) mit vier getrennten Bereichen:
  - **Lebensmittel:** mehrere Einkaufslisten. **Gerne-Liste** (Stern) mit Lebensmitteln, die du gerne kaufst. Beim Anlegen einer neuen Liste werden alle Gerne-Einträge vorgeschlagen, „fällige“ (üblicher Abstand seit dem letzten Kauf verstrichen) sind vorausgewählt; offene Posten älterer Listen lassen sich übernehmen. Unter dem Eingabefeld Vorschläge aus der Gerne-Liste, die noch fehlen. Stern am Posten fügt ihn der Gerne-Liste hinzu bzw. entfernt ihn. Abgeschlossene Listen unter „Erledigt“, wieder öffnen möglich.
  - **Drogerie:** eigene fortlaufende Liste, frühere Einträge als Vorschläge.
  - **Online:** Offen → Bestellt → Erhalten, mit Shop, Link, Preis, Lieferdatum, Notiz.
  - **Anschaffungen:** Preis ca., Priorität, Link, Notiz, Summe der offenen Preise, abhaken = gekauft.
- Alle Bereiche synchronisiert (Collections `listen`, `posten`, `gerne`, `online`, `gross`). Startseite oben rechts: Einkaufswagen mit Zahl offener Posten.
- Kern: neues Symbol `cart`.
- Einstellungen → Dokumentation → Einkaufen.

Geänderte Dateien: `index.html`, `CHANGELOG.md`, `CLAUDE.md`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung bestehender Module.

## 1.11.0 – 2026-11-28

- **Neues Modul Taschenrechner** (`rechner`, Symbol `calculator`) nach dem Vorbild Casio ClassWiz CW (fx-87DE CW): gleiches Tastenfeld mit SHIFT- (gold) und ALPHA-Belegung (pink), Display darüber. Natural Display (Bruch, Wurzel, Potenz, log zur Basis, Abs, ×10ˣ), exakte Ergebnisse (Bruch, Wurzelterm, π) mit S⇔D, Variablen A–F/x/y/M mit STO/RECALL/M+/M−/CALC, Verlauf, DEL/INS/UNDO, °′″, ENG, ÷R, Pol/Rec, nPr/nCr, FACT, Rnd/RndFix, Ran#/RanInt, periodische Dezimalzahlen; OPTN mit Hyperbelfunktionen, Winkeleinheiten, technischen Symbolen, ∫, d/dx, Σ, GCD/LCM. MENU: Berechnungen, Tabelle, Gleichungen (LGS 2–4, Polynom Grad 2–4 inkl. komplexer Lösungen). SETUP, RESET, OFF/ON. Tastaturbedienung am Computer. Daten nur lokal (nicht synchronisiert).
- Kern: untere Tab-Leiste waagerecht scrollbar ohne Scrollbalken (Scroll-Snap, min. 56 px je Symbol), aktives Symbol wird eingeblendet.
- Einstellungen → Dokumentation → Taschenrechner.

Geänderte Dateien: `index.html`, `CHANGELOG.md`, `CLAUDE.md`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung bestehender Module.

## 1.10.1 – 2026-11-28

- Modul Wecker: Einrichtungsanleitung samt „Name kopieren“ und Test-Knopf aus dem Modul entfernt. Die Anleitung für die beiden Kurzbefehle steht in Kurzform unter Einstellungen → Dokumentation → Wecker.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.10.0 – 2026-11-28

- **Aufgeräumtes Layout:** knappe Beschriftungen und Abkürzungen, mehr Symbole (z. B. „+“ statt „Neues ToDo“, „Tagesziel“, „Dazu“), Erklär- und Einrichtungstexte aus Modulen und Einstellungen entfernt. Hinweise auf der Startseite sind einzeilig und kurz.
- **Einstellungen → Dokumentation:** alle Erklärungen gesammelt, aufklappbar: Daten & iPhone (was beim Entfernen der Home-Bildschirm-App verloren geht und was Sync zurückholt), Erinnerungen, ToDos, Tägliche Ziele, Ernährung, Wecker, Push & Sync, Datensicherung.
- **Startseite:** ToDo-Ausschnitt jetzt ca. 1/4 der Höhe (min. 130 px), Hinweise je ToDo immer einzeilig unter dem Titel. Oben rechts neben dem Datum klein Flamme (Tage in Folge) und Stern (Punkte) aus „Tägliche Ziele“.
- **ToDos:** Farbskala für „×“ an den Standard-Turnus gebunden: bei 2 Std bis 2 Tage grün, ab 5 Tagen rot; andere Intervalle verschieben die Grenzen im selben Verhältnis (30 Min → 12/30 Std, 1 Tag → 24/60 Tage). Pillen kürzer („2 Std“, „18×“).
- **Ernährung:** Eingabe- und Antwortfeld bei „Mit Claude schätzen“ einzeilig (wachsen beim Tippen), Knopf „Claude fragen“, „+ kcal“, kürzere Kennzahlen.
- **Tägliche Ziele, Wecker:** kürzere Texte; Ziele-Abfragehinweis „Geschafft? Abhaken.“
- Kern: Modul-Hook `homeStats()` für kleine Kennzahlen auf der Startseite; neue Symbole `paste`, `book`.

Geänderte Dateien: `index.html`, `CLAUDE.md`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.9.4 – 2026-11-28

- App-Logo: Fehler beim Erzeugen der kleinen Größen behoben. Beim Apple-Touch-Icon (180 px) und beim 192-px-Icon war der dunkle Hintergrund nur oben links ein Viertel groß, der Rest weiß. Ursache: Das Render-Skript hat die Größenangabe auch im Hintergrund-Rechteck ersetzt. Skript jetzt als `icons/logo-render.py` im Repo.
- Icon-Dateien `icons/*-v5.png` (neue Namen gegen Caches), v4 entfernt. Service Worker 1.7.0.

Geänderte Dateien: `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` (neu: `*-v5.png`, `logo-render.py`, entfernt: `*-v4.png`). Worker unverändert. Keine Datenänderung.

## 1.9.3 – 2026-11-28

- App-Logo überarbeitet: Griff weiter waagerecht, etwas kleiner; dafür stehen Korkenzieher, Flaschenöffner und Schere heraus (keine Klinge). Gleicher kräftiger Stil mit dicken Konturen.
- Icon-Dateien `icons/*-v4.png` (neue Namen gegen Caches); die erst kurz verwendeten v3-Dateien sind entfernt. Quelle weiter `icons/logo.svg` / `icons/logo-quelle.py`.
- Service Worker 1.6.0 (neue Icon-Pfade).

Geänderte Dateien: `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` (neu: `*-v4.png`, geändert: `logo.svg`, `logo-quelle.py`, entfernt: `*-v3.png`). Worker unverändert. Keine Datenänderung.

## 1.9.2 – 2026-11-28

- Neues App-Logo: Taschenmesser zugeklappt (keine ausgefahrene Klinge), waagerecht statt schräg, kräftiger gezeichnet – dicke dunkle Konturen, großer roter Griff, weißes Kreuz, eingeklappte Werkzeuge und Schlüsselring.
- Neue Icon-Dateien `icons/*-v3.png` (neue Namen, damit Browser- und Service-Worker-Caches sie sicher neu laden). Quelle: `icons/logo.svg`, erzeugt mit `icons/logo-quelle.py`. Die alten v2-Dateien bleiben vorerst liegen.
- Service Worker 1.5.0 (neue Icon-Pfade im Offline-Cache).

Geänderte Dateien: `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` (neu: `icon-192-v3.png`, `icon-512-v3.png`, `icon-maskable-512-v3.png`, `apple-touch-icon-v3.png`, `logo.svg`, `logo-quelle.py`). Worker unverändert. Keine Datenänderung.

Hinweis iPhone: Das Symbol auf dem Home-Bildschirm aktualisiert iOS erst, wenn die App vom Home-Bildschirm entfernt und neu hinzugefügt wird. Vorher unbedingt prüfen, dass Push & Sync eingerichtet ist (Daten liegen sonst nur im Speicher dieser Home-Screen-App) oder einen Export machen.

## 1.9.1 – 2026-11-28

- Modul ToDos: Der Hinweis „… × erinnert“ ist farbig nach der Zeit, die das ToDo schon offen ist: bis 2 Tage grün, danach stufenlos über Gelb und Orange bis 5 Tage rot (ab 5 Tagen bleibt es rot). Gilt in der Liste und im Ausschnitt auf der Startseite; erledigte ToDos bleiben grau. Der Tooltip zeigt „offen seit …“.
- Kern: `ui.h()` setzt auch CSS-Variablen (`style: { '--name': … }`).

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.9.0 – 2026-11-28

- Startseite: scrollbarer Ausschnitt mit den **aktiven ToDos**, etwa ein Drittel der Bildschirmhöhe (mindestens 160 px). Sortiert wie im Modul (überfällig → Abgabe → nächste Erinnerung). Abhaken direkt im Ausschnitt (mit „Rückgängig“), Antippen springt zum ToDo in der Liste, „+“ legt ein neues an.
- Startseite: Begrüßung („Guten Morgen/Hallo/Guten Abend“) entfernt; das Datum bleibt klein oben. Die Modul-Schaltflächen stehen unter dem ToDo-Ausschnitt.
- Kern: Der Modul-Hook `widget(el, ctx)` wird jetzt auf der Startseite angezeigt (`Registry.widget`); Ereignis-Abos und Intervalle des Widgets werden beim Verlassen der Startseite beendet. Weitere Module können so eigene Ausschnitte liefern.
- Modul ToDos 1.4.0 (Widget), Modul Start 1.1.0.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.8.5 – 2026-11-28

- Kern: Die untere Tab-Leiste zeigt nur noch Symbole, ohne Beschriftung. Der Name bleibt für Bedienungshilfen und als Tooltip erhalten; die breite Seitenleiste ab 900 px zeigt weiter Symbol und Name. Alle Tabs passen jetzt ohne Scrollen auf ein Handy.
- Modul Ernährung: neues Symbol Apfel statt Waage.
- Neu: `CLAUDE.md` mit den Grundregeln (direkt auf `main` pushen, alles mitaktualisieren, Tab-Leiste nur Symbole).

Geänderte Dateien: `index.html`, `CLAUDE.md` (neu). Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.8.4 – 2026-11-28

- Modul Tägliche Ziele: **Endlosschleife behoben.** Nach Mitternacht hat die App die Abfrage vom Vortag ständig gelöscht, neu angelegt und mit dem Server abgeglichen. Der Server behielt dabei „zuletzt gesendet“, sodass das Gerät die Abfrage bei jedem Abgleich für neu ausgelöst hielt. Folge: Die Tab-Leiste flackerte etwa jede Sekunde, die App rief den Server rund 20-mal pro Minute auf, und der Hinweis „Ansehen“ kehrte immer wieder.
- Die Abfrage wird jetzt nur noch verschoben bzw. wieder geöffnet, nie gelöscht und neu angelegt.
- Kern: Wird eine Erinnerung über einer gelöschten neu angelegt, übernimmt sie „zuletzt gesendet“ und den Zähler. Das verhindert dieselbe Schleife an anderer Stelle.
- Geprüft mit einem nachgebauten Push-Dienst: vorher ca. 40 Neuzeichnungen und 20 Uploads pro Minute, danach keine; ein Gerät in der Schleife beruhigt sich nach dem Update von selbst.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.8.3 – 2026-11-28

- Modul Tägliche Ziele: Die In-App-Leiste „Tägliche Ziele … Ansehen“ am unteren Bildschirmrand entfällt komplett. Die Abfrage kommt nur noch als Mitteilung des Systems (und als Zähler in der Navigation).
- Kern: Module können mit `reminderToast: false` den In-App-Hinweis für ihre Erinnerungen abschalten. ToDos zeigen ihn weiterhin.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert. Keine Datenänderung.

## 1.8.2 – 2026-11-28

- Kern: **Einmal-Benachrichtigung.** Je ToDo bzw. Abfrage ist immer nur eine Mitteilung sichtbar. Kommt die nächste Erinnerung, wird die alte geschlossen, statt dass sich die Mitteilungen in der Mitteilungszentrale stauen (iOS ersetzt Mitteilungen mit gleichem Tag nicht zuverlässig).
- Kern: Mitteilungen verschwinden automatisch, sobald die Erinnerung gesehen (Modul geöffnet), erledigt, verschoben oder gelöscht ist.
- Kern: neue Funktion `ctx.reminders.moveTo(id, ts)` – verschiebt nur den Zeitpunkt, der Status „ungesehen“ bleibt.
- Modul Tägliche Ziele: Der Abfrage-Hinweis im Modul erscheint nur noch einmal pro Tag bzw. Woche – er verschwindet nach dem ersten Abhaken oder mit „OK“. Die Abfrage-Mitteilung vom Abend bleibt nicht mehr dauerhaft stehen.
- Service Worker 1.4.0: schließt bei jedem Push ältere Mitteilungen derselben Einträge.

Geänderte Dateien: `index.html`, `sw.js`. Worker und Manifest unverändert. Keine Datenänderung, keine Migration.

## 1.8.1 – 2026-11-25

- Modul Ernährung: Einträge (kcal, Nährstoffe, Gewicht) auch für zukünftige Tage, bis 30 Tage im Voraus. Solche Tage sind als „geplant“ markiert.
- Geplante Tage erscheinen in der Eintragstabelle; Diagramme und Durchschnitte reichen weiter nur bis heute. Wird ein geplanter Tag zu „heute“, zählt er automatisch normal mit.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert.

## 1.8.0 – 2026-11-23

- Neues Modul **Tägliche Ziele** (`ziele`): Tagesziele und Wochenziele anlegen, abhaken, umbenennen, löschen.
- Abfrage mit Benachrichtigung: Tagesziele jeden Abend um 20:30, Wochenziele am Sonntag um 20:00 (Uhrzeiten und An/Aus über das Einstellungs-Symbol im Modul). Läuft über den Erinnerungsdienst, kommt also mit eingerichtetem Push auch bei geschlossener App. Sind schon alle Ziele abgehakt, entfällt die Abfrage für diesen Tag bzw. diese Woche.
- Serie „Tage in Folge“ (und „Wochen in Folge“), Rekord, Punkte als Währung für spätere Funktionen: alle Tagesziele erledigt +1, je Wochenziel +3 Extra-Punkte, alle Wochenziele +5 Bonus.
- Verlauf der letzten 14 Tage und 6 Wochen; die letzten 7 Tage und 2 Wochen lassen sich nachtragen.
- Kern: neue Symbole (Ziel, Flamme, Stern).
- Daten: neue synchronisierte Collections `ziele/goals`, `ziele/checkins`, `ziele/ledger` (Schema 1). Bestehende Daten unverändert, keine Migration.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert.

## 1.7.2 – 2026-11-22

- Modul Wecker: Die App übergibt jede Weckzeit als vollständiges Datum („TT.MM.JJJJ HH:MM“, Datum des tatsächlichen Klingelns).
- Kurzbefehl „PA Wecker stellen“: in der Wiederholung zuerst „Datumsangaben aus Eingabe abrufen“, dann „Wecker erstellen“ mit diesen Datumsangaben. Behebt „Keine Konvertierung von Text in Datum“. Anleitung im Modul angepasst.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert.

## 1.7.1 – 2026-11-22

- Modul Wecker: Die Uhrzeiten gehen jetzt über die Zwischenablage an den Kurzbefehl „PA Wecker stellen“ (Aktion „Zwischenablage abrufen“). Die Share-Sheet-Einstellung, die es in aktuellen iOS-Versionen nicht mehr gibt, ist nicht mehr nötig. Einrichtungsanleitung im Modul angepasst.
- Bestehender Kurzbefehl „PA Wecker stellen“ muss angepasst werden: als erste Aktion „Zwischenablage abrufen“, „Text teilen“ teilt dann die Zwischenablage.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert.

## 1.7.0 – 2026-11-22

- Neues Modul **Wecker** (`wecker`): mit einem Knopfdruck mehrere Wecker stellen – erster Wecker, Anzahl und Abstand frei wählbar (Standard: 10 Wecker im Abstand von 3 Minuten, ab 06:00). Vorschau aller Uhrzeiten, Warnung, wenn die Wecker schon heute klingeln würden.
- Mit einem Knopfdruck (und Rückfrage) alle Wecker der Uhr-App löschen.
- Läuft über zwei iOS-Kurzbefehle („PA Wecker stellen“, „PA Wecker löschen“), die einmalig angelegt werden. Einrichtungsanleitung und Testwecker im Modul. Benötigt iOS 17 oder neuer.
- Kern: neues Symbol (Wecker).
- Daten: nur lokale Einstellungen des Moduls, keine Migration, nichts wird synchronisiert.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert.

## 1.6.0 – 2026-11-22

- Modul Ernährung: Eiweiß, Kohlenhydrate, Ballaststoffe und Fett pro Tag – eintragen, Durchschnitt im Zeitraum, Diagramm (Nährstoff wählbar), Ziele und Spalten in der Eintragstabelle.
- Claude schätzt jetzt auch die Nährwerte. Neues Antwortformat `KCAL v2`: `Name; Menge; kcal; Eiweiß; Kohlenhydrate; Ballaststoffe; Fett`, am Ende `SUMME; …`. Antworten im alten Format `KCAL v1` werden weiter eingelesen.
- Protokoll pro Tag: jede Übernahme aus Claude und jedes „Dazu“ mit Uhrzeit, Positionen und Nährwerten. Einzelne Einträge lassen sich löschen, ihre Werte werden dann vom Tag abgezogen.
- Daten: neue optionale Felder `proteinG`, `carbsG`, `fiberG`, `fatG`, `log` im Tagesdatensatz – keine Migration nötig, bestehende Einträge bleiben unverändert.

Geänderte Dateien: `index.html`. Worker, `sw.js` und Manifest unverändert.

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
