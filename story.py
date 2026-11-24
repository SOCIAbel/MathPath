"""Story, grade bosses and the extra rivals of the school adventure.

Primary (1.º–6.º): "Los Cristales de Numeria". Secondary (1.º–5.º): "El Eclipse de Aritmia".
Every grade ends with a strong boss. New art files go in arena/ with the asset names below;
until they exist, placeholder copies of older sprites with a different hue are used (see make_placeholders).
"""

PRIMARY_TITLE = 'Los Cristales de Numeria'
SECONDARY_TITLE = 'El Eclipse de Aritmia'

PRIMARY_PROLOGUE = ('La Sombra del Olvido robó los seis Cristales del Saber que iluminaban el reino de Numeria. '
                    'Sin ellos, los números se borran de los libros. Un joven caballero sale del puente del bosque '
                    'para recuperarlos, un cristal por cada grado.')
PRIMARY_EPILOGUE = ('Con el último golpe, el Rey Sombra se deshace en polvo de estrellas. Los seis Cristales del Saber '
                    'vuelven a la torre de Numeria y los números regresan a los libros. El caballero ya no es un aprendiz: '
                    'es el Guardián de Numeria. Pero en el horizonte, el sol empieza a oscurecerse... (continúa en Secundaria)')
SECONDARY_PROLOGUE = ('Un eclipse que no termina cubre las islas de Aritmia. Los cinco Faros del Álgebra se apagaron uno a uno '
                      'y las mareas ya no siguen ninguna regla. El Guardián de Numeria cruza el mar para encenderlos de nuevo.')
SECONDARY_EPILOGUE = ('El Eclipse Eterno se quiebra como un espejo y la luz de los cinco faros atraviesa el cielo. '
                      'Aritmia vuelve a tener días y noches, y las mareas vuelven a seguir sus ecuaciones. '
                      'Tu nombre queda escrito en la Gran Biblioteca: Maestro de las Matemáticas. ¡Fin de la historia!')

