# RurNova – Asset-Generierungs-Prompts (isometrische Sprites)

Exakte Vorgaben für die noch fehlenden Sprite-Assets der PixiJS-Map.
Bereits vorhanden: Wasser-Tiles (`tile_deep_water`, `tile_river_middle`, `tile_shallow_water`,
`tile_pebble_shore_left/right`) + `rur_valley_background`.

Noch zu erzeugen:
- **5 Terrain-Tiles:** Wiese, Auwald, Acker, Gewerbe, Siedlung
- **Gebäude-Sprites:** pro Kategorie oder pro Gebäude (Liste unten)

---

## 1. Gemeinsame technische Spezifikation (für ALLE Tiles identisch)

```
PROJEKTION:   Isometrisches Hex-Tile, "pointy-top"-Hexagon mit vertikalen
              linken/rechten Kanten (Spitzen oben & unten).
              Seitenverhältnis der Oberfläche = 3:2 (Breite:Höhe).
CANVAS:       360 × 400 px, transparenter Hintergrund (PNG mit Alpha).
              KEIN Hintergrund, KEINE Bodenfläche, KEIN Schachbrett.
OBERFLÄCHE (Top-Face) – exakte Eckpunkte auf der 360×400-Leinwand:
              oben    (180,  20)
              o-rechts(360,  80)
              u-rechts(360, 200)
              unten   (180, 260)
              u-links (  0, 200)
              o-links (  0,  80)
3D-SOCKEL:    Unter der Oberfläche ein massiver "Dorfromantik"-Kartonsockel,
              Tiefe 96 px gerade nach unten extrudiert:
              linke Sockelfläche:  (0,200)→(180,260)→(180,356)→(0,296)
              rechte Sockelfläche: (180,260)→(360,200)→(360,296)→(180,356)
              Sockel mit geschichteten Erd-/Gesteinsstraten (siehe Palette).
KONTAKTSCHATTEN: weicher, warm-erdiger Schatten direkt unter dem Sockel
              (Mitte ~y=360), leicht nach unten/rechts versetzt.
LICHT:        Sonne von OBEN-LINKS. Top-Face oben-links heller (~+13 %),
              oben-rechts nur schwach (~+4 %). Rechte Sockelfläche dunkler
              als die linke (Ambient Occlusion zum Boden hin zunehmend).
RÄNDER:       Tile-Kanten exakt am Hexagon ausgerichtet, damit die Tiles
              nahtlos tessellieren (kein Überstand, keine Lücke).
ANTI-ALIASING: sauber, aber knackige Silhouette; keine weichgezeichneten Ränder.
```

## 2. Kunst-Stil (für ALLE Assets identisch)

```
STIL: Gemütliches, malerisches Low-Poly-Isometrie im Stil von "Terra Nil"
      trifft "Dorfromantik" – warme Pergament-/Leinen-Anmutung, handgemalte
      Brettspiel-Diorama-Kacheln, dicke physische Karton-Slabs, weiche
      facettierte Schattierung, naturnahe Erdtöne. Keine Neon-Farben,
      kein Photorealismus, kein harter Cartoon-Outline.
NEGATIV (--no): Text, Schrift, Buchstaben, Zahlen, Rahmen, Gitter, UI,
                Hintergrund, Wasserzeichen, mehrere Kacheln, Schlagschatten
                in falscher Richtung.
```

## 3. Terrain-Palette (exakte Hex-Werte aus dem Code)

| Terrain | Top-Face | Linke Seite | Rechte Seite (dunkler) |
|---|---|---|---|
| **Wiese** (Blumenwiese) | `#8FB86A` | `#72994C` | `#547238` |
| **Auwald** (Auwald/Ufergehölz) | `#5A7247` | `#465937` | `#303D24` |
| **Acker** (Ackerland) | `#BC6C25` | `#9C5719` | `#754010` |
| **Gewerbe** (Gewerbefläche) | `#8B8273` | `#71695C` | `#554E44` |
| **Siedlung** (Siedlung/Dorf) | `#C48B71` | `#A0705A` | `#7C5442` |

Gemeinsame Sockel-Strata (unter der Kappenfarbe, von oben nach unten):
`#322214` (Boundary) → `#513D28` (Lehm) → `#3E2E1E` (Gestein) → `#19120B` (Basis-AO).

## 4. Terrain-spezifische Oberflächen-Details (Top-Face)

- **Wiese:** sattes Grasgrün, vereinzelt winzige Wildblumen (weiß/gelb/rosa),
  Grasbüschel-Tupfer. Flach, lebendig.
- **Auwald:** dichtere dunkelgrüne Belaubung, 2–4 kleine stilisierte Laubbäume
  (runde Kronen), Unterholz-Schatten. Wirkt erhöht/plateauartig.
- **Acker:** parallele Pflugfurchen (diagonal entlang der Iso-Achse),
  erdiges Braun, leicht abgesenkt.
