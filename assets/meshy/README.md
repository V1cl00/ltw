# Meshy-Modelle
GLB-Dateien hier ablegen und in `manifest.json` eintragen, z. B. `{"m_bogen":{"file":"turm_laterne.glb","height":1.6}}`.
`render3d.js` lädt beim Start alle Einträge (GLTFLoader), skaliert auf `height` (Standard 1,6 Zellen), stellt das Modell auf den Boden und ersetzt den prozeduralen Platzhalter für diese Turm-ID. Ausbaustufen bleiben prozedural.
Empfohlen: vorher Draco/Meshopt-Kompression (dann Loader um DRACOLoader erweitern).
