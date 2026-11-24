# Prompts para los rivales y jefes de la historia

La app ya funciona con **arte provisional**: versiones recoloreadas de rivales existentes. Cuando tengas los dibujos de ChatGPT, se reemplazan solos.

## Cómo hacerlo

1. Por cada personaje pide **dos imágenes**:
   - **Normal** (en guardia): `nombre.png`
   - **Atacando**: `nombre-attack.png`
2. Adjunta siempre como referencia de estilo `arena/knight.webp` y `arena/golem.webp`.
3. Guarda todos los PNG en una carpeta, por ejemplo `C:\arte-nuevo`, con el nombre exacto de la tabla.
4. Desde la carpeta `mathpath`, ejecuta:

```powershell
python importar_arte.py "C:\arte-nuevo"
```

El script recorta cada personaje, lo ajusta a 204×142 con fondo transparente y lo guarda en `arena/`. Al final te dice cuántos siguen con arte provisional.

## Bloque de estilo (pégalo al inicio de cada pedido)

> Pixel art chibi estilo RPG de 16 bits, colores vivos, contorno oscuro de 1 píxel, sombreado suave en 2–3 tonos. **Fondo totalmente transparente**, un solo personaje de cuerpo entero, **mirando hacia la izquierda** (se enfrenta al héroe que está a la izquierda), apoyado en el borde inferior. Formato horizontal 1024×712. Sin texto, sin marco, sin suelo. Mismo estilo que las imágenes de referencia adjuntas.

Para la versión de ataque, añade:

> Ahora el mismo personaje, misma paleta y mismo tamaño, en pose de ataque: **[describe la técnica]**, con un pequeño efecto de energía del color del personaje.

---

## 🐉 Jefes finales de grado (10)

Los jefes deben verse **más grandes, imponentes y detallados** que los rivales normales: aura, ojos brillantes, algún elemento dorado. El de 1.º primaria (Dragón del Alba, `dawn-dragon`) ya existe.

| Archivo | Jefe | Grado | Descripción para el prompt | Ataque |
| --- | --- | --- | --- | --- |
| `boss-kraken` | Kraken del Lago Sereno | 2.º primaria | Kraken morado azulado que emerge del agua, tentáculos enrollados, ojos amarillos, gotas de agua | Tentáculos del lago: lanza dos tentáculos hacia adelante |
| `boss-storm-griffin` | Grifo de la Tormenta | 3.º primaria | Grifo blanco y azul eléctrico, alas abiertas con plumas como rayos, nubes de tormenta a sus pies | Picado de tormenta: se lanza en picada rodeado de relámpagos |
| `boss-minotaur` | Minotauro del Laberinto | 4.º primaria | Minotauro de piedra gris con cuernos enormes, hacha de piedra, runas brillantes en el pecho | Embestida: carga con la cabeza baja levantando polvo |
| `boss-ice-sorceress` | Hechicera de Hielo | 5.º primaria | Hechicera de capa celeste y corona de cristales de hielo, báculo con copo de nieve, cabello blanco | Tormenta de cristales: alza el báculo y lanza fragmentos de hielo |
| `boss-shadow-king` | Rey Sombra (final de primaria) | 6.º primaria | Rey en armadura negra con capa morada, corona oscura con gemas rojas, humo de sombra a su alrededor | Corte del olvido: espada oscura con estela morada |
| `boss-hydra` | Hidra de las Mareas | 1.º secundaria | Hidra verde azulada de tres cabezas, escamas brillantes, espuma de mar | Mordida triple: las tres cabezas atacan a la vez |
| `boss-gear-colossus` | Coloso de Engranajes | 2.º secundaria | Gigante de bronce hecho de engranajes y tuercas, ojo central brillante, vapor saliendo de los hombros | Puño de engranajes: golpe con el puño girando como engranaje |
| `boss-chimera` | Quimera Prismática | 3.º secundaria | Quimera con cuerpo de león dorado, alas de cristal prismático y cola de serpiente, reflejos de arcoíris | Rayo prismático: dispara un haz de luz de colores |
| `boss-leviathan` | Leviatán Estelar | 4.º secundaria | Serpiente marina gigante azul oscuro con constelaciones brillando en la piel, aletas como nebulosas | Ola de constelaciones: ola de agua llena de estrellas |
| `boss-eclipse` | Eclipse Eterno (final de secundaria) | 5.º secundaria | Ave colosal de fuego negro y dorado con un sol eclipsado en el pecho, alas de llamas oscuras | Llamarada del eclipse: lanza fuego negro con anillo dorado |

## ⚔️ Rivales nuevos de los mundos (29)

