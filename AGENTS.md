# Reglas para quien edite MathPath (personas y asistentes de IA)

MathPath es una app de escritorio **para estudiantes** (sin docentes): Electron + Python (SymPy) + SQLite.
Más de un asistente edita este proyecto. Para no pisarse el trabajo:

## Antes y después de cada cambio
1. `git status` antes de empezar. Si hay cambios sin guardar de otra persona, no los borres.
2. Haz cambios pequeños y enfocados. No reescribas archivos completos si basta con editar una parte.
3. Comprueba antes de terminar:
   - `python -X utf8 check.py` (motor y flujos de aprendizaje)
   - `$env:MATHPATH_SMOKE='1'; npm start; Remove-Item Env:MATHPATH_SMOKE` (recorre toda la interfaz)
4. Guarda con `git add -A` y `git commit -m "qué cambió y por qué"`. Un commit por tarea.

## Dónde está cada cosa
| Área | Archivos |
| --- | --- |
| Arranque y conexión | `main.cjs`, `preload.cjs`, `worker.py` |
| Interfaz principal | `app.js`, `app.css`, `index.html` |
| Motor matemático | `engine.py` |
| Catálogo de temas | `routes.py`, `curriculum.py`, `school_extra.py`, `university.py`, `university_extra.py` |
| Historia, jefes y rivales | `story.py`, `adventure.py`, `combat-ui.js`, `combat.css` |
| Progreso y base de datos | `learning.py` |
| Juego (racha, logros, mascotas, retos) | `fun.py`, `fun-ui.js`, `fun-audio.js`, `fun.css`, `student-lounge.js`, `student-pages.css` |
| Dictado y escaneo sin internet | `local_ai.py`, `answer-capture.js` (modelos en `vendor/models/`) |
| Universidad | `academic*.{py,js,css}`, `formula-*.js`, `graph*` |
| Arte | `arena/`, `recursos/`, `pixel-art.*`, `importar_arte.py`, `PROMPTS-*.md` |

## Reglas del producto
- Todo es para el alumno: nada de paneles de profesor, aulas ni configuración técnica.
- El motor local siempre valida las respuestas. La IA (opcional) solo transcribe o explica.
- No cambies el orden de los temas originales: el progreso guardado y los mundos dependen de él.
  Los temas nuevos van al final de cada grado (`school_extra.py`).
- Textos en español, claros y para niños o jóvenes.
