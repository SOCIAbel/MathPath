# MathPath · Autor: Abel Josué Colquehuanca Humpiri
"""Deterministic mathematics. User input is interpreted as a small AST, never evaluated."""
import ast
import html
import re
from dataclasses import dataclass, field

import sympy as s
from sympy.solvers.solveset import NonlinearError
from sympy.printing.mathml import mathml
from sympy.calculus.util import continuous_domain

SYMBOLS = {name: s.Symbol(name, real=True) for name in 'x y z t u v a b c m n k'.split()}
FUNCTIONS = {
    'sqrt': s.sqrt, 'sin': s.sin, 'cos': s.cos, 'tan': s.tan, 'asin': s.asin, 'acos': s.acos,
    'atan': s.atan, 'log': s.log, 'ln': s.log, 'exp': s.exp, 'abs': s.Abs, 'Abs': s.Abs
}
CONSTANTS = {'pi': s.pi, 'e': s.E, 'E': s.E, 'oo': s.oo, 'inf': s.oo}
OPERATIONS = {
    'auto': 'Detectar automáticamente', 'arithmetic': 'Aritmética', 'simplify': 'Simplificar',
    'expand': 'Desarrollar', 'factor': 'Factorizar', 'equation': 'Resolver ecuación',
    'inequality': 'Resolver inecuación', 'system': 'Resolver sistema', 'geometry': 'Geometría',
    'trig': 'Simplificar identidad trigonométrica', 'trig_equation': 'Resolver ecuación trigonométrica',
    'function': 'Evaluar función en un punto', 'limit': 'Límite', 'continuity': 'Continuidad en un punto',
    'derivative': 'Derivada', 'integral': 'Integral', 'gradient': 'Gradiente', 'ode': 'Ecuación diferencial',
    'matrix': 'Operaciones con matrices y vectores', 'statistics': 'Estadística y probabilidad',
}
ARITHMETIC_CALLS = {'mcd', 'mcm', 'primo', 'porcentaje', 'proporcion'}
GEOMETRY_CALLS = {'perimetro_rect', 'area_rect', 'area_triangulo', 'area_circulo', 'volumen_caja', 'pitagoras', 'distancia', 'grados'}
MATRIX_CALLS = {'det', 'inversa', 'transpuesta', 'matmul', 'matsuma', 'punto', 'norma'}
STATS_CALLS = {'media', 'mediana', 'moda', 'varianza', 'desviacion', 'probabilidad'}


class AbelInputError(ValueError):
    pass


class AbelExpressionParser:
    def __init__(self, text):
        raw = str(text).strip()
        if not raw or len(raw) > 450:
            raise AbelInputError('Escribe una expresión de hasta 450 caracteres.')
        self.source = (raw.replace('^', '**').replace('−', '-').replace('×', '*')
                       .replace('·', '*').replace('÷', '/').replace('π', 'pi').replace('∞', 'oo')
                       .replace('√(', 'sqrt('))
        self.source = re.sub(r'(?<=\d)\s*[xX]\s*(?=[0-9(])', '*', self.source)
        self.source = re.sub(r'(?<=\d)(?=[xyztuvabcmnk]\b)', '*', self.source)
        self.source = re.sub(r'(?<=[0-9)])(?=\()', '*', self.source)
        self.source = re.sub(r'(?<=\))(?=[xyztuvabcmnk]\b)', '*', self.source)
        try:
            self.root = ast.parse(self.source, mode='eval').body
        except (SyntaxError, RecursionError) as error:
            raise AbelInputError('Revisa los paréntesis y la sintaxis de la expresión.') from error
        if sum(1 for _ in ast.walk(self.root)) > 140:
            raise AbelInputError('La expresión tiene demasiadas operaciones para una sola consulta.')

    def parse(self, node=None, symbolic_function=False):
        node = self.root if node is None else node
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            token = ast.get_source_segment(self.source, node)
            if not token or not re.fullmatch(r'(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d{1,2})?', token) or len(token) > 22:
                raise AbelInputError('Usa números en notación decimal de longitud razonable.')
            return s.Rational(token)
        if isinstance(node, ast.Name):
            if node.id in SYMBOLS:
                return SYMBOLS[node.id]
            if node.id in CONSTANTS:
                return CONSTANTS[node.id]
        if isinstance(node, (ast.List, ast.Tuple)):
            if len(node.elts) > 24:
                raise AbelInputError('Cada lista admite hasta 24 valores.')
            return [self.parse(item, symbolic_function) for item in node.elts]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            value = self.scalar(node.operand, symbolic_function)
            return -value if isinstance(node.op, ast.USub) else value
        if isinstance(node, ast.BinOp):
            a, b = [self.scalar(item, symbolic_function) for item in (node.left, node.right)]
            if isinstance(node.op, ast.Add):
                return a + b
            if isinstance(node.op, ast.Sub):
                return a - b
            if isinstance(node.op, ast.Mult):
                return a * b
            if isinstance(node.op, ast.Div):
                if b == 0:
                    raise AbelInputError('La división entre cero está indefinida.')
                return a / b
            if isinstance(node.op, ast.Pow):
                if b.is_number and (b.is_real is not True or abs(b) > 120):
                    raise AbelInputError('En esta versión los exponentes numéricos van de −120 a 120.')
                if a.is_Rational and max(int(abs(a.p)).bit_length(), int(a.q).bit_length()) > 12000:
                    raise AbelInputError('La potencia produciría un número demasiado grande.')
                if a == 0 and b.is_negative:
                    raise AbelInputError('Cero elevado a un exponente negativo está indefinido.')
                return a**b
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.keywords:
            name = node.func.id
            if name in FUNCTIONS and len(node.args) in ((1, 2) if name in {'log','ln'} else (1,)):
                return FUNCTIONS[name](*(self.scalar(arg, symbolic_function) for arg in node.args))
            if symbolic_function and name == 'y' and len(node.args) == 1:
                return s.Function('y')(self.scalar(node.args[0], True))
        raise AbelInputError('Símbolo u operación no admitidos. Usa la guía del editor para ver la sintaxis.')

    def scalar(self, node=None, symbolic_function=False):
        result = self.parse(node, symbolic_function)
        if not isinstance(result, s.Expr):
            raise AbelInputError('Se esperaba una expresión escalar.')
        if result.has(s.zoo, s.nan):
            raise AbelInputError('La expresión no está definida para estos valores.')
        return result

    def call(self):
        if not isinstance(self.root, ast.Call) or not isinstance(self.root.func, ast.Name) or self.root.keywords:
            raise AbelInputError('Escribe una operación con paréntesis, como media([2, 4, 6]).')
        return self.root.func.id, [self.parse(arg) for arg in self.root.args]

    def domain(self, variable):
        domain = s.S.Reals
        for node in ast.walk(self.root):
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Div):
                denominator = self.scalar(node.right)
                if denominator.has(variable):
                    domain -= s.solveset(denominator, variable, domain=s.S.Reals)
            elif isinstance(node, ast.BinOp) and isinstance(node.op, ast.Pow):
                base, exponent = self.scalar(node.left), self.scalar(node.right)
                if base.has(variable) and exponent.is_negative:
                    domain -= s.solveset(base, variable, domain=s.S.Reals)
                if base.has(variable) and exponent.is_Rational and exponent.q % 2 == 0:
                    domain &= s.solve_univariate_inequality(s.Ge(base,0),variable,relational=False)
            elif isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and node.func.id in {'sqrt','log','ln','asin','acos','tan'}:
                argument=self.scalar(node.args[0])
                if not argument.has(variable) or argument.free_symbols-{variable}:
                    continue
                if node.func.id=='sqrt':
                    domain &= s.solve_univariate_inequality(s.Ge(argument,0),variable,relational=False)
                if node.func.id in {'log','ln'}:
                    domain &= s.solve_univariate_inequality(s.Gt(argument,0),variable,relational=False)
                if node.func.id in {'asin','acos'}:
                    domain &= s.solve_univariate_inequality(s.Le(s.Abs(argument),1),variable,relational=False)
                if node.func.id=='tan':
                    domain -= s.solveset(s.cos(argument),variable,domain=s.S.Reals)
        expr = self.scalar()
        if expr.has(variable) and not expr.free_symbols - {variable}:
            try:
                domain &= continuous_domain(expr, variable, s.S.Reals)
            except (NotImplementedError, ValueError):
                pass
        return domain


@dataclass
class AbelSolution:
    problem: str
    kind: str
    value: object
    explanation: str
    verification: str
    steps: list = field(default_factory=list)
    data: dict = field(default_factory=dict)
    verified: bool = True
    suffix: str = ''
    approach: dict | None = None

    def as_dict(self):
        return {
            'problem': self.problem, 'kind': self.kind, 'result': format_value(self.value) + self.suffix,
            'formula': display_math(self.value), 'suffix': self.suffix, 'steps': self.steps,
            'data': self.data, 'explanation': self.explanation, 'verification': self.verification,
            'verified': bool(self.verified), 'approach': self.approach
        }


def format_value(value):
    return re.sub(r'\boo\b','∞',s.sstr(value).replace('**','^'))


def math_markup(body):
    return '<math xmlns="http://www.w3.org/1998/Math/MathML">' + body + '</math>'


def display_math(value):
    try:
        result = presentation_body(value)
        if len(result) < 15000:
            return math_markup(result)
    except (TypeError, ValueError, NotImplementedError):
        pass
    return ''


