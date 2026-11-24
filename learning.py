"""SQLite data model and offline learning flows for MathPath."""
import json
import os
import random
import re
import sqlite3
import time
import unicodedata
import uuid
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path

import sympy as s
import academic
import adventure as combat
from adventure import ADVENTURE_SECONDS, FIRST_GRADE_BOSS, FIRST_GRADE_TOPICS
import fun as game
import story
from curriculum import TOPICS, LEVELS, DIFFICULTIES, exercise_for, lesson
from engine import (InputError, ExpressionParser, OPERATIONS, ResultValidator, RELATION, StepGenerator, display_math,
                    exercise_formula, format_value, math_preview, solve_problem, verify_answer, feedback_for)

SCHEMA_VERSION=1
SCHEMA = """
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY, name TEXT NOT NULL, preference TEXT NOT NULL DEFAULT 'guiado',
    difficulty TEXT NOT NULL DEFAULT 'auto', variable TEXT NOT NULL DEFAULT 'x', study_seconds INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS config (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS levels (id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS units (level_id INTEGER REFERENCES levels(id), ordinal INTEGER, title TEXT NOT NULL, PRIMARY KEY(level_id,ordinal));
CREATE TABLE IF NOT EXISTS topics (id TEXT PRIMARY KEY, level_id INTEGER NOT NULL, unit INTEGER NOT NULL, title TEXT NOT NULL,
    FOREIGN KEY(level_id,unit) REFERENCES units(level_id,ordinal));
CREATE TABLE IF NOT EXISTS lessons (topic_id TEXT PRIMARY KEY REFERENCES topics(id), body TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prerequisites (topic_id TEXT REFERENCES topics(id), requires TEXT REFERENCES topics(id), PRIMARY KEY(topic_id,requires));
CREATE TABLE IF NOT EXISTS lesson_notes (
    profile_id INTEGER REFERENCES profiles(id), topic_id TEXT REFERENCES topics(id), body TEXT NOT NULL,
    PRIMARY KEY(profile_id,topic_id)
);
CREATE TABLE IF NOT EXISTS lesson_content (
    profile_id INTEGER REFERENCES profiles(id), topic_id TEXT REFERENCES topics(id),
    theory TEXT NOT NULL, formula TEXT NOT NULL,
    PRIMARY KEY(profile_id,topic_id)
);
CREATE TABLE IF NOT EXISTS exercises (
    id TEXT PRIMARY KEY, profile_id INTEGER NOT NULL REFERENCES profiles(id), topic_id TEXT NOT NULL REFERENCES topics(id),
    body TEXT NOT NULL, purpose TEXT NOT NULL, created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS responses (
    exercise_id TEXT PRIMARY KEY REFERENCES exercises(id), answer TEXT NOT NULL, correct INTEGER NOT NULL, created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY, profile_id INTEGER NOT NULL REFERENCES profiles(id), title TEXT NOT NULL, created TEXT NOT NULL,
    deadline REAL NOT NULL, finished TEXT, score INTEGER, total INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS evaluation_items (
    evaluation_id TEXT REFERENCES evaluations(id), exercise_id TEXT REFERENCES exercises(id), ordinal INTEGER NOT NULL,
    PRIMARY KEY(evaluation_id,ordinal), UNIQUE(exercise_id)
);
CREATE TABLE IF NOT EXISTS evaluation_drafts (
    exercise_id TEXT PRIMARY KEY REFERENCES exercises(id), answer TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS evaluation_work (
    exercise_id TEXT PRIMARY KEY REFERENCES exercises(id), lines TEXT NOT NULL DEFAULT '',
    points INTEGER, checks TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS university_notebook (
    id TEXT PRIMARY KEY, profile_id INTEGER NOT NULL REFERENCES profiles(id),
    unit INTEGER NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
    payload TEXT NOT NULL, updated TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS solved (
    id TEXT PRIMARY KEY, profile_id INTEGER NOT NULL REFERENCES profiles(id), result TEXT NOT NULL,
    request TEXT NOT NULL, created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY, profile_id INTEGER NOT NULL REFERENCES profiles(id), kind TEXT NOT NULL, title TEXT NOT NULL, created TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS adventure_battles (
    profile_id INTEGER NOT NULL REFERENCES profiles(id), topic_id TEXT NOT NULL REFERENCES topics(id),
    body TEXT NOT NULL, PRIMARY KEY (profile_id,topic_id)
);
CREATE TABLE IF NOT EXISTS adventure_wins (
    profile_id INTEGER NOT NULL REFERENCES profiles(id), topic_id TEXT NOT NULL REFERENCES topics(id),
    PRIMARY KEY (profile_id,topic_id)
);
CREATE TABLE IF NOT EXISTS adventure_inventory (
    profile_id INTEGER PRIMARY KEY REFERENCES profiles(id),
    hints INTEGER NOT NULL DEFAULT 0, shields INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS adventure_gear (
    profile_id INTEGER PRIMARY KEY REFERENCES profiles(id),
    body TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS exercises_by_profile ON exercises(profile_id,topic_id);
CREATE INDEX IF NOT EXISTS activities_by_profile ON activities(profile_id,id);
CREATE INDEX IF NOT EXISTS solved_by_profile ON solved(profile_id,created);
"""
ADVENTURE_TABLES = {'adventure_battles', 'adventure_wins', 'adventure_inventory', 'adventure_gear'}
OPTIONAL_TABLES = ADVENTURE_TABLES | {'evaluation_work','university_notebook','fun_state','custom_missions'}

def timestamp():
    return datetime.now(timezone.utc).isoformat()


def token():
    return uuid.uuid4().hex


def normalize(text):
    return ''.join(ch for ch in unicodedata.normalize('NFD',str(text).casefold()) if unicodedata.category(ch)!='Mn')


def clean(value,limit):
    return str(value or '').strip()[:limit]


def with_exercise_formula(item):
    return {**item, 'problemFormula': exercise_formula(item)}


def bounded_int(value,default,minimum,maximum):
    try:
        return min(max(int(value),minimum),maximum)
    except (ValueError,TypeError):
        return default