- **Gewerbe:** versiegelter, grau-beiger Untergrund, dezente Schotter-/
  Betonstruktur, nüchtern.
- **Siedlung:** warmer Terracotta-Grund mit 1–2 winzigen Häuschen
  (rote Satteldächer, helle Wände), wirkt leicht erhöht.

## 5. Gebäude-Sprites

Gebäude sitzen MITTIG auf einer Tile-Oberfläche. Eigener Canvas
**180 × 220 px**, transparent, gleiche Iso-Projektion & Lichtrichtung
(oben-links), weicher Bodenkontakt-Schatten als Ellipse.
Maßstab: Baukörper-Grundfläche ≈ 120 px breit, Höhe je nach Typ.

Kategorie-Leitfarbe (Dach/Akzent):

| Kategorie | Farbe | Beispiel-Gebäude |
|---|---|---|
| ecology | `#5A7247` | Auenwald-Anpflanzung, Altarm, Totholz, Kieslaichbett |
| water | `#2F7DA0` | Fischpass, Deichrückverlegung, Polder |
| fauna | `#B9742A` | Biber-Station, Insektenhotel |
| economy | `#6B6359` | Wasserkraft, Solarpark, Windkraft, Intensiv-Farm |
| infrastructure | `#7C5AA0` | Papierfabrik Schoellershammer, Rurtalbahn-Halt |
| tourism | `#12A594` | Besucherzentrum, Campingplatz, Kanuverleih |

---

## 6. FERTIGES BEISPIEL – Terrain "Auwald"

> Isometric hex terrain tile, cozy painterly low-poly board-game diorama style
> (Terra Nil meets Dorfromantik), warm parchment palette. Pointy-top hexagon
> top face with vertical left/right edges, ratio 3:2; thick extruded cardboard
> slab base (96 px deep) with layered earth/rock strata. Top face is a lush
> riparian floodplain forest in deep forest green **#5A7247** with 3 small
> stylised round-crown deciduous trees and shaded undergrowth, reading slightly
> raised like a plateau. Left slab face **#465937**, right slab face darker
> **#303D24**, strata boundary **#322214** → loam **#513D28** → rock **#3E2E1E**
> → deep ambient-occlusion base **#19120B**. Sunlight from upper-left: top-left
> of the top face brighter, right face darker. Soft warm earthy contact shadow
> beneath the slab. Canvas 360×400 px, fully transparent background, crisp
> tessellating edges, no background, no text, no grid.
> --no text, letters, frame, grid, background, watermark, multiple tiles

## 7. FERTIGES BEISPIEL – Gebäude "Papierfabrik Schoellershammer"

> Isometric building sprite, cozy painterly low-poly board-game style (Terra Nil
> meets Dorfromantik), warm muted palette. A small stylised industrial paper mill:
> rectangular factory hall with a tall chimney, infrastructure accent colour
> **#7C5AA0** on roof trim, weathered concrete/zinc walls, subtle warm window
> glow. Isometric projection matching hex tiles, sunlight from upper-left, soft
> elliptical ground-contact shadow. Sits centred, footprint ~120 px wide.
> Canvas 180×220 px, fully transparent background, no base tile, no text.
> --no text, letters, frame, grid, background, watermark, tile floor

---

## 8. Wiederverwendbares Template (Felder ausfüllen)

> Isometric **{TILE|BUILDING}** sprite, cozy painterly low-poly board-game diorama
> style (Terra Nil meets Dorfromantik), warm parchment palette. {GEOMETRIE-BLOCK
> aus §1}. {MOTIV-BESCHREIBUNG}. Top/main colour **{TOP_HEX}**, left face
> **{LEFT_HEX}**, right face **{RIGHT_HEX}**{, strata §3 bei Tiles}. Sunlight from
> upper-left, soft warm contact shadow. Canvas **{CANVAS}** px, fully transparent
> background, crisp edges, no background, no text, no grid.
> --no text, letters, frame, grid, background, watermark, multiple tiles

### Tool-Hinweise
- **Midjourney v6:** `--ar` weglassen und stattdessen feste Pixelmaße im Prompt
  nennen; transparenten Hintergrund über Stil-Beschreibung erzwingen, danach
  ggf. Hintergrund per `remove-background` entfernen.
- **DALL·E 3 / SD + ControlNet:** Für exakte Tessellation eine 1-px-Hex-Silhouette
  als ControlNet-Vorlage (Canny/Lineart) mit den Eckpunkten aus §1 nutzen.
- **Einheitlichkeit:** Alle Tiles in EINER Sitzung / mit identischem Seed-Stil
  generieren, damit Beleuchtung & Strichführung zusammenpassen.
- **Export:** PNG mit Alpha, exakt die Canvas-Maße, kein zusätzlicher Rand.
  Ablage in `src/assets/images/`, Benennung z. B. `tile_wiese.png`,
  `building_schoellershammer.png`.