def expression_markup(problem):
    problem=str(problem).strip()
    if not problem:
        return ''
    if len(problem)>600:
        raise AbelInputError('El problema supera el límite del editor.')
    def group(body):
        return '<mrow><mo>(</mo>'+body+'<mo>)</mo></mrow>'

    def render(node,parser):
        if isinstance(node,ast.Constant) and type(node.value) in (int,float):
            return '<mn>'+html.escape(ast.get_source_segment(parser.source,node))+'</mn>'
        if isinstance(node,ast.Name):
            return '<mi>'+html.escape({'pi':'π','oo':'∞'}.get(node.id,node.id))+'</mi>'
        if isinstance(node,ast.UnaryOp) and isinstance(node.op,(ast.USub,ast.UAdd)):
            operand=render(node.operand,parser)
            if isinstance(node.operand,ast.BinOp) and isinstance(node.operand.op,(ast.Add,ast.Sub)):
                operand=group(operand)
            return '<mrow><mo>'+('−' if isinstance(node.op,ast.USub) else '+')+'</mo>'+operand+'</mrow>'
        if isinstance(node,ast.BinOp):
            left,right=render(node.left,parser),render(node.right,parser)
            if isinstance(node.op,ast.Div):
                return '<mfrac>'+left+right+'</mfrac>'
            if isinstance(node.op,ast.Pow):
                if isinstance(node.left,(ast.BinOp,ast.UnaryOp)):
                    left=group(left)
                return '<msup>'+left+right+'</msup>'
            if isinstance(node.op,ast.Mult):
                if isinstance(node.left,ast.BinOp) and isinstance(node.left.op,(ast.Add,ast.Sub)):
                    left=group(left)
                if isinstance(node.right,ast.BinOp) and isinstance(node.right.op,(ast.Add,ast.Sub)):
                    right=group(right)
            if isinstance(node.op,ast.Sub) and isinstance(node.right,ast.BinOp) and isinstance(node.right.op,(ast.Add,ast.Sub)):
                right=group(right)
            symbol={ast.Add:'+',ast.Sub:'−',ast.Mult:'·'}.get(type(node.op))
            if not symbol:
                raise AbelInputError('Operación no reconocida en la vista previa.')
            return '<mrow>'+left+'<mo>'+symbol+'</mo>'+right+'</mrow>'
        if isinstance(node,(ast.List,ast.Tuple)):
            return '<mrow><mo>[</mo>'+'<mo>,</mo>'.join(render(item,parser) for item in node.elts)+'<mo>]</mo></mrow>'
        if isinstance(node,ast.Call) and isinstance(node.func,ast.Name):
            if node.func.id=='sqrt' and len(node.args)==1:
                return '<msqrt>'+render(node.args[0],parser)+'</msqrt>'
            return '<mrow><mi>'+html.escape(node.func.id)+'</mi><mo>(</mo>'+'<mo>,</mo>'.join(render(item,parser) for item in node.args)+'<mo>)</mo></mrow>'
        raise AbelInputError('Sintaxis no reconocida en la vista previa.')
    if RELATION.search(problem):
        left,op,right=sides(problem)
        body=render(left.root,left)+'<mo>'+html.escape({'<=':'≤','>=':'≥','!=':'≠'}.get(op,op))+'</mo>'+render(right.root,right)
    else:
        parser=AbelExpressionParser(problem)
        body=render(parser.root,parser)
    return '<mrow>'+body+'</mrow>'



def math_preview(problem):
    problem=str(problem).strip()
    if not problem or ';' in problem or problem.startswith(("y'",'dy/d')):
        return {'formula':''}
    return {'formula':math_markup(expression_markup(problem))}


def exercise_formula(item):
    if item.get('showExpression') is False and item.get('visual'):
        return ''
    problem=item['problem']
    readable=item.get('expression',problem)
    if not readable:
        return ''
    operation=item.get('operation','auto')
    variable=SYMBOLS.get(item.get('variable','x'),SYMBOLS['x'])
    symbol='<mi>'+str(variable)+'</mi>'
    differential='<mi mathvariant="normal">d</mi>'+symbol
    argument=item.get('argument','')
    try:
        if operation=='ode':
            _,right=problem.split('=',1)
            lhs='<mfrac><mrow><mi mathvariant="normal">d</mi><mi>y</mi></mrow><mrow>'+differential+'</mrow></mfrac>'
            return math_markup('<mrow>'+lhs+'<mo>=</mo>'+expression_markup(right)+'</mrow>')
        if operation=='system':
            rows=''.join('<mtr><mtd>'+expression_markup(line)+'</mtd></mtr>' for line in problem.split(';'))
            return math_markup('<mrow><mo>{</mo><mtable columnalign="left">'+rows+'</mtable></mrow>')
        if operation=='matrix':
            name,args=AbelExpressionParser(problem).call()
            if name in {'matsuma','matmul','punto'}:
                matrices=[s.Tuple(*arg) if name=='punto' else s.Matrix(arg) for arg in args]
                separator={'matsuma':'+','matmul':'×','punto':'·'}[name]
                return math_markup('<mrow>'+('<mo>'+separator+'</mo>').join(presentation_body(item) for item in matrices)+'</mrow>')
            value=s.Tuple(*args[0]) if name=='norma' else s.Matrix(args[0])
            matrix=presentation_body(value)
            if name in {'det','norma'}:
                fence='|' if name=='det' else '‖'
                return math_markup('<mrow><mo>'+fence+'</mo>'+matrix+'<mo>'+fence+'</mo></mrow>')
            if name in {'inversa','transpuesta'}:
                power='<mrow><mo>−</mo><mn>1</mn></mrow>' if name=='inversa' else '<mi>T</mi>'
                return math_markup('<msup>'+matrix+power+'</msup>')
        if operation in {'integral','derivative','limit','gradient'}:
            body=expression_markup(problem)
            grouped='<mrow><mo>(</mo>'+body+'<mo>)</mo></mrow>'
            if operation=='integral':
                sign='<mo>∫</mo>'
                if argument.strip():
                    bounds=scalar_list(argument,2)
                    sign='<msubsup>'+sign+''.join(presentation_body(bound) for bound in bounds)+'</msubsup>'
                return math_markup('<mrow>'+sign+grouped+'<mspace width="0.16em"/>'+differential+'</mrow>')
            if operation=='limit':
                under='<mrow>'+symbol+'<mo>→</mo>'+expression_markup(argument)+'</mrow>'
                return math_markup('<mrow><munder><mi mathvariant="normal">lim</mi>'+under+'</munder>'+body+'</mrow>')
            if operation=='gradient':
                return math_markup('<mrow><mo>∇</mo>'+grouped+'</mrow>')
            partial=item.get('topic') in {'derivada_parcial','parcial_y'}
            operator='<mo>∂</mo>' if partial else '<mi mathvariant="normal">d</mi>'
            return math_markup('<mrow><mfrac>'+operator+'<mrow>'+operator+symbol+'</mrow></mfrac>'+grouped+'</mrow>')
        if item.get('topic')=='logaritmos':
            _,args=AbelExpressionParser(problem).call()
            number,base=args
            return math_markup('<mrow><msub><mi mathvariant="normal">log</mi>'+presentation_body(base)+
                               '</msub><mo>(</mo>'+presentation_body(number)+'<mo>)</mo></mrow>')
        if item.get('topic') in {'angulos','analitica','mcdmcm'}:
            _,args=AbelExpressionParser(problem).call()
            if item['topic']=='angulos':
                return math_markup('<msup>'+presentation_body(args[0])+'<mo>°</mo></msup>')
            if item['topic']=='mcdmcm':
                return math_markup('<mrow><mi mathvariant="normal">MCD</mi>'+presentation_body(s.Tuple(*args))+'</mrow>')
            return math_markup('<mrow><mi>A</mi><mo>=</mo>'+presentation_body(s.Tuple(*args[:2]))+
                               '<mspace width="1em"/><mi>B</mi><mo>=</mo>'+presentation_body(s.Tuple(*args[2:]))+'</mrow>')
        if problem==readable and operation in {'geometry','statistics'}:
            return ''
        return math_markup(expression_markup(readable))
    except (AbelInputError,TypeError,ValueError,NotImplementedError):
        return ''


def presentation_body(value):
    return (mathml(value,printer='presentation')
            .replace('&InvisibleTimes;', '&#x2062;')
            .replace('<mo>&dd;</mo>', '<mi mathvariant="normal">d</mi>')
            .replace('<mi>log</mi>', '<mi mathvariant="normal">ln</mi>'))


def equation_formula(left, right):
    return math_markup('<mrow>'+left+'<mo>=</mo>'+right+'</mrow>')


def relation_steps(before, after):
    try:
        return math_markup(expression_markup(before)+'<mo>⇒</mo>'+expression_markup(after))
    except AbelInputError:
        return ''


