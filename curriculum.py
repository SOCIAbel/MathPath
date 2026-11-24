"""MathPath lessons and parametric exercises."""
import random

from routes import ADDITIONS, AREAS, LEVELS, ROUTES
from university import CONTEXTUAL_EXERCISES, UNIVERSITY_LESSONS, UNIVERSITY_VARIABLES, exercise_graph, extra_values
from school_extra import SCHOOL_SHOWN, SCHOOL_VISUALS, school_values

# id, name, goal, explanation, formula, question, operation, template, argument, prerequisites
RAW = [
[
 ('naturales','Números naturales','sumar cantidades enteras positivas','Los naturales sirven para contar. Al sumar dos naturales se obtiene un natural.','a + b','¿Cuál es la suma?','arithmetic','{a} + {b}','',()),
 ('enteros','Números enteros','interpretar los signos al operar','Un entero negativo representa una cantidad por debajo de cero. Sumarlo equivale a restar su valor absoluto.','a + (−b) = a − b','Calcula el valor con su signo.','arithmetic','{a} + (-{c})','',('naturales',)),
 ('suma','Suma y resta','resolver operaciones del mismo nivel','Suma y resta tienen la misma prioridad. Si no hay paréntesis, se procesan de izquierda a derecha.','a − b + c = (a − b) + c','Resuelve de izquierda a derecha.','arithmetic','{c} - {a} + {b}','',('enteros',)),
 ('producto','Multiplicación y división','reconocer operaciones inversas','Multiplicar por un entero positivo equivale a repetir una suma. La división exacta recupera uno de los factores.','(a × b) ÷ b = a, si b ≠ 0','Calcula el resultado exacto.','arithmetic','({a} * {b}) / {b}','',('suma',)),
 ('fracciones','Fracciones','sumar fracciones con distinto denominador','El denominador indica el tamaño de las partes. Antes de sumar, expresa ambas fracciones con un denominador común.','a/b + c/d = (ad + bc)/(bd)','Suma y escribe el resultado como fracción.','arithmetic','{a}/{b} + 1/{c}','',('producto',)),
 ('decimales','Decimales','operar con décimos y centésimos','La posición después del punto indica décimos, centésimos y así sucesivamente. Alinea las posiciones al sumar.','0.3 = 3/10','Calcula la suma. Usa punto decimal o una fracción equivalente.','arithmetic','{a}.25 + {b}.50','',('fracciones',)),
 ('porcentajes','Porcentajes','calcular una parte de cien','Un porcentaje siempre se refiere a una cantidad base. Convierte p % a p/100 y multiplícalo por la base.','p % de x = p·x/100','Calcula el porcentaje indicado sobre la cantidad base.','arithmetic','porcentaje({percent},{base})','',('decimales',)),
 ('regla3','Regla de tres','resolver una proporción directa','En una proporción directa el cociente es constante. Si duplicas la primera cantidad, se duplica la segunda.','x = b·c/a','Si a unidades cuestan b, ¿cuánto cuestan c unidades?','arithmetic','proporcion({a},{prod},{c})','',('porcentajes',))
],[
 ('potencias','Potencias','interpretar un exponente entero positivo','La base es el factor que se repite. El exponente indica cuántas veces se multiplica.','a³ = a·a·a','Evalúa la potencia.','arithmetic','{a}^{power}','',('producto',)),
 ('raices','Raíces','identificar la raíz cuadrada principal','Para un número no negativo, la raíz cuadrada principal es el número no negativo cuyo cuadrado coincide con el radicando.','√(a²) = |a|','Halla la raíz cuadrada principal.','arithmetic','sqrt({square})','',('potencias',)),
 ('jerarquia','Jerarquía de operaciones','aplicar el orden de las operaciones','Evalúa primero los paréntesis, luego potencias, productos y divisiones, y finalmente sumas y restas.','a + b·c = a + (b·c)','Calcula respetando la prioridad.','arithmetic','{a} + {b} * ({c} - {a})','',('potencias','suma')),
 ('divisores','Múltiplos y divisores','comprobar divisibilidad mediante cocientes','Si a divide a b, el cociente b/a es entero. Un múltiplo de a se escribe a·k.','a | b ⇔ b = a·k con k entero','Encuentra el factor entero que multiplicó al divisor.','arithmetic','{prod}/{a}','',('producto',)),
 ('primos','Números primos','distinguir números primos y compuestos','Un primo es mayor que uno y solo tiene los divisores positivos 1 y él mismo. Basta buscar divisores hasta su raíz cuadrada.','Un factor no trivial basta para probar que es compuesto.','¿El número es primo? Responde sí o no.','arithmetic','primo({prime})','',('divisores','raices')),
 ('mcdmcm','MCD y MCM','calcular el mayor divisor común','El algoritmo de Euclides repite la división con resto hasta llegar a cero. El último divisor no nulo es el MCD.','mcd(a,b) = mcd(b, a mod b)','Calcula el MCD de los dos enteros.','arithmetic','mcd({prod},{prod2})','',('divisores',))
],[
 ('variables','Variables','evaluar una expresión en un punto','Una variable representa un valor que puede cambiar. Para evaluar, sustituye todas sus apariciones por el valor dado.','f(x) = a·x + b','Evalúa la expresión en el valor indicado de x.','function','{a}*x + {b}','{c}',('jerarquia',)),
 ('expresiones','Expresiones algebraicas','reunir términos semejantes','Dos términos son semejantes si tienen la misma parte literal. Al sumarlos, se suman los coeficientes.','ax + bx = (a+b)x','Simplifica la expresión.','simplify','{a}*x + {b}*x - {c}','',('variables',)),
 ('lineales','Ecuaciones lineales','despejar una variable de primer grado','Una ecuación conserva sus soluciones si sumas lo mismo a ambos miembros o multiplicas ambos por una constante no nula.','ax + b = c ⇒ x = (c−b)/a','Resuelve para x. Escribe el valor encontrado.','equation','{a}*x + {b} = {linear}','',('expresiones',)),
 ('inecuaciones','Inecuaciones','despejar una desigualdad y conservar sus extremos','Al dividir o multiplicar por un número negativo se invierte el sentido de la desigualdad.','−a·x < b ⇒ x > −b/a, si a > 0','Resuelve la desigualdad. Puedes responder x > valor.','inequality','-{a}*x + {b} < {inequality}','',('lineales',)),
 ('notables','Productos notables','desarrollar el cuadrado de un binomio','Multiplica el binomio por sí mismo. Los dos productos cruzados son iguales y se suman.','(a+b)² = a² + 2ab + b²','Desarrolla el producto.','expand','(x+{a})^2','',('expresiones','potencias')),
 ('polinomios','Polinomios','sumar polinomios por grado','Un polinomio es una suma de potencias no negativas con coeficientes. Agrupa los términos del mismo grado.','ax² + bx² = (a+b)x²','Reduce el polinomio.','simplify','({a}*x^2 + {b}*x) + ({b}*x^2 - {c}*x)','',('notables',))
],[
 ('factor','Factorización','reconocer los factores de un trinomio mónico','En x²+bx+c busca dos números que sumen b y multipliquen c. Cada número completa un factor lineal.','x²+(p+q)x+pq = (x+p)(x+q)','Factoriza el trinomio.','factor','x^2 + {sum}*x + {prod}','',('polinomios',)),
 ('sistemas','Sistemas de ecuaciones','resolver dos ecuaciones con dos incógnitas','Una solución debe satisfacer las dos ecuaciones. Al sumar o restar ecuaciones adecuadas puedes eliminar una incógnita.','Si det(A) ≠ 0, Ax = b tiene una solución.','Resuelve el sistema. Responde como (x,y).','system','x+y={sum};x-y={difference}','',('lineales',)),
 ('cuadraticas','Ecuaciones cuadráticas','obtener y verificar las raíces reales','El discriminante b²−4ac distingue entre dos, una o ninguna raíz real. Sustituye las raíces en la ecuación.','x = (−b ± √(b²−4ac))/(2a)','Encuentra las raíces reales separadas por coma.','equation','x^2 - {sum}*x + {prod} = 0','',('factor',)),
 ('funciones','Funciones','interpretar una regla de asignación','Una función asigna una única salida a cada entrada de su dominio. La notación f(a) indica la salida de a.','f(a) se obtiene al sustituir x = a.','Evalúa f(x) en el valor de x indicado.','function','{a}*x^2 - {b}*x','{c}',('variables','polinomios')),
 ('logaritmos','Logaritmos','relacionar un logaritmo con una potencia','El logaritmo en base b de N es el exponente al que hay que elevar b para obtener N. Requiere N > 0, b > 0 y b ≠ 1.','log_b(bᵖ) = p','Encuentra el valor exacto del logaritmo.','arithmetic','log({cube},{a})','',('potencias','funciones')),
 ('exponenciales','Exponenciales','resolver una igualdad de potencias de igual base','Para una base positiva distinta de 1, la función exponencial es inyectiva. Si las potencias coinciden, coinciden sus exponentes.','aˣ = aᵇ ⇒ x = b','Resuelve la ecuación exponencial para x.','equation','{a}^x = {cube}','',('logaritmos','lineales'))
],[
 ('figuras','Figuras geométricas','identificar la base y altura de un rectángulo','Un rectángulo tiene cuatro ángulos rectos y lados opuestos iguales. Su área cuenta las unidades cuadradas que cubren la superficie.','A = base·altura','Calcula el área del rectángulo.','geometry','area_rect({a},{b})','',('producto',)),
 ('perimetros','Perímetros','calcular la longitud del borde','El perímetro suma las longitudes de todos los lados. En un rectángulo hay dos lados de cada medida.','P = 2(largo + ancho)','Calcula el perímetro del rectángulo.','geometry','perimetro_rect({a},{c})','',('figuras',)),
 ('areas','Áreas','calcular la superficie de un triángulo','Un triángulo tiene la mitad del área de un paralelogramo con la misma base y altura perpendicular.','A = base·altura/2','Halla el área del triángulo.','geometry','area_triangulo({a},{b})','',('figuras','fracciones')),
 ('volumenes','Volúmenes','calcular el volumen de un prisma rectangular','Multiplica el área de la base por la altura. Las unidades del volumen son cúbicas.','V = largo·ancho·altura','Calcula el volumen de la caja.','geometry','volumen_caja({a},{b},{c})','',('areas',)),
 ('pitagoras','Teorema de Pitágoras','obtener la hipotenusa a partir de los catetos','En un triángulo rectángulo, el cuadrado de la hipotenusa es la suma de los cuadrados de los catetos.','c = √(a²+b²)','Calcula la hipotenusa con esos catetos.','geometry','pitagoras({leg1},{leg2})','',('areas','raices')),
 ('analitica','Geometría analítica','calcular distancias en el plano','La diferencia de coordenadas forma dos catetos. Aplica Pitágoras para hallar la distancia entre los puntos.','d = √((x₂−x₁)² + (y₂−y₁)²)','Encuentra la distancia entre los puntos indicados.','geometry','distancia({a},{b},{px},{py})','',('pitagoras','enteros'))
],[
 ('angulos','Ángulos','convertir grados a radianes','Una vuelta completa mide 360 grados o 2π radianes. Un ángulo llano mide 180 grados o π radianes.','rad = grados·π/180','Convierte el ángulo a radianes. Usa pi para π.','geometry','grados({degree})','',('fracciones','pitagoras')),
 ('seno','Seno','relacionar un ángulo con el cateto opuesto','El seno es el cociente entre el cateto opuesto y la hipotenusa en un triángulo rectángulo. En el círculo unitario es la coordenada vertical.','sen(θ) = opuesto/hipotenusa','Calcula el seno exacto.','trig','sin(pi/{angle})','',('angulos',)),
 ('coseno','Coseno','relacionar un ángulo con el cateto adyacente','En el círculo unitario el coseno es la coordenada horizontal. En un triángulo rectángulo divide el cateto adyacente entre la hipotenusa.','cos(θ) = adyacente/hipotenusa','Calcula el coseno exacto.','trig','cos(pi/{angle})','',('angulos',)),
 ('tangente','Tangente','determinar la razón entre los dos catetos','La tangente equivale a seno dividido por coseno y requiere que el coseno sea distinto de cero.','tan(θ) = sen(θ)/cos(θ)','Calcula la tangente exacta.','trig','tan(pi/{angle})','',('seno','coseno')),
 ('identidades','Identidades trigonométricas','aplicar la identidad pitagórica','El punto (cos θ, sen θ) está en una circunferencia de radio uno. La suma de sus cuadrados vale uno.','sen²θ + cos²θ = 1','Simplifica la identidad.','trig','sin({a}*x)^2 + cos({a}*x)^2','',('seno','coseno')),
 ('ec_trig','Ecuaciones trigonométricas','hallar soluciones en un intervalo','El seno y el coseno son periódicos. Identifica las soluciones del ciclo indicado y revisa si los extremos se incluyen.','Para sin(x)=0, x es un múltiplo de π.','Resuelve en [0,2π). Separa las soluciones con comas.','trig_equation','sin(x) = {trigZero}','0,2*pi',('identidades','lineales'))
],[
 ('limites','Límites','calcular a qué valor se aproxima una función','Un límite depende del comportamiento cerca del punto. El valor de la función en el punto puede faltar o ser distinto.','El límite bilateral existe si coinciden los dos laterales.','Calcula el límite al acercarte al punto indicado.','limit','(x^2 - {square})/(x - {a})','{a}',('funciones','factor')),
 ('continuidad','Continuidad','decidir si la función es continua en un punto','La continuidad exige que exista el valor en el punto y que los dos límites laterales coincidan con ese valor.','lim f(x) = f(a) cuando x → a.','¿Es continua en el punto indicado? Responde sí o no.','continuity','{continuous}','{a}',('limites',)),
 ('derivadas','Derivadas','obtener la tasa de cambio instantánea','Deriva los sumandos por separado. La derivada de xⁿ multiplica por n y disminuye el exponente en uno.','d(xⁿ)/dx = n·xⁿ⁻¹','Deriva la expresión con respecto a x.','derivative','{a}*x^{power} + {b}*x','',('limites','potencias')),
 ('ap_deriv','Aplicaciones de derivadas','obtener una función de velocidad','Si x representa tiempo, la derivada de la posición respecto al tiempo da la velocidad instantánea.','v(t) = s′(t)','Escribe la función de velocidad derivando esta posición.','derivative','{b}*x^2 + {c}*x','',('derivadas',)),
 ('integrales','Integrales','encontrar una primitiva de un polinomio','Integrar indefinidamente invierte la derivación. Se añade una constante porque todas las constantes tienen derivada cero.','∫ xⁿ dx = xⁿ⁺¹/(n+1)+C, si n ≠ −1.','Halla una primitiva. Puedes escribir + C.','integral','{a}*x^{power} + {b}','',('derivadas',)),
 ('ap_int','Aplicaciones de integrales','calcular acumulación en un intervalo','Si f es continua en el intervalo, evalúa una primitiva en el extremo superior y resta su valor en el inferior.','∫ₐᵇ f(x) dx = F(b)−F(a).','Evalúa la integral definida en el intervalo indicado.','integral','{a}*x + {b}','0,{c}',('integrales','continuidad'))
],[
 ('lineal','Álgebra lineal','resolver un sistema mediante una matriz de coeficientes','Escribe las ecuaciones como Ax=b. Un determinante distinto de cero en una matriz cuadrada garantiza una solución única.','x = A⁻¹b cuando A es invertible.','Resuelve el sistema. Escribe el par (x,y).','system','2*x+y={sys1};x-y={difference}','',('sistemas',)),
 ('matrices','Matrices','sumar matrices del mismo tamaño','Una matriz ordena entradas por filas y columnas. La suma se define entrada a entrada para matrices de igual dimensión.','(A+B)ᵢⱼ = Aᵢⱼ+Bᵢⱼ.','Suma las matrices. Escribe [[a,b],[c,d]].','matrix','matsuma([[{a},1],[0,{b}]],[[1,{c}],[{b},0]])','',('lineal',)),
 ('determinantes','Determinantes','obtener un determinante de orden dos','El determinante de una matriz 2×2 es el producto de la diagonal principal menos el de la secundaria.','det([[a,b],[c,d]]) = ad−bc.','Calcula el determinante.','matrix','det([[{a},{b}],[1,{c}]])','',('matrices',)),
 ('vectores','Vectores','calcular un producto escalar','El producto escalar suma los productos de componentes en la misma posición. El resultado es un escalar.','u·v = Σ uᵢvᵢ.','Calcula el producto escalar.','matrix','punto([{a},{b}],[{c},2])','',('matrices',)),
 ('multivariable','Cálculo multivariable','calcular un gradiente en dos variables','Para una derivada parcial, las otras variables se tratan como constantes. El gradiente reúne todas las derivadas parciales.','∇f = (∂f/∂x, ∂f/∂y).','Escribe el gradiente como (componente x, componente y).','gradient','{a}*x^2 + {b}*x*y + {c}*y^2','x,y',('derivadas','vectores')),
 ('diferenciales','Ecuaciones diferenciales','reconocer la solución de una ecuación de crecimiento','Una ecuación diferencial relaciona una función con sus derivadas. En y′=ky, la derivada de e^(kx) reproduce k veces la función.','y = C1·e^(kx) para y′ = ky.','Resuelve la ecuación. Escribe la expresión para y usando C1.','ode',"y' = {a}*y",'',('derivadas','exponenciales')),
 ('probabilidad','Probabilidad','calcular la probabilidad de casos equiprobables','Si todos los resultados tienen la misma probabilidad, divide el número de resultados favorables entre el total.','P(A) = favorables/total.','Calcula la probabilidad como fracción.','statistics','probabilidad({a},{base})','',('fracciones',)),
 ('estadistica','Estadística avanzada','medir dispersión con la varianza poblacional','La varianza promedia los cuadrados de las diferencias respecto a la media. Cuadrar evita que desviaciones opuestas se anulen.','σ² = Σ(xᵢ − μ)² / n.','Calcula la varianza poblacional.','statistics','varianza([{a},{b},{c}])','',('probabilidad','potencias'))
]
]

