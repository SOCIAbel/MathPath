# MathPath

**Autor:** Abel Josué Colquehuanca Humpiri

Aplicación de escritorio para Windows. Abre **Abrir-MathPath.cmd** desde la carpeta principal. El lanzador usa el ejecutable de Electron disponible en el proyecto. El motor SymPy corre localmente en un proceso Python y guarda los datos en SQLite.

## Estructura del proyecto

```text
desktop/
├── Abrir-MathPath.cmd
└── mathpath/
    ├── README.md
    ├── arena/                       Escenarios y personajes que usa la aventura
    ├── recursos/aldea/              Paisaje de la aldea y objetos del taller
    ├── recursos/arte-original/      Ilustraciones de versiones anteriores
    ├── node_modules/                Dependencias de Electron
    ├── vendor/                      Dependencias de Python
    └── .qa/                         Resultados generados al ejecutar pruebas
        ├── archivo/
        │   ├── comprobaciones/       Ejecuciones del motor matemático
        │   ├── interfaz/             Datos de pruebas de la interfaz
        │   ├── perfiles-electron/    Perfiles aislados de prueba
        │   └── registros/            Archivos de registro de las pruebas
        └── pip-cache/               Caché de instalación
```

Los archivos de la aplicación están en la raíz de `mathpath/`. Electron localiza allí la interfaz, el archivo de conexión y el proceso Python. La interfaz también carga sus scripts y `arena/` desde esa ubicación.

| Dónde buscar | Archivos | Qué contienen |
| --- | --- | --- |
| Ventana y conexión | `mainajch.cjs`, `preloadajch.cjs`, `workerajch.py` | Inicio de Electron y comunicación con el motor Python. |
| Interfaz | `indexajch.html`, `appajch.js`, `appajch.css` | Pantallas, navegación, controles y estilos. |
| Graficador | `graphajch.js`, `graphingajch.py` | Vista interactiva en 2D y 3D y cálculo de los puntos del gráfico. |
| Motor matemático | `engineajch.py` | Analizador de expresiones, resolución, pasos y validación de respuestas. |
| Cursos y ejercicios | `routesajch.py`, `curriculumajch.py`, `universityajch.py` | Niveles, grados, cursos, lecciones y ejercicios parametrizados. |
| Videos | `lesson-videoajch.js`, `youtube-lessonsajch.js` | Reproductor de minilecciones y enlaces por tema. |
| Progreso | `learningajch.py` | SQLite, perfiles, prerrequisitos, evaluaciones, historial y respaldos. |
| Aventura y aldea | `adventureajch.py`, `adventure-uiajch.js` | Rivales, ataques, botín, equipo y retos de barrera. |
| Instalación | `package.json`, `requirements.txt` | Dependencias y comandos de la aplicación. |
| Comprobaciones | `checkajch.py` | Pruebas del motor y de los flujos de aprendizaje. |
| Capa de juego | `funajch.py`, `fun-uiajch.js`, `fun-audioajch.js`, `funajch.css` | Racha, XP, logros, mascota, habilidades, cofres, retos, cartas, sonidos, temas y pizarra. |

Ejecuta `python -X utf8 checkajch.py` desde `mathpath/` para comprobar el motor. La aplicación guarda el perfil real en la carpeta de datos de MathPath de Windows. `.qa/` contiene archivos de prueba generados dentro del proyecto.

## Prueba rápida

1. En **Solucionador**, pulsa **Resolver** con la ecuación de ejemplo. El resultado es `{3}`. Abajo están los pasos y la comprobación por sustitución.
2. En **Primaria → 1.º grado**, abre **Cuenta las estrellas** y acierta dos retos distintos para desbloquear la siguiente misión. Cada grado empieza con una misión disponible.
3. En **Evaluaciones**, inicia una evaluación general o elige un nivel, grado o curso. La calificación se guarda en **Mi progreso**.
4. Usa **Probar DEMO** para explorar estadísticas y evaluaciones de ejemplo en un perfil separado.

## Historia de la aventura

- **Primaria · Los Cristales de Numeria (1.º a 6.º):** el caballero recupera un cristal por grado y termina enfrentando al Rey Sombra.
- **Secundaria · El Eclipse de Aritmia (1.º a 5.º):** el guardián enciende un faro por grado y termina venciendo al Eclipse Eterno.
- Cada grado es un capítulo con historia y termina con un **jefe final**. El jefe tiene mucha más vida, mezcla hasta 8 temas del grado y da menos tiempo, ajustado al largo de cada ejercicio. Al vencerlo se abre el siguiente capítulo.
- Los datos están en `storyajch.py` (historia, jefes y rivales) y `school_extraajch.py` (temas nuevos al final de cada grado).
- **Arte:** `PROMPTS-HISTORIA.md` tiene los prompts para ChatGPT. Para instalar los dibujos, ejecuta `python importar_arteajch.py "carpeta-con-png"`. Mientras no existan, se usan copias recoloreadas de rivales anteriores.

## Capa de juego

