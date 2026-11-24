"""Additional university lessons and the plots associated with their exercises."""

UNIVERSITY_LESSONS = '''
inversa_funcion|Funciones inversas|Para invertir una función afín de pendiente no nula, despeja la entrada en función de la salida. Intercambia los roles de ambas variables.|Si f(x) = ax + b, f⁻¹(x) = (x − b) ÷ a|Halla la expresión de la inversa de f(x) = {a}x + {b}. Usa x como variable.|simplify|(x - {b})/{a}|
transformaciones|Transformaciones de funciones|El término dentro del paréntesis desplaza la gráfica horizontalmente. El término externo mueve la gráfica en dirección vertical.|g(x) = f(x − h) + k|La parábola g(x) = (x − {a})² + {b} es una traslación de f(x) = x². ¿Cuál es la altura de su vértice?|arithmetic|{b}|
asintotas|Asíntotas de funciones racionales|Si numerador y denominador tienen el mismo grado, la razón de sus coeficientes principales es la altura de la asíntota horizontal.|Para f(x) = (ax + b) ÷ (cx + d), y = a ÷ c es la asíntota horizontal si c ≠ 0.|¿A qué valor de y se aproxima f(x) = ({a}x + 1) ÷ ({b}x − 1) cuando x tiende a +∞?|limit|({a}*x + 1)/({b}*x - 1)|oo
trig_periodo|Período trigonométrico|El seno vuelve a la misma fase después de que su argumento aumenta en 2π radianes.|El período de sin(bx) es 2π ÷ abs(b) para b ≠ 0.|Halla el período en radianes de f(x) = sin({a}x).|arithmetic|2*pi/{a}|
funcion_exponencial|Crecimiento exponencial|En cada incremento de una unidad en el tiempo, la cantidad se multiplica por la base de la potencia.|P(t) = P₀ × qᵗ|Si P(t) = {a} × (1 + {percent} ÷ 100)ᵗ, ¿cuánto vale P({b})?|function|{a} * (1 + {percent}/100)^x|{b}
limite_infinito|Límites al infinito|Divide cada término del numerador y denominador entre la mayor potencia de x del denominador. Las potencias negativas tienden a cero.|1 ÷ xⁿ → 0 cuando x → +∞ y n > 0|Calcula el límite cuando x tiende a +∞.|limit|({a}*x^2+{b}*x)/({c}*x^2+1)|oo
regla_cadena|Regla de la cadena|Deriva la función exterior conservando la interior. Luego multiplica por la derivada de la interior.|Si h(x) = f(g(x)), h′(x) = f′(g(x))g′(x).|Deriva la composición y expresa el resultado en x.|derivative|({a}*x+{b})^{power}|
regla_producto|Regla del producto|En cada término deriva uno de los factores y conserva el otro. Suma los dos términos.|(uv)′ = u′v + uv′|Deriva el producto con respecto a x.|derivative|({a}*x^2+{b})*sin(x)|
regla_cociente|Regla del cociente|En el numerador resta el producto de la función superior por la derivada de la inferior. Conserva el cuadrado de la inferior como denominador.|(u ÷ v)′ = (u′v − uv′) ÷ v²|Halla la derivada del cociente con respecto a x.|derivative|({a}*x^2+{b})/(x+{c})|
recta_tangente|Pendiente de una recta tangente|Deriva la función y evalúa la derivada en la abscisa de tangencia. Ese valor es la pendiente de la recta.|m = f′(x₀)|Halla la pendiente de la tangente a f(x) = {a}x² − {b}x en x = {c}.|arithmetic|2*{a}*{c}-{b}|
integracion_partes|Integración por partes|Elige u de forma que su derivada sea más sencilla. Integra dv para obtener v y aplica la regla del producto en sentido inverso.|∫ u dv = uv − ∫ v du|Integra por partes usando u = x y dv = exp({a}x) dx.|integral|x*exp({a}*x)|
fracciones_parciales|Fracciones parciales en integrales|Descompón la fracción en una suma de fracciones simples. La integral de 1 ÷ (x + a) es ln(abs(x + a)) + C.|Si a ≠ b, 1 ÷ ((x + a)(x + b)) = (1 ÷ (x + a) − 1 ÷ (x + b)) ÷ (b − a).|Halla una primitiva usando fracciones parciales. Trabaja en x > 0.|integral|1/((x+{a})*(x+{b}))|
area_curvas|Área entre curvas|En el intervalo indicado resta la altura de la curva inferior a la superior e integra esa diferencia.|A = ∫ (f(x) − g(x)) dx en el intervalo de intersección|Halla el área entre f(x) = {a}x y g(x) = x², desde x = 0 hasta x = {a}.|integral|{a}*x-x^2|0,{a}
volumen_revolucion|Volúmenes de revolución|Una sección perpendicular al eje x es un disco. Eleva su radio al cuadrado y multiplica por π antes de integrar.|V = π ∫ f(x)² dx|La región bajo f(x) = {b}x, entre 0 y {a}, gira alrededor del eje x. Halla el volumen.|integral|pi*({b}*x)^2|0,{a}
valor_medio_integral|Valor medio de una función|La altura promedio produce un rectángulo de la misma área con signo que la integral. Divide esa área entre la longitud del intervalo.|f media = (1 ÷ (b − a)) ∫ f(x) dx en [a, b]|Halla el valor medio de f(x) = x² + {b} en [0, {a}].|integral|(x^2+{b})/{a}|0,{a}
producto_matricial|Producto matricial|Para cada entrada, multiplica una fila de la primera matriz por una columna de la segunda y suma los productos.|(AB)ᵢⱼ = suma de AᵢₖBₖⱼ sobre k|Multiplica las dos matrices en el orden mostrado. Escribe el resultado como [[a,b],[c,d]].|matrix|matmul([[{a},1],[0,{b}]],[[{c},0],[1,2]])|
transpuesta|Matriz transpuesta|Convierte cada fila en una columna y conserva su posición. Se intercambian las dimensiones de la matriz.|(Aᵀ)ᵢⱼ = Aⱼᵢ|Escribe la transpuesta de la matriz indicada.|matrix|transpuesta([[{a},0,{b}],[1,{c},2]])|
norma_vector|Norma euclidiana|La longitud de un vector se obtiene sumando los cuadrados de las componentes y tomando la raíz cuadrada.|‖v‖ = √(v₁² + v₂² + v₃²)|Halla la longitud del vector indicado.|matrix|norma([{a},-{b},{c}])|
autovalores|Autovalores de una matriz triangular|En una matriz triangular, el determinante de A − λI es el producto de su diagonal. Cada factor da un autovalor.|Los autovalores de A satisfacen det(A − λI) = 0.|Halla los dos autovalores de la matriz triangular [[{a},{c}],[0,{b}]]. Introduce los valores separados por comas.|equation|({a}-x)*({b}-x)=0|
superficies|Superficies de dos variables|Una superficie asocia una altura z a cada par (x, y). Sustituye ambas coordenadas para calcular un punto concreto.|(x, y, f(x,y)) pertenece a la gráfica de z = f(x,y).|Para z = x² − y², halla la altura en (x, y) = ({a}, {b}).|arithmetic|{a}^2-{b}^2|
parcial_y|Derivada parcial respecto de y|Al derivar respecto de y, x actúa como constante. Los términos sin y tienen derivada cero.|∂(xy²) ÷ ∂y = 2xy|Halla la derivada parcial respecto de y.|derivative|{a}*x^2+{b}*x*y+{c}*y^3|
curvas_nivel|Curvas de nivel|Fijar z = c corta una superficie a altura constante. Para z = x² + y², el corte a altura positiva es una circunferencia en planta.|z = c implica x² + y² = c para el paraboloide.|¿Cuál es el radio de la curva de nivel z = {square} de la superficie z = x² + y²?|arithmetic|sqrt({square})|
plano_tangente|Plano tangente a una superficie|Las dos derivadas parciales son las pendientes del plano tangente en las direcciones x e y. Su altura en el punto de tangencia es f(x₀, y₀).|z = f(x₀,y₀) + fₓ(x₀,y₀)(x − x₀) + fᵧ(x₀,y₀)(y − y₀)|Para z = {a}x² + {b}y² en (1, 1), halla el coeficiente de x en el plano tangente.|arithmetic|2*{a}|
derivada_direccional|Derivada direccional|Normaliza el vector de dirección y calcula su producto escalar con el gradiente en el punto. Se obtiene una tasa de cambio escalar.|Dᵤf = ∇f · u con ‖u‖ = 1.|Para f(x,y) = {a}x + {b}y, halla la derivada en la dirección de v = (3,4).|arithmetic|({a}*3+{b}*4)/5|
puntos_criticos_mv|Puntos críticos de dos variables|Calcula las dos derivadas parciales e iguálalas a cero. Sus soluciones dan los candidatos a extremos o puntos de silla.|En un punto crítico interior diferenciable, ∇f = (0,0).|Halla el punto crítico de f(x,y) = (x − {a})² + (y − {b})². Escribe (x,y).|system|2*(x-{a})=0;2*(y-{b})=0|
integral_doble|Integrales dobles sobre rectángulos|Integra respecto de una variable conservando fija la otra. Integra luego el resultado respecto de la segunda en su propio intervalo.|Si f(x,y) = g(x)h(y) sobre un rectángulo, la integral doble es el producto de las dos integrales simples.|Integra f(x,y) = xy sobre 0 ≤ x ≤ {a}, 0 ≤ y ≤ {b}.|arithmetic|({a}^2/2)*({b}^2/2)|
edo_inicial|Problemas de valor inicial|Resuelve primero la ecuación diferencial y luego usa el valor inicial para fijar la constante.|Para y′ = ky e y(0) = A, y(x) = A exp(kx).|Si y′ = {a}y e y(0) = {b}, halla el valor exacto de y(1).|arithmetic|{b}*exp({a})|
edo_equilibrio|Soluciones de equilibrio|Una solución constante cumple y′ = 0 en todo momento. Iguala a cero el lado derecho de la ecuación autónoma.|Las alturas de equilibrio de y′ = F(y) resuelven F(y) = 0.|Encuentra las dos alturas de equilibrio para y′ = {a}y(1 − y ÷ {b}). Escribe los valores separados por comas.|equation|{a}*y*(1-y/{b})=0|
vida_media|Decaimiento y vida media|Divide la cantidad final entre la inicial. La vida media es el instante en que esa razón es 1 ÷ 2.|Para Q(t) = Q₀exp(−kt), t de vida media = ln(2) ÷ k.|Una sustancia tiene cantidad Q(t) = {b}exp(−{a}t). Calcula la vida media exacta.|arithmetic|log(2)/{a}|
bayes|Teorema de Bayes|Para invertir una probabilidad condicional, divide la probabilidad conjunta entre la probabilidad total de la evidencia.|P(A dado B) = P(B dado A)P(A) ÷ P(B)|El {percent}% de los mensajes son spam. Un filtro marca el 90% del spam y el 10% del resto. Si marca un mensaje, ¿qué probabilidad hay de que sea spam?|arithmetic|(0.9*({percent}/100))/(0.9*({percent}/100)+0.1*(1-{percent}/100))|
esperanza_discreta|Esperanza de una variable discreta|Pondera cada valor de la variable por su probabilidad y suma las contribuciones.|E[X] = suma de xᵢ P(X = xᵢ)|X vale {a} con probabilidad {percent}% y {b} en el otro caso. Halla su esperanza.|arithmetic|{a}*({percent}/100)+{b}*(1-{percent}/100)|
bernoulli|Varianza de Bernoulli|Para una variable que vale 0 o 1, X² tiene la misma esperanza que X. Resta el cuadrado de la media a esa esperanza.|Var(X) = p(1 − p)|Un ensayo de Bernoulli tiene probabilidad de éxito {percent}%. Halla su varianza.|arithmetic|({percent}/100)*(1-{percent}/100)|
normal_z|Estandarización de una observación|Resta la media a la observación y divide la diferencia entre la desviación estándar.|z = (x − μ) ÷ σ|Para una normal con media {prod} y desviación estándar {a}, ¿cuál es el valor z de la observación {prod2}?|arithmetic|({prod2}-{prod})/{a}|
confianza_media|Intervalo de confianza para la media|Para una aproximación normal bilateral al 95%, multiplica el error estándar por 1.96. El margen se suma y resta de la media de la muestra.|Margen al 95% ≈ 1.96 × σ ÷ √n con σ poblacional conocida.|Una muestra de {square} observaciones independientes tiene σ poblacional igual a {b}. Halla el margen de error al 95% con z = 1.96.|arithmetic|1.96*{b}/sqrt({square})|
recta_analitica|Pendiente entre dos puntos|Calcula el cambio vertical dividido entre el cambio horizontal. Dos puntos con la misma abscisa definen una recta vertical.|m = (y₂ − y₁) ÷ (x₂ − x₁)|Calcula la pendiente de la recta que pasa por (0, {b}) y ({c}, {sum}).|arithmetic|({sum}-{b})/{c}|
elipse_analitica|Ecuación de la elipse|Los denominadores de la ecuación estándar son los cuadrados de los semiejes. Para eje mayor horizontal, la distancia focal al centro es la raíz de su diferencia.|Para x² ÷ a² + y² ÷ b² = 1, a > b > 0, c = √(a² − b²).|Halla la distancia del centro a uno de los focos de x² ÷ {sum_sq} + y² ÷ {square} = 1.|arithmetic|sqrt({sum_sq}-{square})|
parabola_foco|Foco de una parábola|Compara la ecuación con la forma estándar. El parámetro p indica la distancia con signo del vértice al foco en la dirección de apertura.|Para x² = 4py, el foco es (0,p).|¿Cuál es la coordenada y del foco de x² = {four_a}y?|arithmetic|{four_a}/4|
distancia_espacial|Distancia en el espacio|Calcula el desplazamiento en cada coordenada. Aplica la norma euclidiana al vector de desplazamiento.|d = √((x₂ − x₁)² + (y₂ − y₁)² + (z₂ − z₁)²)|¿Cuál es la distancia entre (0, 0, 0) y ({a}, {b}, {c})?|matrix|norma([{a},{b},{c}])|
plano_espacial|Planos en el espacio|En la forma z = ax + by + c, a y b son pendientes por dirección. Sustituye las coordenadas horizontales para encontrar la altura.|z = ax + by + c|Halla z en (x,y) = (2, −1) sobre el plano z = {a}x + {b}y + {c}.|arithmetic|2*{a}-{b}+{c}|
limite_sucesion|Límites de sucesiones|Reescribe el término general separando la parte constante de la que decae. Cuando 1 ÷ n tiende a cero, queda la parte constante.|Si aₙ = c + b ÷ n, aₙ → c.|Halla el límite de la sucesión aₙ = {a} + {b} ÷ n.|limit|{a}+{b}/n|oo
serie_geometrica|Series geométricas|Una serie geométrica converge cuando el valor absoluto de la razón es menor que uno. Divide el primer término entre uno menos la razón.|S = a₁ ÷ (1 − r) si abs(r) < 1.|Halla la suma desde n = 0 hasta infinito de {a}(1 ÷ {b})ⁿ.|arithmetic|{a}/(1-1/{b})|
serie_telescopica|Series telescópicas|Al escribir la suma parcial, muchos términos consecutivos se cancelan. Halla el límite de los términos de los extremos.|La suma desde n = m hasta N de 1 ÷ n − 1 ÷ (n + 1) es 1 ÷ m − 1 ÷ (N + 1).|Suma desde n = {a} hasta infinito la expresión 1 ÷ n − 1 ÷ (n + 1).|limit|1/{a}-1/(n+1)|oo
taylor|Coeficientes de Taylor|La derivada k-ésima en el centro, dividida entre k!, es el coeficiente de grado k. Para exp(ax), la derivada de orden k en 0 es aᵏ.|Coeficiente de xᵏ en exp(ax) = aᵏ ÷ k!|Halla el coeficiente de x³ en el desarrollo de exp({a}x) alrededor de 0.|arithmetic|{a}^3/6|
biseccion|Método de bisección|Empieza con una función continua que cambia de signo en los extremos. Divide el intervalo por su punto medio y conserva el tramo con cambio de signo.|m = (a + b) ÷ 2|Para aproximar la raíz positiva de f(x) = x² − {a} en [0, {sum}], calcula el primer punto medio.|arithmetic|{sum}/2|
newton|Método de Newton|Traza la tangente desde la aproximación actual y usa la intersección con el eje x como siguiente valor.|x₁ = x₀ − f(x₀) ÷ f′(x₀)|Da una iteración de Newton para f(x) = x² − {a} desde x₀ = {b}.|arithmetic|{b}-({b}^2-{a})/(2*{b})|
trapecio|Regla del trapecio|Aproxima la altura de la función por una recta entre los extremos. El área del trapecio usa el promedio de ambas alturas.|T = (b − a) × (f(a) + f(b)) ÷ 2|Aplica un solo trapecio para f(x) = x² en [0, {a}].|arithmetic|{a}*{square}/2|
simpson|Regla de Simpson|Usa la altura de los extremos y da peso cuatro a la del punto medio. Así se integra la parábola interpolante.|S = (b − a) × (f(a) + 4f((a + b) ÷ 2) + f(b)) ÷ 6|Aplica Simpson en un panel a f(x) = x² + {b} en [0, {double}].|arithmetic|{double}*({b}+4*({a}^2+{b})+({double}^2+{b}))/6|
'''.strip()

