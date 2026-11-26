import json
import sys
import traceback
from pathlib import Path

MATHPATH_AUTOR = 'Abel Josué Colquehuanca Humpiri'

sys.path.insert(0, str(Path(__file__).resolve().parent/'vendor'))
from learningajch import AbelLearningService, math_preview_ajch
from academicajch import matrix_step_ajch
from engineajch import AbelInputError, exercise_formula_ajch
from graphingajch import sample_graph_ajch

service=AbelLearningService(sys.argv[1])


def preview(args):
    problem=args.get('problem','')
    if problem.strip() and args.get('operation') in {'integral','derivative','limit','gradient','matrix','system','ode'}:
        formula=exercise_formula_ajch(args)
        if formula:
            return {'formula':formula}
    return math_preview_ajch(problem)


def dispatch_ajch(name,args):
    handlers={
        'status':lambda:service.status_ajch(),
        'lesson':lambda:service.get_lesson_ajch(args.get('id'),True),
        'solve':lambda:service.solve(args),
        'example':lambda:service.solve(args,save=False),
        'preview':lambda:preview(args),
        'graph':lambda:sample_graph_ajch(args),
        'matrixStep':lambda:matrix_step_ajch(args),
        'notebook':lambda:service.notebook_ajch(args),
        'solved':lambda:service.solved_rows_ajch(),
        'practice':lambda:service.practice_ajch(args.get('topic'),args.get('difficulty','auto'),args.get('guided') is True),
        'grade':lambda:service.grade_ajch(args.get('id'),args.get('answer')),
        'adventure':lambda:service.adventure(args),
        'village':lambda:service.village_ajch(args),
        'hint':lambda:service.hint_ajch(args.get('id')),
        'retry':lambda:service.retry_failed_ajch(),
        'activeExam':lambda:service.active_exam_ajch(),
        'examStart':lambda:service.start_exam_ajch(args.get('scope'),args.get('scopeId'),args.get('minutes'),args.get('count'),
                                             args.get('difficulty','auto'),args.get('topics')),
        'examSubmit':lambda:service.submit_exam_ajch(args.get('id'),args.get('answers'),args.get('work')),
        'examDraft':lambda:service.exam_draft_ajch(args.get('id'),args.get('exerciseId'),args.get('answer'),args.get('work')),
        'examReview':lambda:service.exam_ajch(args.get('id'),True),
        'settings':lambda:service.settings_ajch(args),
        'demo':lambda:service.set_demo_ajch(args.get('enabled') is True),
        'study':lambda:service.study_ajch(args.get('seconds')),
        'teacher':lambda:service.teacher_ajch(args.get('topic'),str(args.get('question',''))[:500]),
        'validateSteps':lambda:service.validate_steps_ajch(str(args.get('lines',''))[:1200],args.get('variable','x')),
        'note':lambda:service.note_ajch(args.get('id'),args.get('note')),
        'fun':lambda:service.fun.dispatch_ajch(args),
        'backup':lambda:service.backup(args['path']),
        'restore':lambda:service.restore_ajch(args['path']),
        'speech':lambda:__import__('local_aiajch').speech_answer_ajch(args['path'],args.get('variable','x')),
        'speechStream':lambda:__import__('local_aiajch').speech_stream_ajch(args),
        'scan':lambda:__import__('local_aiajch').scan_answer_ajch(args['path'])
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
            result=dispatch_ajch(request['name'],request.get('args') or {})
        response={'id':request['id'],'result':result}
    except (AbelInputError, KeyError, TypeError, NotImplementedError, ValueError) as error:
        response={'id':request.get('id'),'error':str(error) or 'El motor no admite esta operación con los datos indicados.'}
    except Exception:
        traceback.print_exc(file=sys.stderr)
        response={'id':request.get('id'),'error':'No se pudo completar la operación. Revisa la sintaxis e inténtalo de nuevo.'}
    print(json.dumps(response,ensure_ascii=True,allow_nan=False),flush=True)
