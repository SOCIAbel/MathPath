import json
import random
from pathlib import Path
from datetime import date, datetime, timedelta

from curriculumajch import TOPICS, exercise_for_ajch
from engineajch import AbelInputError
import adventureajch as combat

FUN_SCHEMA = """
CREATE TABLE IF NOT EXISTS fun_state (
    profile_id INTEGER PRIMARY KEY REFERENCES profiles(id), body TEXT NOT NULL
);
"""

XP_RULES = {'correct': 10, 'win': 25, 'boss': 60, 'daily': 40, 'survival': 3, 'dungeon': 15,
            'graph': 20, 'exam': 30, 'duel': 15, 'custom': 25, 'solve': 2}

THEMES = {
    'bosque': 'Bosque', 'oceano': 'Océano', 'atardecer': 'Atardecer', 'uva': 'Uva mágica',
    'oro': 'Oro real', 'lava': 'Lava', 'aurora': 'Aurora',
}
HATS = {
    'ninguno': 'Sin accesorio', 'lazo': 'Lazo', 'mago': 'Gorro de mago', 'corona': 'Corona',
    'pirata': 'Sombrero pirata', 'casco': 'Casco vikingo', 'birrete': 'Birrete', 'flor': 'Flor',
}
PETS = {
    'draco': {'name': 'Dragoncito', 'perk': 'Ataques de fuego que celebran tus aciertos.'},
    'buho': {'name': 'Búho sabio', 'perk': 'Le encanta leer pistas contigo.'},
    'slime': {'name': 'Slime saltarín', 'perk': 'Rebota de alegría con cada combo.'},
}
PET_STAGES = ('Huevo', 'Cría', 'Joven', 'Adulto', 'Legendario')
SKILLS = {
    'corazon': dict(name='Corazón valiente', max=3, description='+1 corazón al empezar cada duelo por nivel.'),
    'guardia': dict(name='Guardia firme', max=3, description='+1 punto de bloqueo por duelo por nivel.'),
    'reloj': dict(name='Mente rápida', max=3, description='+4 segundos por turno en los duelos por nivel.'),
    'critico': dict(name='Ojo crítico', max=3, description='La ventana para golpes críticos se amplía por nivel.'),
    'botin': dict(name='Bolsa grande', max=3, description='+3 monedas extra al ganar un duelo por nivel.'),
    'combo': dict(name='Maestro del combo', max=2, description='Nivel 1: combo cada 2 aciertos. Nivel 2: +1 de daño en el combo.'),
}

ACHIEVEMENTS = (
    ('primer-acierto', 'Primer paso', 'Acierta tu primer ejercicio.', 'correct', 1, ''),
    ('aciertos-50', 'Calculadora humana', 'Acierta 50 ejercicios.', 'correct', 50, 'theme:oceano'),
    ('aciertos-200', 'Mente brillante', 'Acierta 200 ejercicios.', 'correct', 200, 'hat:birrete'),
    ('racha-3', 'Encendido', 'Mantén una racha de 3 días.', 'streak', 3, 'hat:lazo'),
    ('racha-7', 'Imparable', 'Mantén una racha de 7 días.', 'streak', 7, 'theme:atardecer'),
    ('racha-30', 'Leyenda diaria', 'Mantén una racha de 30 días.', 'streak', 30, 'theme:oro'),
    ('duelo-1', 'Espada en mano', 'Gana tu primer duelo.', 'wins', 1, ''),
    ('duelo-10', 'Caballero veterano', 'Gana 10 duelos.', 'wins', 10, 'hat:casco'),
    ('jefe-1', 'Cazador de jefes', 'Vence a un jefe.', 'bosses', 1, 'hat:corona'),
    ('jefe-5', 'Terror de los reyes', 'Vence a 5 jefes.', 'bosses', 5, 'theme:lava'),
    ('critico-1', '¡Crítico!', 'Haz un golpe crítico respondiendo rápido.', 'crits', 1, ''),
    ('critico-25', 'Rayo veloz', 'Haz 25 golpes críticos.', 'crits', 25, 'hat:pirata'),
    ('combo-1', 'Combo', 'Encadena un combo en un duelo.', 'combos', 1, ''),
    ('combo-15', 'Combo maestro', 'Encadena 15 combos.', 'combos', 15, 'theme:uva'),
    ('diario-1', 'Reto aceptado', 'Completa un reto del día.', 'dailies', 1, ''),
    ('diario-7', 'Disciplina', 'Completa 7 retos del día.', 'dailies', 7, 'hat:mago'),
    ('super-10', 'Superviviente', 'Logra 10 puntos en Supervivencia.', 'survivalBest', 10, ''),
    ('super-25', 'Inmortal', 'Logra 25 puntos en Supervivencia.', 'survivalBest', 25, 'theme:aurora'),
    ('mazmorra-5', 'Explorador de errores', 'Supera 5 pisos de la Mazmorra.', 'dungeonFloors', 5, 'hat:flor'),
    ('cartas-10', 'Coleccionista', 'Consigue 10 cartas de fórmulas.', 'cards', 10, ''),
    ('cartas-40', 'Gran archivo', 'Consigue 40 cartas de fórmulas.', 'cards', 40, ''),
    ('mascota-5', 'Mejores amigos', 'Sube a tu mascota al nivel 5.', 'petLevel', 5, ''),
    ('mascota-10', 'Domador legendario', 'Sube a tu mascota al nivel 10.', 'petLevel', 10, ''),
    ('cofre-1', 'Tesoro', 'Abre tu primer cofre.', 'chests', 1, ''),
    ('grafica-5', 'Ojo de halcón', 'Supera 5 retos gráficos.', 'graphWins', 5, ''),
    ('examen-100', 'Matrícula de honor', 'Saca nota perfecta en una evaluación.', 'perfectExams', 1, ''),
    ('duelo2p-1', 'Rivalidad sana', 'Juega un duelo de dos jugadores.', 'duels2p', 1, ''),
    ('solver-10', 'Investigador', 'Usa el solucionador 10 veces.', 'solves', 10, ''),
    ('nivel-10', 'Héroe de MathPath', 'Llega al nivel 10 de jugador.', 'level', 10, ''),
)
ACHIEVEMENT_INDEX = {row[0]: row for row in ACHIEVEMENTS}
CARD_RARITY = {1: 'común', 2: 'rara', 3: 'épica'}

