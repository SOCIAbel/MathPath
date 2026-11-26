# Prompts de imágenes para ChatGPT

> Estado: los 62 recursos de esta lista ya están generados e integrados. Consulta `ARTE-PIXEL.md` para rutas, tamaños y prompts finales.

La app ya funciona sin estas imágenes: la mascota y los cofres están dibujados en SVG. Si generas estas imágenes y las guardas con el nombre exacto en la carpeta indicada, MathPath las usa automáticamente en lugar del dibujo SVG.

**Cómo guardarlas:**
- Pide a ChatGPT **fondo transparente** (PNG) y conviértelas a `.webp`. Por ejemplo, en squoosh.app o con `magick archivo.png archivo.webp`.
- Tamaño recomendado: **512 × 512 px**, con el personaje centrado y mirando hacia la derecha.
- Estilo: el mismo pixel art chibi que ya usa `arena/knight.webp`. Adjunta esa imagen a ChatGPT como referencia de estilo.

Empieza cada pedido con este bloque de estilo:

> Pixel art chibi estilo RPG de 16 bits, colores vivos y alegres, contorno oscuro de 1 píxel, sombreado suave en 2–3 tonos, fondo totalmente transparente, un solo personaje centrado mirando hacia la derecha, sin texto, sin marco, 512×512. Mismo estilo que la imagen de referencia adjunta (un caballero chibi con armadura azul).

---

## 1. Mascotas (15 imágenes)

Carpeta: `recursos/mascotas/` · Nombre: `<especie>-<etapa>.webp`

| Etapa | Número | Descripción |
| --- | --- | --- |
| Huevo | 0 | Huevo con manchas del color de la especie, un poco agrietado y con ojitos asomando. |
| Cría | 1 | Bebé redondito, cabeza grande y ojos enormes. |
| Joven | 2 | Más grande, alas o extremidades más desarrolladas. |
| Adulto | 3 | Pose orgullosa, detalles más elaborados. |
| Legendario | 4 | Versión dorada y brillante, con aura de chispas y partículas mágicas. |

**Dragoncito** (`draco-0` … `draco-4`):
> [estilo] Mascota dragoncito verde esmeralda con barriga color crema, alitas naranjas, cuernitos pequeños color crema y ojos grandes y tiernos. Etapa: **[describe la etapa de la tabla]**. Expresión feliz.

**Búho sabio** (`buho-0` … `buho-4`):
> [estilo] Mascota búho café con pecho color crema, ojos enormes en círculos claros, pico amarillo y orejas de plumas. Etapa: **[etapa]**. En adulto lleva lentes pequeños.

**Slime saltarín** (`slime-0` … `slime-4`):
> [estilo] Mascota slime azul cielo translúcido con brillo blanco, mejillas rosadas y sonrisa. Etapa: **[etapa]**. En joven y adulto aparecen mini-slimes alrededor.

> Consejo: deja libre la parte de arriba de la cabeza. La app dibuja encima los accesorios (corona, gorro de mago, etc.).

## 2. Cofres (3 imágenes)

Carpeta: `recursos/cofres/` · Nombres: `comun.webp`, `raro.webp`, `epico.webp`

> [estilo] Cofre del tesoro cerrado visto de frente en 3/4, **[común: madera café con bandas de hierro | raro: madera azul con bandas plateadas y brillo azul | épico: morado con bandas doradas, gemas y aura mágica morada]**.

## 3. Jefes de mundo (opcional, 35 imágenes)

Los 35 jefes únicos ya están instalados y conectados. Para regenerar una variante:

> [estilo] Versión "rey" y más imponente de este personaje (adjunta `arena/<rival>.webp`): más grande, con corona dorada, capa real y ojos brillantes. Mantén los colores y la silueta del original.

Guárdalos como `arena/<rival>-rey.webp` (por ejemplo `arena/golem-rey.webp`). La app los carga automáticamente en el mapa y durante los combates de jefe de mundo mediante `pixel-artajch.js`.

## 4. Fondo de la aldea que crece (opcional)

> Pixel art 16 bits de una aldea medieval vista de lado, panorámica 1600×260, con 12 casitas distintas en fila (herrería, panadería, torre, molino, posada, mercado…), cielo celeste y pasto verde, estilo acogedor, sin texto.

Guárdala como `recursos/aldea/aldea-panorama.webp`. La panorámica ya está conectada: las construcciones ganadas aparecen en color. Las casitas SVG se conservan como respaldo.

## 5. Iconos de logros (opcional)

> Medalla en pixel art de 16 bits, 128×128, fondo transparente, con el símbolo **[estrella / llama / espada / corona / rayo / libro / llave / carta]**, borde dorado y brillo.
