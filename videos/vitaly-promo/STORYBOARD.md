---
format: 1080x1920
duration: 22s
message: "Vitaly libera al profesional de salud de la carga administrativa para que pueda enfocarse por completo en sus pacientes."
arc: "Future Pacing con progresion feature-benefit"
audience: "Profesionales de salud y responsables de consultorios privados"
mode: autonomous
music: none
captions: false
---

## Video direction

- Palette: fondo `bg` blanco en todos los frames; titulares `text` casi negros; `primary` ambar como unico acento de accion y transformacion; `text-muted` celeste solo para cuerpo, etiquetas y lineas informativas. Las superficies usan `card-bg` y `border` del `frame.md`, sin sombras.
- Type: usar la rampa display de `frame.md` para titulares grandes y la rampa body para descripciones breves; jerarquia minima 3:1 y lectura prioritaria en el tercio superior.
- Motion grammar: una sola camara percibida, curvas de cola larga `power3`, transformaciones continuas y revelados secuenciales sincronizados con cada frase. Nada se vuelca al inicio; cada pieza aparece cuando la voz la nombra, especialmente en la mitad posterior del frame.
- Handoffs: el logo, el marco de producto y la tarjeta central conservan geometria numerica entre frames. Los cambios de funcion son `card morph-anchor`, `scale-swap` o desplazamientos de velocidad igualada; nunca cortes secos.
- Rhythm: Frames 1–4 desarrollan; Frame 5 es el respiro deliberado; Frame 6 sostiene el lockup final. Durante holds: quietud real, sin respiracion ciclica; como maximo un jitter sutil y finito.
- Safe area: todo contenido esencial queda en el 83% superior del lienzo; el 17% inferior permanece libre aunque captions este desactivado.
- Negative list: sin fondos oscuros, gradientes AI morado/celeste, bokeh, rebotes, overshoot, sombras web, navegador real, barras de navegacion, metricas inventadas, slideshow (entrada temprana + congelado) ni screensaver (objetos flotando sin relacion).

## Frame 1 — Mas tiempo para cuidar

- scene: Una frase grande se transforma de carga administrativa en tiempo de atencion.
- voiceover: "Menos administracion. Mas tiempo para cuidar."
- duration: 3.40275s
- poster: 2.2s
- transition_in: crossfade
- status: outline
- src: compositions/frames/01-mas-tiempo.html
- type: hook
- persuasion: Future pacing
- beat: alivio + aspiracion
- blueprint: kinetic-type-beats (Adapt)
- focal: assets/vitaly-logo.png
- roles: vitaly-logo = supporting brand seed behind the typographic hero
- sfx: soft airy whoosh
- handoff_out: vitaly-mark x=540 y=760 scale=0.42 opacity=1 direction=forward speed=0.10/s
- asset_candidates: assets/vitaly-logo.png — marca Vitaly usada como semilla visual secundaria

narrativeRole: Abrir con el beneficio humano, no con una lista de funciones.
keyMessage: El tiempo recuperado vuelve a la atencion del paciente.

Adapt: keep the in-place transformation signature, but replace hard cuts with a continuous scale-swap so the two halves of the promise feel like one thought.
Scene 1 (0.0–0.9s): only “Menos” enters in the upper third through a per-word staggered reveal (`dynamic-content-sequencing`) with a smooth long-tail settle; a cropped Vitaly mark sits large and pale behind it as the second focal point — asymmetric 70/30, 3 depth layers, top 83%.
Scene 2 (0.9–1.9s): “administracion” unfolds below as three thin tinted cards converge into a single rounded line using cluster→inward expansion (`center-outward-expansion` reversed); the amber accent line draws left-to-right (`svg-path-draw`) exactly on the spoken noun — full-width strip under the headline, medium density.
Scene 3 (1.9–3.2s): the administrative line contracts at center and scale-swaps (`scale-swap-transition`) into “Mas tiempo para cuidar”; “cuidar” receives one finite amber bloom (`ambient-glow-bloom`) as the Vitaly mark resolves at x=540, y=760, scale=0.42. Hold clean and still for the last read — centered climax, 60% frame width.

## Frame 2 — Vitaly conecta todo

- scene: El logo de Vitaly se ensambla mientras modulos dispersos convergen en un unico marco de producto.
- voiceover: "Vitaly reune todo tu consultorio en un solo lugar."
- duration: 3.88175s
- poster: 2.4s
- transition_in: zoom-through 0.6s
- status: outline
- src: compositions/frames/02-vitaly-conecta.html
- type: product_intro
- persuasion: Friction reduction
- beat: claridad + control
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/vitaly-logo.png
- roles: vitaly-logo = cutout fixed center anchor
- sfx: soft logo shimmer
- handoff_in: vitaly-mark x=540 y=760 scale=0.42 opacity=1 direction=forward speed=0.10/s
- handoff_out: app-frame x=540 y=1030 scale=0.86 opacity=1 direction=up speed=80px/s
- asset_candidates: assets/vitaly-logo.png — logo principal de Vitaly