class LearningService:
    def __init__(self,filename):
        self.filename=Path(filename).resolve()
        self.filename.parent.mkdir(parents=True,exist_ok=True)
        self.db=sqlite3.connect(self.filename)
        self.db.row_factory=sqlite3.Row
        self.db.execute('PRAGMA trusted_schema=OFF')
        version=self.db.execute('PRAGMA user_version').fetchone()[0]
        if version not in (0,SCHEMA_VERSION):
            raise InputError('La base local corresponde a otra versión de MathPath.')
        self.db.executescript(SCHEMA)
        self.db.execute(f'PRAGMA user_version={SCHEMA_VERSION}')
        self.seed_catalog()
        self.fun=game.FunService(self)
        self.db.commit()

    def seed_catalog(self):
        self.db.execute("INSERT OR IGNORE INTO profiles(id,name) VALUES (1,'Estudiante'),(2,'Perfil de demostración')")
        self.db.execute("INSERT OR IGNORE INTO config VALUES ('profile','1')")
        for index,(title,description,units) in enumerate(LEVELS,1):
            self.db.execute("""INSERT INTO levels VALUES (?,?,?) ON CONFLICT(id)
                            DO UPDATE SET title=excluded.title,description=excluded.description""",(index,title,description))
            self.db.executemany("""INSERT INTO units VALUES (?,?,?) ON CONFLICT(level_id,ordinal)
                                 DO UPDATE SET title=excluded.title""",((index,ordinal,name) for ordinal,name in enumerate(units,1)))
        for topic_id,topic in TOPICS.items():
            self.db.execute("""INSERT INTO topics VALUES (?,?,?,?) ON CONFLICT(id)
                            DO UPDATE SET level_id=excluded.level_id,unit=excluded.unit,title=excluded.title""",
                            (topic_id,topic['level'],topic['unit'],topic['name']))
            self.db.execute("""INSERT INTO lessons VALUES (?,?) ON CONFLICT(topic_id)
                            DO UPDATE SET body=excluded.body""",(topic_id,json.dumps(lesson(topic_id),ensure_ascii=False)))
        # Register the encounter for saved battles and victories without adding it to the lesson catalog.
        for boss in story.GRADE_BOSSES:
            self.db.execute('INSERT OR IGNORE INTO topics VALUES (?,?,?,?)',(boss['id'],boss['level'],boss['unit'],boss['name']))
        self.db.execute('DELETE FROM prerequisites')
        for topic_id,topic in TOPICS.items():
            self.db.executemany('INSERT INTO prerequisites VALUES (?,?)',((topic_id,prior) for prior in topic['requires']))
        self.db.execute('DELETE FROM units WHERE level_id>?',(len(LEVELS),))
        self.db.execute('DELETE FROM levels WHERE id>?',(len(LEVELS),))

    @property
    def profile_id(self):
        return int(self.db.execute("SELECT value FROM config WHERE key='profile'").fetchone()[0])

    def profile(self):
        return dict(self.db.execute('SELECT name,preference,difficulty,variable,study_seconds FROM profiles WHERE id=?',(self.profile_id,)).fetchone())

    def log(self,kind,title):
        self.db.execute('INSERT INTO activities(profile_id,kind,title,created) VALUES (?,?,?,?)',(self.profile_id,kind,title,timestamp()))

    def solved_rows(self):
        return [{'id':row['id'],'date':row['created'],'solution':json.loads(row['result']),'request':json.loads(row['request'])}
                for row in self.db.execute('SELECT * FROM solved WHERE profile_id=? ORDER BY created DESC LIMIT 30',(self.profile_id,))]

    def attempts(self):
        rows=self.db.execute("""SELECT e.topic_id,e.body,r.correct,r.created FROM responses r
                               JOIN exercises e ON e.id=r.exercise_id
                               WHERE e.profile_id=? AND (e.purpose IN ('practice','exam','survival','daily') OR
                                   (e.purpose='adventure' AND EXISTS (
                                       SELECT 1 FROM adventure_wins w
                                       WHERE w.profile_id=e.profile_id AND w.topic_id=e.topic_id)))
                               ORDER BY r.created DESC""",(self.profile_id,)).fetchall()
        # Topics removed from the catalog (for example the old finance course) keep their rows but are not counted.
        return [row for row in rows if row['topic_id'] in TOPICS]

    def topic_scores(self,attempts=None):
        records=self.attempts() if attempts is None else attempts
        seen={topic_id:set() for topic_id in TOPICS}
        results={topic_id:[] for topic_id in TOPICS}
        for row in records:
            topic_id=row['topic_id']
            school=TOPICS[topic_id]['level']<3
            if (school and not row['correct']) or len(results[topic_id]) >= (2 if school else 3):
                continue
            item=json.loads(row['body'])
            key=(item['problem'],item['argument'])
            if key in seen[topic_id]:
                continue
            seen[topic_id].add(key)
            results[topic_id].append(bool(row['correct']))
        return {topic_id:min(2,sum(scores)) for topic_id,scores in results.items()}

    def mastery(self,attempts=None):
        return {topic_id for topic_id,score in self.topic_scores(attempts).items() if score==2}

    def university_progress(self, mastered=None):
        """Academic evidence, without game levels, collectible cards or rewards."""
        mastered=self.mastery() if mastered is None else mastered
        rows=self.db.execute('''SELECT e.topic_id,r.correct,r.created FROM responses r
                               JOIN exercises e ON e.id=r.exercise_id JOIN topics t ON t.id=e.topic_id
                               WHERE e.profile_id=? AND t.level_id=3 AND
                                   e.purpose IN ('practice','guided','exam','daily','survival')
                               ORDER BY r.created DESC''',(self.profile_id,)).fetchall()
        by_topic={topic_id:[] for topic_id,topic in TOPICS.items() if topic['level']==3}
        for row in rows:
            if row['topic_id'] in by_topic:
                by_topic[row['topic_id']].append(row)

        def metrics(records):
            recent=records[:6]
            correct=sum(row['correct'] for row in records)
            return {'attempts':len(records),'correct':correct,
                    'accuracy':round(100*correct/len(records)) if records else None,
                    'recentAttempts':len(recent),
                    'recentAccuracy':round(100*sum(row['correct'] for row in recent)/len(recent)) if recent else None}

        topics=[]
        for topic_id,records in by_topic.items():
            topic=TOPICS[topic_id]
            score=metrics(records)
            review=score['recentAccuracy'] is not None and score['recentAccuracy']<70
            topics.append({'id':topic_id,'name':topic['name'],'unit':topic['unit'],**score,
                           'mastered':topic_id in mastered,
                           'status':'review' if review else 'mastered' if topic_id in mastered else
                                    'practice' if records else 'unseen',
                           'lastAttempt':records[0]['created'] if records else None})
        courses=[]
        for unit,name in enumerate(LEVELS[2][2],1):
            members=[item for item in topics if item['unit']==unit]
            course_rows=[row for row in rows if TOPICS.get(row['topic_id'],{}).get('unit')==unit]
            courses.append({'unit':unit,'name':name,**metrics(course_rows),
                            'mastered':sum(item['mastered'] for item in members),'total':len(members),
                            'needsReview':sum(item['status']=='review' for item in members)})
        strengths=sorted((item for item in topics if item['recentAttempts']>=2 and item['recentAccuracy']>=80),
                         key=lambda item:(not item['mastered'],-item['recentAccuracy'],-item['recentAttempts']))[:6]
        needs_practice=sorted((item for item in topics if item['status']=='review'),
                              key=lambda item:(item['recentAccuracy'],-item['recentAttempts']))[:6]
        return {**metrics(rows),'recentWindow':6,'mastered':sum(item['mastered'] for item in topics),
                'total':len(topics),'topics':topics,'courses':courses,
                'strengths':strengths,'needsPractice':needs_practice}

    def status(self):
        profile=self.profile()
        attempts=self.attempts()
        correct=sum(row['correct'] for row in attempts)
        scores_by_topic=self.topic_scores(attempts)
        mastered={topic_id for topic_id,score in scores_by_topic.items() if score==2}
        topics=[]
        for topic_id,topic in TOPICS.items():
            missing=[prior for prior in topic['requires'] if prior not in mastered]
            topics.append({key:topic[key] for key in ('id','name','goal','level','unit','area')}|
                          {'mastered':topic_id in mastered,'missing':missing,'stars':scores_by_topic[topic_id]})
        levels=[]
        for index,(title,description,units) in enumerate(LEVELS,1):
            area=[topic for topic in topics if topic['level']==index]
            completed=sum(topic['mastered'] for topic in area)
            scores=[row['correct'] for row in attempts if TOPICS[row['topic_id']]['level']==index]
            levels.append({'id':index,'title':title,'description':description,'units':units,'mastered':completed,'total':len(area),
                           'accuracy':round(100*sum(scores)/len(scores)) if scores else None})
        evaluations=self.exam_history()
        recent=[dict(row) for row in self.db.execute('SELECT kind,title,created FROM activities WHERE profile_id=? ORDER BY id DESC LIMIT 8',(self.profile_id,))]
        failed=sum(1 for row in self.db.execute("""SELECT e.topic_id FROM responses r JOIN exercises e ON r.exercise_id=e.id
                                WHERE e.profile_id=? AND e.purpose='practice' AND r.correct=0""",(self.profile_id,))
                   if row['topic_id'] in TOPICS)
        suggested=next((topic['id'] for topic in topics if not topic['mastered'] and not topic['missing']),None)
        adventure=self.adventure_status()
        return {'profile':profile,'demo':self.profile_id==2,'topics':topics,'levels':levels,'recent':recent,
                'adventure':adventure,'adventureGuide':combat.GUIDE,'village':self.village_state(adventure['wins']),
                'firstGradeBoss':FIRST_GRADE_BOSS|{'health':combat.DRAGON['hearts'],'secondUnlocked':self.second_grade_unlocked()},
                'mastered':len(mastered),'total':len(topics),'attempts':len(attempts),'correct':correct,'failed':failed,'recommended':suggested,
                'accuracy':round(100*correct/len(attempts)) if attempts else None,
                'exams':evaluations,'currentLevel':TOPICS[suggested]['level'] if suggested else len(LEVELS),
                'fun':self.fun.summary(),'funGuide':self.fun.guide(),
                'gradeBosses':self.grade_bosses(mastered,adventure['wins']),
                'storyEndings':{'1':story.PRIMARY_EPILOGUE,'2':story.SECONDARY_EPILOGUE},
                'gradeRivals':{key:value for key,value in combat.GRADE_RIVALS.items()},
                'universityProgress':self.university_progress(mastered),
                'operations':OPERATIONS,'procedureCourses':sorted({topic['unit'] for topic in TOPICS.values()
                    if topic['level']==3 and topic['operation'] in academic.PROCEDURE_OPERATIONS})}

    def get_lesson(self,topic_id,record=False):
        if topic_id not in TOPICS:
            raise InputError('Selecciona un tema del catálogo.')
        data=json.loads(self.db.execute('SELECT body FROM lessons WHERE topic_id=?',(topic_id,)).fetchone()[0])
        data['example']=with_exercise_formula(data['example'])
        note=self.db.execute('SELECT body FROM lesson_notes WHERE profile_id=? AND topic_id=?',(self.profile_id,topic_id)).fetchone()
        data['note']=note[0] if note else ''
        customization=self.db.execute('SELECT theory,formula FROM lesson_content WHERE profile_id=? AND topic_id=?',
                                      (self.profile_id,topic_id)).fetchone()
        data['custom']=dict(customization) if customization else None
        if record:
            self.log('Lección',data['name'])
        return data

    def require_unlocked(self,topic_id):
        if topic_id not in TOPICS:
            raise InputError('Selecciona un tema válido.')
        mastered=self.mastery()
        missing=[TOPICS[item]['name'] for item in TOPICS[topic_id]['requires'] if item not in mastered]
        if missing and topic_id not in mastered:
            raise InputError('Domina primero: '+', '.join(missing)+'.')

    def effective_difficulty(self,requested='auto',topic_id=None):
        if requested in DIFFICULTIES:
            return requested
        configured=self.profile()['difficulty']
        if configured in DIFFICULTIES:
            return configured
        attempts=[row['correct'] for row in self.attempts() if not topic_id or row['topic_id']==topic_id][:6]
        if len(attempts)<3:
            return 'fácil'
        accuracy=sum(attempts)/len(attempts)
        return 'avanzado' if len(attempts)>=5 and accuracy>=.85 else 'intermedio' if accuracy>=.60 else 'fácil'

    def insert_exercise(self,item,purpose):
        identity=token()
        self.db.execute('INSERT INTO exercises VALUES (?,?,?,?,?,?)',(identity,self.profile_id,item['topic'],json.dumps(item),purpose,timestamp()))
        return with_exercise_formula({'id':identity,**item,'purpose':purpose})

    def adventure_status(self):
        wins=[row['topic_id'] for row in self.db.execute(
            'SELECT topic_id FROM adventure_wins WHERE profile_id=?',(self.profile_id,))]
        pack=self.db.execute('SELECT hints,shields FROM adventure_inventory WHERE profile_id=?',(self.profile_id,)).fetchone()
        return {'wins':wins,**(dict(pack) if pack else {'hints':0,'shields':0})}

    def village_ledger(self, wins):
        row=self.db.execute('SELECT body FROM adventure_gear WHERE profile_id=?',(self.profile_id,)).fetchone()
        gear=json.loads(row['body']) if row else {
            'stock':dict.fromkeys(combat.RESOURCES,0), 'owned':[], 'equipped':{}, 'potions':0, 'credited':[]
        }
        credited=set(gear['credited'])
        for topic_id in wins:
            if topic_id not in credited:
                for resource,quantity in combat.loot_for(topic_id).items():
                    gear['stock'][resource]+=quantity
                gear['credited'].append(topic_id)
        return gear

    @staticmethod
    def village_view(gear):
        return {key:gear[key] for key in ('stock','owned','equipped','potions')}|{'bonuses':combat.equipment(gear['equipped'])}

    def village_state(self, wins):
        return self.village_view(self.village_ledger(wins))

    def save_gear(self, gear):
        self.db.execute("""INSERT INTO adventure_gear VALUES (?,?)
                          ON CONFLICT(profile_id) DO UPDATE SET body=excluded.body""",
                        (self.profile_id,json.dumps(gear)))

    def village(self, payload):
        action=payload.get('action')
        if action=='status':
            return self.village_state(self.adventure_status()['wins'])
        item_id=payload.get('item')
        item=combat.ITEMS.get(item_id)
        if not item or action not in {'craft','equip'}:
            raise InputError('Elige una mejora de la aldea.')
        if not self.db.in_transaction:
            self.db.execute('BEGIN IMMEDIATE')
        gear=self.village_ledger(self.adventure_status()['wins'])
        slot=item['slot']
        if action=='craft':
            if item_id in gear['owned']:
                raise InputError('Ya fabricaste esta pieza. Puedes equiparla en el taller.')
            if any(gear['stock'][key]<amount for key,amount in item['cost'].items()):
                raise InputError('Te faltan monedas o materiales para fabricar esta pieza.')
            for key,amount in item['cost'].items():
                gear['stock'][key]-=amount
            if slot=='supply':
                gear['potions']+=1
            else:
                gear['owned'].append(item_id)
        if slot!='supply' and item_id in gear['owned']:
            gear['equipped'][slot]=item_id
        elif action=='equip':
            raise InputError('Primero fabrica esta pieza.')
        self.save_gear(gear)
        return self.village_view(gear)

    def grade_unlocked(self, level, unit):
        """Duels of a grade open after the previous grade's boss. Profiles that already played
        duels of that grade before the story existed keep their access."""
        if unit <= 1:
            return True
        # Grades up to the one chosen in the welcome start open.
        if unit <= int(self.fun.load().get('placement', {}).get(str(level), 0)):
            return True
        if (level, unit) == (1, 2):
            return self.second_grade_unlocked()
        previous = story.GRADE_BOSS_BY_GRADE[(level, unit-1)]['id']
        profile_id = self.profile_id
        return self.db.execute("""SELECT 1 FROM adventure_wins WHERE profile_id=? AND topic_id=?
                                  UNION ALL
                                  SELECT 1 FROM adventure_battles b JOIN topics t ON t.id=b.topic_id
                                  WHERE b.profile_id=? AND t.level_id=? AND t.unit=? AND b.topic_id NOT LIKE 'jefe-%' LIMIT 1""",
                               (profile_id,previous,profile_id,level,unit)).fetchone() is not None

    def grade_bosses(self, mastered=None, wins=None):
        mastered = self.mastery() if mastered is None else mastered
        wins = set(self.adventure_status()['wins'] if wins is None else wins)
        result = []
        for boss in story.GRADE_BOSSES:
            members = combat.grade_topics(boss['level'], boss['unit'])
            rival = combat.GRADE_RIVALS[boss['id']]
            result.append({key: boss[key] for key in ('id','level','unit','name','title','location','effect','chapter',
                                                       'intro','victory','final','story')} |
                          {'enemy': rival['id'], 'health': rival['hearts'], 'won': boss['id'] in wins,
                           'ready': set(members) <= mastered, 'unlocked': self.grade_unlocked(boss['level'], boss['unit']),
                           'missions': len(members), 'questions': min(8, len(members))})
        return result

    def second_grade_unlocked(self):
        # Keep second-grade duels accessible for profiles that started them before the boss was added.
        profile_id=self.profile_id
        return self.db.execute("""SELECT 1 FROM adventure_wins WHERE profile_id=? AND topic_id=?
                                  UNION ALL
                                  SELECT 1 FROM adventure_battles b JOIN topics t ON t.id=b.topic_id
                                  WHERE b.profile_id=? AND t.level_id=1 AND t.unit=2 LIMIT 1""",
                               (profile_id,FIRST_GRADE_BOSS['id'],profile_id)).fetchone() is not None

    def adventure_question(self, item, battle, rival):
        boss=bool(battle.get('topics'))
        barrier=battle['studyHits']==1 and not battle['barrierBroken']
        if boss:
            order=battle['topics']
            source=order[battle['studyHits']%len(order)]
        else:
            # The first arithmetic duel alternates addition with subtraction.
            source='resta1' if item['id']=='naturales' and battle['studyHits']%2 else item['id']
        exercise_topic=source if boss else item['id']
        difficulty='fácil' if barrier else self.effective_difficulty('auto',exercise_topic)
        seen=battle['seen'][-1:]
        if not (boss or barrier) and battle['studyHits']<2:
            seen=seen+battle['correctKeys']
        used={tuple(key) for key in seen}
        for _ in range(40):
            exercise=combat.tactics_exercise(item) if barrier else exercise_for(source,difficulty)
            key=(exercise['problem'],exercise['argument'])
            if barrier or boss:
                key=('barrier' if barrier else source,*key)
            if key not in used:
                break
        else:
            raise InputError('No salió un reto distinto. Inténtalo nuevamente.')
        exercise.update(topic=exercise_topic,hintTopic=source)
        if source in {'naturales','resta1'} and not barrier:
            exercise.update(question='¿Cuánto da esta operación?',showExpression=True)
        if not barrier:
            self.add_number_choices(exercise,TOPICS[exercise_topic])
        purpose='tactic' if barrier else 'boss' if boss else 'adventure'
        turn=self.insert_exercise(exercise,purpose)
        seconds=combat.boss_seconds(exercise,battle,rival) if rival.get('gradeBoss') else None
        combat.open_round(battle,rival,turn['id'],seconds)
        battle['seen']=(battle['seen']+[key])[-16:]

    def reward_adventure(self, topic_id, battle):
        won=self.db.execute('INSERT OR IGNORE INTO adventure_wins VALUES (?,?)',(self.profile_id,topic_id)).rowcount
        battle['reward']=bool(won)
        if won:
            self.db.execute("""INSERT INTO adventure_inventory VALUES (?,1,1)
                              ON CONFLICT(profile_id) DO UPDATE SET hints=hints+1,shields=shields+1""",
                            (self.profile_id,))
            battle['loot']=combat.loot_for(topic_id)
        else:
            gear=self.village_ledger(self.adventure_status()['wins'])
            battle['loot']=combat.replay_loot(topic_id)
            for resource,quantity in battle['loot'].items():
                gear['stock'][resource]+=quantity
            self.save_gear(gear)

    def adventure(self, payload):
        topic_id=payload.get('topic')
        world=combat.is_world_boss(topic_id)
        chapter_boss=story.GRADE_BOSS_BY_ID.get(topic_id)
        boss=bool(chapter_boss) or world
        item=game.WORLD_BOSSES.get(topic_id) if world else chapter_boss if chapter_boss else TOPICS.get(topic_id)
        if not item or item['level']>=3:
            raise InputError('Elige una misión de Primaria o Secundaria.')
        rival=combat.rival_for(topic_id)
        if not self.db.in_transaction:
            self.db.execute('BEGIN IMMEDIATE')
        row=self.db.execute('SELECT body FROM adventure_battles WHERE profile_id=? AND topic_id=?',
                            (self.profile_id,topic_id)).fetchone()
        battle=json.loads(row['body']) if row else None
        if battle:
            combat.update_saved_battle(battle,rival)
        action=payload.get('action')
        grade=None
        if action in {'start','restart'}:
            if world:
                boss_topics=list(item['topics'])
                if not set(boss_topics)<=self.mastery():
                    raise InputError('Completa las tres misiones de este mundo para desafiar a su rey.')
            elif chapter_boss:
                members=combat.grade_topics(item['level'],item['unit'])
                if not self.grade_unlocked(item['level'],item['unit']):
                    raise InputError('Este capítulo aún no empieza. Vence primero al jefe del grado anterior.')
                if not set(members)<=self.mastery():
                    raise InputError('Completa todas las misiones del grado para desafiar a '+item['name']+'.')
                boss_topics=random.sample(members,min(8,len(members)))
            else:
                if not self.grade_unlocked(item['level'],item['unit']):
                    previous=story.GRADE_BOSS_BY_GRADE[(item['level'],item['unit']-1)]
                    raise InputError('Vence a '+previous['name']+' para jugar los duelos de este grado.')
                self.require_unlocked(topic_id)
            if not battle or action=='restart' and (battle['hero']==0 or battle['rival']==0):
                gear=self.village_ledger(self.adventure_status()['wins'])
                fun_state=self.fun.load()
                pet=self.fun.pet_info(fun_state)
                battle=combat.begin_battle(rival,gear['equipped'],self.fun.skill_bonus(fun_state),pet['ward'] if pet else 0)
                battle['petHint']=bool(pet and pet['freeHint'])
                if boss:
                    battle['topics']=random.sample(boss_topics,len(boss_topics))
                self.adventure_question(item,battle,rival)
        elif not battle or payload.get('turn')!=battle['turn']:
            raise InputError('Vuelve a abrir la misión para recuperar el turno actual.')

        # Older saved duels get a full turn the first time they are reopened.
        now=time.time()
        if not battle['event'] and now>=battle.setdefault('deadline',now+ADVENTURE_SECONDS):
            battle['timedOut']=True
            combat.counter(battle)
            self.db.execute('INSERT OR IGNORE INTO responses VALUES (?,?,?,?)',
                            (battle['turn'],'',0,timestamp()))
        elif action=='next' and battle['event'] and battle['hero'] and battle['rival']:
            battle['event']=''
            self.adventure_question(item,battle,rival)
        elif action=='answer' and not battle['event']:
            grade=self.grade(battle['turn'],payload.get('answer'),in_battle=True)
            if not grade['invalid']:
                if grade['correct']:
                    combat.strike(battle,self.exercise(battle['turn']),boss)
                    if battle['impact'].get('crit'):
                        self.fun.event('crit',topic=topic_id)
                    if battle['impact'].get('combo'):
                        self.fun.event('combo',topic=topic_id)
                    if battle['rival']==0:
                        self.reward_adventure(topic_id,battle)
                        self.fun.event('win',boss=boss,topic=topic_id)
                else:
                    combat.counter(battle)
        elif action=='move' and not battle['event']:
            combat.choose_attack(battle,payload.get('move'))
        elif action=='pet-hint' and not battle['event']:
            if not battle.get('petHint') or battle['usedHint']:
                raise InputError('Tu mascota ya te dio su pista en este duelo.')
            battle.update(petHint=False,usedHint=True)
        elif action in {'hint','shield'} and not battle['event']:
            column, flag=('hints','usedHint') if action=='hint' else ('shields','shielded')
            if not battle[flag]:
                spent=self.db.execute(f'UPDATE adventure_inventory SET {column}={column}-1 WHERE profile_id=? AND {column}>0',
                                      (self.profile_id,)).rowcount
                if not spent:
                    raise InputError('Gana un duelo nuevo para conseguir más ayudas.')
                battle[flag]=True
        elif action=='potion' and not (battle['event'] or battle['usedPotion']):
            gear=self.village_ledger(self.adventure_status()['wins'])
            if battle['hero']==battle['heroTotal'] or gear['potions']<=0:
                raise InputError('La poción requiere que te falten corazones y tengas una en el morral.')
            gear['potions']-=1
            restore=combat.ITEMS['healing-potion']['heal']
            battle.update(hero=min(battle['heroTotal'],battle['hero']+restore),usedPotion=True)
            self.save_gear(gear)

        self.db.execute("""INSERT INTO adventure_battles VALUES (?,?,?)
                          ON CONFLICT(profile_id,topic_id) DO UPDATE SET body=excluded.body""",
                        (self.profile_id,topic_id,json.dumps(battle)))
        turn=self.exercise(battle['turn'])
        if battle.get('timedOut'):
            grade={'correct':False,'invalid':False,
                   'feedback':{'type':'Tiempo agotado','message':'Se acabó el tiempo para responder.','answer':''},
                   'solution':self.calculate(turn).as_dict()}
        elif battle['event'] and not grade:
            answer=self.db.execute('SELECT answer FROM responses WHERE exercise_id=?',(turn['id'],)).fetchone()
            grade=self.mark(turn,answer['answer'])
        inventory=self.adventure_status()
        visible={key:battle[key] for key in ('hero','heroTotal','rival','rivalTotal','shielded',
            'event','deadline','turnSeconds','ward','streak','threat','equipped','usedPotion',
            'heroMove','energy','heroGuard','weaponStyle',
            'comboEvery','comboProgress','comboStage','comboNext','comboBonusNext','comboHitsNext')}|{'petHint':battle.get('petHint',False),
            'crits':battle.get('crits',0),'combos':battle.get('combos',0)}
        return visible|{'target':topic_id,'exercise':turn,'grade':grade,
                'heroPower':battle['gear']['power']+(battle['gear']['combo'] if battle['streak']>=1 else 0),
                'reward':battle.get('reward',False),'timedOut':battle.get('timedOut',False),
                'impact':battle.get('impact',{}),'loot':battle.get('loot',{}),
                'hint':self.hint(turn['id'],in_battle=True) if battle['usedHint'] else None,
                'inventory':inventory,'village':self.village_state(inventory['wins'])}

    def add_number_choices(self,item,topic):
        if topic['level']==1 and topic['unit']<=2:
            answer=self.calculate(item).value
            if isinstance(answer,s.Integer):
                step=10 if answer>=30 else 1
                start=max(0,int(answer)-step)
                item['choices']=[start+offset*step for offset in range(4)]
                random.shuffle(item['choices'])

    def practice(self,topic_id,difficulty,guided=False):
        self.require_unlocked(topic_id)
        rank=self.effective_difficulty(difficulty,topic_id)
        recent={(item['problem'],item['argument']) for row in self.attempts() if row['topic_id']==topic_id and row['correct']
                for item in [json.loads(row['body'])]}
        for _ in range(14):
            item=exercise_for(topic_id,rank)
            if (item['problem'],item['argument']) not in recent:
                break
        if not guided:
            self.add_number_choices(item,TOPICS[topic_id])
        return self.insert_exercise(item,'guided' if guided else 'practice')

    def exercise(self,identity):
        row=self.db.execute('SELECT * FROM exercises WHERE id=? AND profile_id=?',(identity,self.profile_id)).fetchone()
        if not row:
            raise InputError('Ese ejercicio ya no pertenece al perfil activo.')
        return with_exercise_formula({'id':identity,**json.loads(row['body']),'purpose':row['purpose']})

    def calculate(self,request):
        result=solve_problem(request['problem'],request.get('operation','auto'),request.get('variable','x'),request.get('argument',''))
        visual=request.get('visual')
        if visual and request.get('topic') in {'conteo','lados'} and isinstance(result.value,s.Integer):
            title, instruction = {
                'conteo':('Cuenta una por una','Señala cada estrella al decir un número. El último número es el total.'),
                'lados':('Recorre el borde','Empieza en una esquina y cuenta cada línea hasta volver al punto de partida.')
            }[request['topic']]
            sequence=', '.join(map(str,range(1,min(int(result.value),30)+1)))
            result.steps=[StepGenerator.step(title,instruction,text=sequence)]
        return result

    def solve(self,request,save=True):
        solution=self.calculate(request).as_dict()
        if save:
            self.db.execute('INSERT INTO solved VALUES (?,?,?,?,?)',(token(),self.profile_id,json.dumps(solution),json.dumps(request),timestamp()))
            self.log('Solucionador',solution['problem'])
        return solution

    def hint(self,identity,in_battle=False):
        item=self.exercise(identity)
        if item['purpose']=='exam':
            raise InputError('Las evaluaciones muestran la corrección al finalizar.')
        if item['purpose'] in {'adventure','boss','tactic'} and not in_battle:
            raise InputError('Usa una pista desde el duelo.')
        if item.get('tactic'):
            return {'rule':'Romper la barrera','explanation':item['tactic']['hint']}
        topic=TOPICS[item.get('hintTopic',item['topic'])]
        return {'rule':topic['formula'],'explanation':topic['theory']}

    def mark(self,item,answer):
        solution=self.calculate(item)
        try:
            correct=verify_answer(answer,solution,item['operation'],item['variable'],item['argument'])
        except (InputError,ValueError,TypeError,NotImplementedError) as error:
            return {'correct':False,'invalid':True,'feedback':{'type':'Formato','message':str(error),'answer':answer},'solution':solution.as_dict()}
        return {'correct':correct,'invalid':False,'feedback':feedback_for(answer,solution,correct),'solution':solution.as_dict()}

    def grade(self,identity,answer,in_battle=False):
        item=self.exercise(identity)
        if item['purpose']=='exam':
            raise InputError('Envía las respuestas desde la evaluación.')
        if item['purpose'] in {'adventure','boss','tactic'} and not in_battle:
            raise InputError('Responde desde el duelo.')
        answer=clean(answer,450)
        previous=self.db.execute('SELECT * FROM responses WHERE exercise_id=?',(identity,)).fetchone()
        if previous:
            return self.mark(item,previous['answer'])
        result=self.mark(item,answer)
        if not result['invalid']:
            self.db.execute('INSERT INTO responses VALUES (?,?,?,?)',(identity,answer,int(result['correct']),timestamp()))
            title={'guided':'Práctica guiada','adventure':'Duelo medieval','boss':'Jefe final','tactic':'Reto de barrera',
                   'daily':'Reto del día','survival':'Supervivencia'}.get(item['purpose'],'Práctica')
            self.log(title,TOPICS[item['topic']]['name'])
            if item['purpose']!='tactic':
                self.fun.event('answer',correct=result['correct'],purpose=item['purpose'],exercise=identity)
        return result

    def retry_failed(self):
        mastered=self.mastery()
        rows=self.db.execute("""SELECT e.body,e.topic_id FROM responses r JOIN exercises e ON e.id=r.exercise_id
                                WHERE e.profile_id=? AND e.purpose='practice'
                                GROUP BY e.topic_id,e.body HAVING MAX(r.correct)=0 ORDER BY MAX(r.created) DESC""",(self.profile_id,))
        for row in rows:
            if row['topic_id'] in TOPICS and all(prior in mastered for prior in TOPICS[row['topic_id']]['requires']):
                return self.insert_exercise(json.loads(row['body']),'practice')
        raise InputError('No tienes ejercicios independientes fallados pendientes de repetir.')

    def exam_history(self):
        rows=self.db.execute("""SELECT e.*,
                 CASE WHEN COUNT(w.exercise_id)>0 THEN e.score+COALESCE(SUM(w.points),0) END AS points,
                 CASE WHEN COUNT(w.exercise_id)>0 THEN 2*e.total END AS maxPoints
                 FROM evaluations e JOIN evaluation_items i ON i.evaluation_id=e.id
                 LEFT JOIN evaluation_work w ON w.exercise_id=i.exercise_id
                 WHERE e.profile_id=? AND e.finished IS NOT NULL
                 GROUP BY e.id ORDER BY e.finished DESC LIMIT 30""",(self.profile_id,))
        return [dict(row) for row in rows]

    def exam(self,identity,include_results=False):
        row=self.db.execute('SELECT * FROM evaluations WHERE id=? AND profile_id=?',(identity,self.profile_id)).fetchone()
        if not row:
            raise InputError('Selecciona una evaluación de tu perfil.')
        result=dict(row)
        entries=self.db.execute("""SELECT i.exercise_id,r.answer,r.correct FROM evaluation_items i
                                  LEFT JOIN responses r ON r.exercise_id=i.exercise_id WHERE i.evaluation_id=? ORDER BY i.ordinal""",(identity,)).fetchall()
        result['items']=[self.exercise(item['exercise_id']) for item in entries]
        result['drafts']={row['exercise_id']:row['answer'] for row in self.db.execute(
            """SELECT i.exercise_id,d.answer FROM evaluation_items i JOIN evaluation_drafts d
               ON d.exercise_id=i.exercise_id WHERE i.evaluation_id=?""",(identity,))}
        work={entry['exercise_id']:entry for entry in self.db.execute(
            """SELECT w.* FROM evaluation_work w JOIN evaluation_items i ON i.exercise_id=w.exercise_id
               WHERE i.evaluation_id=?""",(identity,))}
        result['procedure']=bool(work)
        if work:
            result['procedureDrafts']={key:entry['lines'] for key,entry in work.items()}
            if row['finished']:
                result['points']=row['score']+sum(entry['points'] or 0 for entry in work.values())
                result['maxPoints']=row['total']*2
        if include_results and row['finished']:
            result['review']=[self.mark(item,entry['answer']) if entry['answer'] else
                              {'correct':False,'feedback':{'type':'Sin respuesta','message':'Compara el procedimiento y practica de nuevo.'},'solution':self.calculate(item).as_dict()}
                              for item,entry in zip(result['items'],entries)]
            for grade,entry in zip(result['review'],entries):
                grade['answer']=entry['answer'] or ''
            for item,grade in zip(result['items'],result['review']):
                entry=work.get(item['id'])
                if entry:
                    grade['procedure']={'lines':entry['lines'],'points':entry['points'] or 0,
                                        'checks':json.loads(entry['checks'])}
        return result

    def active_exam(self):
        row=self.db.execute('SELECT id FROM evaluations WHERE profile_id=? AND finished IS NULL ORDER BY created DESC LIMIT 1',(self.profile_id,)).fetchone()
        if not row:
            return None
        result=self.exam(row['id'])
        if time.time()>=result['deadline']:
            self.submit_exam(result['id'],{})
            return None
        return result

    def start_exam(self,scope,scope_id,minutes,count,difficulty,topic_ids=None):
        active=self.active_exam()
        if active:
            return active
        master=self.mastery()
        allowed=[topic for topic in TOPICS.values() if topic['id'] in master or all(prior in master for prior in topic['requires'])]
        count=bounded_int(count,5,3,12)
        if scope=='procedure':
            allowed=[topic for topic in allowed if topic['level']==3 and topic['operation'] in academic.PROCEDURE_OPERATIONS]
            title='Universitaria · procedimiento'
            if scope_id:
                if str(scope_id) not in {str(index) for index in range(1,len(LEVELS[2][2])+1)}:
                    raise InputError('Elige un curso universitario válido.')
                number=int(scope_id)
                allowed=[topic for topic in allowed if topic['unit']==number]
                title=LEVELS[2][2][number-1]+' · procedimiento'
        elif scope=='topics':
            if not isinstance(topic_ids,list) or not topic_ids or any(not isinstance(id_,str) or id_ not in TOPICS for id_ in topic_ids):
                raise InputError('Selecciona al menos un tema válido para la evaluación.')
            selected=set(topic_ids)
            allowed=[topic for topic in allowed if topic['id'] in selected]
            if len(allowed)!=len(selected):
                raise InputError('Selecciona solo temas habilitados para tu perfil.')
            if len(selected)>count:
                raise InputError('Pon al menos una pregunta por cada tema seleccionado.')
            title='Evaluación · '+(allowed[0]['name'] if len(allowed)==1 else f'{len(allowed)} temas')
        elif scope=='unit':
            if scope_id not in TOPICS:
                raise InputError('Elige el tema cuya unidad quieres evaluar.')
            chosen=TOPICS[scope_id]
            allowed=[topic for topic in allowed if topic['level']==chosen['level'] and topic['unit']==chosen['unit']]
            title=LEVELS[chosen['level']-1][2][chosen['unit']-1]
        elif scope=='level':
            if str(scope_id) not in {str(index) for index in range(1,len(LEVELS)+1)}:
                raise InputError('Selecciona un nivel válido para la evaluación.')
            number=int(scope_id)
            allowed=[topic for topic in allowed if topic['level']==number]
            title=LEVELS[number-1][0]
        else:
            title='Evaluación general'
        if not allowed:
            raise InputError('Todavía no tienes temas habilitados en ese alcance. Revisa los prerrequisitos.')
        minutes=bounded_int(minutes,8,1,60)
        identity=token()
        self.db.execute('INSERT INTO evaluations VALUES (?,?,?,?,?,NULL,NULL,?)',(identity,self.profile_id,title,timestamp(),time.time()+minutes*60,count))
        available=allowed[:]
        random.shuffle(available)
        for index in range(count):
            topic_id=available[index%len(available)]['id']
            item=self.insert_exercise(exercise_for(topic_id,self.effective_difficulty(difficulty,topic_id)),'exam')
            self.db.execute('INSERT INTO evaluation_items VALUES (?,?,?)',(identity,item['id'],index))
            if scope=='procedure':
                self.db.execute('INSERT INTO evaluation_work(exercise_id) VALUES (?)',(item['id'],))
        return self.exam(identity)

    def submit_exam(self,identity,answers,work=None):
        if not self.db.in_transaction:
            self.db.execute('BEGIN IMMEDIATE')
        current=self.exam(identity,True)
        if current['finished']:
            return current
        on_time=time.time()<current['deadline']
        supplied=answers if isinstance(answers,dict) and on_time else {}
        answers={**current['drafts'],**supplied}
        written=current.get('procedureDrafts',{})
        steps={**written,**work} if isinstance(work,dict) and on_time else written
        process_points=0
        score=0
        for item in current['items']:
            answer=clean(answers.get(item['id']),450)
            result=self.mark(item,answer) if answer else {'correct':False}
            score+=int(result['correct'])
            self.db.execute('INSERT INTO responses VALUES (?,?,?,?)',(item['id'],answer,int(result['correct']),timestamp()))
            if item['id'] in written:
                lines=clean(steps.get(item['id']),academic.WORK_LIMIT)
                rubric=academic.assess_work(item,self.calculate(item),lines)
                process_points+=rubric['points']
                self.db.execute('UPDATE evaluation_work SET lines=?,points=?,checks=? WHERE exercise_id=?',
                                (lines,rubric['points'],json.dumps(rubric['checks']),item['id']))
        self.db.execute('UPDATE evaluations SET finished=?,score=? WHERE id=?',(timestamp(),score,identity))
        metric=f"{score+process_points}/{2*current['total']} puntos" if written else f"{score}/{current['total']}"
        self.log('Evaluación',current['title']+' · '+metric)
        self.fun.event('exam',evaluation=identity,score=score,total=current['total'])
        return self.exam(identity,True)

    def exam_draft(self,identity,exercise_id,answer,work=None):
        row=self.db.execute("""SELECT e.deadline,e.finished FROM evaluations e JOIN evaluation_items i
                              ON i.evaluation_id=e.id WHERE e.id=? AND e.profile_id=? AND i.exercise_id=?""",
                            (identity,self.profile_id,exercise_id)).fetchone()
        if not row or row['finished'] or time.time()>=row['deadline']:
            return False
        if answer is not None:
            self.db.execute('INSERT INTO evaluation_drafts VALUES (?,?) ON CONFLICT(exercise_id) DO UPDATE SET answer=excluded.answer',
                            (exercise_id,clean(answer,450)))
        if work is not None:
            self.db.execute('UPDATE evaluation_work SET lines=? WHERE exercise_id=?',(clean(work,academic.WORK_LIMIT),exercise_id))
        return True

    def notebook(self,args):
        action=args.get('action')
        if action=='list':
            unit=bounded_int(args.get('unit'),1,1,len(LEVELS[2][2]))
            entries=[dict(row) for row in self.db.execute(
                """SELECT id,unit,kind,title,body,payload,updated FROM university_notebook
                   WHERE profile_id=? AND unit=? ORDER BY updated DESC LIMIT 60""",(self.profile_id,unit))]
            for entry in entries:
                entry['payload']=json.loads(entry['payload'])
            return {'course':LEVELS[2][2][unit-1],'entries':entries}
        identity=clean(args.get('id'),32)
        prior=self.db.execute('SELECT * FROM university_notebook WHERE id=? AND profile_id=?',(identity,self.profile_id)).fetchone() if identity else None
        if identity and not prior:
            raise InputError('Esa entrada no pertenece al cuaderno de este perfil.')
        if action=='remove' and prior:
            self.db.execute('DELETE FROM university_notebook WHERE id=? AND profile_id=?',(identity,self.profile_id))
            return {'id':identity,'unit':prior['unit']}
        if action!='save':
            raise InputError('Elige una acción del cuaderno.')
        title=clean(args.get('title'),100)
        unit=bounded_int(args.get('unit'),0,0,len(LEVELS[2][2]))
        if not title or not unit:
            raise InputError('Pon un título y selecciona un curso.')
        kind=prior['kind'] if prior else args.get('kind','note')
        raw=args.get('payload',{})
        if kind=='graph':
            payload=academic.graph_entry(raw if raw else json.loads(prior['payload']) if prior else None)
        elif kind=='exercise':
            source=raw if raw else json.loads(prior['payload']) if prior else {}
            payload={key:clean(source.get(key),600) for key in ('question','problem','result')}
            if not (payload['question'] or payload['problem']):
                raise InputError('Selecciona un ejercicio para guardar.')
        elif kind=='note':
            payload={}
        else:
            raise InputError('Elige un apunte, un ejercicio o una gráfica.')
        if self.db.execute('SELECT COUNT(*) FROM university_notebook WHERE profile_id=? AND unit=?',
                           (self.profile_id,unit)).fetchone()[0]>=60 and (not prior or prior['unit']!=unit):
            raise InputError('Este curso admite hasta 60 entradas. Quita alguna para guardar otra.')
        identity=identity or token()
        self.db.execute("""INSERT INTO university_notebook VALUES (?,?,?,?,?,?,?,?)
                          ON CONFLICT(id) DO UPDATE SET unit=excluded.unit,title=excluded.title,body=excluded.body,
                          payload=excluded.payload,updated=excluded.updated WHERE profile_id=excluded.profile_id""",
                        (identity,self.profile_id,unit,kind,title,clean(args.get('body'),academic.NOTE_LIMIT),
                         json.dumps(payload),timestamp()))
        return {'id':identity,'unit':unit}

    def settings(self,data):
        name=clean(data.get('name'),65) or self.profile()['name']
        difficulty=data.get('difficulty')
        if difficulty not in ('auto',*DIFFICULTIES):
            raise InputError('Elige una dificultad válida.')
        variable=data.get('variable')
        if variable not in ('x','t','y','z'):
            raise InputError('Elige una variable válida.')
        preference=data.get('preference')
        if preference not in ('guiado','directo'):
            raise InputError('Elige un estilo de aprendizaje válido.')
        self.db.execute('UPDATE profiles SET name=?,difficulty=?,preference=?,variable=? WHERE id=?',(name,difficulty,preference,variable,self.profile_id))
        return self.profile()

    def set_demo(self,enabled):
        if self.active_exam():
            raise InputError('Finaliza la evaluación antes de cambiar de perfil.')
        self.db.execute("UPDATE config SET value=? WHERE key='profile'",('2' if enabled else '1',))
        exists=self.db.execute('SELECT 1 FROM exercises WHERE profile_id=2 LIMIT 1').fetchone()
        if enabled and not exists:
            for topic_id in ('conteo','naturales','resta1','patron1'):
                correct_count=1 if topic_id=='patron1' else 2
                for index in range(correct_count):
                    item=self.insert_exercise(exercise_for(topic_id,'fácil',random.Random(topic_id+str(index))),'practice')
                    solved=self.calculate(item)
                    self.db.execute('INSERT INTO responses VALUES (?,?,?,?)',(item['id'],format_value(solved.value),1,timestamp()))
                    self.log('Práctica de ejemplo',TOPICS[topic_id]['name'])
            self.solve({'problem':'2*x + 3 = 9','operation':'equation','variable':'x','argument':''})
            for correct_count in (2,3):
                sample=self.start_exam('level','1',8,3,'fácil')
                answers={item['id']:format_value(self.calculate(item).value)
                         for item in sample['items'][:correct_count]}
                self.submit_exam(sample['id'],answers)
            self.db.execute('UPDATE profiles SET study_seconds=420 WHERE id=2')
        return self.status()

    def note(self,topic_id,note):
        self.get_lesson(topic_id)
        self.db.execute('INSERT INTO lesson_notes VALUES (?,?,?) ON CONFLICT(profile_id,topic_id) DO UPDATE SET body=excluded.body',
                        (self.profile_id,topic_id,clean(note,1500)))
        return self.get_lesson(topic_id)

    def study(self,seconds):
        seconds=bounded_int(seconds,0,0,60)
        self.db.execute('UPDATE profiles SET study_seconds=study_seconds+? WHERE id=?',(seconds,self.profile_id))
        return True

    def teacher(self,topic_id,question):
        text=normalize(question)
        if topic_id not in TOPICS:
            ranked=sorted(TOPICS.values(),key=lambda topic:len(topic['name']),reverse=True)
            picked=next((topic['id'] for topic in ranked if normalize(topic['name']) in text),None)
            if not picked:
                aliases={'fraccion':'fracciones','porcentaje':'porcentajes','ecuacion lineal':'lineales',
                         'ecuacion cuadratica':'cuadraticas','desigualdad':'inecuaciones',
                         'derivada':'derivadas','integral':'integrales','limite':'limites',
                         'matriz':'matrices','determinante':'determinantes','vector':'vectores',
                         'varianza':'estadistica','factorizar':'factor','logaritmo':'logaritmos'}
                picked=next((topic for phrase,topic in aliases.items() if re.search(r'\b'+phrase+r'\b',text)),None)
            topic_id=picked
        if topic_id not in TOPICS:
            expression=re.match(r'^\s*(resuelve|calcula|simplifica|factoriza|deriva|integra)\s+(.+?)\s*[?]?$',
                                str(question),re.I)
            if expression:
                action,problem=expression.groups()
                request={'problem':problem,'operation':{
                    'resuelve':'auto','calcula':'auto','simplifica':'simplify','factoriza':'factor',
                    'deriva':'derivative','integra':'integral'
                }[action.lower()],'variable':self.profile()['variable'],'argument':''}
                solution=self.solve(request,save=False)
                hints=[{'label':'Método','text':solution['explanation']}]
                if solution['steps']:
                    first=solution['steps'][0]
                    hints.append({'label':'Primera pista','text':first['rule']+'. '+first['explanation']})
                self.log('Profesor',problem)
                return {'topic':None,'name':solution['kind'],'hints':hints,'example':with_exercise_formula(request),'solution':solution,
                        'preferred':len(hints)-1 if self.profile()['preference']=='guiado' else 0}
            return {'clarify':True,'message':'Elige un tema o escribe su nombre. Si tienes una expresión, usa el Solucionador.'}
        content=self.get_lesson(topic_id)
        theory=(content['custom'] or {}).get('theory') or content['theory']
        formula=(content['custom'] or {}).get('formula') or content['formula']
        preference=self.profile()['preference']
        hints=[
            {'label':'Concepto','text':theory},
            {'label':'Pista','text':formula},
            {'label':'Ejemplo','text':content['example']['question']+' '+content['example']['problem']}
        ]
        if content['requires']:
            hints.append({'label':'Antes de empezar','text':'Repasa '+', '.join(TOPICS[item]['name'] for item in content['requires'])+'.'})
        self.log('Profesor',content['name'])
        return {'topic':topic_id,'name':content['name'],'theory':theory,'formula':formula,'hints':hints,'example':content['example'],
                'solution':self.solve(content['example'],save=False),'preferred':1 if preference=='guiado' else 0}

    def validate_steps(self,lines,variable='x'):
        lines=[line.strip() for line in str(lines).splitlines() if line.strip()]
        if not 2<=len(lines)<=8:
            raise InputError('Escribe de 2 a 8 líneas. La primera debe ser el problema original.')
        first=lines[0]
        equation=bool(RELATION.search(first))
        expected=solve_problem(first,'auto',variable).value if equation else ExpressionParser(first).scalar()
        checks=[]
        for index,line in enumerate(lines[1:],2):
            try:
                candidate=solve_problem(line,'auto',variable).value if equation and RELATION.search(line) else ExpressionParser(line).scalar()
                equivalent=ResultValidator.equivalent(expected,candidate)
                text=('Conserva el conjunto de soluciones.' if equation else 'Es equivalente a la expresión inicial.') if equivalent else (
                    'Este paso cambia el conjunto solución. Aplica la misma operación a ambos miembros.' if equation else
                    'El resultado de esta línea no es equivalente al original. Revisa signos, factores y paréntesis.')
            except (InputError,ValueError,TypeError,NotImplementedError) as error:
                equivalent=False
                text='Revisa el formato de esta línea. '+str(error)
            checks.append({'line':index,'input':line,'ok':equivalent,'message':text})
            if not equivalent:
                break
        return {'checks':checks,'solution':solve_problem(first,'auto',variable).as_dict()}

    def backup(self,target):
        target=Path(target).resolve()
        if target==self.filename:
            raise InputError('Elige un archivo distinto a la base activa.')
        temp=target.with_name(target.name+'.'+token()+'.tmp')
        try:
            self.db.commit()
            with closing(sqlite3.connect(temp)) as copy:
                self.db.backup(copy)
            os.replace(temp,target)
        finally:
            temp.unlink(missing_ok=True)
        return True

    def restore(self,source):
        source=Path(source).resolve()
        if source==self.filename:
            raise InputError('Selecciona un archivo de respaldo distinto.')
        if not source.is_file() or source.stat().st_size>64*1024*1024:
            raise InputError('Selecciona un respaldo de MathPath de hasta 64 MB.')
        try:
            copy=sqlite3.connect(source.as_uri()+'?mode=ro',uri=True)
            copy.execute('PRAGMA trusted_schema=OFF')
            tables={row[0] for row in copy.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            expected={row[0] for row in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            if (copy.execute('PRAGMA user_version').fetchone()[0]!=SCHEMA_VERSION
                    or not (expected-OPTIONAL_TABLES)<=tables<=expected
                    or copy.execute('PRAGMA integrity_check').fetchone()[0]!='ok'):
                raise InputError('El archivo no es un respaldo íntegro de esta versión de MathPath.')
            for table in ('profiles','config','topics'):
                if not copy.execute(f'SELECT 1 FROM {table} LIMIT 1').fetchone():
                    raise InputError('Faltan datos en el respaldo.')
            self.db.commit()
            copy.backup(self.db)
        except sqlite3.DatabaseError as error:
            raise InputError('No se pudo leer un respaldo válido de MathPath.') from error
        finally:
            if 'copy' in locals():
                copy.close()
        self.db.executescript(SCHEMA)
        with self.db:
            self.seed_catalog()
            self.fun=game.FunService(self)
        return self.status()