# level, unit, id, boss name, arena title, asset, base art for the placeholder, hue, location, effect,
# technique, kind, chapter title, chapter intro, victory text.
_BOSSES = (
    (1, 1, 'jefe-primaria-1', 'Dragón del Alba', 'Torre del Alba', 'dawn-dragon', None, 0, 'castle', 'sparks',
     'Aliento del Alba', 'ember', 'Capítulo 1 · El primer cristal',
     PRIMARY_PROLOGUE + ' El Dragón del Alba guarda el Cristal del Conteo en su torre.',
     '¡Recuperaste el Cristal del Conteo! El dragón, libre del hechizo, te señala el camino hacia el lago.'),
    (1, 2, 'jefe-primaria-2', 'Kraken del Lago Sereno', 'Lago Sereno', 'boss-kraken', 'swamp-caiman', 200, 'marsh', 'mist',
     'Tentáculos del lago', 'drain', 'Capítulo 2 · El lago encantado',
     'El Cristal de la Suma brilla en el fondo del Lago Sereno. Un kraken despertó y no deja cruzar a nadie.',
     '¡El Cristal de la Suma es tuyo! El lago se calma y aparece un puente de nubes hacia las montañas.'),
    (1, 3, 'jefe-primaria-3', 'Grifo de la Tormenta', 'Cumbre de los Vientos', 'boss-storm-griffin', 'crest-griffin', 230,
     'snow', 'snow', 'Picado de tormenta', 'bolt', 'Capítulo 3 · La cumbre de los vientos',
     'En la cumbre más alta, el Grifo de la Tormenta protege el Cristal de los Grupos entre relámpagos.',
     '¡Cristal de los Grupos recuperado! El grifo te deja un mapa del laberinto subterráneo.'),
    (1, 4, 'jefe-primaria-4', 'Minotauro del Laberinto', 'Laberinto de Piedra', 'boss-minotaur', 'obsidian-ram', 20,
     'cavern', 'crystals', 'Embestida del laberinto', 'slam', 'Capítulo 4 · El laberinto de piedra',
     'Bajo la tierra se extiende un laberinto de pasillos que cambian. En el centro, el Minotauro guarda el Cristal de la Medida.',
     '¡El Cristal de la Medida brilla en tu mano! Una corriente de aire frío llega desde el norte.'),
    (1, 5, 'jefe-primaria-5', 'Hechicera de Hielo', 'Palacio Congelado', 'boss-ice-sorceress', 'moss-witch', 160,
     'snow', 'snow', 'Tormenta de cristales', 'frost', 'Capítulo 5 · El palacio congelado',
     'La Hechicera de Hielo congeló el Cristal de las Fracciones dentro de su palacio. Solo quien piense rápido llegará a ella.',
     '¡Derretiste el hechizo! Con el quinto cristal, descubres dónde se esconde la Sombra del Olvido.'),
    (1, 6, 'jefe-primaria-6', 'Rey Sombra', 'Ciudadela del Olvido', 'boss-shadow-king', 'armor', 250, 'volcano', 'embers',
     'Corte del olvido', 'pierce', 'Capítulo 6 · La ciudadela del olvido',
     'La Sombra del Olvido tomó la forma del Rey Sombra. En su ciudadela de lava guarda el último cristal, el del Saber.',
     PRIMARY_EPILOGUE),
    (2, 1, 'jefe-secundaria-1', 'Hidra de las Mareas', 'Isla de las Mareas', 'boss-hydra', 'temple-cobra', 170,
     'marsh', 'mist', 'Mordida triple', 'flurry', 'Capítulo 1 · La isla de las mareas',
     SECONDARY_PROLOGUE + ' En la primera isla, una hidra de tres cabezas apagó el Faro de los Enteros.',
     '¡El Faro de los Enteros vuelve a brillar! Las mareas te llevan hacia una isla de engranajes.'),
    (2, 2, 'jefe-secundaria-2', 'Coloso de Engranajes', 'Isla Mecánica', 'boss-gear-colossus', 'bell-gargoyle', 30,
     'castle', 'sparks', 'Puño de engranajes', 'slam', 'Capítulo 2 · La isla mecánica',
     'Un coloso hecho de engranajes y fórmulas oxidadas custodia el Faro de las Proporciones.',
     '¡Faro de las Proporciones encendido! Entre los engranajes encuentras un prisma que apunta al desierto.'),
    (2, 3, 'jefe-secundaria-3', 'Quimera Prismática', 'Desierto de los Espejismos', 'boss-chimera', 'sphinx', 280,
     'desert', 'dust', 'Rayo prismático', 'bolt', 'Capítulo 3 · El desierto de los espejismos',
     'En el desierto nada es lo que parece. La Quimera Prismática multiplica su forma para proteger el Faro del Álgebra.',
     '¡El Faro del Álgebra se enciende! Los espejismos desaparecen y ves un mar de estrellas en el horizonte.'),
    (2, 4, 'jefe-secundaria-4', 'Leviatán Estelar', 'Mar de las Estrellas', 'boss-leviathan', 'ice-walrus', 220,
     'mill', 'wind', 'Ola de constelaciones', 'frost', 'Capítulo 4 · El mar de las estrellas',
     'El Leviatán Estelar nada entre constelaciones y se tragó el Faro de las Funciones.',
     '¡Faro de las Funciones rescatado! Solo queda uno, en el corazón del eclipse.'),
    (2, 5, 'jefe-secundaria-5', 'Eclipse Eterno', 'Corazón del Eclipse', 'boss-eclipse', 'ash-phoenix', 260, 'volcano',
     'embers', 'Llamarada del eclipse', 'ember', 'Capítulo 5 · El corazón del eclipse',
     'Dentro del eclipse vive un ser de fuego y sombra que se alimenta de la luz del último faro.',
     SECONDARY_EPILOGUE),
)

