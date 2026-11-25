# MathPath - Autor: Abel Josue Colquehuanca Humpiri
# Descarga los modelos locales de voz (Vosk) y de lectura de formulas (Pix2Text MFR) en vendor\models.
# Uso, desde la carpeta del proyecto:  powershell -ExecutionPolicy Bypass -File scripts\descargar-modelos.ps1
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path -Parent $PSScriptRoot
$models = Join-Path $root 'vendor\models'
New-Item -ItemType Directory -Force $models | Out-Null

$vosk = Join-Path $models 'vosk-es'
if (Test-Path (Join-Path $vosk 'am')) {
    Write-Host 'Modelo de voz ya instalado.'
} else {
    Write-Host 'Descargando modelo de voz (unos 40 MB)...'
    $zip = Join-Path $env:TEMP 'vosk-model-small-es-0.42.zip'
    Invoke-WebRequest 'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip' -OutFile $zip -UseBasicParsing
    $tmp = Join-Path $env:TEMP 'mathpath-vosk'
    if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
    Expand-Archive $zip $tmp
    $inner = Get-ChildItem $tmp -Directory | Select-Object -First 1
    if (Test-Path $vosk) { Remove-Item -Recurse -Force $vosk }
    Move-Item $inner.FullName $vosk
    Remove-Item -Force $zip
    Remove-Item -Recurse -Force $tmp
}

$mfr = Join-Path $models 'mfr'
New-Item -ItemType Directory -Force $mfr | Out-Null
$files = 'config.json', 'generation_config.json', 'preprocessor_config.json', 'special_tokens_map.json',
         'tokenizer.json', 'tokenizer_config.json', 'decoder_model.onnx', 'encoder_model.onnx'
Write-Host 'Descargando modelo de formulas (unos 120 MB)...'
foreach ($file in $files) {
    $target = Join-Path $mfr $file
    if (-not (Test-Path $target)) {
        Invoke-WebRequest "https://huggingface.co/breezedeus/pix2text-mfr-1.5/resolve/main/$file" -OutFile $target -UseBasicParsing
    }
}
Write-Host 'Modelos listos en vendor\models.'
