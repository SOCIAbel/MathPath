import ast
import math
import operator
import re

from engineajch import AbelExpressionParser, AbelInputError


AXIS_LIMIT = 1_000_000
VALUE_LIMIT = 1_000_000_000_000
MIN_SPAN = 0.0001
CURVE_STEPS = 800
SURFACE_STEPS = 36
OPERATORS = {
    ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
    ast.Div: operator.truediv, ast.Pow: math.pow,
}
FUNCTIONS = {name: getattr(math, name) for name in
             ('sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log')}
FUNCTIONS.update({'ln': math.log, 'abs': abs, 'Abs': abs})
CONSTANTS = {'pi': math.pi, 'e': math.e, 'E': math.e}
SUPERSCRIPTS = str.maketrans('⁻⁰¹²³⁴⁵⁶⁷⁸⁹', '-0123456789')


def graph_function_ajch(expression, mode):
    if not isinstance(expression, str) or len(expression) > 220:
        raise AbelInputError('Cada expresión debe tener hasta 220 caracteres.')
    prefix = r'^\s*(?:y|[fgh]\s*\(\s*x\s*\))\s*=\s*' if mode == 2 else r'^\s*(?:z|f\s*\(\s*x\s*,\s*y\s*\))\s*=\s*'
    expression = re.sub(r'[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+', lambda match: '^('+match[0].translate(SUPERSCRIPTS)+')', expression)
    parser = AbelExpressionParser(re.sub(prefix, '', expression))

    def compile_node_ajch(node):
        if isinstance(node, ast.Constant) and type(node.value) in (int, float):
            value = float(parser.scalar_ajch(node))
            if math.isfinite(value):
                return lambda x, y: value
        if isinstance(node, ast.Name):
            if node.id == 'x':
                return lambda x, y: x
            if mode == 3 and node.id == 'y':
                return lambda x, y: y
            if node.id in CONSTANTS:
                return lambda x, y: CONSTANTS[node.id]
        if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
            evaluate = compile_node_ajch(node.operand)
            return evaluate if isinstance(node.op, ast.UAdd) else lambda x, y: -evaluate(x, y)
        if isinstance(node, ast.BinOp) and type(node.op) in OPERATORS:
            calculate_ajch = OPERATORS[type(node.op)]
            left, right = compile_node_ajch(node.left), compile_node_ajch(node.right)
            return lambda x, y: calculate_ajch(left(x, y), right(x, y))
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and not node.keywords:
            name = node.func.id
            lengths = (1, 2) if name in {'log', 'ln'} else (1,)
            if name in FUNCTIONS and len(node.args) in lengths:
                evaluate = [compile_node_ajch(arg) for arg in node.args]
                calculate_ajch = FUNCTIONS[name]
                return lambda x, y: calculate_ajch(*(arg(x, y) for arg in evaluate))
        variables = 'x' if mode == 2 else 'x e y'
        raise AbelInputError(f'Usa {variables}, constantes y funciones como sin, sqrt, log o exp.')

    evaluate = compile_node_ajch(parser.root)

    def sample(x, y=0):
        try:
            number = evaluate(x, y)
            if math.isfinite(number) and abs(number) <= VALUE_LIMIT:
                return number
        except (ArithmeticError, ValueError):
            pass
        return None

    return sample


def axis_bounds_ajch(raw):
    if not isinstance(raw, list) or len(raw) != 4:
        raise AbelInputError('Indica el mínimo y máximo de ambos ejes.')
    if any(type(value) not in (float, int) or not -AXIS_LIMIT <= value <= AXIS_LIMIT for value in raw):
        raise AbelInputError('Usa límites de eje entre −1 000 000 y 1 000 000.')
    if raw[1]-raw[0] < MIN_SPAN or raw[3]-raw[2] < MIN_SPAN:
        raise AbelInputError('Cada máximo debe superar a su mínimo en al menos 0.0001.')
    return raw[:]


def fit_vertical_ajch(rows, bounds):
    values = sorted(y for row in rows for _, y in row if y is not None)
    if not values:
        return
    lower = values[len(values)//100]
    upper = values[len(values)-1-len(values)//100]
    margin = max((upper-lower)*.11, MIN_SPAN)
    if upper == lower:
        margin = max(1, abs(upper)*.15)
    bottom, top = max(-AXIS_LIMIT, lower-margin), min(AXIS_LIMIT, upper+margin)
    if top-bottom >= MIN_SPAN:
        bounds[2:] = [bottom, top]


def curve_paths_ajch(functions, bounds, fit_y):
    x0, x1 = bounds[:2]
    xs = [x0+(x1-x0)*index/CURVE_STEPS for index in range(CURVE_STEPS+1)]
    rows = [[(x, function(x)) for x in xs] for function in functions]
    if fit_y:
        fit_vertical_ajch(rows, bounds)
    span = bounds[3]-bounds[2]
    paths = []
    for function, row in zip(functions, rows):
        points = [row[0]]
        for (x0, y0), (x1, y1) in zip(row, row[1:]):
            if y0 is not None and y1 is not None:
                middle = (x0+x1)/2
                center = function(middle)
                if center is None or (abs(y1-y0) > .15*span and
                                      abs(center-(y0+y1)/2) > max(.09*span, .75*abs(y1-y0))):
                    points.append((middle, None))
            points.append((x1, y1))
        paths.append(points)
    return {'bounds': bounds, 'paths': paths, 'hasValues': any(y is not None for row in rows for _, y in row)}


def surface_mesh_ajch(function, bounds):
    x0, x1, y0, y1 = bounds
    steps = SURFACE_STEPS
    values = [[function(x0+(x1-x0)*col/steps, y0+(y1-y0)*row/steps) for col in range(steps+1)]
              for row in range(steps+1)]
    heights = [z for row in values for z in row if z is not None]
    return {'bounds': bounds, 'mesh': values, 'zRange': [min(heights), max(heights)] if heights else [0, 0],
            'hasValues': bool(heights)}


def sample_graph_ajch(args):
    if args.get('studio') is not None:
        from graph_studio_dataajch import dispatch_ajch
        return dispatch_ajch(args['studio'])
    mode = args.get('mode')
    expressions = args.get('expressions')
    if mode not in (2, 3) or not isinstance(expressions, list) or not 1 <= len(expressions) <= (3 if mode == 2 else 1):
        raise AbelInputError('Introduce hasta tres funciones en 2D o una superficie en 3D.')
    bounds = axis_bounds_ajch(args.get('bounds'))
    functions = [graph_function_ajch(expr, mode) for expr in expressions]
    if mode == 2:
        return curve_paths_ajch(functions, bounds, args.get('fitY') is True)
    return surface_mesh_ajch(functions[0], bounds)