WORLD_BOSSES = {}
for group_index, rival in enumerate(combat.RIVALS):
    members = [topic_id for topic_id, group in combat.GROUPS.items() if group == group_index]
    if not members:
        continue
    first = TOPICS[members[0]]
    WORLD_BOSSES[f'jefe-mundo-{group_index}'] = {
        'id': f'jefe-mundo-{group_index}', 'name': 'Rey ' + rival['name'].split(' ')[0] + ' ' + ' '.join(rival['name'].split(' ')[1:]),
        'level': first['level'], 'unit': first['unit'], 'group': group_index, 'topics': members,
    }


def level_for_ajch(xp):
    level = 1
    while xp >= 50 * level * (level + 1):
        level += 1
    return level


def level_floor_ajch(level):
    return 50 * (level - 1) * level


def pet_level_ajch(xp):
    level = 1
    while xp >= 20 * level * level:
        level += 1
    return level


def pet_stage_ajch(level):
    return 0 if level < 2 else 1 if level < 5 else 2 if level < 10 else 3 if level < 15 else 4


def today():
    return datetime.now().astimezone().date()


def default_state_ajch():
    return {
        'xp': 0, 'days': [], 'bestStreak': 0, 'daily': {}, 'pet': None, 'skills': {}, 'skillPoints': 0,
        'chests': [], 'achievements': {}, 'counters': {}, 'unlocked': {'theme': ['bosque'], 'hat': ['ninguno']},
        'avatar': {'hue': 0, 'title': '', 'theme': 'bosque', 'dark': False}, 'pending': [],
        'survival': None, 'dungeon': {'current': None, 'floor': 0}, 'graphLevel': 1,
    }