_lessons = {row[0]: row[1:] for group in RAW for row in group}
for row in (ADDITIONS+'\n'+UNIVERSITY_LESSONS).splitlines():
    topic_id, name, theory, formula, question, operation, template, argument = row.split('|')
    _lessons[topic_id] = (name, '', theory, formula, question, operation, template, argument, ())

TOPICS = {}
for level, (_, _, units) in enumerate(ROUTES, 1):
    for unit, (_, groups) in enumerate(units, 1):
        previous = []
        for area, ids in enumerate(groups):
            if '::' in ids:
                area, ids = ids.split('::')
                area = int(area)
            for topic_id in ids.split():
                name, goal, theory, formula, question, operation, template, argument, _ = _lessons[topic_id]
                TOPICS[topic_id] = {
                    'id': topic_id, 'name': name, 'level': level, 'unit': unit,
                    'area': AREAS[area] if level < 3 else '',
                    'goal': goal or theory, 'theory': theory, 'formula': formula, 'question': question,
                    'operation': operation, 'template': template, 'argument': argument,
                    'requires': previous[-1:] if level < 3 else []
                }
                previous.append(topic_id)
assert TOPICS.keys() == _lessons.keys()

_SHORT_LESSONS = {
    'naturales': ('Junta los dos grupos y cuenta cuántos hay en total.', 'Si tienes {a} fichas y te dan {b} más, ¿cuántas tienes?'),
    'suma': ('Empieza por la izquierda. Resta y luego suma al resultado.', 'Calcula de izquierda a derecha.'),
    'producto': ('Multiplica primero para saber el total. Si lo repartes entre los mismos grupos, vuelves al valor inicial.', 'Multiplica y luego divide.'),
    'figuras': ('Imagina filas de cuadritos en el rectángulo. Multiplica el largo por el ancho.', 'Un rectángulo mide {a} cm por {b} cm. ¿Cuál es su área en cm²?'),
    'perimetros': ('Recorre el borde. Suma el largo y el ancho dos veces.', 'Un rectángulo mide {a} cm de largo y {c} cm de ancho. ¿Cuántos cm mide su borde?'),
    'areas': ('Dos triángulos iguales pueden formar un paralelogramo. Calcula base × altura y divide entre 2.', 'Un triángulo tiene base de {a} cm y altura de {b} cm. ¿Cuál es su área en cm²?'),
    'volumenes': ('Multiplica largo × ancho para contar los cubitos de una capa. Luego multiplica por la altura.', 'La caja mide {a} cm de largo, {b} cm de ancho y {c} cm de alto. ¿Cuál es su volumen en cm³?'),
    'regla3': ('Divide el precio total entre la cantidad para saber el precio de uno. Multiplica ese precio por la nueva cantidad.', '{a} cuadernos cuestan {prod} soles. ¿Cuánto cuestan {c} cuadernos al mismo precio por unidad?'),
    'porcentajes': ('Divide el porcentaje entre 100. Multiplica el resultado por la cantidad total.', '¿Cuánto es el {percent}% de {base}?'),
    'probabilidad': ('Cuenta los casos que buscas y divide entre todos los casos posibles.', 'Hay {a} fichas verdes entre {base} fichas. ¿Qué probabilidad hay de sacar una verde?'),
    'estadistica': ('Resta el promedio a cada dato y eleva la diferencia al cuadrado. Promedia esos cuadrados.', 'Calcula la varianza poblacional de {a}, {b} y {c}.'),
    'decimales': ('Alinea los puntos decimales. Suma unidades con unidades, décimos con décimos y centésimos con centésimos.', 'Suma los decimales.'),
    'pitagoras': ('Eleva al cuadrado cada cateto, suma los resultados y saca la raíz cuadrada.', 'Los catetos miden {leg1} y {leg2} cm. ¿Cuántos cm mide la hipotenusa?'),
    'lineales': ('El signo igual dice que ambos lados valen lo mismo. Para dejar sola la x, haz la misma operación a los dos lados.', '¿Cuánto vale x?'),
    'limites': ('Un límite pregunta a qué valor te acercas desde ambos lados. Si sustituir da 0 ÷ 0, en este ejemplo puedes factorizar y simplificar primero.', '¿A qué valor se acerca la expresión cuando x se acerca a {a}?')
}
for topic_id, (theory, question) in _SHORT_LESSONS.items():
    TOPICS[topic_id].update(theory=theory, question=question)

