import random
import sys
import tempfile
import time
from pathlib import Path

BASE = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE / 'vendor'))
from curriculumajch import TOPICS, DIFFICULTIES, LEVELS, exercise_for_ajch
from engineajch import AbelInputError, solve_problem_ajch, verify_answer_ajch
from learningajch import AbelLearningService, math_preview_ajch


def expect_error_ajch(action):
    try:
        action()
    except AbelInputError:
        return
    raise AssertionError('Se esperaba un error de validación')


for topic in TOPICS:
    for difficulty in DIFFICULTIES:
        case = exercise_for_ajch(topic, difficulty, random.Random(topic+difficulty))
        answer = solve_problem_ajch(case['problem'], case['operation'], case['variable'], case['argument'])
        assert answer.as_dict()['result'], topic
        assert verify_answer_ajch(answer.as_dict()['result'], answer, case['operation'], case['variable'], case['argument']), topic

equation = solve_problem_ajch('2*x+3=9').as_dict()
assert equation['result'] == '{3}'
assert equation['steps'][0]['rule'] == 'Resta 3 en ambos lados'
assert '2*x = 6' in equation['steps'][0]['expression']
limit = solve_problem_ajch('(x^2 - 64)/(x - 8)', 'limit', 'x', '8').as_dict()
assert limit['result'] == '16'
assert limit['steps'][1]['rule'] == 'Factoriza y simplifica'
assert limit['steps'][2]['expression'] == '8 + 8 = 16'
assert limit['approach']['samples'] == [{'x':'7.9','y':'15.9'},{'x':'8.1','y':'16.1'}]
assert solve_problem_ajch('x/x','limit','x','0').as_dict()['approach'] is None
assert solve_problem_ajch('6 x 4 ÷ 3').as_dict()['result'] == '8'
assert solve_problem_ajch('moda([3,2,3,4])').as_dict()['result'] == '3'
assert solve_problem_ajch('x+y=8;x-y=2').as_dict()['result'] == '{(5, 3)}'
assert 'Interval.open(0' in solve_problem_ajch('x/x=1').as_dict()['result']
assert solve_problem_ajch('sqrt(x)^2=x').as_dict()['result'] == 'Interval(0, ∞)'
assert solve_problem_ajch('x^3','integral','x','0,2').as_dict()['result'] == '4'
assert solve_problem_ajch('det([[1,2],[3,4]])').as_dict()['result'] == '-2'
assert verify_answer_ajch('x^3/3+C', solve_problem_ajch('x^2','integral'), 'integral')
assert not verify_answer_ajch('(x+2)^2', solve_problem_ajch('(x+2)^2','expand'), 'expand')
assert not verify_answer_ajch('x^2+5*x+6', solve_problem_ajch('x^2+5*x+6','factor'), 'factor')
assert '<mfrac>' in math_preview_ajch('2*x+3/4=9')['formula']
expect_error_ajch(lambda: solve_problem_ajch('__import__("os").system("dir")'))
expect_error_ajch(lambda: solve_problem_ajch('1/x', 'limit', 'x', '0'))

scratch = BASE / '.qa'
scratch.mkdir(exist_ok=True)
folder = Path(tempfile.mkdtemp(prefix='check-', dir=scratch))
service = AbelLearningService(folder / 'student.sqlite')
assert [level[0] for level in LEVELS] == ['Primaria','Secundaria','Universitario']
assert [len(level[2]) for level in LEVELS[:2]] == [6,5]
assert service.status_ajch()['total'] == len(TOPICS)
expect_error_ajch(lambda: service.practice_ajch('naturales', 'fácil'))
for _ in range(2):
    item = service.practice_ajch('conteo', 'fácil')
    expected = service.calculate_ajch(item).as_dict()['result']
    assert service.grade_ajch(item['id'], expected)['correct']
assert service.status_ajch()['mastered'] == 1
assert next(topic for topic in service.status_ajch()['topics'] if topic['id']=='conteo')['stars'] == 2
missed = service.practice_ajch('naturales', 'fácil')
assert not service.grade_ajch(missed['id'], '999')['correct']
assert service.retry_failed_ajch()['problem'] == missed['problem']
assert not service.validate_steps_ajch('2*x+3=9\n2*x=6\nx=4')['checks'][-1]['ok']
exam_ajch = service.start_exam_ajch('general', '', 2, 3, 'auto')
for item in exam_ajch['items']:
    answer = service.calculate_ajch(item).as_dict()['result']
    assert service.exam_draft_ajch(exam_ajch['id'], item['id'], answer)
service.db.execute('UPDATE evaluations SET deadline=? WHERE id=?', (time.time()-1, exam_ajch['id']))
assert service.submit_exam_ajch(exam_ajch['id'], {})['score'] == 3
service.db.commit()
service.note_ajch('conteo','Apunte de mi misión')
service.db.execute("UPDATE levels SET title='Fundamentos' WHERE id=1")
service.db.execute("UPDATE lessons SET body='{}' WHERE topic_id='conteo'")
service.db.commit()
service.backup(folder / 'backup.sqlite')
assert service.set_demo_ajch(True)['demo']
assert len(service.exam_history_ajch()) == 2
assert service.set_demo_ajch(False)['mastered'] >= 1
assert len(service.exam_history_ajch()) == 1
service.restore_ajch(folder / 'backup.sqlite')
assert service.status_ajch()['exams'][0]['score'] == 3
assert service.get_lesson_ajch('conteo')['name'] == 'Cuenta las estrellas'
assert service.get_lesson_ajch('conteo')['note'] == 'Apunte de mi misión'
assert service.db.execute('SELECT title FROM levels WHERE id=1').fetchone()[0] == 'Primaria'
service.db.close()
print(f'{len(TOPICS)*len(DIFFICULTIES)} ejercicios, notación escolar, misiones, evaluación, DEMO y respaldo comprobados.')
