# Reglas para quien edite MathPath (personas y asistentes de IA)

MathPath es una app de escritorio **para estudiantes** (sin docentes): Electron + Python (SymPy) + SQLite.
Más de un asistente edita este proyecto. Para no pisarse el trabajo:

## Antes y después de cada cambio
1. `git status` antes de empezar. Si hay cambios sin guardar de otra persona, no los borres.
2. Haz cambios pequeños y enfocados. No reescribas archivos completos si basta con editar una parte.
3. Comprueba antes de terminar:
   - `python -X utf8 checkajch.py` (motor y flujos de aprendizaje)
   - `$env:MATHPATH_SMOKE='1'; npm start; Remove-Item Env:MATHPATH_SMOKE` (recorre toda la interfaz)
4. Guarda con `git add -A` y `git commit -m "qué cambió y por qué"`. Un commit por tarea.

## Dónde está cada cosa
| Área | Archivos |
| --- | --- |
| Arranque y conexión | `mainajch.cjs`, `preloadajch.cjs`, `workerajch.py` |
| Interfaz principal | `appajch.js`, `appajch.css`, `indexajch.html` |
| Motor matemático | `engineajch.py` |
| Catálogo de temas | `routesajch.py`, `curriculumajch.py`, `school_extraajch.py`, `universityajch.py`, `university_extraajch.py` |
| Historia, jefes y rivales | `storyajch.py`, `adventureajch.py`, `combat-uiajch.js`, `combatajch.css` |
| Progreso y base de datos | `learningajch.py` |
| Juego (racha, logros, mascotas, retos) | `funajch.py`, `fun-uiajch.js`, `fun-audioajch.js`, `funajch.css`, `student-loungeajch.js`, `student-pagesajch.css` |
| Dictado y escaneo sin internet | `local_aiajch.py`, `answer-captureajch.js` (modelos en `vendor/models/`) |
| Universidad | `academic*.{py,js,css}`, `formula-*.js`, `graph*` |
| Arte | `arena/`, `recursos/`, `pixel-art.*`, `importar_arteajch.py`, `PROMPTS-*.md` |

## Reglas del producto
- Todo es para el alumno: nada de paneles de profesor, aulas ni configuración técnica.
- El motor local siempre valida las respuestas. La IA (opcional) solo transcribe o explica.
- No cambies el orden de los temas originales: el progreso guardado y los mundos dependen de él.
  Los temas nuevos van al final de cada grado (`school_extraajch.py`).
- Textos en español, claros y para niños o jóvenes.