GRADE_BOSSES = [
    dict(level=level, unit=unit, id=identity, name=name, title=title, asset=asset, base=base, hue=hue, location=location,
         effect=effect, move=move, kind=kind, chapter=chapter, intro=intro, victory=victory,
         final=(level, unit) in ((1, 6), (2, 5)), story=PRIMARY_TITLE if level == 1 else SECONDARY_TITLE)
    for (level, unit, identity, name, title, asset, base, hue, location, effect, move, kind, chapter, intro, victory)
    in _BOSSES
]
GRADE_BOSS_BY_ID = {boss['id']: boss for boss in GRADE_BOSSES}
GRADE_BOSS_BY_GRADE = {(boss['level'], boss['unit']): boss for boss in GRADE_BOSSES}

# Three extra techniques for each boss (name, kind).
BOSS_ATTACKS = {
    'boss-kraken': (('Remolino del lago', 'flurry'), ('Ola gigante', 'slam'), ('Burbuja aprisionadora', 'bolt')),
    'boss-storm-griffin': (('Garras de trueno', 'flurry'), ('Ráfaga helada', 'frost'), ('Embestida aérea', 'rush')),
    'boss-minotaur': (('Hachazo de piedra', 'pierce'), ('Terremoto', 'slam'), ('Carga ciega', 'rush')),
    'boss-ice-sorceress': (('Lanza de hielo', 'pierce'), ('Espejo helado', 'bolt'), ('Ventisca eterna', 'frost')),
    'boss-shadow-king': (('Orbe del olvido', 'drain'), ('Danza de sombras', 'flurry'), ('Golpe real', 'slam')),
    'boss-hydra': (('Veneno de marea', 'drain'), ('Cabezazo', 'slam'), ('Escupitajo ácido', 'bolt')),
    'boss-gear-colossus': (('Rayo de vapor', 'bolt'), ('Engranaje giratorio', 'flurry'), ('Pisotón de hierro', 'rush')),
    'boss-chimera': (('Zarpazo triple', 'flurry'), ('Fuego del espejismo', 'ember'), ('Embestida del león', 'rush')),
    'boss-leviathan': (('Coletazo cósmico', 'slam'), ('Mordida estelar', 'pierce'), ('Tormenta de cometas', 'bolt')),
    'boss-eclipse': (('Sombra devoradora', 'drain'), ('Alas de fuego negro', 'flurry'), ('Estallido solar', 'bolt')),
}