TOPICS['suma']['template'] = '{sum} - {a} + {c}'
TOPICS['lineales']['formula'] = 'Si ax + b = c, entonces x = (c − b) ÷ a, con a ≠ 0.'
TOPICS['limites']['formula'] = 'x² − a² = (x − a) × (x + a)'
TOPICS['primos']['question'] = '¿{prime} es un número primo? Responde sí o no.'
TOPICS['mcdmcm']['name'] = 'Máximo común divisor'
TOPICS['angulo_recto']['question'] = 'Cada cuarto de vuelta mide 90°. ¿Cuántos grados hay en {quarter} cuartos?'
TOPICS['azar']['question'] = 'Hay {a} fichas azules y {b} rojas. ¿Cuántas de las fichas son verdes?'
TOPICS['azar']['template'] = '{a} * 0 + {b} * 0'

_VISUALS = {
    'conteo': ('stars', '{a}'),
    'lados': ('polygon', '{sides}'),
    'pictograma': ('pictogram', '{a}', '{b}'),
    'barras': ('bars', '{sum}', '{a}'),
    'multiplicar': ('groups', '{a}', '{b}'),
    'dividir': ('sharing', '{prod}', '{a}'),
}

_SHOW_EXPRESSION = {
    'suma', 'producto', 'jerarquia', 'fracciones', 'decimales', 'divisores', 'potencias',
    'enteros', 'racionales', 'raices', 'mcdmcm', 'variables', 'expresiones', 'lineales',
    'inecuaciones', 'notables', 'polinomios', 'factor', 'sistemas', 'analitica', 'cientifica',
    'irracionales', 'cuadraticas', 'funciones', 'angulos', 'seno', 'coseno', 'tangente',
    'logaritmos', 'exponenciales', 'identidades', 'ec_trig'
}