class AbelStepGenerator:
    @staticmethod
    def step(rule, explanation, value=None, text=None, formula=None):
        return {
            'rule': rule, 'explanation': explanation,
            'expression': text if text is not None else format_value(value) if value is not None else '',
            'formula': formula if formula is not None else display_math(value) if value is not None else ''
        }

    @staticmethod
    def written_fraction(parser, node):
        sign=1
        if isinstance(node,ast.UnaryOp):
            sign=-1 if isinstance(node.op,ast.USub) else 1
            node=node.operand
        if not isinstance(node,ast.BinOp) or not isinstance(node.op,ast.Div):
            return None
        for part in (node.left,node.right):
            literal=part.operand if isinstance(part,ast.UnaryOp) else part
            if not isinstance(literal,ast.Constant):
                return None
        numerator,denominator=parser.scalar(node.left),parser.scalar(node.right)
        if numerator.is_Integer and denominator.is_Integer and denominator!=0:
            return sign*numerator,denominator
        return None

    @classmethod
    def double_c(cls, top, bottom, value):
        a,b=top
        c,d=bottom
        numerator,denominator=a*d,b*c
        extremes,means='#245684','#694025'

        def fraction(upper,lower):
            return '<mfrac>'+upper+lower+'</mfrac>'

        def product(left,right):
            factors=[('<mrow><mo>(</mo>'+presentation_body(term)+'<mo>)</mo></mrow>'
                      if term<0 else presentation_body(term)) for term in (left,right)]
            return '<mrow>'+'<mo>×</mo>'.join(factors)+'</mrow>'

        def highlight(body,color):
            return '<mstyle mathcolor="'+color+'">'+body+'</mstyle>'

        original=('<mfrac linethickness="2px">'+
                  fraction(highlight(presentation_body(a),extremes),highlight(presentation_body(b),means))+
                  fraction(highlight(presentation_body(c),means),highlight(presentation_body(d),extremes))+'</mfrac>')
        products=fraction(highlight(product(a,d),extremes),highlight(product(b,c),means))
        intermediate=fraction(presentation_body(numerator),presentation_body(denominator))
        steps=[
            cls.step('Método de la doble C',
                     'Multiplica los extremos (el primer y el último número) para el numerador. Multiplica los medios (los dos números del centro) para el denominador.',
                     text=f'({a} × {d})/({b} × {c})',formula=equation_formula(original,products)),
            cls.step('Multiplica arriba y abajo',
                     f'Los extremos dan {format_value(numerator)}. Los medios dan {format_value(denominator)}.',
                     text=f'{numerator}/{denominator}',formula=equation_formula(products,intermediate)),
        ]
        divisor=s.igcd(numerator,denominator)
        if denominator<0:
            divisor=-divisor
        if divisor!=1:
            explanation=f'Divide el numerador y el denominador entre {format_value(divisor)}.'
            if divisor<0:
                explanation+=' Así el denominador queda positivo.'
            parts=['<mrow>'+presentation_body(number)+'<mo>÷</mo>'+presentation_body(divisor)+'</mrow>'
                   for number in (numerator,denominator)]
            reduced=fraction(*parts)
            intermediate='<mrow>'+intermediate+'<mo>=</mo>'+reduced+'</mrow>'
            steps.append(cls.step('Simplifica la fracción',explanation,value,
                                  formula=equation_formula(intermediate,presentation_body(value))))
        return steps

    @classmethod
    def arithmetic(cls, parser):
        result = []
        rules = {
            ast.Add:('Suma','Suma los dos valores.'), ast.Sub:('Resta','Resta el segundo valor del primero.'),
            ast.Mult:('Multiplicación','Multiplica los factores.'), ast.Div:('División','Divide el primer número entre el segundo.'),
            ast.Pow:('Potencia','Eleva la base al exponente.')
        }

        def visit(node):
            if isinstance(node, ast.BinOp):
                if isinstance(node.op,ast.Div):
                    top=cls.written_fraction(parser,node.left)
                    bottom=cls.written_fraction(parser,node.right)
                    if top and bottom:
                        result.extend(cls.double_c(top,bottom,parser.scalar(node)))
                        return
                visit(node.left)
                visit(node.right)
                if type(node.op) in rules:
                    rule, explanation = rules[type(node.op)]
                    left, right = parser.scalar(node.left), parser.scalar(node.right)
                    value = parser.scalar(node)
                    symbol = {ast.Add:'+', ast.Sub:'−', ast.Mult:'×', ast.Div:'÷', ast.Pow:'^'}[type(node.op)]
                    a, b = map(format_value, (left, right))
                    if isinstance(node.op,(ast.Mult,ast.Div,ast.Pow)) and left.is_Rational and left.q != 1:
                        a = f'({a})'
                    if isinstance(node.op,(ast.Mult,ast.Div,ast.Pow)) and (right.is_negative or right.is_Rational and right.q != 1):
                        b = f'({b})'
                    if isinstance(node.op,ast.Pow) and left.is_negative:
                        a = f'({a})'
                    before = f'{a}^{b}' if isinstance(node.op,ast.Pow) else f'{a} {symbol} {b}'
                    if isinstance(node.op,ast.Div) and node is not parser.root and before.replace(' ÷ ','/')==format_value(value):
                        return
                    if isinstance(node.op,(ast.Add,ast.Sub)):
                        if left.is_Rational and right.is_Rational and left.q!=right.q:
                            common=s.ilcm(left.q,right.q)
                            numerator_left=left*common
                            numerator_right=right*common
                            operator='+' if isinstance(node.op,ast.Add) else '−'
                            left_fraction=f'<mfrac><mn>{numerator_left}</mn><mn>{common}</mn></mfrac>'
                            right_fraction=f'<mfrac><mn>{numerator_right}</mn><mn>{common}</mn></mfrac>'
                            result.append(cls.step('Denominador común','Expresa las dos cantidades con el mismo denominador antes de combinar los numeradores.',
                                                   text=f'({numerator_left}/{common}) {operator} ({numerator_right}/{common})',
                                                   formula=equation_formula(expression_markup(before),'<mrow>'+left_fraction+'<mo>'+operator+'</mo>'+right_fraction+'</mrow>')))
                            before=f'({numerator_left} {operator} {numerator_right})/{common}'
                    result.append(cls.step(rule, explanation, text=f'{before} = {format_value(value)}',
                                           formula=equation_formula(expression_markup(before),presentation_body(value))))
            elif isinstance(node, ast.UnaryOp):
                visit(node.operand)
            elif isinstance(node, ast.Call):
                for arg in node.args:
                    visit(arg)
                before = ast.get_source_segment(parser.source, node).replace('**','^')
                value = parser.scalar(node)
                if isinstance(node.func,ast.Name) and node.func.id=='sqrt':
                    radicand=parser.scalar(node.args[0])
                    result.append(cls.step('Raíz cuadrada','Busca un cuadrado perfecto que divida al número dentro de la raíz.',
                                           text=f'√({radicand}) = {format_value(value)}',
                                           formula=equation_formula(expression_markup(before),presentation_body(value))))
                else:
                    result.append(cls.step('Evaluar la función', 'Usa el valor indicado dentro de la función.',
                                           text=f'{before} = {format_value(value)}'))

        visit(parser.root)
        return result[:24]

    @classmethod
    def integral(cls, expr, variable, primitive):
        integral=s.Integral(expr,variable)
        if expr.is_Add and expr.is_polynomial(variable):
            terms=expr.as_ordered_terms()
            separated=s.Add(*(s.Integral(term,variable) for term in terms),evaluate=False)
            values=[]
            for term in terms:
                coefficient, dependent=term.as_independent(variable,as_Add=False)
                negative=coefficient.could_extract_minus_sign()
                coefficient=-coefficient if negative else coefficient
                sign='<mo>−</mo>' if negative else '<mo>+</mo>' if values else ''
                if dependent==1:
                    body=presentation_body(coefficient*variable)
                else:
                    exponent=2 if dependent==variable else dependent.exp+1
                    numerator=presentation_body(coefficient*variable**exponent)
                    body='<mfrac>'+numerator+presentation_body(exponent)+'</mfrac>'
                values.append(sign+body)
            return [
                cls.step('Separa los sumandos','Integra cada término por separado.',
                         s.Eq(integral,separated,evaluate=False)),
                cls.step('Integra cada término','Aumenta cada exponente en uno y divide por el nuevo exponente. Para una constante k, la primitiva es k por la variable.',
                         text=format_value(primitive),formula=equation_formula(presentation_body(separated),'<mrow>'+''.join(values)+'</mrow>')),
            ]
        substitution=cls.linear_substitution(expr,variable)
        if substitution:
            base,coefficient,power,slope=substitution
            name=next(name for name in ('u','t','w') if name not in {str(symbol) for symbol in expr.free_symbols})
            u=s.Symbol(name,real=True)
            ratio=coefficient/slope
            factor=presentation_body(ratio)+'<mo>&#x2062;</mo>' if ratio!=1 else ''
            change='<mrow>'+factor+presentation_body(s.Integral(u**power,u))+'</mrow>'
            result=s.log(s.Abs(u)) if power==-1 else u**(power+1)/(power+1)
            method='Aplica la regla del logaritmo a 1/'+str(u)+'.' if power==-1 else 'Aumenta el exponente en uno y divide por el nuevo exponente.'
            constant='<mo>+</mo><mi>C</mi>'
            return [
                cls.step('Elige la sustitución',f'Con {u} como expresión interior, d{u} = {format_value(slope)} d{variable}.',
                         s.Eq(u,base,evaluate=False)),
                cls.step('Cambia de variable',f'Escribe la integral con {u} y su diferencial.',
                         text=f'Integral en {u}',formula=equation_formula(presentation_body(integral),change)),
                cls.step('Integra en la nueva variable',method,text=format_value(ratio*result),
                         formula=equation_formula(change,'<mrow>'+factor+presentation_body(result)+'</mrow>')),
                cls.step('Vuelve a la variable original',f'Sustituye {u} por la expresión interior y añade la constante C.',
                         text=format_value(primitive)+' + C',
                         formula=equation_formula(presentation_body(integral),'<mrow>'+presentation_body(primitive)+constant+'</mrow>')),
            ]
        if expr.is_polynomial(variable):
            explanation=('La integral de una constante k es k por la variable.' if not expr.has(variable) else
                         'Aumenta el exponente en uno y divide por el nuevo exponente.')
            return [cls.step('Integra el término',explanation,s.Eq(integral,primitive,evaluate=False))]
        return []

    @staticmethod
    def linear_substitution(expr,variable):
        constant,dependent=expr.as_independent(variable,as_Add=False)
        base,power=dependent.as_base_exp()
        if power!=-1 and (power.is_integer is not True or power<=0):
            return None
        if not base.is_polynomial(variable):
            return None
        polynomial=s.Poly(base,variable)
        if polynomial.degree()!=1 or base==variable and power!=-1:
            return None
        return base,constant,power,polynomial.LC()

    @classmethod
    def derivative(cls, expr, variable):
        if not expr.has(variable):
            return [cls.step('Derivada de una constante','Una constante tiene derivada cero.',s.S.Zero)]
        if expr == variable:
            return [cls.step('Derivada de la variable','La derivada de la variable respecto de sí misma es 1.',s.S.One)]
        if expr.is_Add:
            terms = list(expr.args)
            return [
                cls.step('Linealidad','Deriva cada sumando y conserva la suma.', s.Add(*(s.Derivative(item, variable, evaluate=False) for item in terms),evaluate=False)),
                *[step for item in terms for step in cls.derivative(item,variable)],
                cls.step('Suma de derivadas','Reúne las derivadas de los sumandos.', s.diff(expr,variable))
            ]
        if expr.is_Mul:
            constant, dependent = expr.as_independent(variable,as_Add=False)
            if constant != 1:
                return [cls.step('Factor constante','Conserva el factor que no depende de la variable.',constant*s.Derivative(dependent,variable,evaluate=False)),
                        *cls.derivative(dependent,variable),
                        cls.step('Multiplicación final','Multiplica la derivada por el factor constante.',s.diff(expr,variable))]
            args = expr.args
            products = [s.Mul(*(s.Derivative(value,variable,evaluate=False) if j==i else value for j,value in enumerate(args))) for i in range(len(args))]
            return [cls.step('Regla del producto','En cada término deriva un factor y conserva los demás.',s.Add(*products,evaluate=False)),
                    cls.step('Evaluación de los términos','Calcula las derivadas que aparecen en la suma.',s.diff(expr,variable))]
        if expr.is_Pow and not expr.exp.has(variable):
            return [cls.step('Potencia y cadena','Multiplica el exponente por la base elevada a una unidad menos y por la derivada de la base.',
                             expr.exp*expr.base**(expr.exp-1)*s.Derivative(expr.base,variable,evaluate=False)),
                    cls.step('Simplificación','Evalúa la derivada de la base y simplifica.',s.diff(expr,variable))]
        if expr.func in {s.sin,s.cos,s.exp,s.log,s.tan} and len(expr.args)==1:
            arg=expr.args[0]
            outer={s.sin:s.cos(arg),s.cos:-s.sin(arg),s.exp:s.exp(arg),s.log:1/arg,s.tan:1/s.cos(arg)**2}[expr.func]
            return [cls.step('Regla de la cadena','Deriva la función exterior y multiplica por la derivada de su argumento.',
                             outer*s.Derivative(arg,variable,evaluate=False)),
                    cls.step('Simplificación','Evalúa el factor interior.',s.diff(expr,variable))]
        return []