# Extra rivals for the new worlds. Same columns as the original roster plus the placeholder base art and hue,
# and three extra techniques.
NEW_ROSTER = (
    ('sand-crab', 'Cangrejo de arena', 'Pinza veloz', 'flurry', (1, 2), 38, 3, 'gem', False, 'quartz-crab', 40,
     'Concha giratoria,slam|Chorro de arena,bolt|Salto lateral,rush'),
    ('river-otter', 'Nutria del río', 'Ola juguetona', 'slam', (1, 1, 2), 38, 3, 'wood', True, 'miller-fox', 160,
     'Coletazo,rush|Burbujas,bolt|Remolino,flurry'),
    ('lantern-moth', 'Polilla farolera', 'Polvo brillante', 'bolt', (1, 2), 37, 3, 'fiber', False, 'amethyst-bat', 60,
     'Aleteo,flurry|Picado de luz,rush|Destello dormilón,drain'),
    ('clay-golem', 'Gólem de arcilla', 'Puño de barro', 'slam', (1, 2, 1), 39, 3, 'ore', False, 'golem', 25,
     'Bola de barro,bolt|Rodada,rush|Puños alternos,flurry'),
    ('berry-boar', 'Jabalí de las bayas', 'Carga frutal', 'rush', (2, 1), 38, 4, 'wood', False, 'oak-boar', 300,
     'Lluvia de bayas,bolt|Colmillazo,pierce|Pisotón,slam'),
    ('cloud-sheep', 'Oveja nube', 'Rayo esponjoso', 'bolt', (1, 1, 2), 37, 3, 'fiber', True, 'polar-hare', 200,
     'Salto de nube,rush|Lluvia suave,drain|Tormenta de lana,flurry'),
    ('rock-tortoise', 'Tortuga de piedra', 'Caparazón rodante', 'slam', (1, 2), 40, 4, 'ore', False, 'moss-turtle', 30,
     'Mordida lenta,pierce|Roca lanzada,bolt|Giro de piedra,flurry'),
    ('frost-fox', 'Zorro escarcha', 'Aliento helado', 'frost', (1, 2, 1), 36, 4, 'fiber', False, 'miller-fox', 190,
     'Salto de nieve,rush|Zarpas frías,flurry|Colmillo de hielo,pierce'),
    ('jungle-parrot', 'Loro de la selva', 'Graznido sónico', 'bolt', (2, 1), 35, 3, 'fiber', False, 'crest-griffin', 100,
     'Picado,rush|Plumas de colores,flurry|Pico afilado,pierce'),
    ('thunder-ram', 'Carnero del trueno', 'Embestida eléctrica', 'rush', (2, 1, 1), 37, 4, 'ore', True, 'obsidian-ram', 220,
     'Rayo de cuernos,bolt|Pisada sísmica,slam|Chispas,flurry'),
    ('ink-octopus', 'Pulpo de tinta', 'Chorro de tinta', 'drain', (1, 2), 36, 4, 'gem', False, 'swamp-caiman', 260,
     'Tentáculos,flurry|Abrazo marino,slam|Ventosa,pierce'),
    ('bronze-knight', 'Caballero de bronce', 'Lanza de bronce', 'pierce', (1, 2, 2), 38, 4, 'ore', True, 'armor', 35,
     'Escudo embestida,rush|Espadazos,flurry|Martillo de bronce,slam'),
    ('dune-beetle', 'Escarabajo de duna', 'Torbellino de arena', 'flurry', (2, 1), 36, 4, 'gem', False, 'beetle', 40,
     'Cuernazo,pierce|Bola de arena,bolt|Excavación,rush'),
    ('fire-salamander', 'Salamandra ígnea', 'Lengua de fuego', 'ember', (1, 2, 1), 37, 4, 'ore', False, 'lizard', 330,
     'Coletazo ardiente,slam|Salto de brasa,rush|Escamas de fuego,flurry'),
    ('vine-serpent', 'Serpiente de lianas', 'Látigo verde', 'pierce', (2, 1), 35, 4, 'wood', True, 'temple-cobra', 90,
     'Enredo,drain|Mordida,rush|Espiral de hojas,flurry'),
    ('crystal-deer', 'Ciervo de cristal', 'Cuernos prismáticos', 'bolt', (1, 2, 2), 36, 4, 'gem', False, 'thorn-stag', 180,
     'Carga brillante,rush|Patada de cuarzo,slam|Astillas,flurry'),
    ('storm-eagle', 'Águila de tormenta', 'Picado relámpago', 'rush', (2, 1, 2), 33, 4, 'fiber', False, 'dunes-vulture', 210,
     'Garras de rayo,flurry|Viento cortante,bolt|Pico de trueno,pierce'),
    ('iron-mantis', 'Mantis de hierro', 'Guadañas de acero', 'flurry', (2, 2, 1), 34, 5, 'ore', True, 'canopy-spider', 30,
     'Estocada,pierce|Salto metálico,rush|Chispazo,bolt'),
    ('lava-golem', 'Gólem de lava', 'Erupción', 'ember', (2, 1, 2), 38, 5, 'ore', False, 'caldera-ape', 10,
     'Puño de magma,slam|Roca ardiente,bolt|Carga volcánica,rush'),
    ('ghost-lantern', 'Farol fantasma', 'Llama espectral', 'drain', (1, 2, 2), 35, 5, 'gem', True, 'scarecrow', 250,
     'Susto,rush|Fuego fatuo,bolt|Remolino espectral,flurry'),
    ('tide-shark', 'Tiburón de marea', 'Mordida abisal', 'pierce', (2, 2, 1), 34, 5, 'wood', False, 'ice-walrus', 200,
     'Ola de choque,slam|Torbellino,flurry|Embestida,rush'),
    ('sky-wyvern', 'Guiverno celeste', 'Viento cortante', 'bolt', (2, 1, 2), 33, 5, 'fiber', True, 'ash-phoenix', 180,
     'Picado,rush|Cola de látigo,pierce|Aleteo huracanado,flurry'),
    ('obsidian-knight', 'Caballero de obsidiana', 'Tajo oscuro', 'pierce', (2, 1, 3), 36, 5, 'ore', False, 'armor', 260,
     'Golpe de escudo,slam|Cortes dobles,flurry|Orbe oscuro,bolt'),
    ('star-owl', 'Búho estelar', 'Lluvia de estrellas', 'bolt', (1, 2, 2), 34, 5, 'gem', True, 'copper-owl', 230,
     'Picado nocturno,rush|Plumas de luz,flurry|Mirada hipnótica,drain'),
    ('magma-wolf', 'Lobo de magma', 'Colmillo ardiente', 'ember', (2, 2, 1), 35, 5, 'ore', False, 'blizzard-wolf', 340,
     'Salto de lava,rush|Zarpas de fuego,flurry|Mordida,pierce'),
    ('coral-golem', 'Gólem de coral', 'Golpe de arrecife', 'slam', (2, 1, 3), 37, 5, 'wood', True, 'geode-slug', 300,
     'Lluvia de coral,bolt|Abrazo marino,drain|Púas,pierce'),
    ('shadow-cat', 'Gato sombra', 'Zarpazo veloz', 'flurry', (2, 1, 2), 32, 5, 'fiber', False, 'wind-badger', 270,
     'Salto felino,rush|Ojos de sombra,drain|Garra única,pierce'),
    ('aurora-moth', 'Polilla aurora', 'Polvo de aurora', 'drain', (2, 2, 1), 34, 5, 'gem', True, 'amethyst-bat', 120,
     'Aleteo boreal,flurry|Rayo de colores,bolt|Picado,rush'),
    ('titan-beetle', 'Escarabajo titán', 'Cuerno sísmico', 'slam', (2, 2, 2), 36, 6, 'ore', False, 'crystal-mole', 50,
     'Embestida,rush|Pinzas,flurry|Rayo de caparazón,bolt'),
)

