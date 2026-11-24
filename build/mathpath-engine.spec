# Build only: the application's Python sources are compiled into the executable archive.
from pathlib import Path
from PyInstaller.utils.hooks import collect_dynamic_libs, copy_metadata

root = Path(SPECPATH).parent
vendor = root / 'vendor'
datas = [(str(vendor / 'models'), 'vendor/models')]
for package in ('sympy', 'mpmath', 'numpy', 'onnxruntime', 'tokenizers', 'vosk', 'pillow'):
    datas += copy_metadata(package)

a = Analysis(
    [str(root / 'worker.py')],
    pathex=[str(root), str(vendor)],
    binaries=collect_dynamic_libs('vosk'),
    datas=datas,
    hiddenimports=['local_ai', 'graph_studio_data', '_cffi_backend'],
    excludes=['tkinter', 'matplotlib', 'IPython', 'pytest', 'torch', 'tensorflow', 'scipy', 'pandas'],
    noarchive=False,
    optimize=1,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz, a.scripts, [('X utf8', None, 'OPTION')],
    exclude_binaries=True,
    name='mathpath-engine',
    console=True,
    debug=False,
    strip=False,
    upx=False,
    icon=str(root / 'build' / 'icon.ico'),
)
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, name='mathpath-engine')