class AbelResultValidator:
    @staticmethod
    def equivalent(a, b):
        if isinstance(a,s.MatrixBase) or isinstance(b,s.MatrixBase):
            return isinstance(a,s.MatrixBase) and isinstance(b,s.MatrixBase) and a.shape==b.shape and all(s.simplify(x-y)==0 for x,y in zip(a,b))
        if isinstance(a,s.Set) or isinstance(b,s.Set):
            return isinstance(a,s.Set) and isinstance(b,s.Set) and (a == b or a.symmetric_difference(b) == s.S.EmptySet)
        if isinstance(a,(tuple,s.Tuple)) or isinstance(b,(tuple,s.Tuple)):
            return isinstance(a,(tuple,s.Tuple)) and isinstance(b,(tuple,s.Tuple)) and len(a)==len(b) and all(AbelResultValidator.equivalent(x,y) for x,y in zip(a,b))
        if isinstance(a,(bool,s.logic.boolalg.BooleanAtom)) or isinstance(b,(bool,s.logic.boolalg.BooleanAtom)):
            return a == b
        return a == b or s.simplify(a-b)==0

    @staticmethod
    def finite_answers(result, equations, variables):
        if not isinstance(result,s.FiniteSet):
            return False
        for member in result:
            coordinates = tuple(member) if isinstance(member,(tuple,s.Tuple)) else (member,)
            if len(coordinates)!=len(variables):
                return False
            if any(s.simplify(eq.subs(dict(zip(variables,coordinates))))!=0 for eq in equations):
                return False
        return True


class AbelArithmeticEngine:
    @staticmethod
    def solve(problem):
        parser = AbelExpressionParser(problem)
        if isinstance(parser.root,ast.Call) and isinstance(parser.root.func,ast.Name) and parser.root.func.id in ARITHMETIC_CALLS:
            name,args=parser.call()
            n = 3 if name=='proporcion' else 1 if name=='primo' else 2
            if len(args)!=n or any(not isinstance(v,s.Expr) or v.is_real is not True or v.is_finite is not True for v in args):
                raise AbelInputError('La operación requiere '+str(n)+' valores reales finitos.')
            if name in {'mcd','mcm','primo'} and any(value.is_Integer is not True for value in args):
                raise AbelInputError('Esta operación requiere enteros.')
            if name=='primo':
                if abs(args[0])>10**12:
                    raise AbelInputError('Usa un entero de hasta 12 cifras para comprobar primalidad.')
                value=s.true if s.isprime(args[0]) else s.false
                rule='Primalidad'
                explanation='Un primo es un entero mayor que 1 con exactamente dos divisores positivos.'
                check='El motor comprobó si el entero cumple la definición de número primo.'
            elif name in {'mcd','mcm'}:
                a,b=map(abs,args)
                x,y=a,b
                steps=[]
                while y and len(steps)<80:
                    q,r=divmod(x,y)
                    if len(steps)<9:
                        steps.append(AbelStepGenerator.step('Algoritmo de Euclides','Sustituye el par por el divisor y el resto.',text=f'{x} = {q} × {y} + {r}'))
                    x,y=y,r
                    if len(steps)>=9:
                        break
                gcd=s.gcd(a,b)
                value=gcd if name=='mcd' else s.lcm(a,b)
                if name=='mcm':
                    steps.append(AbelStepGenerator.step('Relación entre MCD y MCM','Cuando ambos valores son distintos de cero, divide su producto por el MCD. Si alguno es cero, el MCM es cero.',value))
                return AbelSolution(problem,'Aritmética',value,'El MCD divide a los dos enteros. El MCM es un múltiplo común mínimo.',
                                f'MCD calculado: {gcd}. Se comprobó con el algoritmo de enteros.',steps,verified=True)
            elif name=='porcentaje':
                p,base=args
                value=p*base/100
                rule='Porcentaje'
                explanation='Convierte el porcentaje en una fracción de cien y multiplícala por la base.'
                check='Se verificó la igualdad 100 × resultado = porcentaje × base.'
            else:
                a,b,c=args
                if a==0:
                    raise AbelInputError('La primera cantidad de la proporción debe ser distinta de cero.')
                value=b*c/a
                rule='Proporción directa'
                explanation='Si a corresponde a b, la cantidad que corresponde a c se obtiene con b × c ÷ a.'
                check='Se comprobó la igualdad de los productos cruzados.'
            return AbelSolution(problem,'Aritmética',value,explanation,check,[AbelStepGenerator.step(rule,explanation,value)])
        expr=parser.scalar()
        if expr.free_symbols:
            raise AbelInputError('Para calcular un valor, sustituye las variables o elige una operación de álgebra.')
        steps=AbelStepGenerator.arithmetic(parser)
        return AbelSolution(problem,'Aritmética',expr,'Resuelve primero los grupos internos, luego potencias y productos o divisiones, y al final sumas y restas.',
                        'El cálculo utiliza valores exactos cuando es posible. Las fracciones conservan numerador y denominador.',steps)


class AbelAlgebraEngine:
    @staticmethod
    def solve(problem, operation):
        expr=AbelExpressionParser(problem).scalar()
        functions={'simplify':s.simplify,'expand':s.expand,'factor':s.factor}
        rules={
            'simplify':('Reducción algebraica','Combina términos equivalentes y reduce la expresión en su dominio original.'),
            'expand':('Propiedad distributiva','Multiplica los factores por los sumandos y reúne términos semejantes.'),
            'factor':('Factorización','Escribe el polinomio como un producto de factores.')
        }
        value=functions[operation](expr)
        rule,explanation=rules[operation]
        ok=AbelResultValidator.equivalent(value,expr)
        steps=[AbelStepGenerator.step(rule,explanation,value)] if ok and operation!='factor' else []
        if operation=='factor' and ok and expr.is_polynomial() and len(expr.free_symbols)==1:
            variable=next(iter(expr.free_symbols))
            coefficients=s.Poly(expr,variable).all_coeffs()
            if len(coefficients)==3 and coefficients[0]==1:
                a,b,c=coefficients
                roots=s.roots(expr,variable)
                if sum(roots.values())==2 and all(root.is_Integer for root in roots):
                    factors=[-root for root,multiplicity in roots.items() for _ in range(multiplicity)]
                    steps=[AbelStepGenerator.step('Buscar dos números','Para un trinomio mónico, busca dos números cuya suma sea el coeficiente lineal y cuyo producto sea el término independiente.',
                                               text=f'{factors[0]} + {factors[1]} = {b} · {factors[0]} × {factors[1]} = {c}'),
                           AbelStepGenerator.step('Escritura del producto','Construye los dos factores lineales.',value)]
        return AbelSolution(problem,'Álgebra',value,explanation,
                        'La diferencia simbólica se reduce a cero. Se conservan las restricciones de la expresión original.' if ok else 'No se obtuvo una comprobación simbólica independiente.',
                        steps,verified=ok)


RELATION = re.compile(r'(<=|>=|!=|=|<|>|≤|≥)')
def sides(problem):
    pieces=RELATION.split(problem)
    if len(pieces)!=3 or not pieces[0].strip() or not pieces[2].strip():
        raise AbelInputError('Escribe una sola relación, por ejemplo 2*x + 3 = 9.')
    a,operator,b=pieces
    return AbelExpressionParser(a),operator,AbelExpressionParser(b)


