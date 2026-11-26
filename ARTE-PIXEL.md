# Arte de MathPath

Se incluyen 62 imágenes creadas con la herramienta integrada `image_gen`, convertidas a WebP sin pérdida. Los sprites conservan el fondo transparente.

| Recurso | Cantidad | Carpeta y nombres | Tamaño |
|---|---:|---|---|
| Mascotas | 15 | `recursos/mascotas/{draco,buho,slime}-{0,1,2,3,4}.webp` | 512 × 512 |
| Cofres | 3 | `recursos/cofres/{comun,raro,epico}.webp` | 512 × 512 |
| Reyes de cada mundo | 35 | `arena/<rival>-rey.webp` | 512 × 512 |
| Aldea | 1 | `recursos/aldea/aldea-panorama.webp` | 1600 × 260 |
| Medallas | 8 | `recursos/logros/{estrella,llama,espada,corona,rayo,libro,llave,carta}.webp` | 128 × 128 |

Las etapas de las mascotas son huevo, cría, joven, adulto y legendario. Los accesorios se dibujan sobre la imagen y se alinean con la cabeza de cada variante.

Los reyes aparecen en su tarjeta del mapa y en los duelos de jefe de mundo. Sus imágenes se usan también durante las animaciones de ataque y en las miniaturas de las técnicas.

La panorámica muestra los doce edificios de la aldea: los construidos aparecen en color y los pendientes, apagados y con un candado. El número de construcciones continúa dependiendo del progreso y del equipo forjado.

`pixel-artajch.js` y `pixel-artajch.css` conectan estos recursos con la interfaz existente. Si falta una imagen, la aplicación conserva su dibujo o sprite de respaldo. Para ver imágenes nuevas después de copiarlas, reinicia MathPath.

Los prompts finales, referencias, dimensiones y hashes de los archivos están en **`recursos/arte-original/pixel-art-manifest.json`**.
