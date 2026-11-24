# MathPath · Autor: Abel Josué Colquehuanca Humpiri
"""Combat rules, rival roster and equipment for the school adventure."""

from itertools import groupby
import random
import re
import time

from curriculum import TOPICS
from engine import AbelInputError
from school_extra import NEW_SCHOOL_IDS
import story


KNIGHT_LIVES = 3
GUARDIAN_LIVES = 2
ADVENTURE_SECONDS = 40
ENERGY_MAX = 3
HEALTH_VERSION = 3
# Consecutive answers charge a real multi-hit finisher. The next finisher is
# stronger, but an error (even when blocked) resets the chain.
COMBO_RULES = {'baseEvery':3, 'minEvery':2, 'maxStage':3,
               'bonuses':[2,3,4], 'hits':[2,3,4]}
HERO_ATTACKS = {
    'slash': dict(name='Espadazo', cost=0, bonus=0, hits=1,
                  description='Da un golpe y recupera 1 energía.'),
    'double': dict(name='Doble corte', cost=1, bonus=1, hits=2,
                   description='Da dos golpes seguidos. Gasta 1 energía.'),
    'vault': dict(name='Salto protector', cost=1, bonus=0, hits=1, guard=1,
                  description='Golpea desde el aire y bloquea 1 de daño del próximo ataque.'),
    'wave': dict(name='Onda rúnica', cost=2, bonus=2, hits=1,
                 description='Lanza una onda mágica más fuerte. Gasta 2 energías.'),
}
FIRST_GRADE_BOSS = {'id': 'jefe-primaria-1', 'name': 'Dragón del Alba', 'level': 1, 'unit': 1}
FIRST_GRADE_TOPICS = tuple(topic_id for topic_id, item in TOPICS.items() if item['level'] == 1 and item['unit'] == 1)