class AbelEquationEngine:
    @staticmethod
    def solve(problem, variable, operation):
        left,operator,right=sides(problem)
        a,b=left.scalar(),right.scalar()
        if (a.free_symbols|b.free_symbols)-{variable}:
            raise AbelInputError('Selecciona la variable que aparece en la relación o usa la opción Sistemas.')
        domain=left.domain(variable)&right.domain(variable)
        expr=a-b
        data={'Variable':str(variable),'Dominio real':format_value(domain)}
        steps=[AbelStepGenerator.step('Restar el segundo miembro','Traslada todos los términos al primer miembro.',text=f'{format_value(expr)} {operator} 0')]
        if operator!='=':
            comparison={'<':s.Lt,'>':s.Gt,'<=':s.Le,'>=':s.Ge,'≤':s.Le,'≥':s.Ge,'!=':s.Ne}[operator]
            relation=comparison(expr,0,evaluate=False)
            value=s.solve_univariate_inequality(relation,variable,relational=False,domain=s.S.Reals)&domain
            if expr.is_polynomial(variable) and s.Poly(expr,variable).degree()==1:
                slope,offset=s.Poly(expr,variable).all_coeffs()
                steps.append(AbelStepGenerator.step('Aislar la variable','Al dividir por un número negativo se invierte el sentido de la desigualdad.' if slope<0 else 'Al dividir por un número positivo se conserva el sentido de la desigualdad.',value))
            else:
                steps=[]
            return AbelSolution(problem,'Inecuación',value,'El resultado representa los valores reales que satisfacen la desigualdad.',
                            'Se obtuvo el conjunto solución de la relación y se intersectó con el dominio original.',steps,data,False)
        value=s.solveset(expr,variable,domain=domain)
        if expr.is_polynomial(variable):
            polynomial=s.Poly(expr,variable)
            if polynomial.degree()==1:
                slope,offset=polynomial.all_coeffs()
                steps.extend([
                    AbelStepGenerator.step('Despeje','Resta el término independiente en ambos miembros.',s.Eq(slope*variable,-offset,evaluate=False)),
                    AbelStepGenerator.step('División','Divide ambos miembros por el coeficiente distinto de cero.',s.Eq(variable,-offset/slope,evaluate=False))
                ])
                if a.is_polynomial(variable) and not b.has(variable) and s.Poly(a,variable).degree()==1 and a.subs(variable,0).is_real:
                    constant=a.subs(variable,0)
                    term=format_value(slope*variable)
                    target=format_value(b-constant)
                    if constant:
                        verb,sign=('Resta','−') if constant>0 else ('Suma','+')
                        n=format_value(abs(constant))
                        working=f'({format_value(a)}) {sign} {n} = {format_value(b)} {sign} {n}'
                        simplified=f'{term} = {target}'
                        steps=[AbelStepGenerator.step(f'{verb} {n} en ambos lados','Deja el término con la letra en el lado izquierdo.',
                                                  text=working+'  →  '+simplified,
                                                  formula=relation_steps(working,simplified))]
                    else:
                        steps=[]
                    answer=format_value(-offset/slope)
                    if slope!=1:
                        by=format_value(slope)
                        working=f'({term}) ÷ ({by}) = ({target}) ÷ ({by})'
                        simplified=f'{variable} = {answer}'
                        steps.append(AbelStepGenerator.step(f'Divide ambos lados entre {by}','Así queda sola la letra.',
                                                        text=f'{term} ÷ ({by}) = {target} ÷ ({by})  →  {variable} = {answer}',
                                                        formula=relation_steps(working,simplified)))
                    substituted=re.sub(r'\b'+str(variable)+r'\b',lambda _:f'({answer})',format_value(a))
                    working=f'{substituted} = {format_value(b)}'
                    simplified=f'{format_value(a.subs(variable,-offset/slope))} = {format_value(b)}'
                    steps.append(AbelStepGenerator.step('Prueba tu respuesta',f'Cambia {variable} por {answer} en la ecuación original.',
                                                    text=working+'  →  '+simplified,
                                                    formula=relation_steps(working,simplified)))
            elif polynomial.degree()==2:
                q,p,r=polynomial.all_coeffs()
                discriminant=p**2-4*q*r
                steps.append(AbelStepGenerator.step('Discriminante','Calcula b² − 4ac para determinar las raíces reales.',text=f'Δ = ({p})² − 4({q})({r}) = {format_value(discriminant)}'))
                if discriminant>=0:
                    roots=[s.simplify((-p+sign*s.sqrt(discriminant))/(2*q)) for sign in (-1,1)]
                    steps.append(AbelStepGenerator.step('Fórmula cuadrática','Aplica x = (−b ± √Δ) / (2a) y conserva las raíces del dominio.',s.FiniteSet(*roots)&domain))
                else:
                    steps.append(AbelStepGenerator.step('Discriminante negativo','La ecuación cuadrática no tiene raíces reales.',s.S.EmptySet))
            else:
                steps=[]
        else:
            steps=[]
        ok=AbelResultValidator.finite_answers(value,[expr],[variable]) or (
            value==s.S.EmptySet and expr.is_polynomial(variable) and s.Poly(expr,variable).degree()==2
            and s.discriminant(expr,variable)<0
        )
        return AbelSolution(problem,'Trigonometría' if operation=='trig_equation' else 'Ecuación',value,
                        'Busca los valores del dominio para los que ambos miembros coinciden.',
                        'Las soluciones finitas se comprobaron en la ecuación y en el dominio.' if ok else 'El resultado es un conjunto simbólico. La comprobación independiente queda pendiente.',
                        steps,data,ok)

    @staticmethod
    def system(problem):
        equations=[]
        for relation in problem.split(';'):
            left,operator,right=sides(relation)
            if operator!='=':
                raise AbelInputError('Un sistema debe contener ecuaciones separadas por punto y coma.')
            for parser in (left,right):
                if any(isinstance(node,ast.BinOp) and isinstance(node.op,ast.Div) and parser.scalar(node.right).free_symbols for node in ast.walk(parser.root)):
                    raise AbelInputError('Para sistemas usa ecuaciones polinómicas, sin variables en el denominador.')
            equations.append(left.scalar()-right.scalar())
        variables=sorted(set().union(*(eq.free_symbols for eq in equations)),key=str)
        if not 2<=len(equations)<=4 or not 2<=len(variables)<=4:
            raise AbelInputError('El sistema debe tener de 2 a 4 ecuaciones y de 2 a 4 variables.')
        if not all(equation.is_polynomial(*variables) for equation in equations):
            raise AbelInputError('Escribe un sistema polinómico.')
        steps=[]
        try:
            matrix,constants=s.linear_eq_to_matrix(equations,variables)
            value=s.linsolve((matrix,constants),variables)
            if matrix.shape==(2,2) and matrix.det()!=0:
                steps.append(AbelStepGenerator.step('Forma matricial','Organiza los coeficientes en A y los términos independientes en b.',matrix))
                determinant=matrix.det()
                steps.append(AbelStepGenerator.step('Determinante distinto de cero','La matriz tiene inversa y el sistema tiene una única solución.',determinant))
                for i,variable in enumerate(variables):
                    replaced=matrix.copy()
                    replaced[:,i]=constants
                    steps.append(AbelStepGenerator.step('Regla de Cramer','Divide el determinante con la columna reemplazada por det(A).',s.Eq(variable,replaced.det()/determinant,evaluate=False)))
        except NonlinearError:
            value=s.nonlinsolve(equations,variables)
        if isinstance(value,s.FiniteSet):
            value=s.FiniteSet(*(item for item in value if all(component.is_real is not False for component in item)))
        ok=AbelResultValidator.finite_answers(value,equations,variables)
        return AbelSolution(problem,'Sistema de ecuaciones',value,'Las coordenadas siguen el orden de variables indicado.',
                        'Se sustituyeron las coordenadas en todas las ecuaciones.' if ok else 'La comprobación independiente no está disponible para este conjunto.',steps,
                        {'Variables':', '.join(map(str,variables))},ok)


class AbelGeometryEngine:
    @staticmethod
    def solve(problem):
        name,args=AbelExpressionParser(problem).call()
        required=4 if name=='distancia' else 3 if name=='volumen_caja' else 1 if name in {'grados','area_circulo'} else 2
        if name not in GEOMETRY_CALLS or len(args)!=required or any(not isinstance(v,s.Expr) or v.is_real is not True or v.is_finite is not True for v in args):
            raise AbelInputError('Revisa la fórmula y usa medidas reales finitas.')
        if name not in {'distancia','grados'} and any(v<=0 for v in args):
            raise AbelInputError('Las longitudes deben ser positivas.')
        a=args[0]
        b=args[1] if len(args)>1 else None
        if name=='perimetro_rect':
            label,formula,result='Perímetro del rectángulo',f'2 × ({a} + {b})',2*(a+b)
        elif name=='area_rect':
            label,formula,result='Área del rectángulo',f'{a} × {b}',a*b
        elif name=='area_triangulo':
            label,formula,result='Área del triángulo',f'{a} × {b} ÷ 2',a*b/2
        elif name=='area_circulo':
            label,formula,result='Área del círculo',f'π × {a}²',s.pi*a**2
        elif name=='volumen_caja':
            label,formula,result='Volumen del prisma rectangular',f'{a} × {b} × {args[2]}',a*b*args[2]
        elif name=='pitagoras':
            label,formula,result='Teorema de Pitágoras',f'√({a}² + {b}²)',s.sqrt(a**2+b**2)
        elif name=='distancia':
            label,formula,result='Distancia entre dos puntos',f'√(({args[2]} − {a})² + ({args[3]} − {b})²)',s.sqrt((args[2]-a)**2+(args[3]-b)**2)
        else:
            label,formula,result='Grados a radianes',f'{a} × π ÷ 180',a*s.pi/180
        return AbelSolution(problem,'Geometría' if name!='grados' else 'Trigonometría',result,
                        'Sustituye los datos en la fórmula y respeta las unidades del problema.',
                        'Se evaluó la fórmula con los valores exactos introducidos.',
                        [AbelStepGenerator.step(label,'Coloca las medidas en la fórmula.',text=formula),
                         AbelStepGenerator.step('Calcula','Resuelve la operación.',text=f'{formula} = {format_value(result)}')],
                        {'Datos':', '.join(map(format_value,args))})


