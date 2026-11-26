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
import academicajch as academic
import adventureajch as combat
from adventureajch import ADVENTURE_SECONDS, FIRST_GRADE_BOSS, FIRST_GRADE_TOPICS
import funajch as game
import storyajch as story
from curriculumajch import TOPICS, LEVELS, DIFFICULTIES, exercise_for_ajch, lesson_ajch
from engineajch import (AbelInputError, AbelExpressionParser, OPERATIONS, AbelResultValidator, RELATION, AbelStepGenerator, display_math_ajch,
                    exercise_formula_ajch, format_value_ajch, math_preview_ajch, solve_problem_ajch, verify_answer_ajch, feedback_for_ajch)

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


def token_ajch():
    return uuid.uuid4().hex


def normalize(text):
    return ''.join(ch for ch in unicodedata.normalize('NFD',str(text).casefold()) if unicodedata.category(ch)!='Mn')


def clean_ajch(value,limit):
    return str(value or '').strip()[:limit]


def with_exercise_formula_ajch(item):
    return {**item, 'problemFormula': exercise_formula_ajch(item)}


def bounded_int_ajch(value,default,minimum,maximum):
    try:
        return min(max(int(value),minimum),maximum)
    except (ValueError,TypeError):
        return default


class AbelLearningService:
    def __init__(self,filename):
        self.filename=Path(filename).resolve()
        self.filename.parent.mkdir(parents=True,exist_ok=True)
        self.db=sqlite3.connect(self.filename)
        self.db.row_factory=sqlite3.Row
        self.db.execute('PRAGMA trusted_schema=OFF')
        version=self.db.execute('PRAGMA user_version').fetchone()[0]
        if version not in (0,SCHEMA_VERSION):
            raise AbelInputError('La base local corresponde a otra versión de MathPath.')
        self.db.executescript(SCHEMA)
        self.db.execute(f'PRAGMA user_version={SCHEMA_VERSION}')
        self.seed_catalog_ajch()
        self.fun=game.AbelFunService(self)
        self.db.commit()

    def seed_catalog_ajch(self):
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
                            DO UPDATE SET body=excluded.body""",(topic_id,json.dumps(lesson_ajch(topic_id),ensure_ascii=False)))
        for boss in story.GRADE_BOSSES:
            self.db.execute('INSERT OR IGNORE INTO topics VALUES (?,?,?,?)',(boss['id'],boss['level'],boss['unit'],boss['name']))
        self.db.execute('DELETE FROM prerequisites')
        for topic_id,topic in TOPICS.items():
            self.db.executemany('INSERT INTO prerequisites VALUES (?,?)',((topic_id,prior) for prior in topic['requires']))
        self.db.execute('DELETE FROM units WHERE level_id>?',(len(LEVELS),))
        self.db.execute('DELETE FROM levels WHERE id>?',(len(LEVELS),))

    @property
    def profile_id_ajch(self):
        return int(self.db.execute("SELECT value FROM config WHERE key='profile'").fetchone()[0])

    def profile_ajch(self):
        return dict(self.db.execute('SELECT name,preference,difficulty,variable,study_seconds FROM profiles WHERE id=?',(self.profile_id_ajch,)).fetchone())

    def log(self,kind,title):
        self.db.execute('INSERT INTO activities(profile_id,kind,title,created) VALUES (?,?,?,?)',(self.profile_id_ajch,kind,title,timestamp()))

    def solved_rows_ajch(self):
        return [{'id':row['id'],'date':row['created'],'solution':json.loads(row['result']),'request':json.loads(row['request'])}
                for row in self.db.execute('SELECT * FROM solved WHERE profile_id=? ORDER BY created DESC LIMIT 30',(self.profile_id_ajch,))]

    def attempts_ajch(self):
        rows=self.db.execute("""SELECT e.topic_id,e.body,r.correct,r.created FROM responses r
                               JOIN exercises e ON e.id=r.exercise_id
                               WHERE e.profile_id=? AND (e.purpose IN ('practice','exam','survival','daily') OR
                                   (e.purpose='adventure' AND EXISTS (
                                       SELECT 1 FROM adventure_wins w
                                       WHERE w.profile_id=e.profile_id AND w.topic_id=e.topic_id)))
                               ORDER BY r.created DESC""",(self.profile_id_ajch,)).fetchall()
        return [row for row in rows if row['topic_id'] in TOPICS]

    def topic_scores_ajch(self,attempts_ajch=None):
        records=self.attempts_ajch() if attempts_ajch is None else attempts_ajch
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

    def mastery_ajch(self,attempts_ajch=None):
        return {topic_id for topic_id,score in self.topic_scores_ajch(attempts_ajch).items() if score==2}

    def university_progress_ajch(self, mastered=None):
        mastered=self.mastery_ajch() if mastered is None else mastered
        rows=self.db.execute('''SELECT e.topic_id,r.correct,r.created FROM responses r
                               JOIN exercises e ON e.id=r.exercise_id JOIN topics t ON t.id=e.topic_id
                               WHERE e.profile_id=? AND t.level_id=3 AND
                                   e.purpose IN ('practice','guided','exam','daily','survival')
                               ORDER BY r.created DESC''',(self.profile_id_ajch,)).fetchall()
        by_topic={topic_id:[] for topic_id,topic in TOPICS.items() if topic['level']==3}
        for row in rows:
            if row['topic_id'] in by_topic:
                by_topic[row['topic_id']].append(row)

        def metrics_ajch(records):
            recent=records[:6]
            correct=sum(row['correct'] for row in records)
            return {'attempts':len(records),'correct':correct,
                    'accuracy':round(100*correct/len(records)) if records else None,
                    'recentAttempts':len(recent),
                    'recentAccuracy':round(100*sum(row['correct'] for row in recent)/len(recent)) if recent else None}

        topics=[]
        for topic_id,records in by_topic.items():
            topic=TOPICS[topic_id]
            score=metrics_ajch(records)
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
            courses.append({'unit':unit,'name':name,**metrics_ajch(course_rows),
                            'mastered':sum(item['mastered'] for item in members),'total':len(members),
                            'needsReview':sum(item['status']=='review' for item in members)})
        strengths=sorted((item for item in topics if item['recentAttempts']>=2 and item['recentAccuracy']>=80),
                         key=lambda item:(not item['mastered'],-item['recentAccuracy'],-item['recentAttempts']))[:6]
        needs_practice=sorted((item for item in topics if item['status']=='review'),
                              key=lambda item:(item['recentAccuracy'],-item['recentAttempts']))[:6]
        return {**metrics_ajch(rows),'recentWindow':6,'mastered':sum(item['mastered'] for item in topics),
                'total':len(topics),'topics':topics,'courses':courses,
                'strengths':strengths,'needsPractice':needs_practice}

    def status_ajch(self):
        profile_ajch=self.profile_ajch()
        attempts_ajch=self.attempts_ajch()
        correct=sum(row['correct'] for row in attempts_ajch)
        scores_by_topic=self.topic_scores_ajch(attempts_ajch)
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
            scores=[row['correct'] for row in attempts_ajch if TOPICS[row['topic_id']]['level']==index]
            levels.append({'id':index,'title':title,'description':description,'units':units,'mastered':completed,'total':len(area),
                           'accuracy':round(100*sum(scores)/len(scores)) if scores else None})
        evaluations=self.exam_history_ajch()
        recent=[dict(row) for row in self.db.execute('SELECT kind,title,created FROM activities WHERE profile_id=? ORDER BY id DESC LIMIT 8',(self.profile_id_ajch,))]
        failed=sum(1 for row in self.db.execute("""SELECT e.topic_id FROM responses r JOIN exercises e ON r.exercise_id=e.id
                                WHERE e.profile_id=? AND e.purpose='practice' AND r.correct=0""",(self.profile_id_ajch,))
                   if row['topic_id'] in TOPICS)
        suggested=next((topic['id'] for topic in topics if not topic['mastered'] and not topic['missing']),None)
        adventure=self.adventure_status_ajch()
        return {'profile':profile_ajch,'demo':self.profile_id_ajch==2,'topics':topics,'levels':levels,'recent':recent,
                'adventure':adventure,'adventureGuide':combat.GUIDE,'village':self.village_state_ajch(adventure['wins']),
                'firstGradeBoss':FIRST_GRADE_BOSS|{'health':combat.DRAGON['hearts'],'secondUnlocked':self.second_grade_unlocked_ajch()},
                'mastered':len(mastered),'total':len(topics),'attempts':len(attempts_ajch),'correct':correct,'failed':failed,'recommended':suggested,
                'accuracy':round(100*correct/len(attempts_ajch)) if attempts_ajch else None,
                'exams':evaluations,'currentLevel':TOPICS[suggested]['level'] if suggested else len(LEVELS),
                'fun':self.fun.summary_ajch(),'funGuide':self.fun.guide_ajch(),
                'gradeBosses':self.grade_bosses_ajch(mastered,adventure['wins']),
                'storyEndings':{'1':story.PRIMARY_EPILOGUE,'2':story.SECONDARY_EPILOGUE},
                'gradeRivals':{key:value for key,value in combat.GRADE_RIVALS.items()},
                'universityProgress':self.university_progress_ajch(mastered),
                'operations':OPERATIONS,'procedureCourses':sorted({topic['unit'] for topic in TOPICS.values()
                    if topic['level']==3 and topic['operation'] in academic.PROCEDURE_OPERATIONS})}

    def get_lesson_ajch(self,topic_id,record=False):
        if topic_id not in TOPICS:
            raise AbelInputError('Selecciona un tema del catálogo.')
        data=json.loads(self.db.execute('SELECT body FROM lessons WHERE topic_id=?',(topic_id,)).fetchone()[0])
        data['example']=with_exercise_formula_ajch(data['example'])
        note_ajch=self.db.execute('SELECT body FROM lesson_notes WHERE profile_id=? AND topic_id=?',(self.profile_id_ajch,topic_id)).fetchone()
        data['note']=note_ajch[0] if note_ajch else ''
        customization=self.db.execute('SELECT theory,formula FROM lesson_content WHERE profile_id=? AND topic_id=?',
                                      (self.profile_id_ajch,topic_id)).fetchone()
        data['custom']=dict(customization) if customization else None
        if record:
            self.log('Lección',data['name'])
        return data

    def require_unlocked_ajch(self,topic_id):
        if topic_id not in TOPICS:
            raise AbelInputError('Selecciona un tema válido.')
        mastered=self.mastery_ajch()
        missing=[TOPICS[item]['name'] for item in TOPICS[topic_id]['requires'] if item not in mastered]
        if missing and topic_id not in mastered:
            raise AbelInputError('Domina primero: '+', '.join(missing)+'.')

    def effective_difficulty_ajch(self,requested='auto',topic_id=None):
        if requested in DIFFICULTIES:
            return requested
        configured=self.profile_ajch()['difficulty']
        if configured in DIFFICULTIES:
            return configured
        attempts_ajch=[row['correct'] for row in self.attempts_ajch() if not topic_id or row['topic_id']==topic_id][:6]
        if len(attempts_ajch)<3:
            return 'fácil'
        accuracy=sum(attempts_ajch)/len(attempts_ajch)
        return 'avanzado' if len(attempts_ajch)>=5 and accuracy>=.85 else 'intermedio' if accuracy>=.60 else 'fácil'

    def insert_exercise_ajch(self,item,purpose):
        identity=token_ajch()
        self.db.execute('INSERT INTO exercises VALUES (?,?,?,?,?,?)',(identity,self.profile_id_ajch,item['topic'],json.dumps(item),purpose,timestamp()))
        return with_exercise_formula_ajch({'id':identity,**item,'purpose':purpose})

    def adventure_status_ajch(self):
        wins=[row['topic_id'] for row in self.db.execute(
            'SELECT topic_id FROM adventure_wins WHERE profile_id=?',(self.profile_id_ajch,))]
        pack=self.db.execute('SELECT hints,shields FROM adventure_inventory WHERE profile_id=?',(self.profile_id_ajch,)).fetchone()
        return {'wins':wins,**(dict(pack) if pack else {'hints':0,'shields':0})}

    def village_ledger_ajch(self, wins):
        row=self.db.execute('SELECT body FROM adventure_gear WHERE profile_id=?',(self.profile_id_ajch,)).fetchone()
        gear=json.loads(row['body']) if row else {
            'stock':dict.fromkeys(combat.RESOURCES,0), 'owned':[], 'equipped':{}, 'potions':0, 'credited':[]
        }
        credited=set(gear['credited'])
        for topic_id in wins:
            if topic_id not in credited:
                for resource,quantity in combat.loot_for_ajch(topic_id).items():
                    gear['stock'][resource]+=quantity
                gear['credited'].append(topic_id)
        return gear

    @staticmethod
    def village_view_ajch(gear):
        return {key:gear[key] for key in ('stock','owned','equipped','potions')}|{'bonuses':combat.equipment_ajch(gear['equipped'])}

    def village_state_ajch(self, wins):
        return self.village_view_ajch(self.village_ledger_ajch(wins))

    def save_gear_ajch(self, gear):
        self.db.execute("""INSERT INTO adventure_gear VALUES (?,?)
                          ON CONFLICT(profile_id) DO UPDATE SET body=excluded.body""",
                        (self.profile_id_ajch,json.dumps(gear)))

    def village_ajch(self, payload):
        action=payload.get('action')
        if action=='status':
            return self.village_state_ajch(self.adventure_status_ajch()['wins'])
        item_id=payload.get('item')
        item=combat.ITEMS.get(item_id)
        if not item or action not in {'craft','equip'}:
            raise AbelInputError('Elige una mejora de la aldea.')
        if not self.db.in_transaction:
            self.db.execute('BEGIN IMMEDIATE')
        gear=self.village_ledger_ajch(self.adventure_status_ajch()['wins'])
        slot=item['slot']
        if action=='craft':
            if item_id in gear['owned']:
                raise AbelInputError('Ya fabricaste esta pieza. Puedes equiparla en el taller.')
            if any(gear['stock'][key]<amount for key,amount in item['cost'].items()):
                raise AbelInputError('Te faltan monedas o materiales para fabricar esta pieza.')
            for key,amount in item['cost'].items():
                gear['stock'][key]-=amount
            if slot=='supply':
                gear['potions']+=1
            else:
                gear['owned'].append(item_id)
        if slot!='supply' and item_id in gear['owned']:
            gear['equipped'][slot]=item_id
        elif action=='equip':
            raise AbelInputError('Primero fabrica esta pieza.')
        self.save_gear_ajch(gear)
        return self.village_view_ajch(gear)

    def grade_unlocked_ajch(self, level, unit):
        if unit <= 1:
            return True
        if unit <= int(self.fun.load().get('placement', {}).get(str(level), 0)):
            return True
        if (level, unit) == (1, 2):
            return self.second_grade_unlocked_ajch()
        previous = story.GRADE_BOSS_BY_GRADE[(level, unit-1)]['id']
        profile_id_ajch = self.profile_id_ajch
        return self.db.execute("""SELECT 1 FROM adventure_wins WHERE profile_id=? AND topic_id=?
                                  UNION ALL
                                  SELECT 1 FROM adventure_battles b JOIN topics t ON t.id=b.topic_id
                                  WHERE b.profile_id=? AND t.level_id=? AND t.unit=? AND b.topic_id NOT LIKE 'jefe-%' LIMIT 1""",
                               (profile_id_ajch,previous,profile_id_ajch,level,unit)).fetchone() is not None

    def grade_bosses_ajch(self, mastered=None, wins=None):
        mastered = self.mastery_ajch() if mastered is None else mastered
        wins = set(self.adventure_status_ajch()['wins'] if wins is None else wins)
        result = []
        for boss in story.GRADE_BOSSES:
            members = combat.grade_topics_ajch(boss['level'], boss['unit'])
            rival = combat.GRADE_RIVALS[boss['id']]
            result.append({key: boss[key] for key in ('id','level','unit','name','title','location','effect','chapter',
                                                       'intro','victory','final','story')} |
                          {'enemy': rival['id'], 'health': rival['hearts'], 'won': boss['id'] in wins,
                           'ready': set(members) <= mastered, 'unlocked': self.grade_unlocked_ajch(boss['level'], boss['unit']),
                           'missions': len(members), 'questions': min(8, len(members))})
        return result

    def second_grade_unlocked_ajch(self):
        profile_id_ajch=self.profile_id_ajch
        return self.db.execute("""SELECT 1 FROM adventure_wins WHERE profile_id=? AND topic_id=?
                                  UNION ALL
                                  SELECT 1 FROM adventure_battles b JOIN topics t ON t.id=b.topic_id
                                  WHERE b.profile_id=? AND t.level_id=1 AND t.unit=2 LIMIT 1""",
                               (profile_id_ajch,FIRST_GRADE_BOSS['id'],profile_id_ajch)).fetchone() is not None

    def adventure_question_ajch(self, item, battle, rival):
        boss=bool(battle.get('topics'))
        barrier=battle['studyHits']==1 and not battle['barrierBroken']
        if boss:
            order=battle['topics']
            source=order[battle['studyHits']%len(order)]
        else:
            source='resta1' if item['id']=='naturales' and battle['studyHits']%2 else item['id']
        exercise_topic=source if boss else item['id']
        difficulty='fácil' if barrier else self.effective_difficulty_ajch('auto',exercise_topic)
        seen=battle['seen'][-1:]
        if not (boss or barrier) and battle['studyHits']<2:
            seen=seen+battle['correctKeys']
        used={tuple(key) for key in seen}
        for _ in range(40):
            exercise=combat.tactics_exercise_ajch(item) if barrier else exercise_for_ajch(source,difficulty)
            key=(exercise['problem'],exercise['argument'])
            if barrier or boss:
                key=('barrier' if barrier else source,*key)
            if key not in used:
                break
        else:
            raise AbelInputError('No salió un reto distinto. Inténtalo nuevamente.')
        exercise.update(topic=exercise_topic,hintTopic=source)
        if source in {'naturales','resta1'} and not barrier:
            exercise.update(question='¿Cuánto da esta operación?',showExpression=True)
        if not barrier:
            self.add_number_choices_ajch(exercise,TOPICS[exercise_topic])
        purpose='tactic' if barrier else 'boss' if boss else 'adventure'
        turn=self.insert_exercise_ajch(exercise,purpose)
        seconds=combat.boss_seconds_ajch(exercise,battle,rival) if rival.get('gradeBoss') else None
        combat.open_round_ajch(battle,rival,turn['id'],seconds)
        battle['seen']=(battle['seen']+[key])[-16:]

    def reward_adventure_ajch(self, topic_id, battle):
        won=self.db.execute('INSERT OR IGNORE INTO adventure_wins VALUES (?,?)',(self.profile_id_ajch,topic_id)).rowcount
        battle['reward']=bool(won)
        if won:
            self.db.execute("""INSERT INTO adventure_inventory VALUES (?,1,1)
                              ON CONFLICT(profile_id) DO UPDATE SET hints=hints+1,shields=shields+1""",
                            (self.profile_id_ajch,))
            battle['loot']=combat.loot_for_ajch(topic_id)
        else:
            gear=self.village_ledger_ajch(self.adventure_status_ajch()['wins'])
            battle['loot']=combat.replay_loot_ajch(topic_id)
            for resource,quantity in battle['loot'].items():
                gear['stock'][resource]+=quantity
            self.save_gear_ajch(gear)

    def adventure(self, payload):
        topic_id=payload.get('topic')
        world=combat.is_world_boss_ajch(topic_id)
        chapter_boss=story.GRADE_BOSS_BY_ID.get(topic_id)
        boss=bool(chapter_boss) or world
        item=game.WORLD_BOSSES.get(topic_id) if world else chapter_boss if chapter_boss else TOPICS.get(topic_id)
        if not item or item['level']>=3:
            raise AbelInputError('Elige una misión de Primaria o Secundaria.')
        rival=combat.rival_for_ajch(topic_id)
        if not self.db.in_transaction:
            self.db.execute('BEGIN IMMEDIATE')
        row=self.db.execute('SELECT body FROM adventure_battles WHERE profile_id=? AND topic_id=?',
                            (self.profile_id_ajch,topic_id)).fetchone()
        battle=json.loads(row['body']) if row else None
        if battle:
            combat.update_saved_battle_ajch(battle,rival)
        action=payload.get('action')
        grade_ajch=None
        if action in {'start','restart'}:
            if world:
                boss_topics=list(item['topics'])
                if not set(boss_topics)<=self.mastery_ajch():
                    raise AbelInputError('Completa las tres misiones de este mundo para desafiar a su rey.')
            elif chapter_boss:
                members=combat.grade_topics_ajch(item['level'],item['unit'])
                if not self.grade_unlocked_ajch(item['level'],item['unit']):
                    raise AbelInputError('Este capítulo aún no empieza. Vence primero al jefe del grado anterior.')
                if not set(members)<=self.mastery_ajch():
                    raise AbelInputError('Completa todas las misiones del grado para desafiar a '+item['name']+'.')
                boss_topics=random.sample(members,min(8,len(members)))
            else:
                if not self.grade_unlocked_ajch(item['level'],item['unit']):
                    previous=story.GRADE_BOSS_BY_GRADE[(item['level'],item['unit']-1)]
                    raise AbelInputError('Vence a '+previous['name']+' para jugar los duelos de este grado.')
                self.require_unlocked_ajch(topic_id)
            if not battle or action=='restart' and (battle['hero']==0 or battle['rival']==0):
                gear=self.village_ledger_ajch(self.adventure_status_ajch()['wins'])
                fun_state=self.fun.load()
                pet=self.fun.pet_info_ajch(fun_state)
                battle=combat.begin_battle_ajch(rival,gear['equipped'],self.fun.skill_bonus_ajch(fun_state),pet['ward'] if pet else 0)
                battle['petHint']=bool(pet and pet['freeHint'])
                if boss:
                    battle['topics']=random.sample(boss_topics,len(boss_topics))
                self.adventure_question_ajch(item,battle,rival)
        elif not battle or payload.get('turn')!=battle['turn']:
            raise AbelInputError('Vuelve a abrir la misión para recuperar el turno actual.')

        now=time.time()
        if not battle['event'] and now>=battle.setdefault('deadline',now+ADVENTURE_SECONDS):
            battle['timedOut']=True
            combat.counter(battle)
            self.db.execute('INSERT OR IGNORE INTO responses VALUES (?,?,?,?)',
                            (battle['turn'],'',0,timestamp()))
        elif action=='next' and battle['event'] and battle['hero'] and battle['rival']:
            battle['event']=''
            self.adventure_question_ajch(item,battle,rival)
        elif action=='answer' and not battle['event']:
            grade_ajch=self.grade_ajch(battle['turn'],payload.get('answer'),in_battle=True)
            if not grade_ajch['invalid']:
                if grade_ajch['correct']:
                    combat.strike_ajch(battle,self.exercise(battle['turn']),boss)
                    if battle['impact'].get('crit'):
                        self.fun.event('crit',topic=topic_id)
                    if battle['impact'].get('combo'):
                        self.fun.event('combo',topic=topic_id)
                    if battle['rival']==0:
                        self.reward_adventure_ajch(topic_id,battle)
                        self.fun.event('win',boss=boss,topic=topic_id)
                else:
                    combat.counter(battle)
        elif action=='move' and not battle['event']:
            combat.choose_attack_ajch(battle,payload.get('move'))
        elif action=='pet-hint' and not battle['event']:
            if not battle.get('petHint') or battle['usedHint']:
                raise AbelInputError('Tu mascota ya te dio su pista en este duelo.')
            battle.update(petHint=False,usedHint=True)
        elif action in {'hint','shield'} and not battle['event']:
            column, flag=('hints','usedHint') if action=='hint' else ('shields','shielded')
            if not battle[flag]:
                spent=self.db.execute(f'UPDATE adventure_inventory SET {column}={column}-1 WHERE profile_id=? AND {column}>0',
                                      (self.profile_id_ajch,)).rowcount
                if not spent:
                    raise AbelInputError('Gana un duelo nuevo para conseguir más ayudas.')
                battle[flag]=True
        elif action=='potion' and not (battle['event'] or battle['usedPotion']):
            gear=self.village_ledger_ajch(self.adventure_status_ajch()['wins'])
            if battle['hero']==battle['heroTotal'] or gear['potions']<=0:
                raise AbelInputError('La poción requiere que te falten corazones y tengas una en el morral.')
            gear['potions']-=1
            restore_ajch=combat.ITEMS['healing-potion']['heal']
            battle.update(hero=min(battle['heroTotal'],battle['hero']+restore_ajch),usedPotion=True)
            self.save_gear_ajch(gear)

        self.db.execute("""INSERT INTO adventure_battles VALUES (?,?,?)
                          ON CONFLICT(profile_id,topic_id) DO UPDATE SET body=excluded.body""",
                        (self.profile_id_ajch,topic_id,json.dumps(battle)))
        turn=self.exercise(battle['turn'])
        if battle.get('timedOut'):
            grade_ajch={'correct':False,'invalid':False,
                   'feedback':{'type':'Tiempo agotado','message':'Se acabó el tiempo para responder.','answer':''},
                   'solution':self.calculate_ajch(turn).as_dict()}
        elif battle['event'] and not grade_ajch:
            answer=self.db.execute('SELECT answer FROM responses WHERE exercise_id=?',(turn['id'],)).fetchone()
            grade_ajch=self.mark_ajch(turn,answer['answer'])
        inventory=self.adventure_status_ajch()
        visible={key:battle[key] for key in ('hero','heroTotal','rival','rivalTotal','shielded',
            'event','deadline','turnSeconds','ward','streak','threat','equipped','usedPotion',
            'heroMove','energy','heroGuard','weaponStyle',
            'comboEvery','comboProgress','comboStage','comboNext','comboBonusNext','comboHitsNext')}|{'petHint':battle.get('petHint',False),
            'crits':battle.get('crits',0),'combos':battle.get('combos',0)}
        return visible|{'target':topic_id,'exercise':turn,'grade':grade_ajch,
                'heroPower':battle['gear']['power']+(battle['gear']['combo'] if battle['streak']>=1 else 0),
                'reward':battle.get('reward',False),'timedOut':battle.get('timedOut',False),
                'impact':battle.get('impact',{}),'loot':battle.get('loot',{}),
                'hint':self.hint_ajch(turn['id'],in_battle=True) if battle['usedHint'] else None,
                'inventory':inventory,'village':self.village_state_ajch(inventory['wins'])}

    def add_number_choices_ajch(self,item,topic):
        if topic['level']==1 and topic['unit']<=2:
            answer=self.calculate_ajch(item).value
            if isinstance(answer,s.Integer):
                step=10 if answer>=30 else 1
                start=max(0,int(answer)-step)
                item['choices']=[start+offset*step for offset in range(4)]
                random.shuffle(item['choices'])

    def practice_ajch(self,topic_id,difficulty,guided=False):
        self.require_unlocked_ajch(topic_id)
        rank=self.effective_difficulty_ajch(difficulty,topic_id)
        recent={(item['problem'],item['argument']) for row in self.attempts_ajch() if row['topic_id']==topic_id and row['correct']
                for item in [json.loads(row['body'])]}
        for _ in range(14):
            item=exercise_for_ajch(topic_id,rank)
            if (item['problem'],item['argument']) not in recent:
                break
        if not guided:
            self.add_number_choices_ajch(item,TOPICS[topic_id])
        return self.insert_exercise_ajch(item,'guided' if guided else 'practice')

    def exercise(self,identity):
        row=self.db.execute('SELECT * FROM exercises WHERE id=? AND profile_id=?',(identity,self.profile_id_ajch)).fetchone()
        if not row:
            raise AbelInputError('Ese ejercicio ya no pertenece al perfil activo.')
        return with_exercise_formula_ajch({'id':identity,**json.loads(row['body']),'purpose':row['purpose']})

    def calculate_ajch(self,request):
        result=solve_problem_ajch(request['problem'],request.get('operation','auto'),request.get('variable','x'),request.get('argument',''))
        visual=request.get('visual')
        if visual and request.get('topic') in {'conteo','lados'} and isinstance(result.value,s.Integer):
            title, instruction = {
                'conteo':('Cuenta una por una','Señala cada estrella al decir un número. El último número es el total.'),
                'lados':('Recorre el borde','Empieza en una esquina y cuenta cada línea hasta volver al punto de partida.')
            }[request['topic']]
            sequence=', '.join(map(str,range(1,min(int(result.value),30)+1)))
            result.steps=[AbelStepGenerator.step(title,instruction,text=sequence)]
        return result

    def solve(self,request,save=True):
        solution=self.calculate_ajch(request).as_dict()
        if save:
            self.db.execute('INSERT INTO solved VALUES (?,?,?,?,?)',(token_ajch(),self.profile_id_ajch,json.dumps(solution),json.dumps(request),timestamp()))
            self.log('Solucionador',solution['problem'])
        return solution

    def hint_ajch(self,identity,in_battle=False):
        item=self.exercise(identity)
        if item['purpose']=='exam':
            raise AbelInputError('Las evaluaciones muestran la corrección al finalizar.')
        if item['purpose'] in {'adventure','boss','tactic'} and not in_battle:
            raise AbelInputError('Usa una pista desde el duelo.')
        if item.get('tactic'):
            return {'rule':'Romper la barrera','explanation':item['tactic']['hint']}
        topic=TOPICS[item.get('hintTopic',item['topic'])]
        return {'rule':topic['formula'],'explanation':topic['theory']}

    def mark_ajch(self,item,answer):
        solution=self.calculate_ajch(item)
        try:
            correct=verify_answer_ajch(answer,solution,item['operation'],item['variable'],item['argument'])
        except (AbelInputError,ValueError,TypeError,NotImplementedError) as error:
            return {'correct':False,'invalid':True,'feedback':{'type':'Formato','message':str(error),'answer':answer},'solution':solution.as_dict()}
        return {'correct':correct,'invalid':False,'feedback':feedback_for_ajch(answer,solution,correct),'solution':solution.as_dict()}

    def grade_ajch(self,identity,answer,in_battle=False):
        item=self.exercise(identity)
        if item['purpose']=='exam':
            raise AbelInputError('Envía las respuestas desde la evaluación.')
        if item['purpose'] in {'adventure','boss','tactic'} and not in_battle:
            raise AbelInputError('Responde desde el duelo.')
        answer=clean_ajch(answer,450)
        previous=self.db.execute('SELECT * FROM responses WHERE exercise_id=?',(identity,)).fetchone()
        if previous:
            return self.mark_ajch(item,previous['answer'])
        result=self.mark_ajch(item,answer)
        if not result['invalid']:
            self.db.execute('INSERT INTO responses VALUES (?,?,?,?)',(identity,answer,int(result['correct']),timestamp()))
            title={'guided':'Práctica guiada','adventure':'Duelo medieval','boss':'Jefe final','tactic':'Reto de barrera',
                   'daily':'Reto del día','survival':'Supervivencia'}.get(item['purpose'],'Práctica')
            self.log(title,TOPICS[item['topic']]['name'])
            if item['purpose']!='tactic':
                self.fun.event('answer',correct=result['correct'],purpose=item['purpose'],exercise=identity)
        return result

    def retry_failed_ajch(self):
        mastered=self.mastery_ajch()
        rows=self.db.execute("""SELECT e.body,e.topic_id FROM responses r JOIN exercises e ON e.id=r.exercise_id
                                WHERE e.profile_id=? AND e.purpose='practice'
                                GROUP BY e.topic_id,e.body HAVING MAX(r.correct)=0 ORDER BY MAX(r.created) DESC""",(self.profile_id_ajch,))
        for row in rows:
            if row['topic_id'] in TOPICS and all(prior in mastered for prior in TOPICS[row['topic_id']]['requires']):
                return self.insert_exercise_ajch(json.loads(row['body']),'practice')
        raise AbelInputError('No tienes ejercicios independientes fallados pendientes de repetir.')

    def exam_history_ajch(self):
        rows=self.db.execute("""SELECT e.*,
                 CASE WHEN COUNT(w.exercise_id)>0 THEN e.score+COALESCE(SUM(w.points),0) END AS points,
                 CASE WHEN COUNT(w.exercise_id)>0 THEN 2*e.total END AS maxPoints
                 FROM evaluations e JOIN evaluation_items i ON i.evaluation_id=e.id
                 LEFT JOIN evaluation_work w ON w.exercise_id=i.exercise_id
                 WHERE e.profile_id=? AND e.finished IS NOT NULL
                 GROUP BY e.id ORDER BY e.finished DESC LIMIT 30""",(self.profile_id_ajch,))
        return [dict(row) for row in rows]

    def exam_ajch(self,identity,include_results=False):
        row=self.db.execute('SELECT * FROM evaluations WHERE id=? AND profile_id=?',(identity,self.profile_id_ajch)).fetchone()
        if not row:
            raise AbelInputError('Selecciona una evaluación de tu perfil.')
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
            result['review']=[self.mark_ajch(item,entry['answer']) if entry['answer'] else
                              {'correct':False,'feedback':{'type':'Sin respuesta','message':'Compara el procedimiento y practica de nuevo.'},'solution':self.calculate_ajch(item).as_dict()}
                              for item,entry in zip(result['items'],entries)]
            for grade_ajch,entry in zip(result['review'],entries):
                grade_ajch['answer']=entry['answer'] or ''
            for item,grade_ajch in zip(result['items'],result['review']):
                entry=work.get(item['id'])
                if entry:
                    grade_ajch['procedure']={'lines':entry['lines'],'points':entry['points'] or 0,
                                        'checks':json.loads(entry['checks'])}
        return result

    def active_exam_ajch(self):
        row=self.db.execute('SELECT id FROM evaluations WHERE profile_id=? AND finished IS NULL ORDER BY created DESC LIMIT 1',(self.profile_id_ajch,)).fetchone()
        if not row:
            return None
        result=self.exam_ajch(row['id'])
        if time.time()>=result['deadline']:
            self.submit_exam_ajch(result['id'],{})
            return None
        return result

    def start_exam_ajch(self,scope,scope_id,minutes,count,difficulty,topic_ids=None):
        active=self.active_exam_ajch()
        if active:
            return active
        master=self.mastery_ajch()
        allowed=[topic for topic in TOPICS.values() if topic['id'] in master or all(prior in master for prior in topic['requires'])]
        count=bounded_int_ajch(count,5,3,12)
        if scope=='procedure':
            allowed=[topic for topic in allowed if topic['level']==3 and topic['operation'] in academic.PROCEDURE_OPERATIONS]
            title='Universitaria · procedimiento'
            if scope_id:
                if str(scope_id) not in {str(index) for index in range(1,len(LEVELS[2][2])+1)}:
                    raise AbelInputError('Elige un curso universitario válido.')
                number=int(scope_id)
                allowed=[topic for topic in allowed if topic['unit']==number]
                title=LEVELS[2][2][number-1]+' · procedimiento'
        elif scope=='topics':
            if not isinstance(topic_ids,list) or not topic_ids or any(not isinstance(id_,str) or id_ not in TOPICS for id_ in topic_ids):
                raise AbelInputError('Selecciona al menos un tema válido para la evaluación.')
            selected=set(topic_ids)
            allowed=[topic for topic in allowed if topic['id'] in selected]
            if len(allowed)!=len(selected):
                raise AbelInputError('Selecciona solo temas habilitados para tu perfil.')
            if len(selected)>count:
                raise AbelInputError('Pon al menos una pregunta por cada tema seleccionado.')
            title='Evaluación · '+(allowed[0]['name'] if len(allowed)==1 else f'{len(allowed)} temas')
        elif scope=='unit':
            if scope_id not in TOPICS:
                raise AbelInputError('Elige el tema cuya unidad quieres evaluar.')
            chosen=TOPICS[scope_id]
            allowed=[topic for topic in allowed if topic['level']==chosen['level'] and topic['unit']==chosen['unit']]
            title=LEVELS[chosen['level']-1][2][chosen['unit']-1]
        elif scope=='level':
            if str(scope_id) not in {str(index) for index in range(1,len(LEVELS)+1)}:
                raise AbelInputError('Selecciona un nivel válido para la evaluación.')
            number=int(scope_id)
            allowed=[topic for topic in allowed if topic['level']==number]
            title=LEVELS[number-1][0]
        else:
            title='Evaluación general'
        if not allowed:
            raise AbelInputError('Todavía no tienes temas habilitados en ese alcance. Revisa los prerrequisitos.')
        minutes=bounded_int_ajch(minutes,8,1,60)
        identity=token_ajch()
        self.db.execute('INSERT INTO evaluations VALUES (?,?,?,?,?,NULL,NULL,?)',(identity,self.profile_id_ajch,title,timestamp(),time.time()+minutes*60,count))
        available=allowed[:]
        random.shuffle(available)
        for index in range(count):
            topic_id=available[index%len(available)]['id']
            item=self.insert_exercise_ajch(exercise_for_ajch(topic_id,self.effective_difficulty_ajch(difficulty,topic_id)),'exam')
            self.db.execute('INSERT INTO evaluation_items VALUES (?,?,?)',(identity,item['id'],index))
            if scope=='procedure':
                self.db.execute('INSERT INTO evaluation_work(exercise_id) VALUES (?)',(item['id'],))
        return self.exam_ajch(identity)

    def submit_exam_ajch(self,identity,answers,work=None):
        if not self.db.in_transaction:
            self.db.execute('BEGIN IMMEDIATE')
        current=self.exam_ajch(identity,True)
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
            answer=clean_ajch(answers.get(item['id']),450)
            result=self.mark_ajch(item,answer) if answer else {'correct':False}
            score+=int(result['correct'])
            self.db.execute('INSERT INTO responses VALUES (?,?,?,?)',(item['id'],answer,int(result['correct']),timestamp()))
            if item['id'] in written:
                lines=clean_ajch(steps.get(item['id']),academic.WORK_LIMIT)
                rubric=academic.assess_work_ajch(item,self.calculate_ajch(item),lines)
                process_points+=rubric['points']
                self.db.execute('UPDATE evaluation_work SET lines=?,points=?,checks=? WHERE exercise_id=?',
                                (lines,rubric['points'],json.dumps(rubric['checks']),item['id']))
        self.db.execute('UPDATE evaluations SET finished=?,score=? WHERE id=?',(timestamp(),score,identity))
        metric=f"{score+process_points}/{2*current['total']} puntos" if written else f"{score}/{current['total']}"
        self.log('Evaluación',current['title']+' · '+metric)
        self.fun.event('exam',evaluation=identity,score=score,total=current['total'])
        return self.exam_ajch(identity,True)

    def exam_draft_ajch(self,identity,exercise_id,answer,work=None):
        row=self.db.execute("""SELECT e.deadline,e.finished FROM evaluations e JOIN evaluation_items i
                              ON i.evaluation_id=e.id WHERE e.id=? AND e.profile_id=? AND i.exercise_id=?""",
                            (identity,self.profile_id_ajch,exercise_id)).fetchone()
        if not row or row['finished'] or time.time()>=row['deadline']:
            return False
        if answer is not None:
            self.db.execute('INSERT INTO evaluation_drafts VALUES (?,?) ON CONFLICT(exercise_id) DO UPDATE SET answer=excluded.answer',
                            (exercise_id,clean_ajch(answer,450)))
        if work is not None:
            self.db.execute('UPDATE evaluation_work SET lines=? WHERE exercise_id=?',(clean_ajch(work,academic.WORK_LIMIT),exercise_id))
        return True

    def notebook_ajch(self,args):
        action=args.get('action')
        if action=='list':
            unit=bounded_int_ajch(args.get('unit'),1,1,len(LEVELS[2][2]))
            entries=[dict(row) for row in self.db.execute(
                """SELECT id,unit,kind,title,body,payload,updated FROM university_notebook
                   WHERE profile_id=? AND unit=? ORDER BY updated DESC LIMIT 60""",(self.profile_id_ajch,unit))]
            for entry in entries:
                entry['payload']=json.loads(entry['payload'])
            return {'course':LEVELS[2][2][unit-1],'entries':entries}
        identity=clean_ajch(args.get('id'),32)
        prior=self.db.execute('SELECT * FROM university_notebook WHERE id=? AND profile_id=?',(identity,self.profile_id_ajch)).fetchone() if identity else None
        if identity and not prior:
            raise AbelInputError('Esa entrada no pertenece al cuaderno de este perfil.')
        if action=='remove' and prior:
            self.db.execute('DELETE FROM university_notebook WHERE id=? AND profile_id=?',(identity,self.profile_id_ajch))
            return {'id':identity,'unit':prior['unit']}
        if action!='save':
            raise AbelInputError('Elige una acción del cuaderno.')
        title=clean_ajch(args.get('title'),100)
        unit=bounded_int_ajch(args.get('unit'),0,0,len(LEVELS[2][2]))
        if not title or not unit:
            raise AbelInputError('Pon un título y selecciona un curso.')
        kind=prior['kind'] if prior else args.get('kind','note')
        raw=args.get('payload',{})
        if kind=='graph':
            payload=academic.graph_entry_ajch(raw if raw else json.loads(prior['payload']) if prior else None)
        elif kind=='exercise':
            source=raw if raw else json.loads(prior['payload']) if prior else {}
            payload={key:clean_ajch(source.get(key),600) for key in ('question','problem','result')}
            if not (payload['question'] or payload['problem']):
                raise AbelInputError('Selecciona un ejercicio para guardar.')
        elif kind=='note':
            payload={}
        else:
            raise AbelInputError('Elige un apunte, un ejercicio o una gráfica.')
        if self.db.execute('SELECT COUNT(*) FROM university_notebook WHERE profile_id=? AND unit=?',
                           (self.profile_id_ajch,unit)).fetchone()[0]>=60 and (not prior or prior['unit']!=unit):
            raise AbelInputError('Este curso admite hasta 60 entradas. Quita alguna para guardar otra.')
        identity=identity or token_ajch()
        self.db.execute("""INSERT INTO university_notebook VALUES (?,?,?,?,?,?,?,?)
                          ON CONFLICT(id) DO UPDATE SET unit=excluded.unit,title=excluded.title,body=excluded.body,
                          payload=excluded.payload,updated=excluded.updated WHERE profile_id=excluded.profile_id""",
                        (identity,self.profile_id_ajch,unit,kind,title,clean_ajch(args.get('body'),academic.NOTE_LIMIT),
                         json.dumps(payload),timestamp()))
        return {'id':identity,'unit':unit}

    def settings_ajch(self,data):
        name=clean_ajch(data.get('name'),65) or self.profile_ajch()['name']
        difficulty=data.get('difficulty')
        if difficulty not in ('auto',*DIFFICULTIES):
            raise AbelInputError('Elige una dificultad válida.')
        variable=data.get('variable')
        if variable not in ('x','t','y','z'):
            raise AbelInputError('Elige una variable válida.')
        preference=data.get('preference')
        if preference not in ('guiado','directo'):
            raise AbelInputError('Elige un estilo de aprendizaje válido.')
        self.db.execute('UPDATE profiles SET name=?,difficulty=?,preference=?,variable=? WHERE id=?',(name,difficulty,preference,variable,self.profile_id_ajch))
        return self.profile_ajch()

    def set_demo_ajch(self,enabled):
        if self.active_exam_ajch():
            raise AbelInputError('Finaliza la evaluación antes de cambiar de perfil.')
        self.db.execute("UPDATE config SET value=? WHERE key='profile'",('2' if enabled else '1',))
        exists=self.db.execute('SELECT 1 FROM exercises WHERE profile_id=2 LIMIT 1').fetchone()
        if enabled and not exists:
            for topic_id in ('conteo','naturales','resta1','patron1'):
                correct_count=1 if topic_id=='patron1' else 2
                for index in range(correct_count):
                    item=self.insert_exercise_ajch(exercise_for_ajch(topic_id,'fácil',random.Random(topic_id+str(index))),'practice')
                    solved=self.calculate_ajch(item)
                    self.db.execute('INSERT INTO responses VALUES (?,?,?,?)',(item['id'],format_value_ajch(solved.value),1,timestamp()))
                    self.log('Práctica de ejemplo',TOPICS[topic_id]['name'])
            self.solve({'problem':'2*x + 3 = 9','operation':'equation','variable':'x','argument':''})
            for correct_count in (2,3):
                sample=self.start_exam_ajch('level','1',8,3,'fácil')
                answers={item['id']:format_value_ajch(self.calculate_ajch(item).value)
                         for item in sample['items'][:correct_count]}
                self.submit_exam_ajch(sample['id'],answers)
            self.db.execute('UPDATE profiles SET study_seconds=420 WHERE id=2')
        return self.status_ajch()

    def note_ajch(self,topic_id,note_ajch):
        self.get_lesson_ajch(topic_id)
        self.db.execute('INSERT INTO lesson_notes VALUES (?,?,?) ON CONFLICT(profile_id,topic_id) DO UPDATE SET body=excluded.body',
                        (self.profile_id_ajch,topic_id,clean_ajch(note_ajch,1500)))
        return self.get_lesson_ajch(topic_id)

    def study_ajch(self,seconds):
        seconds=bounded_int_ajch(seconds,0,0,60)
        self.db.execute('UPDATE profiles SET study_seconds=study_seconds+? WHERE id=?',(seconds,self.profile_id_ajch))
        return True

    def teacher_ajch(self,topic_id,question):
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
                }[action.lower()],'variable':self.profile_ajch()['variable'],'argument':''}
                solution=self.solve(request,save=False)
                hints=[{'label':'Método','text':solution['explanation']}]
                if solution['steps']:
                    first=solution['steps'][0]
                    hints.append({'label':'Primera pista','text':first['rule']+'. '+first['explanation']})
                self.log('Profesor',problem)
                return {'topic':None,'name':solution['kind'],'hints':hints,'example':with_exercise_formula_ajch(request),'solution':solution,
                        'preferred':len(hints)-1 if self.profile_ajch()['preference']=='guiado' else 0}
            return {'clarify':True,'message':'Elige un tema o escribe su nombre. Si tienes una expresión, usa el Solucionador.'}
        content=self.get_lesson_ajch(topic_id)
        theory=(content['custom'] or {}).get('theory') or content['theory']
        formula=(content['custom'] or {}).get('formula') or content['formula']
        preference=self.profile_ajch()['preference']
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

    def validate_steps_ajch(self,lines,variable='x'):
        lines=[line.strip() for line in str(lines).splitlines() if line.strip()]
        if not 2<=len(lines)<=8:
            raise AbelInputError('Escribe de 2 a 8 líneas. La primera debe ser el problema original.')
        first=lines[0]
        equation=bool(RELATION.search(first))
        expected=solve_problem_ajch(first,'auto',variable).value if equation else AbelExpressionParser(first).scalar_ajch()
        checks=[]
        for index,line in enumerate(lines[1:],2):
            try:
                candidate=solve_problem_ajch(line,'auto',variable).value if equation and RELATION.search(line) else AbelExpressionParser(line).scalar_ajch()
                equivalent_ajch=AbelResultValidator.equivalent_ajch(expected,candidate)
                text=('Conserva el conjunto de soluciones.' if equation else 'Es equivalente a la expresión inicial.') if equivalent_ajch else (
                    'Este paso cambia el conjunto solución. Aplica la misma operación a ambos miembros.' if equation else
                    'El resultado de esta línea no es equivalente al original. Revisa signos, factores y paréntesis.')
            except (AbelInputError,ValueError,TypeError,NotImplementedError) as error:
                equivalent_ajch=False
                text='Revisa el formato de esta línea. '+str(error)
            checks.append({'line':index,'input':line,'ok':equivalent_ajch,'message':text})
            if not equivalent_ajch:
                break
        return {'checks':checks,'solution':solve_problem_ajch(first,'auto',variable).as_dict()}

    def backup(self,target):
        target=Path(target).resolve()
        if target==self.filename:
            raise AbelInputError('Elige un archivo distinto a la base activa.')
        temp=target.with_name(target.name+'.'+token_ajch()+'.tmp')
        try:
            self.db.commit()
            with closing(sqlite3.connect(temp)) as copy:
                self.db.backup(copy)
            os.replace(temp,target)
        finally:
            temp.unlink(missing_ok=True)
        return True

    def restore_ajch(self,source):
        source=Path(source).resolve()
        if source==self.filename:
            raise AbelInputError('Selecciona un archivo de respaldo distinto.')
        if not source.is_file() or source.stat().st_size>64*1024*1024:
            raise AbelInputError('Selecciona un respaldo de MathPath de hasta 64 MB.')
        try:
            copy=sqlite3.connect(source.as_uri()+'?mode=ro',uri=True)
            copy.execute('PRAGMA trusted_schema=OFF')
            tables={row[0] for row in copy.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            expected={row[0] for row in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            if (copy.execute('PRAGMA user_version').fetchone()[0]!=SCHEMA_VERSION
                    or not (expected-OPTIONAL_TABLES)<=tables<=expected
                    or copy.execute('PRAGMA integrity_check').fetchone()[0]!='ok'):
                raise AbelInputError('El archivo no es un respaldo íntegro de esta versión de MathPath.')
            for table in ('profiles','config','topics'):
                if not copy.execute(f'SELECT 1 FROM {table} LIMIT 1').fetchone():
                    raise AbelInputError('Faltan datos en el respaldo.')
            self.db.commit()
            copy.backup(self.db)
        except sqlite3.DatabaseError as error:
            raise AbelInputError('No se pudo leer un respaldo válido de MathPath.') from error
        finally:
            if 'copy' in locals():
                copy.close()
        self.db.executescript(SCHEMA)
        with self.db:
            self.seed_catalog_ajch()
            self.fun=game.AbelFunService(self)
        return self.status_ajch()