# Each recipe uses the same numerical parameters as the problem it illustrates.
GRAPH_RECIPES = {
    'dominio': (2, ('1/(x-{a})',)),
    'composicion': (2, ('{a}*x', 'x+{b}', '{a}*(x+{b})')),
    'inversa_funcion': (2, ('{a}*x+{b}', 'x')),
    'transformaciones': (2, ('(x-{a})^2+{b}', 'x^2')),
    'asintotas': (2, ('{problem}',)),
    'trig_periodo': (2, ('sin({a}*x)',)),
    'funcion_exponencial': (2, ('{problem}',)),
    'limites': (2, ('{problem}',)),
    'continuidad': (2, ('{problem}',)),
    'limite_infinito': (2, ('{problem}',)),
    'derivadas': (2, ('{problem}',)),
    'regla_cadena': (2, ('{problem}',)),
    'regla_producto': (2, ('{problem}',)),
    'regla_cociente': (2, ('{problem}',)),
    'recta_tangente': (2, ('{a}*x^2-{b}*x',)),
    'ap_deriv': (2, ('{problem}',)),
    'optimizacion': (2, ('-{a}*x^2+{b}*x',)),
    'integrales': (2, ('{problem}',)),
    'ap_int': (2, ('{problem}',), (0, '{c}')),
    'sustitucion': (2, ('{problem}',)),
    'integracion_partes': (2, ('{problem}',)),
    'fracciones_parciales': (2, ('{problem}',)),
    'area_curvas': (2, ('{a}*x', 'x^2'), (0, '{a}')),
    'volumen_revolucion': (2, ('{b}*x',), (0, '{a}')),
    'valor_medio_integral': (2, ('x^2+{b}',), (0, '{a}')),
    'multivariable': (3, ('{problem}',)),
    'derivada_parcial': (3, ('{problem}',)),
    'superficies': (3, ('x^2-y^2',)),
    'parcial_y': (3, ('{problem}',)),
    'curvas_nivel': (3, ('x^2+y^2',)),
    'plano_tangente': (3, ('{a}*x^2+{b}*y^2',)),
    'derivada_direccional': (3, ('{a}*x+{b}*y',)),
    'puntos_criticos_mv': (3, ('(x-{a})^2+(y-{b})^2',)),
    'integral_doble': (3, ('x*y',)),
    'edo_inicial': (2, ('{b}*exp({a}*x)',)),
    'vida_media': (2, ('{b}*exp(-{a}*x)',)),
    'recta_analitica': (2, ('{a}/{c}*x+{b}',)),
    'elipse_analitica': (2, ('{a}*sqrt(1-x^2/{sum_sq})', '-{a}*sqrt(1-x^2/{sum_sq})')),
    'parabola_foco': (2, ('x^2/{four_a}',)),
    'plano_espacial': (3, ('{a}*x+{b}*y+{c}',)),
    'biseccion': (2, ('x^2-{a}',)),
    'newton': (2, ('x^2-{a}',)),
    'trapecio': (2, ('x^2',), (0, '{a}')),
    'simpson': (2, ('x^2+{b}',), (0, '{double}')),
}