# The order follows the three-mission stretches of the two school levels.
# Asset, name, technique, type, damage by round, time, hearts, loot, barrier.
_ROSTER = (
    ('golem', 'Gólem de piedra', 'Pisotón de roca', 'slam', (1, 2), 40, 2, 'ore', False),
    ('mushroom', 'Duende de las setas', 'Salto de esporas', 'rush', (1, 1, 2), 37, 3, 'wood', True),
    ('beetle', 'Escarabajo de cristal', 'Destello prismático', 'bolt', (1, 2, 1), 38, 3, 'gem', False),
    ('yeti', 'Yeti nevado', 'Ventisca blanca', 'frost', (1, 2, 1), 40, 3, 'fiber', False),
    ('armor', 'Armadura encantada', 'Tajo perforante', 'pierce', (1, 2, 2), 40, 4, 'ore', True),
    ('sphinx', 'Esfinge de arena', 'Garras de la duna', 'flurry', (1, 2, 1), 39, 3, 'gem', False),
    ('frog', 'Caballero rana', 'Salto desde el fango', 'rush', (1, 2), 34, 3, 'wood', True),
    ('lizard', 'Lagarto de lava', 'Llama rasante', 'ember', (1, 1, 2), 39, 4, 'ore', False),
    ('scarecrow', 'Guardia de paja', 'Soplo que reanima', 'drain', (1, 1, 2), 38, 3, 'fiber', False),
    ('oak-boar', 'Jabalí de roble', 'Embestida de raíces', 'slam', (2, 1, 1), 39, 4, 'wood', False),
    ('amethyst-bat', 'Murciélago de amatista', 'Eco de amatista', 'drain', (1, 2), 35, 3, 'gem', False),
    ('blizzard-wolf', 'Lobo de la ventisca', 'Mordida de hielo', 'frost', (2, 1, 1), 38, 4, 'fiber', False),
    ('copper-owl', 'Centinela de cobre', 'Pluma de cobre', 'pierce', (2, 1, 2), 38, 4, 'ore', True),
    ('solar-scorpion', 'Escorpión solar', 'Aguijón incandescente', 'ember', (2, 1, 1), 36, 4, 'gem', False),
    ('moss-turtle', 'Tortuga del lodazal', 'Onda del caparazón', 'slam', (1, 1, 3), 40, 5, 'wood', True),
    ('obsidian-ram', 'Carnero de obsidiana', 'Topetazo de obsidiana', 'pierce', (2, 2, 1), 39, 4, 'ore', False),
    ('miller-fox', 'Zorro molinero', 'Vaivén del molino', 'flurry', (2, 1, 2), 34, 3, 'fiber', False),
    ('thorn-stag', 'Ciervo de espinas', 'Tormenta de espinas', 'bolt', (2, 1), 36, 4, 'wood', True),
    ('quartz-crab', 'Cangrejo de cuarzo', 'Pinzas en ráfaga', 'flurry', (2, 1, 1), 37, 4, 'gem', True),
    ('ice-walrus', 'Morsa del hielo', 'Muro de hielo', 'frost', (1, 1, 2), 39, 5, 'fiber', True),
    ('crest-griffin', 'Grifo heráldico', 'Picado heráldico', 'rush', (2, 1, 1), 32, 4, 'ore', False),
    ('temple-cobra', 'Cobra del templo', 'Mirada del templo', 'pierce', (1, 2), 34, 4, 'gem', False),
    ('moss-witch', 'Bruja del musgo', 'Hechizo de musgo', 'drain', (2, 1, 1), 36, 4, 'wood', True),
    ('ash-phoenix', 'Fénix de ceniza', 'Lluvia de ceniza', 'ember', (1, 2, 1, 2), 35, 5, 'gem', False),
    ('wind-badger', 'Tejón del vendaval', 'Golpe del vendaval', 'slam', (2, 1, 3), 38, 4, 'fiber', False),
    ('canopy-spider', 'Araña del dosel', 'Trampa de seda', 'rush', (1, 2, 2), 33, 4, 'fiber', True),
    ('geode-slug', 'Babosa de geoda', 'Pulso de la geoda', 'drain', (1, 1, 3), 40, 5, 'gem', False),
    ('polar-hare', 'Liebre polar', 'Zigzag polar', 'frost', (1, 2), 32, 4, 'fiber', False),
    ('bell-gargoyle', 'Gárgola del campanario', 'Campanada de piedra', 'slam', (1, 3, 2), 40, 5, 'ore', True),
    ('dunes-vulture', 'Buitre de las dunas', 'Soplo de arena', 'bolt', (1, 2, 2), 34, 4, 'fiber', False),
    ('swamp-caiman', 'Caimán de la ciénaga', 'Coletazo de la ciénaga', 'flurry', (2, 2, 1), 36, 5, 'wood', False),
    ('caldera-ape', 'Mono de la caldera', 'Puños de la caldera', 'ember', (2, 1, 2), 38, 5, 'ore', False),
    ('miller-puppet', 'Molinero de madera', 'Aspas giratorias', 'flurry', (2, 1, 3), 35, 5, 'wood', True),
    ('oak-hornet', 'Avispa del roble', 'Aguijón relámpago', 'pierce', (1, 2, 2), 31, 4, 'fiber', False),
    ('crystal-mole', 'Topo de cristal', 'Sacudida subterránea', 'bolt', (2, 1, 3), 37, 5, 'gem', True),
)