| Archivo | Rival | Descripción para el prompt | Ataque |
| --- | --- | --- | --- |
| `sand-crab` | Cangrejo de arena | Cangrejo color arena con pinzas grandes y caparazón con manchas | Pinza veloz |
| `river-otter` | Nutria del río | Nutria marrón juguetona con una ola pequeña a su alrededor | Ola juguetona |
| `lantern-moth` | Polilla farolera | Polilla con alas que brillan como faroles amarillos | Polvo brillante |
| `clay-golem` | Gólem de arcilla | Gólem pequeño de arcilla rojiza con grietas y ojos verdes | Puño de barro |
| `berry-boar` | Jabalí de las bayas | Jabalí morado con bayas y hojas en el lomo | Carga frutal |
| `cloud-sheep` | Oveja nube | Oveja esponjosa hecha de nube con chispas eléctricas | Rayo esponjoso |
| `rock-tortoise` | Tortuga de piedra | Tortuga con caparazón de roca y musgo | Caparazón rodante |
| `frost-fox` | Zorro escarcha | Zorro blanco azulado con cola de cristales de hielo | Aliento helado |
| `jungle-parrot` | Loro de la selva | Loro de colores vivos (rojo, verde, azul) con plumas grandes | Graznido sónico |
| `thunder-ram` | Carnero del trueno | Carnero gris con cuernos en espiral que sueltan rayos | Embestida eléctrica |
| `ink-octopus` | Pulpo de tinta | Pulpo azul marino con gotas de tinta negra | Chorro de tinta |
| `bronze-knight` | Caballero de bronce | Caballero en armadura de bronce con lanza y escudo redondo | Lanza de bronce |
| `dune-beetle` | Escarabajo de duna | Escarabajo dorado con cuerno, rodeado de arena | Torbellino de arena |
| `fire-salamander` | Salamandra ígnea | Salamandra roja y naranja con llamas en el lomo | Lengua de fuego |
| `vine-serpent` | Serpiente de lianas | Serpiente verde hecha de lianas y hojas | Látigo verde |
| `crystal-deer` | Ciervo de cristal | Ciervo con cuernos de cristal celeste que reflejan luz | Cuernos prismáticos |
| `storm-eagle` | Águila de tormenta | Águila gris oscuro con plumas eléctricas | Picado relámpago |
| `iron-mantis` | Mantis de hierro | Mantis metálica plateada con brazos como guadañas | Guadañas de acero |
| `lava-golem` | Gólem de lava | Gólem de roca negra con grietas de lava brillante | Erupción |
| `ghost-lantern` | Farol fantasma | Fantasma pequeño que lleva un farol con llama azul | Llama espectral |
| `tide-shark` | Tiburón de marea | Tiburón azul con aletas grandes y espuma | Mordida abisal |
| `sky-wyvern` | Guiverno celeste | Dragón pequeño celeste con alas membranosas | Viento cortante |
| `obsidian-knight` | Caballero de obsidiana | Caballero en armadura negra brillante con espada | Tajo oscuro |
| `star-owl` | Búho estelar | Búho azul noche con estrellas en las plumas | Lluvia de estrellas |
| `magma-wolf` | Lobo de magma | Lobo negro con pelaje de fuego y ojos naranjas | Colmillo ardiente |
| `coral-golem` | Gólem de coral | Gólem rosado hecho de coral y conchas | Golpe de arrecife |
| `shadow-cat` | Gato sombra | Gato negro con ojos morados brillantes y humo de sombra | Zarpazo veloz |
| `aurora-moth` | Polilla aurora | Polilla con alas verdes y moradas como aurora boreal | Polvo de aurora |
| `titan-beetle` | Escarabajo titán | Escarabajo enorme con armadura gris y cuerno gigante | Cuerno sísmico |

---

### Ejemplo completo (copiar y pegar)

> Pixel art chibi estilo RPG de 16 bits, colores vivos, contorno oscuro de 1 píxel, sombreado suave en 2–3 tonos. Fondo totalmente transparente, un solo personaje de cuerpo entero, mirando hacia la izquierda, apoyado en el borde inferior. Formato horizontal 1024×712. Sin texto, sin marco, sin suelo. Mismo estilo que las imágenes de referencia adjuntas.
> Personaje: **jefe final** "Kraken del Lago Sereno". Kraken morado azulado que emerge del agua, tentáculos enrollados, ojos amarillos, gotas de agua. Debe verse grande e imponente, con un aura brillante.

Luego, en el mismo chat:

> Ahora el mismo personaje, misma paleta y mismo tamaño, en pose de ataque: lanza dos tentáculos hacia adelante, con un pequeño efecto de agua morada.

Guarda las imágenes como `boss-kraken.png` y `boss-kraken-attack.png`.