class AbelTrigonometryEngine:
    @staticmethod
    def solve(problem, variable, argument):
        if '=' in problem:
            result=AbelEquationEngine.solve(problem,variable,'trig_equation')
            if argument.strip():
                lower,upper=scalar_list(argument,2)
                if lower>=upper:
                    raise AbelInputError('El extremo inferior debe ser menor que el superior.')
                left,_,right=sides(problem)
                domain=s.Interval.Ropen(lower,upper)&left.domain(variable)&right.domain(variable)
                result.value=s.solveset(left.scalar()-right.scalar(),variable,domain=domain)
                result.data['Intervalo']=format_value(domain)
                result.verified=AbelResultValidator.finite_answers(result.value,[left.scalar()-right.scalar()],[variable])
                result.verification=('Se sustituyó cada solución en la ecuación y se comprobó el intervalo.' if result.verified else
                                     'Se consultó el conjunto solución en ese intervalo. La comprobación independiente queda pendiente.')
                result.steps=[]
            return result
        expr=AbelExpressionParser(problem).scalar()
        value=s.trigsimp(expr)
        ok=s.trigsimp(expr-value)==0
        steps=[]
        if value==1 and expr.has(s.sin) and expr.has(s.cos):
            for sine in expr.atoms(s.sin):
                angle=sine.args[0]
                if s.expand(expr-(s.sin(angle)**2+s.cos(angle)**2))==0:
                    steps=[AbelStepGenerator.step('Identidad pitagórica','El seno al cuadrado más el coseno al cuadrado del mismo ángulo da uno.',value)]
        return AbelSolution(problem,'Trigonometría',value,'Trabaja en radianes salvo que conviertas de grados.',
                        'La diferencia se reduce a cero por simplificación trigonométrica.' if ok else 'La comprobación independiente queda pendiente.',steps,verified=ok)


class AbelFunctionEngine:
    @staticmethod
    def solve(problem,variable,argument):
        expr=AbelExpressionParser(problem).scalar()
        point=AbelExpressionParser(argument).scalar()
        if point.free_symbols or point.is_finite is not True:
            raise AbelInputError('Introduce un punto numérico finito.')
        if point not in AbelExpressionParser(problem).domain(variable):
            raise AbelInputError('El punto está fuera del dominio real de la expresión.')
        value=expr.subs(variable,point)
        return AbelSolution(problem,'Función',value,'Evaluar una función significa reemplazar su variable por un valor del dominio.',
                        'Se sustituyó el punto en la expresión original.',
                        [AbelStepGenerator.step('Sustitución',f'Reemplaza {variable} por {format_value(point)}.',value)],
                        {'Variable':str(variable),'Punto':format_value(point)})


def scalar_list(argument,count):
    items=str(argument).split(',')
    if len(items)!=count:
        raise AbelInputError(f'Escribe {count} valores separados por coma.')
    result=[AbelExpressionParser(item).scalar() for item in items]
    if any(value.free_symbols or value.is_extended_real is not True for value in result):
        raise AbelInputError('Usa valores reales o infinito cuando corresponda.')
    return result


class AbelCalculusEngine:
    @staticmethod
    def solve(problem,operation,variable,argument):
        if operation=='ode':
            return AbelCalculusEngine.ode(problem,variable)
        parser=AbelExpressionParser(problem)
        expr=parser.scalar()
        data={'Variable':str(variable)}
        steps=[]
        verified=False
        suffix=''
        approach=None
        verification='Cálculo simbólico. La comprobación independiente no está disponible para esta entrada.'
        if operation=='derivative':
            value=s.diff(expr,variable)
            steps=AbelStepGenerator.derivative(expr,variable)[:24]
            verified=bool(steps) and s.simplify(s.Derivative(expr,variable,evaluate=False).doit()-value)==0
            verification='Las transformaciones se contrastaron con la derivada simbólica.' if verified else verification
            explanation='La derivada mide la tasa de cambio de la expresión respecto a la variable.'
        elif operation=='integral':
            substitution=AbelStepGenerator.linear_substitution(expr,variable)
            if substitution and substitution[2]==-1:
                base,coefficient,_,slope=substitution
                nonzero=s.Dummy(real=True,nonzero=True)
                logarithm=coefficient/slope*s.log(s.Abs(nonzero))
                antiderivative=logarithm.subs(nonzero,base)
                derivative_ok=s.simplify(s.diff(logarithm,nonzero)*slope-coefficient/nonzero)==0
            else:
                antiderivative=s.integrate(expr,variable)
                derivative_ok=not antiderivative.has(s.Integral) and s.simplify(s.diff(antiderivative,variable)-expr)==0
            if argument.strip():
                lower,upper=scalar_list(argument,2)
                value=s.integrate(expr,(variable,lower,upper))
                explanation='Una integral definida representa la acumulación con signo entre dos extremos.'
                data['Intervalo']=f'{format_value(lower)}, {format_value(upper)}'
                if lower.is_finite and upper.is_finite and derivative_ok and value.is_finite:
                    interval=s.Interval(min(lower,upper),max(lower,upper))
                    domain=parser.domain(variable)
                    if interval.is_subset(domain):
                        evaluated=antiderivative.subs(variable,upper)-antiderivative.subs(variable,lower)
                        verified=s.simplify(evaluated-value)==0
                        if verified:
                            integral=presentation_body(s.Integral(expr,(variable,lower,upper)))
                            primitive_formula=presentation_body(antiderivative)
                            at_bounds=('<msubsup><mrow><mo>[</mo>'+primitive_formula+'<mo>]</mo></mrow>'+
                                       presentation_body(lower)+presentation_body(upper)+'</msubsup>')
                            upper_value=antiderivative.subs(variable,upper)
                            lower_value=antiderivative.subs(variable,lower)
                            difference='<mrow>'+presentation_body(upper_value)+'<mo>−</mo><mo>(</mo>'+presentation_body(lower_value)+'<mo>)</mo></mrow>'
                            steps=[
                                AbelStepGenerator.step('Encuentra la primitiva','Integra respecto a la variable antes de sustituir los límites.',
                                                   s.Eq(s.Function('F')(variable),antiderivative,evaluate=False)),
                                AbelStepGenerator.step('Evalúa en los límites','Resta el valor en el límite inferior al valor en el límite superior.',
                                                   text=f'F({upper}) − F({lower})',formula=equation_formula(integral,at_bounds)),
                                AbelStepGenerator.step('Calcula la diferencia','Sustituye ambos límites y simplifica.',
                                                   text=format_value(evaluated),formula=equation_formula(difference,presentation_body(evaluated))),
                            ]
                            verification='Se derivó la primitiva y se comprobó la diferencia de sus valores en los extremos.'
            else:
                value=antiderivative
                verified=derivative_ok
                explanation='Una primitiva es una función cuya derivada coincide con el integrando.'
                if verified:
                    suffix=' + C'
                    verification='Al derivar el resultado se recupera el integrando.'
                    steps=AbelStepGenerator.integral(expr,variable,value)
                    if steps and steps[-1]['rule']!='Vuelve a la variable original':
                        steps.append(AbelStepGenerator.step('Añade la constante','Todas las primitivas difieren en una constante en cada intervalo del dominio.',
                                                        text=format_value(value)+suffix,
                                                        formula=equation_formula(presentation_body(s.Integral(expr,variable)),
                                                            '<mrow>'+presentation_body(value)+'<mo>+</mo><mi>C</mi></mrow>')))
        elif operation in {'limit','continuity'}:
            point=AbelExpressionParser(argument).scalar()
            if point.free_symbols or point.is_extended_real is not True:
                raise AbelInputError('El punto del límite debe ser real o infinito.')
            data['Punto']=format_value(point)
            if point.is_finite:
                left=s.limit(expr,variable,point,dir='-')
                right=s.limit(expr,variable,point,dir='+')
                same=left==right
                evaluated=expr.subs(variable,point)
                steps=[AbelStepGenerator.step('Límite por la izquierda','Considera valores menores que el punto.',left),
                       AbelStepGenerator.step('Límite por la derecha','Considera valores mayores que el punto.',right)]
                if operation=='continuity':
                    value=s.true if same and left.is_finite and evaluated==left and point in parser.domain(variable) else s.false
                    verified=True
                    explanation='Hay continuidad si ambos límites coinciden y su valor es igual al de la función en el punto.'
                    verification='Se compararon los dos límites laterales y el valor de la función en el punto.'
                elif not same:
                    raise AbelInputError('El límite bilateral no existe. Izquierda: '+format_value(left)+' · Derecha: '+format_value(right)+'.')
                else:
                    value=left
                    verified=not value.has(s.Limit)
                    explanation='El límite describe a qué valor se aproxima la función.'
                    verification='Se comprobaron por separado los dos límites laterales.' if verified else verification
                    steps,approach=AbelCalculusEngine.removable_limit(parser,expr,variable,point,value,steps)
            elif operation=='limit':
                value=s.limit(expr,variable,point)
                explanation='Un límite en infinito describe cómo se comporta la función cuando la variable crece en magnitud.'
            else:
                raise AbelInputError('Comprueba la continuidad en un punto finito.')
        else:
            names=[name.strip() for name in argument.split(',')] if argument.strip() else sorted(map(str,expr.free_symbols))
            if not names or len(names)>4 or len(set(names))!=len(names) or any(name not in SYMBOLS for name in names):
                raise AbelInputError('Indica de una a cuatro variables distintas, como x,y.')
            data['Variables']=', '.join(names)
            value=s.Tuple(*(s.diff(expr,SYMBOLS[name]) for name in names))
            steps=[AbelStepGenerator.step('Derivada parcial',f'Deriva respecto de {name} manteniendo fijas las otras variables.',component)
                   for name,component in zip(names,value)]
            verified=True
            verification='Cada componente se contrastó con su derivada parcial simbólica.'
            explanation='El gradiente ordena las derivadas parciales según las variables indicadas.'
        return AbelSolution(problem,'Cálculo',value,explanation,verification,steps,data,verified,suffix,approach)

    @staticmethod
    def removable_limit(parser,expr,variable,point,value,original_steps):
        if not isinstance(parser.root,ast.BinOp) or not isinstance(parser.root.op,ast.Div):
            return original_steps,None
        numerator=parser.scalar(parser.root.left)
        denominator=parser.scalar(parser.root.right)
        if not (numerator.subs(variable,point)==0 and denominator.subs(variable,point)==0):
            return original_steps,None
        reduced=s.cancel(expr)
        if reduced.subs(variable,point)!=value or value.is_finite is not True:
            return original_steps,None
        numerator_factored=s.factor(numerator)
        denominator_factored=s.factor(denominator)
        p=format_value(point)
        simplified=format_value(reduced)
        substituted=re.sub(r'\b'+str(variable)+r'\b',lambda _:p if point.is_Integer and point>=0 else f'({p})',simplified)
        steps=[
            AbelStepGenerator.step(f'Prueba con {variable} = {p}','Arriba y abajo da cero. Esa división no da el límite.',text='0 ÷ 0',
                               formula=math_markup('<mfrac><mn>0</mn><mn>0</mn></mfrac>')),
            AbelStepGenerator.step('Factoriza y simplifica',f'Cancela los factores comunes para valores cercanos con {variable} ≠ {p}.',
                               text=f'({format_value(numerator_factored)}) ÷ ({format_value(denominator_factored)})  →  {simplified}',
                               formula=equation_formula('<mfrac>'+presentation_body(numerator_factored)+presentation_body(denominator_factored)+'</mfrac>',
                                                        presentation_body(reduced))),
            AbelStepGenerator.step(f'Acércate a {p}',f'Evalúa la expresión simplificada en {variable} = {p}.',
                               text=f'{substituted} = {format_value(value)}',
                               formula=equation_formula(expression_markup(substituted),presentation_body(value)))
        ]
        if (not reduced.is_polynomial(variable) or s.degree(reduced,variable)!=1 or
            not denominator.is_polynomial(variable) or s.degree(denominator,variable)!=1 or
            not (point.is_Integer and value.is_Integer)):
            return steps,None
        offset=s.Rational(1,10)
        samples=[]
        for sample in (point-offset,point+offset):
            y=reduced.subs(variable,sample)
            if y.is_Rational is not True:
                return steps,None
            coordinates=[str(s.N(number,10)) for number in (sample,y)]
            x_label,y_label=[label.rstrip('0').rstrip('.') if '.' in label and 'e' not in label else label
                             for label in coordinates]
            samples.append({'x':x_label,'y':y_label})
        approach={'x':p,'y':format_value(value),'slope':1 if reduced.diff(variable)>0 else -1,'samples':samples}
        return steps,approach

    @staticmethod
    def ode(problem,variable):
        parts=problem.split('=',1)
        if len(parts)!=2 or parts[0].strip() not in {"y'","dy/d"+str(variable)}:
            raise AbelInputError("Escribe una ecuación explícita de primer orden, por ejemplo y' = 2*y.")
        function=s.Function('y')(variable)
        right=AbelExpressionParser(parts[1]).scalar(symbolic_function=True).subs(SYMBOLS['y'],function)
        if right.free_symbols-{variable}:
            raise AbelInputError('Usa solo la variable independiente y la función y.')
        eq=s.Eq(s.diff(function,variable),right)
        try:
            answer=s.dsolve(eq,function)
            checked=s.checkodesol(eq,answer,function)[0] if isinstance(answer,s.Equality) else False
        except (NotImplementedError,ValueError) as error:
            raise AbelInputError('El motor no encontró una solución explícita para esta ecuación.') from error
        if not isinstance(answer,s.Equality):
            raise AbelInputError('Esta entrada produjo varias ramas y requiere un análisis adicional.')
        return AbelSolution(problem,'Ecuación diferencial',answer,'La solución es una función. C1 representa una constante de integración.',
                        'La solución se sustituyó en la ecuación diferencial.' if checked else 'La comprobación simbólica no concluyó.',
                        [],{'Variable':str(variable)},checked)