# Three additional techniques for every rival, alongside its original signature.
# Each row defines a separate attack animation and a combat effect.
_EXTRA_ATTACKS = '''
golem|Roca voladora,bolt|Embestida del puente,rush|Lluvia de guijarros,flurry
mushroom|Nube de esporas,drain|Raíces saltarinas,slam|Semillas en ráfaga,bolt
beetle|Pinzas de cuarzo,pierce|Salto de geoda,rush|Cristales en ráfaga,flurry
yeti|Pisotón de nieve,slam|Carrera del glaciar,rush|Puños de escarcha,flurry
armor|Acero en ráfaga,flurry|Escudo arrollador,rush|Sello encantado,bolt
sphinx|Zarpazo del faraón,pierce|Salto de la esfinge,rush|Esfera del desierto,bolt
frog|Lanza del pantano,pierce|Onda de nenúfar,slam|Burbuja del fango,bolt
lizard|Coletazo ardiente,slam|Salto de lava,rush|Garras de brasa,flurry
scarecrow|Ráfaga de paja,bolt|Danza del espantapájaros,flurry|Salto del sembrado,rush
oak-boar|Colmillo de roble,pierce|Hojas afiladas,flurry|Semilla de raíz,bolt
amethyst-bat|Picado de amatista,rush|Alas de cristal,flurry|Destello del eco,bolt
blizzard-wolf|Salto de la ventisca,rush|Zarpas del glaciar,flurry|Colmillo polar,pierce
copper-owl|Picado de cobre,rush|Plumas en ráfaga,flurry|Relámpago del centinela,bolt
solar-scorpion|Pinzas del sol,flurry|Carrera de la duna,rush|Aguijón solar,pierce
moss-turtle|Giro de musgo,flurry|Carga del caparazón,rush|Orbe del lodazal,drain
obsidian-ram|Salto del cráter,rush|Pisada de obsidiana,slam|Chispa del volcán,ember
miller-fox|Salto del molino,rush|Aspa de viento,bolt|Estocada del molinero,pierce
thorn-stag|Cornamenta de espinas,pierce|Carrera del bosque,rush|Pisada de raíces,slam
quartz-crab|Martillo de cuarzo,slam|Punta de cristal,pierce|Orbe del arrecife,bolt
ice-walrus|Colmillos del hielo,pierce|Ola del glaciar,slam|Deslizamiento polar,rush
crest-griffin|Garras heráldicas,flurry|Pluma dorada,bolt|Pico del guardián,pierce
temple-cobra|Espiral del templo,flurry|Salto de la cobra,rush|Orbe de arena,bolt
moss-witch|Brote espinoso,pierce|Semillas encantadas,flurry|Remolino de musgo,bolt
ash-phoenix|Picado de ceniza,rush|Alas del renacer,flurry|Pluma solar,pierce
wind-badger|Carrera del vendaval,rush|Garras del viento,flurry|Bola de aire,bolt
canopy-spider|Hilos en ráfaga,flurry|Colmillo del dosel,pierce|Esfera de seda,bolt
geode-slug|Lluvia de geodas,bolt|Salto del cristal,rush|Pisada de piedra,slam
polar-hare|Salto de la aurora,rush|Patadas de nieve,flurry|Estrella polar,bolt
bell-gargoyle|Picado del campanario,rush|Garras de piedra,pierce|Eco de la campana,bolt
dunes-vulture|Picado de la duna,rush|Garras de arena,flurry|Pico del desierto,pierce
swamp-caiman|Mordida de la ciénaga,pierce|Salto del caimán,rush|Ola del pantano,slam
caldera-ape|Salto de la caldera,rush|Puños en ráfaga,flurry|Martillo del cráter,slam
miller-puppet|Salto de madera,rush|Martillo del molino,slam|Astilla encantada,pierce
oak-hornet|Picado del roble,rush|Alas en ráfaga,flurry|Polen del bosque,drain
crystal-mole|Excavación sorpresa,rush|Garras de geoda,flurry|Punta de cuarzo,pierce
dawn-dragon|Zarpas del Alba,flurry|Picado del amanecer,rush|Rugido de la torre,slam
'''
EXTRA_ATTACKS = {
    cells[0]: [entry.rsplit(',',1) for entry in cells[1:]]
    for cells in (line.split('|') for line in _EXTRA_ATTACKS.strip().splitlines())
}
EXTRA_ATTACKS.update({row[0]: [entry.rsplit(',',1) for entry in row[11].split('|')] for row in story.NEW_ROSTER})
EXTRA_ATTACKS.update({asset: [list(entry) for entry in moves] for asset, moves in story.BOSS_ATTACKS.items()})

def rival_attacks(identity, name, kind, pattern):
    techniques = [(name,kind),*EXTRA_ATTACKS[identity]]
    return [
        dict(id=f'{identity}-{index}', name=label, kind=style,
             damage=pattern[index % len(pattern)], index=index)
        for index,(label,style) in enumerate(techniques)
    ]

RIVALS = [
    dict(id=asset, name=name, move=move, kind=kind, pattern=pattern,
         seconds=seconds, hearts=12+2*lives+index//10, rewardCoins=10 if lives>=4 else 8, drop=drop, guard=guard,
         attacks=rival_attacks(asset,move,kind,pattern))
    for index,(asset,name,move,kind,pattern,seconds,lives,drop,guard,*_) in enumerate(_ROSTER+story.NEW_ROSTER)
]
DRAGON = dict(id='dawn-dragon', name=FIRST_GRADE_BOSS['name'], move='Aliento del Alba', kind='ember',
              pattern=(1, 1, 2), seconds=40, hearts=30, drop='scale', guard=False,
              attacks=rival_attacks('dawn-dragon','Aliento del Alba','ember',(1,1,2)))

