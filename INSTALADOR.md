# Instalador de MathPath para Windows

El archivo para compartir es `dist/MathPath-Setup-1.0.0-x64.exe`. Incluye Electron, el motor matemático compilado, las imágenes y los modelos locales de voz y escaneo. El destinatario no necesita instalar Node.js, Python ni las dependencias del proyecto. La instalación y las funciones locales no descargan componentes.

## Instalar

1. Abrir el archivo `MathPath-Setup-1.0.0-x64.exe`.
2. Elegir la carpeta y completar el asistente en español.
3. Abrir MathPath desde el escritorio o el menú Inicio.

Es una aplicación para Windows de 64 bits. Los videos de YouTube y la IA externa opcional necesitan conexión. El progreso se guarda en el perfil de Windows, fuera de la carpeta de instalación, y se conserva al desinstalar. El instalador se genera sin firma digital si no se proporciona un certificado de firma.

## Volver a generar el instalador (solo desarrollo)

Desde la raíz del proyecto, con Python de 64 bits y los modelos en `vendor/models/`:

```cmd
npm install
python -m venv .build-env
.build-env\Scripts\python -m pip install -r build\requirements-build.txt
.build-env\Scripts\python -m pip install --target vendor -r requirements.txt
set "MATHPATH_BUILD_PYTHON=%CD%\.build-env\Scripts\python.exe"
npm run dist
```

`npm run dist:dir` genera la aplicación sin el instalador, para pruebas. `MATHPATH_BUILD_PYTHON` permite seleccionar otro entorno de compilación. Las salidas temporales van en `build-output/` y los archivos para distribuir en `dist/`; ambas carpetas están excluidas de Git.

No compartir la carpeta del proyecto. El instalador solo contiene la interfaz compactada en un archivo ASAR, el motor compilado y sus recursos. Se excluyen los documentos, `.git`, código Python de la aplicación, bases de datos, respaldos y claves de API. El empaquetado no es un mecanismo de cifrado ni impide por completo la ingeniería inversa.

## Comprobaciones

```powershell
python -X utf8 checkajch.py
npm run check:package
$env:MATHPATH_SMOKE='1'; npm start; Remove-Item Env:MATHPATH_SMOKE
$env:MATHPATH_SMOKE='1'; & '.\dist\win-unpacked\MathPath.exe'; Remove-Item Env:MATHPATH_SMOKE
```

La última prueba usa el motor incluido y un perfil temporal, incluso si Python no está en `PATH`. Los avisos de copyright de las dependencias se incluyen en `resources/licenses/`.