class AbelFunService:
    def __init__(self, service):
        self.service = service
        self.db = service.db
        self.duels = {}
        self.db.executescript(FUN_SCHEMA)
        for boss in WORLD_BOSSES.values():
            self.db.execute('INSERT OR IGNORE INTO topics VALUES (?,?,?,?)',
                            (boss['id'], boss['level'], boss['unit'], boss['name']))

    def load(self):
        row = self.db.execute('SELECT body FROM fun_state WHERE profile_id=?', (self.service.profile_id_ajch,)).fetchone()
        state = default_state_ajch()
        if row:
            saved = json.loads(row['body'])
            state.update(saved)
            for key, value in default_state_ajch().items():
                if isinstance(value, dict) and isinstance(state.get(key), dict):
                    state[key] = {**value, **state[key]}
        pets = state.get('pets')
        if not isinstance(pets, dict):
            pets = {state['pet']['species']: state['pet']} if state.get('pet') else {}
        state['pets'] = pets
        active = state.get('activePet') or (state['pet']['species'] if state.get('pet') else None)
        if active not in pets:
            active = next(iter(pets), None)
        state['activePet'] = active
        state['pet'] = pets.get(active)
        return state

    def save(self, state):
        self.db.execute("""INSERT INTO fun_state VALUES (?,?)
                           ON CONFLICT(profile_id) DO UPDATE SET body=excluded.body""",
                        (self.service.profile_id_ajch, json.dumps(state, ensure_ascii=False)))

    @staticmethod
    def streak(state):
        days = sorted({date.fromisoformat(day) for day in state['days']}, reverse=True)
        if not days:
            return 0
        current = today()
        if days[0] < current - timedelta(days=1):
            return 0
        count, expected = 0, days[0]
        for day in days:
            if day != expected:
                break
            count += 1
            expected = day - timedelta(days=1)
        return count

    def skill_bonus_ajch(self, state=None):
        skills = (state or self.load())['skills']
        return {key: int(skills.get(key, 0)) for key in SKILLS}

    def pet_info_ajch(self, state):
        pet = state['pet']
        if not pet:
            return None
        level = pet_level_ajch(pet['xp'])
        stage = pet_stage_ajch(level)
        return {**pet, 'level': level, 'stage': stage, 'stageName': PET_STAGES[stage],
                'next': 20 * level * level, 'floor': 20 * (level - 1) * (level - 1),
                'species': pet['species'], 'speciesName': PETS[pet['species']]['name'],
                'freeHint': level >= 3, 'ward': 1 if level >= 7 else 0}

    def cards_owned_ajch(self):
        return sum(TOPICS[topic_id]['level'] in (1, 2) for topic_id in self.service.mastery_ajch())

    @staticmethod
    def school_topic_ajch(topic_id):
        topic = TOPICS.get(topic_id) or WORLD_BOSSES.get(topic_id)
        if topic is None:
            topic = combat.story.GRADE_BOSS_BY_ID.get(topic_id)
        return bool(topic and topic['level'] in (1, 2))

    def school_event_ajch(self, kind, data):
        if kind == 'answer':
            row = self.db.execute('SELECT topic_id,purpose FROM exercises WHERE id=? AND profile_id=?',
                                  (data.get('exercise'), self.service.profile_id_ajch)).fetchone()
            return bool(row and row['purpose'] != 'tactic' and self.school_topic_ajch(row['topic_id']))
        if kind == 'exam':
            rows = self.db.execute('''SELECT e.topic_id FROM evaluation_items i
                                       JOIN exercises e ON e.id=i.exercise_id
                                       JOIN evaluations v ON v.id=i.evaluation_id
                                       WHERE i.evaluation_id=? AND v.profile_id=? AND v.finished IS NOT NULL''',
                                   (data.get('evaluation'), self.service.profile_id_ajch)).fetchall()
            return bool(rows) and all(self.school_topic_ajch(row['topic_id']) for row in rows)
        if kind in {'crit', 'combo', 'win'}:
            return self.school_topic_ajch(data.get('topic'))
        return False

    def counters_ajch(self, state):
        values = dict(state['counters'])
        values.update(streak=max(state['bestStreak'], self.streak(state)), level=level_for_ajch(state['xp']),
                      cards=self.cards_owned_ajch(),
                      petLevel=pet_level_ajch(state['pet']['xp']) if state['pet'] else 0)
        return values

    def notify_ajch(self, state, kind, title, detail='', icon='✨'):
        state['pending'].append({'kind': kind, 'title': title, 'detail': detail, 'icon': icon})
        state['pending'] = state['pending'][-12:]

    def add_xp_ajch(self, state, amount, pet=True):
        before = level_for_ajch(state['xp'])
        state['xp'] += amount
        if pet and state['pet']:
            pet_before = pet_level_ajch(state['pet']['xp'])
            state['pet']['xp'] += max(1, amount // 2)
            pet_after = pet_level_ajch(state['pet']['xp'])
            if pet_after > pet_before:
                stage_changed = pet_stage_ajch(pet_after) != pet_stage_ajch(pet_before)
                self.notify_ajch(state, 'pet', ('¡Tu mascota evolucionó a ' + PET_STAGES[pet_stage_ajch(pet_after)] + '!')
                            if stage_changed else f'Tu mascota subió al nivel {pet_after}', state['pet']['name'], '🐾')
        after = level_for_ajch(state['xp'])
        for level in range(before + 1, after + 1):
            state['skillPoints'] += 1
            rarity = 'épico' if level % 5 == 0 else 'raro' if level % 2 == 0 else 'común'
            state['chests'].append({'id': f'nivel-{level}', 'rarity': rarity, 'source': f'Nivel {level}'})
            self.notify_ajch(state, 'level', f'¡Nivel {level}!', 'Ganaste 1 punto de habilidad y un cofre ' + rarity + '.', '⭐')

    def bump_ajch(self, state, counter, amount=1):
        state['counters'][counter] = state['counters'].get(counter, 0) + amount

    def mark_day_ajch(self, state):
        stamp = today().isoformat()
        if stamp not in state['days']:
            state['days'] = sorted(set(state['days'] + [stamp]))[-400:]
            current = self.streak(state)
            state['bestStreak'] = max(state['bestStreak'], current)
            if current > 1:
                self.notify_ajch(state, 'streak', f'¡Racha de {current} días!', 'Vuelve mañana para mantenerla.', '🔥')

    def check_achievements_ajch(self, state):
        values = self.counters_ajch(state)
        for identity, name, description, counter, goal, unlock in ACHIEVEMENTS:
            if identity in state['achievements'] or values.get(counter, 0) < goal:
                continue
            state['achievements'][identity] = today().isoformat()
            reward = ''
            if unlock:
                kind, value = unlock.split(':')
                if value not in state['unlocked'][kind]:
                    state['unlocked'][kind].append(value)
                reward = ' Desbloqueaste: ' + (THEMES if kind == 'theme' else HATS)[value] + '.'
            self.notify_ajch(state, 'achievement', 'Logro: ' + name, description + reward, '🏆')
            self.add_xp_ajch(state, 20)

    def event(self, kind, **data):
        if not self.school_event_ajch(kind, data):
            return
        state = self.load()
        if kind == 'answer':
            purpose = data.get('purpose')
            if data.get('correct'):
                self.bump_ajch(state, 'correct')
                self.mark_day_ajch(state)
                self.add_xp_ajch(state, XP_RULES['correct'])
                if purpose == 'survival' and state['survival']:
                    state['survival']['score'] += 1
                    self.add_xp_ajch(state, XP_RULES['survival'])
                if state['dungeon']['current'] == data.get('exercise'):
                    state['dungeon']['floor'] += 1
                    state['dungeon']['current'] = None
                    self.bump_ajch(state, 'dungeonFloors')
                    self.add_xp_ajch(state, XP_RULES['dungeon'])
                    self.notify_ajch(state, 'dungeon', f"Piso {state['dungeon']['floor']} superado", 'Venciste a uno de tus errores.', '🗝️')
                daily_ajch = state['daily']
                if daily_ajch.get('exercise') == data.get('exercise') and not daily_ajch.get('done'):
                    daily_ajch['done'] = True
                    self.bump_ajch(state, 'dailies')
                    self.add_xp_ajch(state, XP_RULES['daily'])
                    self.give_resources_ajch({'coins': 10})
                    state['chests'].append({'id': 'diario-' + daily_ajch['date'], 'rarity': 'raro', 'source': 'Reto del día'})
                    self.notify_ajch(state, 'daily', '¡Reto del día completado!', '+40 XP, +10 monedas y un cofre raro.', '📅')
            else:
                self.bump_ajch(state, 'wrong')
                if purpose == 'survival' and state['survival']:
                    state['survival']['lives'] -= 1
                if daily_match := state['daily'].get('exercise') == data.get('exercise'):
                    state['daily']['failed'] = daily_match
        elif kind == 'crit':
            self.bump_ajch(state, 'crits')
        elif kind == 'combo':
            self.bump_ajch(state, 'combos')
        elif kind == 'win':
            self.bump_ajch(state, 'wins')
            self.add_xp_ajch(state, XP_RULES['boss' if data.get('boss') else 'win'])
            bonus = 3 * self.skill_bonus_ajch(state)['botin']
            if bonus:
                self.give_resources_ajch({'coins': bonus})
            if data.get('boss'):
                self.bump_ajch(state, 'bosses')
                state['chests'].append({'id': 'jefe-' + str(data.get('topic')), 'rarity': 'épico', 'source': 'Jefe vencido'})
                self.notify_ajch(state, 'boss', '¡Jefe derrotado!', 'Ganaste un cofre épico.', '👑')
        elif kind == 'exam':
            self.add_xp_ajch(state, XP_RULES['exam'] * data.get('score', 0) // max(1, data.get('total', 1)))
            if data.get('total') and data.get('score') == data.get('total'):
                self.bump_ajch(state, 'perfectExams')
        elif kind == 'solve':
            self.bump_ajch(state, 'solves')
            self.add_xp_ajch(state, XP_RULES['solve'], pet=False)
        self.check_achievements_ajch(state)
        self.save(state)

    def give_resources_ajch(self, loot):
        service = self.service
        gear = service.village_ledger_ajch(service.adventure_status_ajch()['wins'])
        for resource, quantity in loot.items():
            gear['stock'][resource] = gear['stock'].get(resource, 0) + quantity
        service.save_gear_ajch(gear)

    def spend_coins_ajch(self, amount):
        service = self.service
        gear = service.village_ledger_ajch(service.adventure_status_ajch()['wins'])
        if gear['stock'].get('coins', 0) < amount:
            raise AbelInputError(f'Necesitas {amount} monedas. Gánalas en los duelos.')
        gear['stock']['coins'] -= amount
        service.save_gear_ajch(gear)

    def summary_ajch(self, state=None):
        state = state or self.load()
        level = level_for_ajch(state['xp'])
        stamp = today().isoformat()
        return {
            'xp': state['xp'], 'level': level, 'levelFloor': level_floor_ajch(level), 'levelNext': level_floor_ajch(level + 1),
            'streak': self.streak(state), 'bestStreak': max(state['bestStreak'], self.streak(state)), 'activeToday': stamp in state['days'],
            'days': state['days'][-35:], 'skillPoints': state['skillPoints'], 'skills': state['skills'],
            'chests': state['chests'], 'pet': self.pet_info_ajch(state), 'avatar': state['avatar'],
            'pets': [self.pet_info_ajch({'pet': pet}) | {'active': species == state['activePet']}
                     for species, pet in state['pets'].items()],
            'unlocked': state['unlocked'], 'achievements': state['achievements'], 'counters': self.counters_ajch(state),
            'dailyDone': state['daily'].get('date') == stamp and state['daily'].get('done', False),
            'survivalBest': state['counters'].get('survivalBest', 0), 'dungeonFloor': state['dungeon']['floor'],
            'survivalRecords': state.get('survivalRecords', {}),
            'graphLevel': state['graphLevel'], 'welcomed': bool(state.get('welcomed')),
        }

    def guide_ajch(self):
        return {'themes': THEMES, 'hats': HATS, 'pets': PETS, 'stages': PET_STAGES, 'skills': SKILLS,
                'achievements': [dict(id=a, name=n, description=d, counter=c, goal=g, unlock=u)
                                 for a, n, d, c, g, u in ACHIEVEMENTS],
                'bosses': {key: {k: v for k, v in boss.items()} for key, boss in WORLD_BOSSES.items()}}

    def unlocked_topics_ajch(self, school_only=True):
        mastered = self.service.mastery_ajch()
        unlocked = [topic_id for topic_id, topic in TOPICS.items()
                    if all(prior in mastered for prior in topic['requires'])]
        current = next((TOPICS[t]['level'] for t in unlocked if t not in mastered), 3)
        current_unit = next((TOPICS[t]['unit'] for t in unlocked if t not in mastered and TOPICS[t]['level'] == current), 99)
        pool = [t for t in unlocked if TOPICS[t]['level'] < current or
                (TOPICS[t]['level'] == current and TOPICS[t]['unit'] <= current_unit)]
        if school_only:
            pool = [t for t in pool if TOPICS[t]['level'] in (1, 2)]
            unlocked = [t for t in unlocked if TOPICS[t]['level'] in (1, 2)]
        return pool or unlocked

    def daily_ajch(self):
        state = self.load()
        stamp = today().isoformat()
        if state['daily'].get('date') != stamp or not self.school_topic_ajch(state['daily'].get('topic')):
            pool = self.unlocked_topics_ajch()
            rng = random.Random(stamp + str(self.service.profile_id_ajch))
            topic_id = rng.choice(pool)
            item = exercise_for_ajch(topic_id, self.service.effective_difficulty_ajch('auto', topic_id), rng)
            exercise = self.service.insert_exercise_ajch(item, 'daily')
            state['daily'] = {'date': stamp, 'exercise': exercise['id'], 'done': False, 'topic': topic_id}
            self.save(state)
        exercise = self.service.exercise(state['daily']['exercise'])
        answer = self.db.execute('SELECT answer,correct FROM responses WHERE exercise_id=?', (exercise['id'],)).fetchone()
        return {'exercise': exercise, 'done': state['daily'].get('done', False), 'answered': bool(answer),
                'topicName': TOPICS[state['daily']['topic']]['name'],
                'grade': self.service.mark_ajch(exercise, answer['answer']) if answer else None}

    SURVIVAL_LEVELS = {1: 'Primaria', 2: 'Secundaria'}

    def survival_scope_ajch(self, scope):
        scope = str(scope or 'mine')
        if scope == 'mine':
            return 'mine', 'Mis temas (según mi avance)', [t for t in self.unlocked_topics_ajch() if TOPICS[t]['level'] < 3] or self.unlocked_topics_ajch()
        if scope == 'school':
            return 'school', 'Todo el colegio', [t for t, item in TOPICS.items() if item['level'] < 3]
        grades_by_level = {level: sorted({item['unit'] for item in TOPICS.values() if item['level'] == level})
                           for level in self.SURVIVAL_LEVELS}
        chosen = set()
        for part in filter(None, scope.replace(' ', '').split(',')):
            try:
                level, _, unit = part.partition('-')
                level, unit = int(level), int(unit or 0)
            except ValueError:
                raise AbelInputError('Elige de dónde salen las preguntas.') from None
            if level not in self.SURVIVAL_LEVELS or (unit and unit not in grades_by_level[level]):
                raise AbelInputError('Elige grados de Primaria o Secundaria.')
            chosen |= {(level, unit)} if unit else {(level, grade_ajch) for grade_ajch in grades_by_level[level]}
        if not chosen:
            raise AbelInputError('Marca al menos un grado.')
        pool = [t for t, item in TOPICS.items() if (item['level'], item['unit']) in chosen]
        parts, keys = [], []
        for level, name in self.SURVIVAL_LEVELS.items():
            units = sorted(unit for chosen_level, unit in chosen if chosen_level == level)
            if not units:
                continue
            if units == grades_by_level[level]:
                parts.append('Toda ' + name)
                keys.append(str(level))
                continue
            keys.extend(f'{level}-{unit}' for unit in units)
            ranges, start = [], units[0]
            for previous, current in zip(units, units[1:] + [None]):
                if current != previous + 1:
                    ranges.append(f'{start}.º' if start == previous else f'{start}.º–{previous}.º')
                    start = current
            parts.append(f'{name} {", ".join(ranges)}')
        return ','.join(keys), ' + '.join(parts), pool

    def survival_ajch(self, action, scope=None):
        state = self.load()
        if action == 'start':
            key, label, _ = self.survival_scope_ajch(scope)
            state['survival'] = {'score': 0, 'lives': 3, 'scope': key, 'scopeLabel': label}
        run = state['survival']
        if not run:
            raise AbelInputError('Empieza una partida de Supervivencia.')
        if action == 'timeout':
            run['lives'] -= 1
            action = 'next'
        key, label, pool = self.survival_scope_ajch(run.get('scope', 'mine'))
        records = state.setdefault('survivalRecords', {})
        result = {'score': run['score'], 'lives': run['lives'], 'best': records.get(key, 0), 'scope': key, 'scopeLabel': label}
        if action in {'start', 'next'} and run['lives'] > 0:
            topic_id = random.choice(pool)
            level = 'fácil' if run['score'] < 5 else 'intermedio' if run['score'] < 15 else 'avanzado'
            item = exercise_for_ajch(topic_id, level)
            self.service.add_number_choices_ajch(item, TOPICS[topic_id])
            result['exercise'] = self.service.insert_exercise_ajch(item, 'survival')
            result['topicName'] = TOPICS[topic_id]['name']
        if run['lives'] <= 0 or action == 'end':
            record = run['score'] > records.get(key, 0)
            records[key] = max(records.get(key, 0), run['score'])
            state['counters']['survivalBest'] = max(state['counters'].get('survivalBest', 0), run['score'])
            state['survival'] = None
            result.update(over=True, best=records[key], record=record)
            if record and run['score']:
                self.notify_ajch(state, 'record', '¡Nuevo récord de Supervivencia!', f"{run['score']} puntos", '🏅')
            self.check_achievements_ajch(state)
        self.save(state)
        return result

    def dungeon_ajch(self, scope=None):
        state = self.load()
        mastered = self.service.mastery_ajch()
        key, label, pool = ('mine', 'Todos mis errores', None) if str(scope or 'mine') == 'mine' else self.survival_scope_ajch(scope)
        rows = self.db.execute("""SELECT e.body,e.topic_id FROM responses r JOIN exercises e ON e.id=r.exercise_id
                                  JOIN topics t ON t.id=e.topic_id AND t.level_id IN (1,2)
                                  WHERE e.profile_id=? AND e.purpose IN ('practice','survival','daily')
                                  GROUP BY e.topic_id,e.body HAVING MAX(r.correct)=0 ORDER BY MAX(r.created) DESC LIMIT 400""",
                               (self.service.profile_id_ajch,)).fetchall()
        pending_ajch = [row for row in rows if self.school_topic_ajch(row['topic_id']) and (pool is None or row['topic_id'] in pool) and
                   all(prior in mastered for prior in TOPICS[row['topic_id']]['requires'])]
        result = {'floor': state['dungeon']['floor'], 'remaining': len(pending_ajch), 'scope': key, 'scopeLabel': label}
        if pending_ajch:
            item = json.loads(pending_ajch[0]['body'])
            item.pop('choices', None)
            exercise = self.service.insert_exercise_ajch(item, 'practice')
            state['dungeon']['current'] = exercise['id']
            result.update(exercise=exercise, topicName=TOPICS[item['topic']]['name'])
            self.save(state)
        return result

    def formula_favorites_ajch(self, identity=None, enabled=None):
        allowed=set(json.loads((Path(__file__).resolve().parent/'recursos/formulas/indice.json').read_text(encoding='utf-8')))
        state=self.load()
        saved=state.get('formulaFavorites',[])
        favorites={value for value in saved if isinstance(value,str) and value in allowed} if isinstance(saved,list) else set()
        if identity is not None:
            if not isinstance(identity,str) or identity not in allowed or type(enabled) is not bool:
                raise AbelInputError('Elige una fórmula válida del formulario universitario.')
            if enabled:
                favorites.add(identity)
            else:
                favorites.discard(identity)
            state['formulaFavorites']=sorted(favorites)
            self.save(state)
        return sorted(favorites)

    def cards(self):
        mastered = self.service.mastery_ajch()
        scores = self.service.topic_scores_ajch()
        return [{'id': topic_id, 'name': topic['name'], 'formula': topic['formula'], 'level': topic['level'],
                 'unit': topic['unit'], 'area': topic.get('area', ''), 'rarity': CARD_RARITY[topic['level']],
                 'owned': topic_id in mastered, 'progress': scores.get(topic_id, 0)}
                for topic_id, topic in TOPICS.items() if topic['level'] in (1, 2)]

    def open_chest_ajch(self, index):
        state = self.load()
        if not 0 <= index < len(state['chests']):
            raise AbelInputError('Ese cofre ya no está disponible.')
        chest = state['chests'].pop(index)
        rarity = chest['rarity']
        rng = random.Random()
        coins = {'común': 12, 'raro': 25, 'épico': 50}[rarity] + rng.randint(0, 6)
        material = rng.choice(['wood', 'ore', 'fiber', 'gem'])
        loot = {'coins': coins, material: {'común': 1, 'raro': 2, 'épico': 3}[rarity]}
        if rarity == 'épico' and rng.random() < .35:
            loot['scale'] = 1
        self.give_resources_ajch(loot)
        prizes = []
        chance = {'común': .2, 'raro': .45, 'épico': .9}[rarity]
        if rng.random() < chance:
            kind = rng.choice(['hat', 'theme'])
            catalog = HATS if kind == 'hat' else THEMES
            missing = [key for key in catalog if key not in state['unlocked'][kind]]
            if missing:
                value = rng.choice(missing)
                state['unlocked'][kind].append(value)
                prizes.append({'kind': kind, 'id': value, 'name': catalog[value]})
        potions = 1 if rarity != 'común' else 0
        if potions:
            service = self.service
            gear = service.village_ledger_ajch(service.adventure_status_ajch()['wins'])
            gear['potions'] += potions
            service.save_gear_ajch(gear)
        self.bump_ajch(state, 'chests')
        self.check_achievements_ajch(state)
        self.save(state)
        return {'rarity': rarity, 'loot': loot, 'prizes': prizes, 'potions': potions, 'summary': self.summary_ajch(state)}

    def adopt_ajch(self, species, name):
        state = self.load()
        if species not in PETS:
            raise AbelInputError('Elige una de las mascotas.')
        name = str(name or '').strip()[:24]
        if species in state['pets']:
            if name:
                state['pets'][species]['name'] = name
        else:
            state['pets'][species] = {'species': species, 'name': name or PETS[species]['name'], 'xp': 0, 'hat': 'ninguno'}
            self.notify_ajch(state, 'pet', '¡Nuevo compañero!', (name or PETS[species]['name']) + ' se une a tu aventura.', '🐾')
        state['activePet'] = species
        state['pet'] = state['pets'][species]
        self.save(state)
        return self.summary_ajch(state)

    def welcome_ajch(self, level=None, unit=None):
        state = self.load()
        state['welcomed'] = True
        try:
            level, unit = int(level), int(unit)
        except (TypeError, ValueError):
            level = unit = None
        if level in (1, 2) and 1 <= unit <= (6 if level == 1 else 5):
            state.setdefault('placement', {})[str(level)] = unit
        self.save(state)
        return self.summary_ajch(state)

    def switch_pet_ajch(self, species):
        state = self.load()
        if species not in state['pets']:
            raise AbelInputError('Primero adopta a ese compañero.')
        state['activePet'] = species
        state['pet'] = state['pets'][species]
        self.save(state)
        return self.summary_ajch(state)

    def feed_ajch(self):
        state = self.load()
        if not state['pet']:
            raise AbelInputError('Adopta una mascota primero.')
        self.spend_coins_ajch(5)
        before = pet_level_ajch(state['pet']['xp'])
        state['pet']['xp'] += 30
        after = pet_level_ajch(state['pet']['xp'])
        if after > before:
            self.notify_ajch(state, 'pet', f'Tu mascota subió al nivel {after}', state['pet']['name'], '🐾')
        self.check_achievements_ajch(state)
        self.save(state)
        return self.summary_ajch(state)

    def dress_ajch(self, hat):
        state = self.load()
        if not state['pet'] or hat not in state['unlocked']['hat']:
            raise AbelInputError('Ese accesorio aún no está desbloqueado.')
        state['pet']['hat'] = hat
        self.save(state)
        return self.summary_ajch(state)

    def learn_skill_ajch(self, skill):
        state = self.load()
        if skill not in SKILLS:
            raise AbelInputError('Elige una habilidad del árbol.')
        current = state['skills'].get(skill, 0)
        if current >= SKILLS[skill]['max']:
            raise AbelInputError('Esa habilidad ya está al máximo.')
        if state['skillPoints'] <= 0:
            raise AbelInputError('Sube de nivel para conseguir puntos de habilidad.')
        state['skillPoints'] -= 1
        state['skills'][skill] = current + 1
        self.save(state)
        return self.summary_ajch(state)

    def reset_skills_ajch(self):
        state = self.load()
        self.spend_coins_ajch(15)
        state['skillPoints'] += sum(state['skills'].values())
        state['skills'] = {}
        self.save(state)
        return self.summary_ajch(state)

    def set_avatar_ajch(self, data):
        state = self.load()
        avatar = state['avatar']
        if 'hue' in data:
            try:
                avatar['hue'] = max(-180, min(180, int(data['hue'])))
            except (TypeError, ValueError):
                pass
        if data.get('theme') in state['unlocked']['theme']:
            avatar['theme'] = data['theme']
        if 'dark' in data:
            avatar['dark'] = data['dark'] is True
        if 'title' in data:
            title = data['title']
            avatar['title'] = title if title == '' or title in state['achievements'] else avatar['title']
        self.save(state)
        return self.summary_ajch(state)

    def graph_win_ajch(self):
        state = self.load()
        state['graphLevel'] += 1
        self.bump_ajch(state, 'graphWins')
        self.add_xp_ajch(state, XP_RULES['graph'])
        self.check_achievements_ajch(state)
        self.save(state)
        return self.summary_ajch(state)

    def duel_question_ajch(self, topic_id):
        if not self.school_topic_ajch(topic_id) or topic_id not in TOPICS:
            raise AbelInputError('Elige un tema de Primaria o Secundaria para el duelo.')
        item = exercise_for_ajch(topic_id, 'fácil' if TOPICS[topic_id]['level'] == 1 else 'intermedio')
        self.service.add_number_choices_ajch(item, TOPICS[topic_id])
        identity = 'duel-' + str(random.getrandbits(48))
        self.duels[identity] = item
        if len(self.duels) > 200:
            self.duels.pop(next(iter(self.duels)))
        from engineajch import exercise_formula_ajch
        return {'id': identity, **item, 'problemFormula': exercise_formula_ajch(item)}

    def duel_check_ajch(self, identity, answer):
        item = self.duels.get(identity)
        if not item:
            raise AbelInputError('Ese reto del duelo ya expiró.')
        result = self.service.mark_ajch(item, str(answer or '')[:200])
        return {'correct': result['correct'], 'invalid': result['invalid'],
                'answer': result['solution'].get('result', ''), 'message': result['feedback'].get('message', '')}

    def duel_end_ajch(self):
        state = self.load()
        self.bump_ajch(state, 'duels2p')
        self.add_xp_ajch(state, XP_RULES['duel'])
        self.check_achievements_ajch(state)
        self.save(state)
        return self.summary_ajch(state)

    def pending_ajch(self):
        state = self.load()
        items = state['pending']
        if items:
            state['pending'] = []
            self.save(state)
        return {'events': items, 'summary': self.summary_ajch(state)}

    def dispatch_ajch(self, args):
        action = args.get('action')
        handlers = {
            'summary': lambda: self.summary_ajch(),
            'guide': lambda: self.guide_ajch(),
            'pending': lambda: self.pending_ajch(),
            'daily': lambda: self.daily_ajch(),
            'survival': lambda: self.survival_ajch(args.get('step', 'next'), args.get('scope')),
            'dungeon': lambda: self.dungeon_ajch(args.get('scope')),
            'cards': lambda: self.cards(),
            'formulaFavorites': lambda: self.formula_favorites_ajch(args.get('identity'),args.get('enabled')),
            'openChest': lambda: self.open_chest_ajch(int(args.get('index', -1))),
            'adopt': lambda: self.adopt_ajch(args.get('species'), args.get('name')),
            'switchPet': lambda: self.switch_pet_ajch(args.get('species')),
            'welcome': lambda: self.welcome_ajch(args.get('level'), args.get('unit')),
            'feed': lambda: self.feed_ajch(),
            'dress': lambda: self.dress_ajch(args.get('hat')),
            'skill': lambda: self.learn_skill_ajch(args.get('skill')),
            'resetSkills': lambda: self.reset_skills_ajch(),
            'avatar': lambda: self.set_avatar_ajch(args),
            'graphWin': lambda: self.graph_win_ajch(),
            'duelQuestion': lambda: self.duel_question_ajch(args.get('topic')),
            'duelCheck': lambda: self.duel_check_ajch(args.get('id'), args.get('answer')),
            'duelEnd': lambda: self.duel_end_ajch(),
        }
        if action not in handlers:
            raise AbelInputError('Acción de juego no disponible.')
        return handlers[action]()