GROUPS = {}
_NEW = set(NEW_SCHOOL_IDS)
next_group = 0
# Original missions first, exactly as before, so saved worlds and world bosses keep their numbers.
for extra in (False, True):
    school = (item for item in TOPICS.values() if item['level'] < 3 and (item['id'] in _NEW) == extra)
    for _, grade in groupby(school, key=lambda item: (item['level'],item['unit'])):
        topics = list(grade)
        GROUPS.update({item['id']: next_group+index//3 for index,item in enumerate(topics)})
        next_group += (len(topics)+2)//3
assert next_group == len(RIVALS), (next_group, len(RIVALS))

# One strong boss closes every school grade. The first one is the original Dawn Dragon.
DRAGON.update(boss=True, gradeBoss=True, level=1, unit=1)
GRADE_RIVALS = {}
for _boss in story.GRADE_BOSSES:
    if _boss['id'] == FIRST_GRADE_BOSS['id']:
        GRADE_RIVALS[_boss['id']] = DRAGON
        continue
    _step = _boss['unit'] - 1
    _pattern = (1, 2, 2) if _boss['level'] == 1 and _step < 3 else (2, 2, 3)
    GRADE_RIVALS[_boss['id']] = dict(
        id=_boss['asset'], name=_boss['name'], move=_boss['move'], kind=_boss['kind'], pattern=_pattern,
        seconds=34, hearts=(30 + 6*_step) if _boss['level'] == 1 else (48 + 6*_step), rewardCoins=40,
        drop='scale', guard=False, boss=True, gradeBoss=True, level=_boss['level'], unit=_boss['unit'],
        attacks=rival_attacks(_boss['asset'], _boss['move'], _boss['kind'], _pattern))


def is_grade_boss(topic_id):
    return topic_id in GRADE_RIVALS


def grade_topics(level, unit):
    return [topic_id for topic_id, item in TOPICS.items() if item['level'] == level and item['unit'] == unit]


_SLOW_OPERATIONS = {'equation': 7, 'system': 10, 'inequality': 8, 'factor': 6, 'expand': 5, 'simplify': 5,
                    'statistics': 4, 'matrix': 6}


def boss_seconds(exercise, battle, rival):
    """Grade bosses give less time, adjusted to how long the exercise takes to read and solve."""
    problem = str(exercise.get('problem', ''))
    tokens = len(re.findall(r'[\d.]+|[a-zA-Z]+|[-+*/^=()]', problem))
    seconds = 8 + 1.3*tokens + len(str(exercise.get('question', '')))/16 + _SLOW_OPERATIONS.get(exercise.get('operation'), 0)
    if exercise.get('choices'):
        seconds -= 4
    seconds *= .8
    if 0 < battle['rival'] <= battle['rivalTotal']//3:
        seconds *= .85     # final phase: the boss is furious
    # Younger grades get a little more time; the minimum shrinks as the story advances.
    minimum = max(14, 24 - 2*rival.get('unit', 1)) if rival.get('level', 2) == 1 else 15
    return int(max(minimum, min(40, round(seconds))))

RESOURCES = {
    'coins': 'Monedas', 'wood': 'Madera', 'ore': 'Mineral',
    'fiber': 'Fibra', 'gem': 'Cristal', 'scale': 'Escama de dragón',
}
SLOTS = {'sword':'Arma', 'armor':'Armadura', 'shield':'Escudo', 'supply':'Ayudas'}
ITEMS = {
    'iron-sword': dict(slot='sword', name='Espada de hierro', cost={'coins':16,'ore':2}, power=1,
                       description='Tus aciertos causan un punto más de daño.'),
    'rune-sword': dict(slot='sword', name='Espada rúnica', cost={'coins':34,'ore':3,'gem':2}, power=1, combo=1,
                       description='Añade un punto de daño y otro al encadenar dos aciertos.'),
    'bronze-blades': dict(slot='sword', name='Hojas gemelas', cost={'coins':20,'ore':1}, power=1, combo=1,
                          description='Dos hojas con cortes encadenados.'),
    'frost-sword': dict(slot='sword', name='Espada de hielo', cost={'coins':34,'gem':2,'ore':1}, power=2,
                       description='Cortes y proyectiles de hielo.'),
    'ember-axe': dict(slot='sword', name='Hacha de fuego', cost={'coins':42,'ore':3,'gem':1}, power=3,
                     description='Tajos de fuego y llamaradas.'),
    'storm-spear': dict(slot='sword', name='Lanza del rayo', cost={'coins':46,'gem':3,'ore':2}, power=2, combo=1,
                       description='Estocadas rápidas y relámpagos.'),
    'stone-hammer': dict(slot='sword', name='Martillo de roca', cost={'coins':30,'ore':3,'wood':2}, power=3,
                        description='Golpes pesados y ondas por el suelo.'),
    'forest-bow': dict(slot='sword', name='Arco del bosque', cost={'coins':18,'wood':3,'fiber':1}, power=1, combo=2,
                      description='Flechas, ráfagas y disparos desde el aire.'),
    'leather-armor': dict(slot='armor', name='Armadura de cuero', cost={'coins':16,'fiber':2}, hearts=1,
                          description='Empiezas cada duelo con un corazón extra.'),
    'plated-armor': dict(slot='armor', name='Cota reforzada', cost={'coins':32,'ore':3,'fiber':2}, hearts=2, armor=1,
                         description='Dos corazones extra y un punto menos de daño en golpes fuertes.'),
    'scout-cloak': dict(slot='armor', name='Capa del bosque', cost={'coins':12,'fiber':2,'wood':1}, hearts=1, ward=1,
                       description='Un corazón y un punto de bloqueo extra.'),
    'ice-armor': dict(slot='armor', name='Armadura de hielo', cost={'coins':50,'fiber':4,'gem':3}, hearts=3, armor=1,
                     description='Tres corazones extra y defensa contra golpes fuertes.'),
    'ember-armor': dict(slot='armor', name='Armadura de fuego', cost={'coins':64,'ore':5,'gem':3}, hearts=4, armor=1,
                       description='Cuatro corazones extra y defensa contra golpes fuertes.'),
    'royal-armor': dict(slot='armor', name='Armadura real', cost={'coins':84,'ore':6,'scale':1}, hearts=5, armor=2,
                       description='Cinco corazones extra y dos de defensa contra golpes fuertes.'),
    'oak-shield': dict(slot='shield', name='Escudo de roble', cost={'coins':15,'wood':2}, ward=1,
                       description='Absorbe un punto de daño por duelo.'),
    'scale-shield': dict(slot='shield', name='Escudo de escamas', cost={'coins':24,'scale':1,'ore':2}, ward=2,
                         description='Absorbe dos puntos de daño por duelo. Requiere una escama del Dragón del Alba.'),
    'crystal-shield': dict(slot='shield', name='Escudo de cristal', cost={'coins':38,'gem':3,'ore':2}, ward=3,
                          description='Bloquea tres puntos de daño por duelo.'),
    'royal-shield': dict(slot='shield', name='Escudo real', cost={'coins':65,'ore':4,'scale':1}, ward=4,
                        description='Bloquea cuatro puntos de daño por duelo.'),
    'healing-potion': dict(slot='supply', name='Poción de curación', cost={'coins':9}, heal=2,
                          description='Recupera hasta dos corazones. Usa una por turno.'),
}
_WEAPON_MOVES = {
    'wood': ('starter-sword', ('slash','double','vault','wave'),
             ('Espadazo','Doble corte','Salto protector','Onda mágica'), ('Golpe','Doble','Salto','Magia')),
    'steel': ('iron-sword', ('slash','double','vault','pierce'),
              ('Tajo de hierro','Doble acero','Estocada aérea','Corte de viento'), ('Tajo','Doble','Salto','Viento')),
    'rune': ('rune-sword', ('wave','double','vault','bolt'),
             ('Sello rúnico','Cruce arcano','Paso encantado','Orbe rúnico'), ('Sello','Cruce','Salto','Orbe')),
    'twin': ('bronze-blades', ('double','flurry','vault','blade-storm'),
             ('Corte gemelo','Rueda de hojas','Salto doble','Tormenta de hojas'), ('Gemelo','Giro','Salto','Hojas')),
    'frost': ('frost-sword', ('frost','double','vault','blizzard'),
              ('Aguja helada','Corte de escarcha','Salto polar','Ventisca'), ('Hielo','Doble','Salto','Nevada')),
    'fire': ('ember-axe', ('slash','flurry','vault','firestorm'),
             ('Tajo de brasa','Giro de fuego','Salto de llama','Llamarada'), ('Brasa','Giro','Salto','Fuego')),
    'storm': ('storm-spear', ('pierce','double','vault','lightning'),
              ('Estocada del trueno','Doble relámpago','Salto del rayo','Rayo celeste'), ('Punta','Doble','Salto','Rayo')),
    'stone': ('stone-hammer', ('slam','double','vault','quake'),
              ('Martillazo','Doble impacto','Salto sísmico','Terremoto'), ('Golpe','Doble','Salto','Sismo')),
    'bow': ('forest-bow', ('arrow','volley','vault','arrow-rain'),
            ('Flecha rápida','Doble flecha','Salto del arquero','Lluvia de flechas'), ('Flecha','Doble','Salto','Lluvia')),
}
WEAPONS = {
    style:{'item':item, 'moves':{
        key:{'animation':animation,'name':name,'label':label}
        for key,animation,name,label in zip(HERO_ATTACKS,animations,names,labels)
    }}
    for style,(item,animations,names,labels) in _WEAPON_MOVES.items()
}
WEAPON_STYLE = {profile['item']:style for style,profile in WEAPONS.items()}
GUIDE = {'groups': GROUPS, 'rivals': RIVALS, 'dragon': DRAGON,
         'resources': RESOURCES, 'slots': SLOTS, 'items': ITEMS,
         'heroAttacks':HERO_ATTACKS, 'maxEnergy':ENERGY_MAX, 'weapons':WEAPONS,
         'combo':COMBO_RULES}


BOSS_RIVALS = {}


def world_boss_rival(topic_id):
    """Crowned, tougher version of the rival guarding a stretch of three missions."""
    suffix = str(topic_id).removeprefix('jefe-mundo-')
    if not is_world_boss(topic_id) or not suffix.isdecimal() or not 0 <= int(suffix) < len(RIVALS):
        raise AbelInputError('Elige un jefe del mapa de Primaria o Secundaria.')
    if topic_id not in BOSS_RIVALS:
        group = int(topic_id.rsplit('-',1)[1])
        base = RIVALS[group]
        members = sum(1 for value in GROUPS.values() if value == group)
        BOSS_RIVALS[topic_id] = base | {
            'name': 'Rey ' + base['name'], 'hearts': 2*base['hearts']+2*members, 'guard': False,
            'seconds': max(30, base['seconds']-2), 'rewardCoins': 30, 'boss': True, 'worldBoss': True,
            'attacks': [move | {'damage': min(3, move['damage']+(1 if index == 3 else 0))}
                        for index, move in enumerate(base['attacks'])],
        }
    return BOSS_RIVALS[topic_id]


def is_world_boss(topic_id):
    return str(topic_id).startswith('jefe-mundo-')


def rival_for(topic_id):
    if is_world_boss(topic_id):
        return world_boss_rival(topic_id)
    if topic_id in GRADE_RIVALS:
        return GRADE_RIVALS[topic_id]
    if topic_id not in GROUPS:
        raise AbelInputError('Elige una misión de Primaria o Secundaria.')
    return RIVALS[GROUPS[topic_id]]


def loot_for(topic_id):
    if topic_id == FIRST_GRADE_BOSS['id']:
        return {'coins':32, 'scale':1, 'ore':2}
    if topic_id in GRADE_RIVALS:
        unit = story.GRADE_BOSS_BY_ID[topic_id]['unit']
        return {'coins':32+8*unit, 'scale':1, 'ore':2, 'gem':1+unit//2}
    if is_world_boss(topic_id):
        rival = rival_for(topic_id)
        return {'coins':30, rival['drop']:2, 'gem':1}
    rival = rival_for(topic_id)
    return {'coins':rival['rewardCoins'], rival['drop']:1}


def replay_loot(topic_id):
    return {key: max(1,value//3) if key=='coins' else 1 for key,value in loot_for(topic_id).items()}


def equipment(equipped):
    bonuses = {'power':0, 'combo':0, 'hearts':0, 'armor':0, 'ward':0}
    for item_id in equipped.values():
        for key in bonuses:
            bonuses[key]+=ITEMS[item_id].get(key,0)
    return bonuses


def begin_battle(rival, equipped, skills=None, pet_ward=0):
    gear = equipment(equipped)
    skills = skills or {}
    gear['hearts'] += skills.get('corazon',0)
    gear['ward'] += skills.get('guardia',0)+pet_ward
    hero_total = KNIGHT_LIVES+gear['hearts']
    battle = {'hero':hero_total, 'heroTotal':hero_total, 'rival':rival['hearts'], 'rivalTotal':rival['hearts'],
            'gear':gear, 'equipped':dict(equipped), 'ward':gear['ward'], 'shielded':False, 'event':'',
            'seen':[], 'correctKeys':[], 'studyHits':0, 'streak':0, 'round':0, 'chilled':False,
            'burned':False, 'barrierBroken':not rival['guard'], 'usedPotion':False,
            'heroMove':'slash', 'energy':ENERGY_MAX, 'heroGuard':0, 'healthVersion':HEALTH_VERSION,
            'weaponStyle':WEAPON_STYLE.get(equipped.get('sword'),'wood'), 'skills':dict(skills),
            'crits':0, 'combos':0}
    sync_combo(battle)
    return battle


def sync_combo(battle):
    """Keep one authoritative charge state for the meter and the next strike."""
    rank = max(0, min(2, battle.get('skills',{}).get('combo',0)))
    every = max(COMBO_RULES['minEvery'],COMBO_RULES['baseEvery']-min(rank,1))
    streak = max(0,battle.get('streak',0))
    stage = min(COMBO_RULES['maxStage'],streak//every)
    next_stage = min(COMBO_RULES['maxStage'],stage+1)
    battle.update(comboEvery=every,comboProgress=streak%every,comboStage=stage,
                  comboNext=every-streak%every,
                  comboBonusNext=COMBO_RULES['bonuses'][next_stage-1]+max(0,rank-1),
                  comboHitsNext=COMBO_RULES['hits'][next_stage-1])


def update_saved_battle(battle, rival):
    for key,value in (('heroMove','slash'),('energy',ENERGY_MAX),('heroGuard',0)):
        battle.setdefault(key,value)
    if 'heroTotal' not in battle:
        total=len(FIRST_GRADE_TOPICS) if rival is DRAGON else GUARDIAN_LIVES
        hits=total-battle['rival']
        for key,value in begin_battle(rival,{}).items():
            if key!='healthVersion':
                battle.setdefault(key,value)
        battle.update(rivalTotal=total,studyHits=hits,round=max(1,len(battle['seen'])),barrierBroken=True)
        battle.setdefault('turnSeconds',ADVENTURE_SECONDS)
        battle.setdefault('threat',forecast(battle,rival))
    battle.setdefault('weaponStyle',WEAPON_STYLE.get(battle['equipped'].get('sword'),'wood'))
    # New fights use the tougher roster. Keep an existing fight's exact health,
    # including defeated enemies, rather than refilling it when it is reopened.
    battle['healthVersion']=HEALTH_VERSION
    sync_combo(battle)


def forecast(battle, rival):
    technique = rival['attacks'][max(0,battle['round']-1)%len(rival['attacks'])]
    enraged = bool((rival.get('worldBoss') or rival.get('gradeBoss')) and 0 < battle['rival'] <= battle['rivalTotal']//3)
    power = min(3,technique['damage']+int(battle['burned'])+int(enraged))
    return technique|{'damage':power, 'enraged':enraged, 'burned':battle['burned']}


def choose_attack(battle, identity):
    technique=HERO_ATTACKS.get(identity)
    if not technique:
        raise AbelInputError('Elige uno de los cuatro ataques de tu caballero.')
    if battle['energy']<technique['cost']:
        raise AbelInputError('Recupera energía con el primer ataque.')
    battle['heroMove']=identity


def open_round(battle, rival, turn, seconds=None):
    if seconds:
        duration = max(12, seconds-(4 if battle['chilled'] else 0))+3*battle.get('skills',{}).get('reloj',0)
    else:
        duration = max(24,rival['seconds']-(8 if battle['chilled'] else 0))+4*battle.get('skills',{}).get('reloj',0)
    battle['round'] += 1
    battle.update(turn=turn, usedHint=False, usedPotion=False, timedOut=False,
                  turnSeconds=duration, deadline=time.time()+duration, impact={}, loot={},
                  threat=forecast(battle,rival), chilled=False)
    if HERO_ATTACKS[battle['heroMove']]['cost']>battle['energy']:
        battle['heroMove']='slash'


def strike(battle, exercise, boss):
    battle['burned'] = False
    if exercise.get('tactic'):
        battle.update(event='break',barrierBroken=True,impact={})
        return
    battle['streak'] += 1
    battle['studyHits'] += 1
    if battle['studyHits'] <= 2:
        battle['correctKeys'].append([exercise['problem'],exercise['argument']])
    gear = battle['gear']
    move=battle['heroMove']
    technique=HERO_ATTACKS[move]
    battle['energy']=min(ENERGY_MAX,battle['energy']-technique['cost']+int(move=='slash'))
    battle['heroGuard']=max(battle['heroGuard'],technique.get('guard',0))
    power=1+gear['power']+(gear['combo'] if battle['streak']>=2 else 0)+technique['bonus']
    skills=battle.get('skills',{})
    left_time=battle.get('deadline',0)-time.time()
    crit=left_time>=battle.get('turnSeconds',ADVENTURE_SECONDS)*(.6-.07*skills.get('critico',0))
    sync_combo(battle)
    combo=battle['streak']%battle['comboEvery']==0
    combo_stage=battle['comboStage'] if combo else 0
    combo_bonus=(COMBO_RULES['bonuses'][combo_stage-1]+max(0,skills.get('combo',0)-1)) if combo else 0
    combo_hits=COMBO_RULES['hits'][combo_stage-1] if combo else 0
    power+=int(crit)+combo_bonus
    battle['crits']=battle.get('crits',0)+int(crit)
    battle['combos']=battle.get('combos',0)+int(combo)
    minimum_topics=len(battle.get('topics') or FIRST_GRADE_TOPICS) if boss else 2
    floor=1 if battle['studyHits']<minimum_topics else 0
    if boss and floor:
        remaining=minimum_topics-battle['studyHits']
        checkpoint=(battle['rivalTotal']*remaining+minimum_topics-1)//minimum_topics
        floor=max(1,min(battle['rival'],checkpoint))
    left = max(floor,battle['rival']-power)
    form=WEAPONS[battle['weaponStyle']]['moves'][move]
    battle.update(event='hit',rival=left,impact={'damage':battle['rival']-left,
                  'move':move,'hits':max(technique['hits'],combo_hits),'guard':technique.get('guard',0),
                  'weapon':battle['weaponStyle'],'animation':form['animation'],'name':form['name'],
                  'resisted':bool(floor and battle['rival']-power<floor),'crit':crit,'combo':combo,
                  'streak':battle['streak'],'comboStage':battle['comboStage'],
                  'comboBonus':combo_bonus,'comboHits':combo_hits,
                  'comboEvery':battle['comboEvery'],'comboProgress':battle['comboProgress'],
                  'comboNext':battle['comboNext']})


def counter(battle):
    threat = battle['threat']
    power, kind = threat['damage'], threat['kind']
    strikes = [1]*power if kind == 'flurry' else [power]
    loss = 0
    blocked = 0
    for strength in strikes:
        if battle['shielded']:
            battle['shielded'] = False
            blocked += strength
            continue
        guard=min(battle['heroGuard'],strength)
        battle['heroGuard']-=guard
        strength-=guard
        blocked+=guard
        if kind != 'pierce' and strength > 1:
            armor = min(strength-1,battle['gear']['armor'])
            blocked += armor
            strength -= armor
        ward = min(battle['ward'],strength)
        battle['ward'] -= ward
        blocked += ward
        loss += strength-ward
    dealt = min(loss,battle['hero'])
    healed = min(1,battle['rivalTotal']-battle['rival']) if dealt and kind == 'drain' else 0
    battle['hero'] -= dealt
    battle['rival'] += healed
    battle.update(event='hurt' if dealt else 'blocked', streak=0, chilled=bool(dealt and kind == 'frost'),
                  burned=bool(dealt and kind == 'ember'),
                  impact={'damage':dealt,'blocked':blocked,'healed':healed,'hits':len(strikes)})
    sync_combo(battle)


def tactics_exercise(item):
    if item['level'] == 2:
        run = 4
        rise = random.choice([-3,-2,-1,1,2,3])
        problem = f'{rise}/{run}'
        question = f'Gira el rayo para que pase por el espejo situado en ({run}, {rise}).'
        tactic = {'kind':'slope', 'run':run, 'rise':rise,
                  'hint':'La pendiente es el desplazamiento vertical dividido entre el horizontal.'}
    elif item['unit'] >= 3:
        divisions = random.choice([3,4,5,6,8])
        numerator = random.randint(1,divisions-1)
        problem = f'{numerator}/{divisions}'
        question = f'Marca {numerator}/{divisions} en la recta de 0 a 1 para romper la barrera.'
        tactic = {'kind':'fraction', 'divisions':divisions,
                  'hint':'El denominador divide la unidad. El numerador indica cuántos pasos avanzas desde cero.'}
    else:
        number = random.randint(2,9)
        problem = str(number)
        question = f'Marca el número {number} en la recta para romper la barrera.'
        tactic = {'kind':'number', 'divisions':10, 'hint':'Empieza en cero y avanza una marca cada vez.'}
    return {'topic':item['id'], 'problem':problem, 'argument':'', 'operation':'arithmetic', 'variable':'x',
            'difficulty':'fácil', 'question':question, 'showExpression':False, 'tactic':tactic}
