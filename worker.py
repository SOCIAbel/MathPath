# MathPath · Autor: Abel Josué Colquehuanca Humpiri
"""JSON-line bridge between the desktop process and the offline math service."""
import json
import sys
import traceback
from pathlib import Path

MATHPATH_AUTOR = 'Abel Josué Colquehuanca Humpiri'

sys.path.insert(0, str(Path(__file__).resolve().parent/'vendor'))
from learning import AbelLearningService, math_preview
from academic import matrix_step
from engine import AbelInputError, exercise_formula
from graphing import sample_graph

service=AbelLearningService(sys.argv[1])


def preview(args):
    problem=args.get('problem','')
    if problem.strip() and args.get('operation') in {'integral','derivative','limit','gradient','matrix','system','ode'}:
        formula=exercise_formula(args)
        if formula:
            return {'formula':formula}
    return math_preview(problem)


def dispatch(name,args):
    handlers={
        'status':lambda:service.status(),
        'lesson':lambda:service.get_lesson(args.get('id'),True),
        'solve':lambda:service.solve(args),
        'example':lambda:service.solve(args,save=False),
        'preview':lambda:preview(args),
        'graph':lambda:sample_graph(args),
        'matrixStep':lambda:matrix_step(args),
        'notebook':lambda:service.notebook(args),
        'solved':lambda:service.solved_rows(),
        'practice':lambda:service.practice(args.get('topic'),args.get('difficulty','auto'),args.get('guided') is True),
        'grade':lambda:service.grade(args.get('id'),args.get('answer')),
        'adventure':lambda:service.adventure(args),
        'village':lambda:service.village(args),
        'hint':lambda:service.hint(args.get('id')),
        'retry':lambda:service.retry_failed(),
        'activeExam':lambda:service.active_exam(),
        'examStart':lambda:service.start_exam(args.get('scope'),args.get('scopeId'),args.get('minutes'),args.get('count'),
                                             args.get('difficulty','auto'),args.get('topics')),
        'examSubmit':lambda:service.submit_exam(args.get('id'),args.get('answers'),args.get('work')),
        'examDraft':lambda:service.exam_draft(args.get('id'),args.get('exerciseId'),args.get('answer'),args.get('work')),
        'examReview':lambda:service.exam(args.get('id'),True),
        'settings':lambda:service.settings(args),
        'demo':lambda:service.set_demo(args.get('enabled') is True),
        'study':lambda:service.study(args.get('seconds')),
        'teacher':lambda:service.teacher(args.get('topic'),str(args.get('question',''))[:500]),
        'validateSteps':lambda:service.validate_steps(str(args.get('lines',''))[:1200],args.get('variable','x')),
        'note':lambda:service.note(args.get('id'),args.get('note')),
        'fun':lambda:service.fun.dispatch(args),
        'backup':lambda:service.backup(args['path']),
        'restore':lambda:service.restore(args['path']),
        # Offline answer capture. Only the desktop process sends these, with files it wrote itself.
        'speech':lambda:__import__('local_ai').speech_answer(args['path'],args.get('variable','x')),
        'speechStream':lambda:__import__('local_ai').speech_stream(args),
        'scan':lambda:__import__('local_ai').scan_answer(args['path'])
    }
    if name not in handlers:
        raise AbelInputError('Operación de escritorio no disponible.')
    return handlers[name]()


for raw in sys.stdin:
    request={}
    try:
        if len(raw)>180000:
            raise AbelInputError('La solicitud supera el tamaño permitido.')
        request=json.loads(raw)
        if len(raw)>18000 and request.get('name')!='notebook':
            raise AbelInputError('La solicitud supera el tamaño permitido.')
        with service.db:
            result=dispatch(request['name'],request.get('args') or {})
        response={'id':request['id'],'result':result}
    except (AbelInputError, KeyError, TypeError, NotImplementedError, ValueError) as error:
        response={'id':request.get('id'),'error':str(error) or 'El motor no admite esta operación con los datos indicados.'}
    except Exception:
        traceback.print_exc(file=sys.stderr)
        response={'id':request.get('id'),'error':'No se pudo completar la operación. Revisa la sintaxis e inténtalo de nuevo.'}
    print(json.dumps(response,ensure_ascii=True,allow_nan=False),flush=True)