_READABLE = {
    'figuras': '{a} × {b}', 'perimetros': '2 × ({a} + {c})', 'areas': '({a} × {b}) ÷ 2',
    'volumenes': '{a} × {b} × {c}', 'regla3': '({prod} ÷ {a}) × {c}', 'porcentajes': '({percent} ÷ 100) × {base}',
    'probabilidad': '{a} ÷ {base}', 'pitagoras': '√({leg1}² + {leg2}²)', 'circulo': 'π × {a}²',
    'primos': '', 'mcdmcm': 'MCD de {prod} y {prod2}', 'mcm': 'MCM de {a} y {b}',
    'mediana': '', 'promedio': '({a} + {b} + {c}) ÷ 3',
    'desviacion': '', 'moda': '', 'estadistica': '', 'azar': '', 'afin': 'f(x) = {a} × x + {b}',
    'angulos': '{degree}°', 'raices': '√({square})', 'logaritmos': 'log en base {a} de {cube}',
    'analitica': 'A = ({a}, {b})    B = ({px}, {py})',
}

_SHOW_EXPRESSION |= SCHOOL_SHOWN
_VISUALS.update(SCHOOL_VISUALS)

DIFFICULTIES = ('fácil','intermedio','avanzado')


def exercise_for(topic_id, difficulty='fácil', rng=None):
    topic = TOPICS[topic_id]
    rng = rng or random.SystemRandom()
    if difficulty not in DIFFICULTIES:
        difficulty='fácil'
    rank=DIFFICULTIES.index(difficulty)
    low,high = ([(2,5),(3,7),(4,8)] if (topic['level']==1 and topic['unit']==1) or topic_id in {'multiplicar','dividir'} else
                [(2,9),(4,14),(7,23)])[rank]
    a,b,c=(rng.randint(low,high) for _ in range(3))
    if a==b:
        b += 1
    if topic_id == 'decenas':
        b = rng.randrange(10)
    if topic_id == 'cientifica':
        a = rng.randrange(1,10)
    if topic_id == 'moda':
        c = next(value for value in range(c, c+3) if value not in (a,b))
    values = dict(
        a=a,b=b,c=c,prod=a*b,prod2=b*c,linear=a*c+b,sum=a+b,difference=a-b,inequality=b-a*c,
        sum_sq=(a+b)**2,four_a=4*a,future_cash=a*(100+b),loan_payment=a*b+5*c,
        square=a*a,cube=a**3,power=rng.randint(2+rank,3+rank),
        base=(a+b)*5,percent=rng.choice([5,10,15,20,25,40,50,75]),prime=rng.choice([11,13,15,17,21,29,33,37])+rank*2,
        angle=rng.choice([3,4,6]),degree=rng.choice([30,45,60,90,120,135,150,180]),
        leg1=3*a,leg2=4*a,px=a+3*c,py=b+4*c,sys1=2*a+b,
        continuous=(f'{a}*x+{b}' if rng.choice([True,False]) else f'(x^2-{a*a})/(x-{a})'),
        trigZero=rng.choice([0,1,-1]),
        p1=a+b,p2=a+2*b,p3=a+3*b,g2=a*b*b,position=rng.randint(3,5),
        double=a*2,sides=rng.randint(3,7),quarter=rng.randint(1,4),deg1=a+35,deg2=b+40,
        radical=a*a*rng.choice([2,3,5]),capital=100*a
    )
    values.update(extra_values(values))
    values.update(school_values(values))
    visual = _VISUALS.get(topic_id)
    question = topic['question'].format(**values)
    expression = _READABLE.get(topic_id, topic['template']).format(**values)
    problem=topic['template'].format(**values)
    argument=topic['argument'].format(**values)
    item = {
        'topic':topic_id,'difficulty':difficulty,'question':question,
        'problem':problem,'operation':topic['operation'],'variable':UNIVERSITY_VARIABLES.get(topic_id,'x'),
        'argument':argument,
        'expression':expression,
        'showExpression':(topic['level']==3 and topic_id not in CONTEXTUAL_EXERCISES) or topic_id in _SHOW_EXPRESSION,
        'visual':[visual[0], *(int(entry.format(**values)) for entry in visual[1:])] if visual else None
    }
    graph=exercise_graph(topic_id,values,problem,topic['name'],argument)
    if graph:
        item['graph']=graph
    return item


def lesson(topic_id):
    topic=TOPICS[topic_id]
    return {**topic,
        'intro': 'En esta lección vas a '+topic['goal']+'.',
        'example': exercise_for(topic_id,'fácil',random.Random(topic_id)),
        'guided': 'Identifica los datos, elige la regla de la lección y contrasta tu primer paso con la pista.',
        'independent':'Resuelve un ejercicio nuevo y comprueba tu resultado.',
        'assessment':('Acierta dos retos distintos para completar la misión.' if topic['level']<3 else
                      'Dos aciertos en problemas distintos, de los tres intentos independientes más recientes, acreditan el tema.'),
        'feedback':'Si te equivocas, compara tu respuesta con el procedimiento y repite el ejercicio desde Prácticas.'
    }
