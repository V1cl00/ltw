# Meshy-Checkliste (Konzept → GLB → manifest.json)

Ablauf je Modell: Konzeptbild in Meshy (Image-to-3D) → GLB exportieren → Polygone reduzieren → nach `assets/meshy/` → Eintrag in `manifest.json` (`{"key":{"file":"x.glb","height":1.6}}`) → in 3D prüfen.
Budget gilt nach Reduktion (Handy-Preset muss flüssig bleiben). Texturen max. 1024 px, möglichst webp/ktx2.

| ☐ | Konzeptbild | manifest-Schlüssel | Poly-Budget | Notizen |
|---|---|---|---|---|
| ☐ | turm_laterne.jpg | `m_bogen` (Funkenwerfer) | 3–5 k | Pagode mit Laterne, height 1.6; Laterne als eigenes Mesh (Glühen/Bloom) |
| ☐ | tuerme4.jpg | `m_kanone`, `m_wacht`, `m_kapelle`, `m_ballista` | je 3–5 k | 4 Türme einzeln ausschneiden und je ein Modell erzeugen; gleiche Pagoden-Grundform, height 1.6 |
| ☐ | mauer.jpg | `mauer` | 0,5–1 k | kachelbar 1×1 Feld, flach (height ~0.7), viele Instanzen → sehr sparsam |
| ☐ | held_ilka.jpg | `hero_menschen` (neu, Loader-Hook nötig) | 6–8 k | Held Ilka; später Rig/Animation; Hammer + Laterne getrennt |
| ☐ | goldmine.jpg | `goldmine` (neu, Hook nötig) | 3–4 k | ersetzt Minen-Platzhalter neben der Bahn |
| ☐ | schrein.jpg | `schrein` (neu, Hook nötig) | 3–4 k | ersetzt Schrein-Platzhalter; Dach als Glühfläche |
| ☐ | tore.jpg | `tor_start`, `tor_ziel` (neu, Hook nötig) | je 2–3 k | Start- und Zieltor (aktuell blau/rot Bögen) |
| ☐ | klippe.jpg | `klippe` (neu, Hook nötig) | 4–6 k | nur als Deko-Kacheln an Inselrändern; prozedurale Klippen bleiben Rückfall |
| ☐ | props.jpg | `prop_*` (neu, Hook nötig) | je 0,3–1 k | Laternen, Steine, Büsche; per Instancing verteilen |
| – | tex_boden.jpg | – | – | erledigt: als `assets/tex/boden.jpg` Bodentextur im Einsatz |

Hinweis: Nur Turm-IDs und `mauer` werden heute schon vom Loader genutzt. Für die „neu“-Schlüssel muss `render3d.js` noch einen kleinen Hook bekommen.