narrativeRole: Nombrar el producto y prometer una unica experiencia conectada.
keyMessage: Vitaly centraliza la gestion del consultorio.

Adapt: keep the central mark and parts-assembly signature; the assembling parts are confirmed Vitaly modules and resolve into one tall product frame instead of an abstract orbit.
Scene 1 (0.0–0.8s): continue the Vitaly mark at the exact handoff geometry; two amber guide rings self-draw (`svg-path-draw`) while the mark moves from supporting size to the centered hero on a static white field — centered, low density, 3 layers.
Scene 2 (0.8–2.3s): as the voice says “reune todo tu consultorio”, four tinted module cards — Agenda, Pacientes, Historia clinica, Cobros — expand outward from behind the fixed mark (`center-outward-expansion`) one cue at a time; the last card arrives in the back half, not at t=0 — layered-depth, primary visual 64% of canvas.
Scene 3 (2.3–3.6s): the four cards fold inward and morph into one tall rounded product window (`card-morph-anchor`); “Un solo lugar” reveals above it while the mark seats in its header. The window settles at x=540, y=1030, scale=0.86, opacity=1 and holds still — centered 60/40 vertical hierarchy.

## Frame 3 — Agenda y pacientes

- scene: Un marco de interfaz vertical muestra agenda, ficha de paciente y una notificacion que se encadenan sin perder contexto.
- voiceover: "Agenda turnos, pacientes y notificaciones."
- duration: 3.317792s
- poster: 2.6s
- transition_in: push-slide UP 0.55s
- status: outline
- src: compositions/frames/03-agenda-pacientes.html
- type: feature_showcase
- persuasion: Show-dont-tell proof
- beat: fluidez + confianza
- blueprint: device-surface-showcase (Adapt)
- focal: assets/vitaly-logo.png
- roles: vitaly-logo = supporting identifier inside the app-frame header
- sfx: subtle ui click
- handoff_in: app-frame x=540 y=1030 scale=0.86 opacity=1 direction=up speed=80px/s
- handoff_out: app-frame x=540 y=1030 scale=0.92 opacity=1 direction=left speed=90px/s
- asset_candidates: assets/vitaly-logo.png — identificador de marca dentro del marco de producto

narrativeRole: Demostrar el primer flujo operativo con modulos confirmados por el codigo de Vitaly.
keyMessage: La agenda y los pacientes viven en el mismo flujo.

Adapt: keep the cursorless static-tour signature; reconstruct only confirmed modules and let the same held surface advance through agenda, patient and notification states.
Scene 1 (0.0–0.8s): the tall app-frame continues at the incoming geometry and settles to scale=0.92; only the “Agenda” header and today rail reveal, using a masked vertical slide with long-tail settle (`dynamic-content-sequencing`) — rule-of-thirds, dense surface inside a quiet white frame.
Scene 2 (0.8–2.3s): calendar slots populate top-to-bottom (`waterfall-entry`); when the voice names “pacientes”, a patient chip slides from the side panel and snaps into the selected appointment using a card morph-anchor (`card-morph-anchor`) — one surface, 3 depth layers, primary visual 68% of canvas.
Scene 3 (2.3–3.8s): on “notificaciones”, a confirmation banner reveals from the top edge of the surface and its check stroke draws (`svg-path-draw`); the rest of the UI focus-dims slightly (`depth-of-field-blur`). The frame holds at x=540, y=1030, scale=0.92, opacity=1 with no camera drift.

## Frame 4 — Historia y cobros

- scene: El mismo marco se transforma en una linea de historia clinica y luego en un panel de cobros ordenado.
- voiceover: "Historias clinicas y cobros, siempre en orden."
- duration: 3.273417s
- poster: 2.6s
- transition_in: push-slide LEFT 0.55s
- status: outline
- src: compositions/frames/04-historia-cobros.html
- type: feature_showcase
- persuasion: Feature-to-benefit translation
- beat: orden + tranquilidad
- blueprint: cursor-ui-demo (Adapt)
- focal: assets/vitaly-logo.png
- roles: vitaly-logo = supporting identifier persistent in the app-frame header
- sfx: soft page swish, subtle confirmation click
- handoff_in: app-frame x=540 y=1030 scale=0.92 opacity=1 direction=left speed=90px/s
- handoff_out: central-card x=540 y=960 scale=0.88 opacity=1 direction=inward speed=0.12/s
- asset_candidates: assets/vitaly-logo.png — identificador de marca persistente

narrativeRole: Completar la prueba funcional y traducirla en orden administrativo.
keyMessage: Vitaly mantiene el seguimiento clinico y financiero organizado.