ASSET_BASES = {row[0]: (row[9], row[10]) for row in NEW_ROSTER}
ASSET_BASES.update({boss['asset']: (boss['base'], boss['hue']) for boss in GRADE_BOSSES if boss['base']})


def make_placeholders(arena_dir):
    """Create hue-shifted copies of existing sprites for new rivals and bosses that still have no art.

    Real drawings simply replace these files (same names). Returns the list of files created.
    """
    from pathlib import Path
    from PIL import Image
    import numpy as np
    arena = Path(arena_dir)
    created = []
    for asset, (base, hue) in ASSET_BASES.items():
        for suffix in ('', '-attack'):
            target = arena / f'{asset}{suffix}.webp'
            source = arena / f'{base}{suffix}.webp'
            if target.exists() or not source.exists():
                continue
            image = Image.open(source).convert('RGBA')
            alpha = image.getchannel('A')
            hsv = np.array(image.convert('RGB').convert('HSV'), dtype=np.int16)
            hsv[..., 0] = (hsv[..., 0] + int(hue / 360 * 255)) % 256
            shifted = Image.fromarray(hsv.astype('uint8'), 'HSV').convert('RGB')
            shifted.putalpha(alpha)
            if asset.startswith('boss-'):
                # Bosses look bigger: scale the sprite inside the same canvas.
                width, height = shifted.size
                grown = shifted.resize((int(width * 1.12), int(height * 1.12)), Image.LANCZOS)
                canvas = Image.new('RGBA', (width, height), (0, 0, 0, 0))
                canvas.alpha_composite(grown.crop(((grown.width - width) // 2, grown.height - height,
                                                   (grown.width - width) // 2 + width, grown.height)))
                shifted = canvas
            shifted.save(target, 'WEBP', quality=92)
            created.append(target.name)
    return created
