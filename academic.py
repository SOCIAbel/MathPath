"""Exact row operations, procedure scoring and notebook data validation."""

import ast
import math
import re

import sympy as s
from engine import ExpressionParser, InputError, ResultValidator, format_value, solve_problem
from graphing import axis_bounds, graph_function


PROCEDURE_OPERATIONS = {'arithmetic', 'equation', 'simplify', 'factor', 'expand', 'function'}
WORK_LIMIT = 750
NOTE_LIMIT = 2400
IMAGE_LIMIT = 120_000
_RATIONAL = re.compile(r'[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:/[+-]?\d+)?')


def exact_number(raw):
    raw = str(raw).strip().replace('−','-')
    if len(raw) > 35 or not _RATIONAL.fullmatch(raw):
        raise InputError('Usa enteros, decimales con punto o fracciones como 3/4.')
    if '/' in raw:
        numerator, denominator = raw.split('/')
        bottom = int(denominator)
        if not bottom:
            raise InputError('El denominador no puede ser cero.')
        return s.Rational(numerator)/bottom
    return s.Rational(raw)


def matrix_step(args):
    raw = args.get('matrix','')
    if isinstance(raw,str):
        if len(raw)>1200:
            raise InputError('La matriz es demasiado larga.')
        raw = [re.split(r'[\t ,]+',line.strip()) for line in raw.replace(';','\n').splitlines() if line.strip()]
    if (not isinstance(raw,list) or not 2<=len(raw)<=4 or not isinstance(raw[0],list)
            or not 2<=len(raw[0])<=5 or any(not isinstance(row,list) or len(row)!=len(raw[0]) for row in raw)):
        raise InputError('Escribe de 2 a 4 filas con el mismo número de entradas (de 2 a 5).')
    matrix = s.Matrix([[exact_number(value) for value in row] for row in raw])
    action = args.get('action','load')
    changed=[]
    if action!='load':
        target=int(args.get('target',-1))
        source=int(args.get('source',-1))
        if not 0<=target<matrix.rows:
            raise InputError('Selecciona una fila de la matriz.')
        if action=='scale':
            factor=exact_number(args.get('factor',''))
            if not factor:
                raise InputError('Para conservar el sistema, multiplica por un número distinto de cero.')
            matrix[target,:]=factor*matrix[target,:]
            changed=[target]
        elif action in {'add','swap'}:
            if not 0<=source<matrix.rows or source==target:
                raise InputError('Elige dos filas distintas.')
            if action=='swap':
                matrix.row_swap(target,source)
                changed=[target,source]
            else:
                factor=exact_number(args.get('factor',''))
                matrix[target,:]=matrix[target,:]+factor*matrix[source,:]
                changed=[target]
        else:
            raise InputError('Elige una operación de fila.')
    values=[[str(value) for value in row] for row in matrix.tolist()]
    if any(len(value)>35 for row in values for value in row):
        raise InputError('Las fracciones se hicieron muy grandes. Deshaz el paso anterior o usa otro factor.')
    reduced,pivots=matrix.rref()
    resolution=None
    if matrix==reduced:
        variables=matrix.cols-1
        if variables in pivots:
            resolution={'type':'none'}
        elif len(pivots)<variables:
            resolution={'type':'free'}
        else:
            resolution={'type':'unique','values':[str(matrix[row,-1]) for row in range(variables)]}
    return {'rows':values,'changed':changed,'resolution':resolution}


def expression_key(line):
    return ast.dump(ExpressionParser(line).root,include_attributes=False)


def equality_parts(line):
    parts=line.split('=')
    if len(parts)>2 or any(not part.strip() for part in parts):
        raise InputError('Escribe una sola expresión o igualdad completa en cada línea.')
    return parts


def rational_terminal(text):
    raw = text.strip().replace(' ','').replace('−','-')
    if re.fullmatch(r'[+-]?\d+(?:\.\d+)?',raw):
        return True
    match=re.fullmatch(r'([+-]?\d+)/(\d+)',raw)
    return bool(match and int(match[2])>1 and math.gcd(int(match[1]),int(match[2]))==1)


def assess_work(item,solution,raw):
    lines=[line.strip() for line in raw[:WORK_LIMIT].splitlines() if line.strip()]
    equation=item['operation']=='equation'
    original=tuple(expression_key(part) for part in equality_parts(item['problem']))
    expected=solution.value
    canonical=format_value(expected)
    checks=[]
    partial=0
    for index,line in enumerate(lines[:8],1):
        try:
            parts=equality_parts(line)
            parsed=[ExpressionParser(part) for part in parts]
            key=tuple(ast.dump(parser.root,include_attributes=False) for parser in parsed)
            if equation:
                if len(parts)!=2:
                    raise InputError('Mantén los dos lados de la ecuación en cada paso.')
                values=[parser.scalar() for parser in parsed]
                candidate=solve_problem(line,'equation',item['variable']).value
                valid=ResultValidator.equivalent(expected,candidate)
                variable=s.Symbol(item['variable'],real=True)
                terminal=any(value==variable and not other.free_symbols for value,other in (values,values[::-1]))
                message='Conserva las soluciones.' if valid else 'Esta ecuación cambia el conjunto de soluciones.'
            else:
                valid=all(ResultValidator.equivalent(expected,parser.scalar()) for parser in parsed)
                terminal=all(rational_terminal(part) or part.strip()==canonical for part in parts)
                message='Conserva el valor.' if valid else 'Esta línea cambia el valor de la expresión.'
            if valid and key!=original and not terminal:
                partial=1
        except (InputError,ValueError,TypeError,NotImplementedError):
            valid=False
            message='Revisa la expresión y los signos de esta línea.'
        checks.append({'line':index,'input':line,'ok':valid,'message':message})
        if not valid:
            break
    return {'points':partial,'checks':checks}


def graph_entry(raw):
    if isinstance(raw,dict) and raw.get('studio') is not None:
        from graph_studio_data import notebook_entry
        return notebook_entry(raw,IMAGE_LIMIT)
    if not isinstance(raw,dict):
        raise InputError('Abre una gráfica y pulsa Guardar en cuaderno.')
    mode,expressions=raw.get('mode'),raw.get('expressions')
    if mode not in (2,3) or not isinstance(expressions,list) or not 1<=len(expressions)<=(3 if mode==2 else 1):
        raise InputError('La gráfica guardada necesita una expresión válida.')
    for expression in expressions:
        graph_function(expression,mode)
    spec={'mode':mode,'expressions':expressions,'bounds':axis_bounds(raw.get('bounds')),
          'title':str(raw.get('title',''))[:120]}
    interval=raw.get('interval')
    if isinstance(interval,list) and len(interval)==2 and all(type(value) in (float,int) and abs(value)<=1e6 for value in interval):
        spec['interval']=interval
    camera=raw.get('camera')
    if isinstance(camera,list) and len(camera)==3 and all(type(value) in (float,int) and math.isfinite(value) for value in camera):
        yaw,pitch,zoom=camera
        spec['camera']=[yaw%math.tau,min(1.47,max(.11,pitch)),min(3.5,max(.45,zoom))]
    image=raw.get('image','')
    if not isinstance(image,str) or len(image)>IMAGE_LIMIT or (
            image and not re.fullmatch(r'data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}',image)):
        raise InputError('La vista previa del gráfico no es válida.')
    return spec|{'image':image}