Adapt: keep the cursor-as-actor and static-stage state-tour signature; use two confirmed Vitaly states and a matched container morph instead of a camera chase.
Scene 1 (0.0–0.9s): continue the app-frame unchanged; a custom amber cursor enters and lands on one patient row with a cursor click + restrained ripple (`cursor-click-ripple`) as the title “Historia clinica” reveals above — locked camera, layered-depth surface.
Scene 2 (0.9–2.2s): the selected row expands into a clinical-history timeline through an anchored panel expansion (`anchored-layout-expand`); session nodes draw downward (`svg-path-draw`) exactly as “Historias clinicas” is spoken — asymmetric 60/40, medium density, two clear focal points.
Scene 3 (2.2–3.2s): on “cobros”, the same rounded container morphs in place (`card-morph-anchor`) to a payments state; three payment rows cascade (`waterfall-entry`) and one status pill changes to “Al dia” through a discrete state swap (`dynamic-content-sequencing`) — no cut, no zoom.
Scene 4 (3.2–3.8s): “Siempre en orden” lands above the surface while the outer frame contracts into the central-card handoff at x=540, y=960, scale=0.88, opacity=1. Everything holds still after the final word.

## Frame 5 — Confianza Boavida

- scene: Los marcos de producto se pliegan en una tarjeta de confianza con el logo real de Boavida.
- voiceover: "Boavida nos confio el desarrollo para mejorar cada dia."
- duration: 3.944917s
- poster: 2.7s
- transition_in: blur-crossfade 0.6s
- status: outline
- src: compositions/frames/05-confianza-boavida.html
- type: social_proof
- persuasion: Authority by association
- beat: confianza + cercania
- blueprint: titlecard-reveal (Adapt)
- focal: assets/boavida-logo.png
- roles: boavida-logo = cutout trust proof centered inside the card
- sfx: soft trust chime
- handoff_in: central-card x=540 y=960 scale=0.88 opacity=1 direction=inward speed=0.12/s
- handoff_out: central-card x=540 y=960 scale=0.78 opacity=1 direction=forward speed=0.08/s
- asset_candidates: assets/boavida-logo.png — logo real del consultorio Boavida

narrativeRole: Dar una prueba concreta de origen y confianza sin inventar metricas.
keyMessage: Vitaly fue confiada por Boavida para mejorar su trabajo cotidiano.

Adapt: keep the one-move proof-card signature; the incoming product frame is the busy open and the real Boavida logo is the settled proof, with no invented metric.
Scene 1 (0.0–0.7s): the incoming central-card holds for a short establishing beat while the last UI details flatten into quiet lines — centered, low density, top 83%.
Scene 2 (0.7–2.1s): one restrained morph (`card-morph-anchor`) transforms the UI card into a clean trust card; the Boavida logo reveals inside via scale-swap (`scale-swap-transition`) and the line “Boavida nos confio” appears below on its spoken cue — centered, logo ~45% canvas width, no shadow.
Scene 3 (2.1–3.8s): “el desarrollo para mejorar cada dia” reveals as one supporting line with a gentle slide-up handoff (`dynamic-content-sequencing`); the proof card settles at x=540, y=960, scale=0.78, opacity=1 and remains completely still. This is the deliberate breather frame.

## Frame 6 — Atencion completa

- scene: La tarjeta Boavida se transforma en el lockup final de Vitaly con una frase breve.
- voiceover: "Vitaly. Atencion completa. Gestion simple."
- duration: 3.241s
- poster: 2.8s
- transition_in: zoom-through 0.7s
- status: outline
- src: compositions/frames/06-atencion-completa.html
- type: branding
- persuasion: Rule of three
- beat: calma + inevitabilidad
- blueprint: logo-assemble-lockup (Adapt)
- focal: assets/vitaly-logo.png
- roles: vitaly-logo = cutout final brand anchor
- sfx: soft resolve chime
- handoff_in: central-card x=540 y=960 scale=0.78 opacity=1 direction=forward speed=0.08/s
- asset_candidates: assets/vitaly-logo.png — logo final de Vitaly

narrativeRole: Cerrar en una idea memorable que resume la promesa del video.
keyMessage: Vitaly combina atencion completa con gestion simple.

Adapt: keep the same-center morph-chain and long final lockup hold; the Boavida proof card hands directly into the Vitaly mark without a cut.
Scene 1 (0.0–0.8s): continue the trust card at the exact handoff geometry; its inner content contracts toward center and scale-swaps (`scale-swap-transition`) to the Vitaly mark while the card border becomes two concentric amber rings — centered, 3 depth layers.
Scene 2 (0.8–2.4s): the mark slides slightly upward and “Vitaly” reveals below it; “Atencion completa” and “Gestion simple” arrive as two paced lines through per-word sequencing (`dynamic-content-sequencing`), each on its spoken cue. The amber accent line self-draws between them (`svg-path-draw`) — centered climax, headline fills 64% width.
Scene 3 (2.4–3.8s): the finished lockup holds dead static; only a single finite amber glow blooms once behind the mark (`ambient-glow-bloom`) and resolves before the final 0.5s. Fade the entire composition softly to white at the tail; no bounce, no breathing.