CONTEXTUAL_EXERCISES = frozenset('''
inversa_funcion transformaciones trig_periodo funcion_exponencial recta_tangente autovalores superficies curvas_nivel
plano_tangente derivada_direccional puntos_criticos_mv integral_doble edo_inicial edo_equilibrio vida_media
bayes esperanza_discreta bernoulli normal_z confianza_media recta_analitica elipse_analitica parabola_foco
distancia_espacial plano_espacial serie_geometrica serie_telescopica taylor biseccion newton trapecio simpson
'''.split())

UNIVERSITY_VARIABLES = {'parcial_y': 'y', 'edo_equilibrio': 'y', 'limite_sucesion': 'n', 'serie_telescopica': 'n'}


def exercise_graph(topic_id, values, problem, title, argument):
    recipe = GRAPH_RECIPES.get(topic_id)
    if not recipe:
        return None
    mode, formulas, *area = recipe
    a, b, c = (values[key] for key in 'abc')
    graph = {
        'mode': mode, 'expressions': [formula.format(problem=problem, **values) for formula in formulas],
        'title': title,
    }
    if mode == 3:
        bounds = [-4, 4, -4, 4]
        if topic_id in {'superficies', 'puntos_criticos_mv'}:
            bounds = [-3, max(4, a+2), -3, max(4, b+2)]
        elif topic_id == 'curvas_nivel':
            edge = a+1
            bounds = [-edge, edge, -edge, edge]
        elif topic_id == 'integral_doble':
            bounds = [0, a, 0, b]
        graph['bounds'] = bounds
        return graph

    left, right = -7, 7
    if area:
        start, end = (float(str(value).format(**values)) for value in area[0])
        graph['interval'] = [start, end]
        edge = (end-start)*.22
        left, right = start-edge, end+edge
    elif topic_id == 'dominio':
        left, right = a-5, a+5
    elif topic_id == 'recta_tangente':
        left, right = c-4, c+4
    elif topic_id in {'limites', 'continuidad', 'ap_deriv'}:
        try:
            center = float(argument)
        except ValueError:
            center = 0
        left, right = center-5, center+5
    elif topic_id == 'transformaciones':
        left, right = -3, a+4
    elif topic_id == 'elipse_analitica':
        left, right = -(a+b+1), a+b+1
    elif topic_id == 'funcion_exponencial':
        left, right = -1, b+1
    elif topic_id in {'edo_inicial','vida_media','integracion_partes'}:
        left, right = -1, 2
    elif topic_id == 'biseccion':
        left, right = -1, a+b+1
    elif topic_id == 'newton':
        left, right = -1, b+2
    graph['bounds'] = [left, right, -6, 6]
    graph['fitY'] = True
    return graph


# Extra pure-mathematics topics and courses.
from university_extra import EXTRA_CONTEXTUAL, EXTRA_LESSONS, EXTRA_VARIABLES, extra_values  # noqa: E402
UNIVERSITY_LESSONS = UNIVERSITY_LESSONS + '\n' + EXTRA_LESSONS
CONTEXTUAL_EXERCISES = CONTEXTUAL_EXERCISES | EXTRA_CONTEXTUAL
UNIVERSITY_VARIABLES.update(EXTRA_VARIABLES)