- **Barra superior:** racha diaria 🔥, nivel y XP ⭐, cofres 🎁, sonido, música, modo oscuro y pizarra ✏️.
- **Retos:** reto del día, Supervivencia (3 vidas), Mazmorra de errores, reto gráfico, y duelo de 2 jugadores.
- **Duelos:** golpe crítico si respondes rápido, combo cada 3 aciertos, mascota acompañante con pista gratis, y un **Rey** opcional en cada mundo con fases y cofre épico.
- **Logros:** 30 logros, cofres, árbol de habilidades, color del caballero, títulos y 7 temas de color.
- **Mascota:** varias especies a elegir que evolucionan en 5 etapas y accesorios para equiparles.
- **Cartas:** una carta de fórmula por cada tema dominado.
- **Responder sin escribir:** 🎤 Dictar en todos los niveles y 📸 escanear (cámara, foto o pizarra) en universidad. Funciona sin internet con `local_aiajch.py` (Vosk y el modelo de fórmulas de Pix2Text). Si la IA está configurada, se usa solo como respaldo. El motor local sigue validando la respuesta.
- **Con IA configurada:** botón "Explícamelo fácil" en las lecciones y "Desde una foto" en el Solucionador (necesita un modelo con visión).
- **Arte opcional:** ver `PROMPTS-IMAGENES.md`.

`MATHPATH_DATA_DIR` permite abrir la app con otra carpeta de datos (útil para pruebas).

## Editor

Usa **×** para multiplicar, **÷** para dividir y **^** para potencias. `pi` representa π. Escribe los decimales con punto. Elige la variable y escribe los parámetros cuando la operación los requiera.

| Operación | Expresión | Parámetro |
| --- | --- | --- |
| Ecuación | `2*x + 3 = 9` | |
| Sistema | `x+y=8; x-y=2` | |
| Límite | `(x^2-1)/(x-1)` | `1` |
| Integral definida | `x^2` | `0,2` |
| Gradiente | `x^2+x*y+y^2` | `x,y` |
| Matrices | `det([[2,3],[1,4]])` | |
| Estadística | `varianza([2,4,6])` | |
| Ecuación diferencial de primer orden | `y' = 2*y` | |

El catálogo incluye lecciones introductorias con ejercicios parametrizados. Primaria y Secundaria agrupan las misiones por grado y por las cuatro competencias del currículo peruano. Universitario ofrece una ruta introductoria de ciencias e ingeniería por curso.

- [MINEDU · Programa curricular de Primaria, área de Matemática](https://repositorio.minedu.gob.pe/bitstream/handle/20.500.12799/4549/Programa%20curricular%20de%20Educaci%C3%B3n%20Primaria.pdf?isAllowed=y&sequence=4)
- [MINEDU · Programa curricular de Secundaria, área de Matemática](https://www.minedu.gob.pe/curriculo/pdf/programa-curricular-educacion-secundaria.pdf)
- [PUCP · Estudios Generales Ciencias](https://estudios-generales-ciencias.pucp.edu.pe/plan_estudio/matematicas/)
- [PUCP · Plan de estudios de Matemáticas](https://facultad-ciencias-ingenieria.pucp.edu.pe/wp-content/uploads/2026/03/ppee_MATEMATICAS-2026-1.pdf)

## Instalación en otro equipo

Instalador listo para Windows: descarga `MathPath-Setup-1.0.0-x64.exe` desde la sección **Releases** del repositorio.

Desde el código fuente:

```powershell
git clone https://github.com/SOCIAbel/MathPath.git
cd MathPath
```


Instala Node.js 22.12 o posterior y Python 3.12. Desde esta carpeta ejecuta:

```powershell
python -m pip install --target vendor -r requirements.txt
npm install
npm start
```

Para el dictado y el escaneo sin internet, descarga los modelos con `powershell -ExecutionPolicy Bypass -File scripts\descargar-modelosajch.ps1`. El script guarda en `vendor/models/`:

- `vendor/models/vosk-es/`: contenido de [vosk-model-small-es-0.42](https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip) (voz, unos 40 MB).
- `vendor/models/mfr/`: archivos de [breezedeus/pix2text-mfr-1.5](https://huggingface.co/breezedeus/pix2text-mfr-1.5/tree/main) (fórmulas, unos 120 MB).

El primer inicio de Electron descarga su ejecutable. Después, las lecciones, el solucionador, los ejercicios y las evaluaciones funcionan sin conexión. Si Python está fuera del PATH, define `MATHPATH_PYTHON` con la ruta a su ejecutable. En este equipo el lanzador también reconoce el Python incluido en el entorno de trabajo.

Los datos se guardan en el directorio local de MathPath. **Mi perfil → Copias de seguridad** permite exportar y restaurar el archivo SQLite. Las claves de IA se almacenan por separado con el cifrado del sistema.

## IA opcional

Configura un endpoint HTTPS compatible con Chat Completions, un modelo y una clave en **Mi perfil**. En **Profesor inteligente**, **Ordenar pistas con IA** envía la pregunta y las pistas de la lección al proveedor. Solo se acepta el índice de una pista existente. El resultado, los pasos y la comprobación vienen del motor local.