class AbelStatisticsEngine:
    @staticmethod
    def solve(problem):
        name,args=AbelExpressionParser(problem).call()
        if name not in STATS_CALLS:
            raise AbelInputError('Usa media, mediana, moda, varianza, desviacion o probabilidad.')
        if name=='probabilidad':
            if len(args)!=2 or any(not isinstance(item,s.Integer) for item in args):
                raise AbelInputError('Escribe probabilidad(casos_favorables, casos_totales) con enteros.')
            favorable,total=args
            if total<=0 or not 0<=favorable<=total:
                raise AbelInputError('El total debe ser positivo y los casos favorables deben estar entre cero y el total.')
            value=favorable/total
            explanation='Con casos equiprobables, divide los casos favorables por el total de casos.'
            return AbelSolution(problem,'Probabilidad',value,explanation,'La fracción se simplificó exactamente.',[AbelStepGenerator.step('Casos equiprobables',explanation,value)])
        if len(args)!=1 or not isinstance(args[0],list) or not args[0] or any(not isinstance(value,s.Expr) or value.is_finite is not True or value.is_real is not True for value in args[0]):
            raise AbelInputError('Introduce una lista no vacía de números reales, como media([2, 4, 6]).')
        values=args[0]
        total=sum(values,s.S.Zero)
        count=len(values)
        mean=total/count
        if name=='media':
            answer=mean
            steps=[AbelStepGenerator.step('Sumar los datos','Suma todas las observaciones.',total),
                   AbelStepGenerator.step('Dividir por la cantidad','Divide la suma por el número de observaciones.',mean)]
        elif name=='mediana':
            ordered=sorted(values)
            answer=(ordered[(count-1)//2]+ordered[count//2])/2
            steps=[AbelStepGenerator.step('Ordenar los datos','Organiza los valores de menor a mayor.',s.Tuple(*ordered)),
                   AbelStepGenerator.step('Centro','Si hay dos valores centrales, toma su promedio.',answer)]
        elif name=='moda':
            frequencies={value:values.count(value) for value in values}
            modes=[value for value, frequency in frequencies.items() if frequency==max(frequencies.values())]
            if len(modes)!=1:
                raise AbelInputError('Esta operación requiere una lista con una sola moda.')
            answer=modes[0]
            steps=[AbelStepGenerator.step('Contar repeticiones','Cuenta cuántas veces aparece cada valor.',
                                      text=', '.join(f'{value} aparece {frequency} veces' for value,frequency in frequencies.items())),
                   AbelStepGenerator.step('Elegir el más frecuente','El dato que aparece más veces es la moda.',answer)]
        else:
            variance=sum((value-mean)**2 for value in values)/count
            answer=s.sqrt(variance) if name=='desviacion' else variance
            steps=[AbelStepGenerator.step('Media','Calcula el promedio de las observaciones.',mean),
                   AbelStepGenerator.step('Varianza poblacional','Promedia los cuadrados de las diferencias respecto a la media.',variance)]
            if name=='desviacion':
                steps.append(AbelStepGenerator.step('Raíz cuadrada','Toma la raíz de la varianza.',answer))
        explanation = {
            'media':'La media reparte el total en partes iguales.',
            'mediana':'La mediana está en el centro de los datos ordenados.',
            'moda':'La moda es el dato de mayor frecuencia.'
        }.get(name,'La varianza de este módulo usa la fórmula poblacional, con divisor n.')
        return AbelSolution(problem,'Estadística',answer,explanation,
                        'Se evaluó la definición con aritmética exacta.',steps,{'Observaciones':str(count)})


class AbelLinearAlgebraEngine:
    @staticmethod
    def matrix(value):
        if not isinstance(value,list) or not value or not all(isinstance(row,list) for row in value):
            raise AbelInputError('Escribe una matriz como [[1, 2], [3, 4]].')
        if len(value)>5 or not 1<=len(value[0])<=5 or any(len(row)!=len(value[0]) for row in value) or any(not isinstance(item,s.Expr) for row in value for item in row):
            raise AbelInputError('Usa matrices rectangulares de hasta 5 por 5.')
        return s.Matrix(value)

    @staticmethod
    def solve(problem):
        name,args=AbelExpressionParser(problem).call()
        required=2 if name in {'punto','matmul','matsuma'} else 1
        if name not in MATRIX_CALLS or len(args)!=required:
            raise AbelInputError('Revisa el número de argumentos de la operación matricial.')
        if name in {'punto','norma'}:
            if any(not isinstance(vec,list) or not vec or any(not isinstance(value,s.Expr) for value in vec) for vec in args):
                raise AbelInputError('Escribe vectores como [1, 2, 3].')
            a=s.Matrix(args[0])
            if name=='norma':
                value=s.sqrt(a.dot(a))
                text='Suma los cuadrados de las componentes y toma la raíz cuadrada.'
            else:
                b=s.Matrix(args[1])
                if len(a)!=len(b):
                    raise AbelInputError('Los vectores deben tener el mismo número de componentes.')
                value=a.dot(b)
                text='Multiplica las componentes correspondientes y suma los productos.'
            return AbelSolution(problem,'Vectores',value,text,'La operación se comprobó con la definición del producto escalar.',
                            [AbelStepGenerator.step('Componentes',text,value)])
        a=AbelLinearAlgebraEngine.matrix(args[0])
        steps=[]
        if name in {'det','inversa'} and a.rows!=a.cols:
            raise AbelInputError('Esta operación requiere una matriz cuadrada.')
        if name=='det':
            value=a.det()
            if a.shape==(2,2):
                steps=[AbelStepGenerator.step('Determinante 2×2','Resta el producto de la diagonal secundaria al de la diagonal principal.',
                                           text=f'({a[0,0]})({a[1,1]}) − ({a[0,1]})({a[1,0]}) = {format_value(value)}')]
            check=a.det(method='berkowitz')==value
            verification='Se contrastó el determinante con el algoritmo de Berkowitz.'
        elif name=='inversa':
            if a.det()==0:
                raise AbelInputError('La matriz es singular y no tiene inversa.')
            value=a.inv()
            check=AbelResultValidator.equivalent(a*value,s.eye(a.rows))
            verification='El producto A·A⁻¹ es la identidad.'
        elif name=='transpuesta':
            value=a.T
            check=value.T==a
            verification='Al transponer de nuevo se obtiene la matriz original.'
            steps=[AbelStepGenerator.step('Transposición','Intercambia filas por columnas.',value)]
        else:
            b=AbelLinearAlgebraEngine.matrix(args[1])
            if name=='matsuma':
                if a.shape!=b.shape:
                    raise AbelInputError('Para sumar, las matrices deben tener las mismas dimensiones.')
                value=a+b
                check=AbelResultValidator.equivalent(value-b,a)
                verification='Al restar la segunda matriz se recupera la primera.'
                steps=[AbelStepGenerator.step('Suma de entradas','Suma las entradas en la misma posición.',value)]
            else:
                if a.cols!=b.rows:
                    raise AbelInputError('Las columnas de A deben coincidir con las filas de B.')
                value=a*b
                explicit=s.Matrix(a.rows,b.cols,lambda i,j:sum(a[i,k]*b[k,j] for k in range(a.cols)))
                check=AbelResultValidator.equivalent(value,explicit)
                verification='Cada entrada se comprobó con el producto fila por columna.'
                steps=[AbelStepGenerator.step('Producto matricial','Cada entrada es el producto escalar de una fila de A y una columna de B.',value)]
        return AbelSolution(problem,'Álgebra lineal',value,'Las dimensiones determinan qué operaciones son válidas.',
                        verification if check else 'La comprobación independiente no concluyó.',steps,
                        {'Dimensión':f'{a.rows} × {a.cols}'},check)


def solve_problem(problem, operation='auto', variable='x', argument=''):
    problem=str(problem).strip()
    if not problem or len(problem)>600:
        raise AbelInputError('Introduce un problema de hasta 600 caracteres.')
    if operation not in OPERATIONS or variable not in SYMBOLS:
        raise AbelInputError('Elige una operación y una variable admitidas.')
    symbol=SYMBOLS[variable]
    if operation=='auto':
        prefix=re.match(r'([a-z_]+)\s*\(',problem,re.I)
        command=prefix.group(1) if prefix else ''
        if ';' in problem:
            operation='system'
        elif re.match(r"^(?:y'|dy/d[a-z])\s*=",problem):
            operation='ode'
        elif RELATION.search(problem):
            operation='trig_equation' if re.search(r'\b(?:sin|cos|tan)\(',problem) and '=' in problem else 'equation'
        elif command in GEOMETRY_CALLS:
            operation='geometry'
        elif command in STATS_CALLS:
            operation='statistics'
        elif command in MATRIX_CALLS:
            operation='matrix'
        elif command in ARITHMETIC_CALLS:
            operation='arithmetic'
        else:
            expression=AbelExpressionParser(problem).scalar()
            operation='simplify' if expression.free_symbols else 'arithmetic'
    if operation=='arithmetic':
        return AbelArithmeticEngine.solve(problem)
    if operation in {'simplify','expand','factor'}:
        return AbelAlgebraEngine.solve(problem,operation)
    if operation in {'equation','inequality'}:
        return AbelEquationEngine.solve(problem,symbol,operation)
    if operation=='system':
        return AbelEquationEngine.system(problem)
    if operation=='geometry':
        return AbelGeometryEngine.solve(problem)
    if operation in {'trig','trig_equation'}:
        return AbelTrigonometryEngine.solve(problem,symbol,argument)
    if operation=='function':
        return AbelFunctionEngine.solve(problem,symbol,argument)
    if operation in {'limit','continuity','derivative','integral','gradient','ode'}:
        return AbelCalculusEngine.solve(problem,operation,symbol,argument)
    if operation=='statistics':
        return AbelStatisticsEngine.solve(problem)
    return AbelLinearAlgebraEngine.solve(problem)


def verify_answer(answer, solution, operation, variable='x', argument=''):
    value=solution.value
    answer=str(answer).strip()
    if not answer:
        raise AbelInputError('Escribe tu respuesta.')
    if answer==format_value(value):
        return True
    if isinstance(value,s.logic.boolalg.BooleanAtom):
        normalized=answer.casefold()
        if normalized in {'sí','si','verdadero','true'}:
            return value==s.true
        if normalized in {'no','falso','false'}:
            return value==s.false
        return False
    if isinstance(value,s.Set):
        if value==s.S.EmptySet and answer.lower() in {'ninguna','vacío','vacio','∅'}:
            return True
        if isinstance(value,s.Interval) and RELATION.search(answer):
            candidate=AbelEquationEngine.solve(answer,SYMBOLS[variable],'inequality').value
            return AbelResultValidator.equivalent(value,candidate)
        if isinstance(value,s.FiniteSet):
            cleaned=answer.strip('{}')
            if all(isinstance(item,s.Tuple) for item in value):
                cleaned=cleaned if cleaned.startswith('(') else '('+cleaned+')'
                parsed=AbelExpressionParser(cleaned).parse()
                if not isinstance(parsed,list):
                    return False
                candidates=parsed if parsed and isinstance(parsed[0],list) else [parsed]
                candidate=s.FiniteSet(*(s.Tuple(*item) for item in candidates))
            else:
                items=AbelExpressionParser('['+cleaned+']').parse()
                if any(not isinstance(item,s.Expr) for item in items):
                    return False
                candidate=s.FiniteSet(*items)
            return AbelResultValidator.equivalent(value,candidate)
        match=re.fullmatch(r'([\[(])(.+),(.+)([\])])',answer)
        if match and isinstance(value,s.Interval):
            a,b=scalar_list(match.group(2)+','+match.group(3),2)
            interval=s.Interval(a,b,left_open=match.group(1)=='(',right_open=match.group(4)==')')
            return AbelResultValidator.equivalent(value,interval)
        return False
    if isinstance(value,s.MatrixBase):
        return AbelResultValidator.equivalent(value,AbelLinearAlgebraEngine.matrix(AbelExpressionParser(answer).parse()))
    if isinstance(value,s.Tuple):
        normalized=answer if answer.startswith(('[','(')) else '['+answer+']'
        parsed=AbelExpressionParser(normalized).parse()
        return isinstance(parsed,list) and AbelResultValidator.equivalent(value,s.Tuple(*parsed))
    if isinstance(value,s.Equality):
        candidate=answer.split('=',1)[-1].replace('C1','c').replace('C','c')
        expected=value.rhs.subs(s.Symbol('C1'),SYMBOLS['c'])
        return AbelResultValidator.equivalent(expected,AbelExpressionParser(candidate).scalar())
    parser=AbelExpressionParser(answer.replace('C','c') if operation=='integral' else answer)
    candidate=parser.scalar()
    if operation=='integral' and not argument.strip():
        return s.simplify(s.diff(candidate-value,SYMBOLS[variable]))==0
    if operation=='expand':
        for node in ast.walk(parser.root):
            if not isinstance(node,ast.BinOp):
                continue
            additive=lambda part: isinstance(part,ast.BinOp) and isinstance(part.op,(ast.Add,ast.Sub))
            if isinstance(node.op,ast.Mult) and (additive(node.left) or additive(node.right)):
                return False
            if isinstance(node.op,ast.Pow) and additive(node.left):
                return False
    if operation=='factor' and value.is_polynomial() and value.free_symbols:
        needs_product=value.is_Mul or (value.is_Pow and value.exp.is_Integer and value.exp>1)
        if needs_product and not (candidate.is_Mul or candidate.is_Pow):
            return False
    return AbelResultValidator.equivalent(value,candidate)


def feedback_for(answer,solution,correct):
    if correct:
        return {'type':'Correcto','message':'Tu respuesta es equivalente al resultado del motor.'}
    kind=solution.kind
    hint={
        'Aritmética':'Comprueba el signo, la prioridad de las operaciones y si redujiste la fracción.',
        'Ecuación':'Sustituye tu resultado en ambos miembros y compara. Si hay varias raíces, escríbelas todas.',
        'Inecuación':'Revisa el sentido de la desigualdad al dividir por un número negativo y si el extremo está incluido.',
        'Sistema de ecuaciones':'Sustituye tu par de valores en las dos ecuaciones y revisa el orden de las variables.',
        'Cálculo':'Identifica primero la regla que corresponde a la operación. Revisa los coeficientes y la variable.',
        'Álgebra lineal':'Comprueba el orden de las filas y columnas y los signos en cada entrada.'
    }.get(kind,'Compara los datos que usaste con la fórmula y revisa las operaciones del procedimiento.')
    return {'type':'Revisión de '+kind.lower(),'message':hint,'answer':answer}

