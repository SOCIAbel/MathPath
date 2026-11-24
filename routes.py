# MathPath · Autor: Abel Josué Colquehuanca Humpiri
"""Stage and grade routes, adapted from Peru's school curriculum and PUCP Ciencias."""

AREAS = ('Números', 'Patrones y álgebra', 'Geometría y medida', 'Datos y azar')

# Each school grade covers the four strands in AREAS. University blocks are by subject.
ROUTES = (
    ('Primaria', '1.º a 6.º', (
        ('1.º grado', ('conteo naturales resta1', 'patron1 igualdad1', 'lados', 'pictograma')),
        ('2.º grado', ('decenas suma reloj monedas', 'patron2', 'medir simetria', 'barras')),
        ('3.º grado', ('multiplicar dividir fraccion_base', 'equilibrio3', 'perimetros coordenadas', 'frecuencia')),
        ('4.º grado', ('producto jerarquia masa', 'patron4', 'figuras angulo_recto', 'moda azar')),
        ('5.º grado', ('fracciones resta_fraccion decimales divisores', 'regla3', 'areas volumenes', 'promedio')),
        ('6.º grado', ('potencias primos fraccion_operador decimal_producto porcentajes', 'equilibrio6', 'circulo escala', 'probabilidad')),
    )),
    ('Secundaria', '1.º a 5.º', (
        ('1.º grado', ('enteros racionales mcdmcm mcm', 'variables expresiones lineales progresion', 'angulos1', 'mediana')),
        ('2.º grado', ('raices proporcion_inversa', 'inecuaciones afin', 'pitagoras traslacion', 'frecuencia_rel')),
        ('3.º grado', ('cientifica interes_simple', 'notables polinomios factor sistemas', 'analitica semejanza', 'datos_agrupados estadistica')),
        ('4.º grado', ('irracionales', 'cuadraticas funciones progresion_geo', 'angulos seno coseno tangente', 'azar_independiente')),
        ('5.º grado', ('interes_compuesto', 'logaritmos exponenciales', 'identidades ec_trig cilindro circunferencia', 'desviacion azar_dependiente')),
    )),
    ('Universitario', 'Ciencias e ingeniería', (
        ('Precálculo', ('dominio composicion inversa_funcion transformaciones asintotas trig_periodo funcion_exponencial',)),
        ('Cálculo diferencial', ('limites continuidad limite_infinito derivadas regla_cadena regla_producto regla_cociente recta_tangente ap_deriv optimizacion',)),
        ('Cálculo integral', ('integrales ap_int sustitucion integracion_partes fracciones_parciales area_curvas volumen_revolucion valor_medio_integral',)),
        ('Álgebra lineal', ('matrices determinantes lineal vectores matriz_inv producto_matricial transpuesta norma_vector autovalores',)),
        ('Cálculo multivariable', ('superficies derivada_parcial parcial_y multivariable curvas_nivel plano_tangente derivada_direccional puntos_criticos_mv integral_doble',)),
        ('Ecuaciones diferenciales', ('diferenciales edo_inicial edo_equilibrio vida_media euler',)),
        ('Probabilidad y estadística', ('combinaciones binomial condicional bayes esperanza_discreta bernoulli normal_z error_estandar confianza_media',)),
        ('Geometría analítica', ('recta_analitica elipse_analitica parabola_foco distancia_espacial plano_espacial',)),
        ('Sucesiones y series', ('limite_sucesion serie_geometrica serie_telescopica taylor',)),
        ('Métodos numéricos', ('biseccion newton trapecio simpson',)),
    )),
)

# More school topics at the end of every grade (see school_extra.py). Each extra group is "area::ids".
from school_extra import EXTRA_SCHOOL, EXTRA_SCHOOL_ROUTES
ROUTES = tuple(
    (name, subtitle, tuple((grade, tuple(groups) + tuple(f'{area}::{ids}' for area, ids in EXTRA_SCHOOL_ROUTES.get((level, unit), ())))
                           for unit, (grade, groups) in enumerate(grades, 1)))
    if level < 3 else (name, subtitle, grades)
    for level, (name, subtitle, grades) in enumerate(ROUTES, 1)
)

# More pure-mathematics topics per course, plus four extra courses (see university_extra.py).
from university_extra import EXTRA_ROUTES, NEW_COURSES
_name, _subtitle, _courses = ROUTES[2]
_courses = tuple((course, (ids[0] + (' ' + EXTRA_ROUTES[course] if course in EXTRA_ROUTES else ''),)) for course, ids in _courses)
ROUTES = ROUTES[:2] + ((_name, _subtitle, _courses + tuple((course, (ids,)) for course, ids in NEW_COURSES)),)

LEVELS = [(name, subtitle, tuple(label for label, _ in grades)) for name, subtitle, grades in ROUTES]

# id | title | explanation | rule | exercise prompt | engine | expression | parameter
# The prompt supplies context before the student sees the symbolic calculation.
ADDITIONS = '''
conteo|Cuenta las estrellas|Toca o señala una estrella por cada número que dices.|Cuenta de uno en uno.|¿Cuántas estrellas ves?|arithmetic|{a}|
resta1|Quitar y contar|Tacha las que se van. Cuenta las que quedan.|Lo que queda = total − lo que quitas|Tienes {sum} pegatinas y regalas {b}. ¿Cuántas te quedan?|arithmetic|{sum} - {b}|
patron1|Completa el patrón|Compara dos números seguidos. Se repite el mismo salto.|Suma el mismo salto cada vez.|¿Qué número sigue? {a}, {p1}, {p2}, ___|arithmetic|{p2} + {b}|
igualdad1|La caja misteriosa|Las dos partes deben valer lo mismo. Cuenta lo que falta para llegar al total.|Parte que falta = total − parte conocida|¿Qué número va en la caja? {a} + □ = {sum}|arithmetic|{sum} - {a}|
lados|Lados de una figura|Recorre el borde y cuenta cada línea recta una vez.|Un lado une dos esquinas seguidas.|¿Cuántos lados tiene la figura?|arithmetic|{sides}|
pictograma|Lee los dibujos|Cada dibujo representa un voto. Cuenta los de los dos grupos.|Total = votos del primer grupo + votos del segundo|Cada estrella vale un voto. ¿Cuántos votos hay en total?|arithmetic|{a} + {b}|
decenas|Decenas y unidades|Una decena es un grupo de diez unidades. Junta los grupos y las unidades sueltas.|1 decena = 10 unidades|¿Qué número forman {a} decenas y {b} unidades?|arithmetic|{a} * 10 + {b}|
reloj|Horas y minutos|Cada hora tiene 60 minutos. Multiplica las horas por 60.|1 h = 60 min|¿Cuántos minutos hay en {a} horas?|arithmetic|{a} * 60|
monedas|Monedas y vuelto|Resta el precio al dinero que entregas. La diferencia es el vuelto.|Vuelto = pago − precio|Pagas con {sum} soles y la compra cuesta {a} soles. ¿Cuánto recibes de vuelto?|arithmetic|{sum} - {a}|
patron2|Cuenta hacia atrás|Mira cuánto baja el número en cada salto. Resta lo mismo otra vez.|Siguiente = anterior − salto|¿Qué número sigue? {p3}, {p2}, {p1}, ___|arithmetic|{p1} - {b}|
medir|Metros y centímetros|Imagina cada metro como una regla de 100 centímetros.|1 m = 100 cm|¿Cuántos centímetros hay en {a} metros?|arithmetic|{a} * 100|
simetria|El espejo|El lado del espejo tiene tantas fichas como el original.|Total = fichas de un lado × 2|Hay {a} fichas a la izquierda de la línea. Agrega su reflejo. ¿Cuántas hay en total?|arithmetic|{a} * 2|
barras|Lee las barras|Cada bloque vale un voto. Compara cuánto mide cada barra.|Diferencia = barra mayor − barra menor|¿Por cuántos votos ganó el grupo A?|arithmetic|{sum} - {a}|
multiplicar|Grupos iguales|Cuenta cuántos grupos hay y cuántos objetos tiene cada uno.|Total = grupos × objetos por grupo|Hay {a} bolsas con {b} canicas en cada una. ¿Cuántas canicas hay?|arithmetic|{a} * {b}|
dividir|Reparto justo|Reparte la misma cantidad en cada grupo. Comprueba multiplicando.|Por grupo = total ÷ grupos|Reparte {prod} fichas entre {a} personas. ¿Cuántas recibe cada una?|arithmetic|{prod} / {a}|
fraccion_base|Partes iguales|El número de abajo indica en cuántas partes iguales divides el entero. El de arriba dice cuántas tomas.|Un medio es una de dos partes iguales.|¿Cuántas fichas son la mitad de {double} fichas?|arithmetic|{double} / 2|
equilibrio3|Equilibrio con grupos|Si el total y el número de grupos son conocidos, divide para hallar lo que hay en cada grupo.|Factor que falta = total ÷ factor conocido|¿Qué número va en la caja? {a} × □ = {prod}|arithmetic|{prod} / {a}|
coordenadas|Movimientos en la cuadrícula|Moverse a la derecha aumenta la primera coordenada. La altura se mantiene.|Posición final = posición inicial + pasos a la derecha|Partes de ({a}, {c}) y avanzas {b} casillas a la derecha. ¿Cuál es tu nueva primera coordenada?|arithmetic|{a} + {b}|
frecuencia|Tabla de frecuencias|Una frecuencia dice cuántas veces aparece un valor. Suma las frecuencias para contar todas las respuestas.|Total = suma de las frecuencias|Votaron {a} por fútbol, {b} por vóley y {c} por básquet. ¿Cuántas personas votaron?|arithmetic|{a} + {b} + {c}|
masa|Kilogramos y gramos|Cada kilogramo contiene 1 000 gramos. Multiplica por 1 000 al pasar a gramos.|1 kg = 1 000 g|¿Cuántos gramos hay en {a} kilogramos?|arithmetic|{a} * 1000|
patron4|Patrones que se multiplican|Divide un término por el anterior para encontrar el factor. Repite ese factor para avanzar.|Siguiente = anterior × factor|¿Qué número sigue? {a}, {prod}, {g2}, ___|arithmetic|{g2} * {b}|
angulo_recto|Giros y ángulos rectos|Un cuarto de vuelta forma un ángulo recto. Dos cuartos forman media vuelta.|Un cuarto de vuelta = 90°|¿Cuántos grados tiene media vuelta? Calcula usando los {quarter} cuartos de vuelta.|arithmetic|{quarter} * 90|
moda|El dato más repetido|Cuenta las veces que sale cada valor. La moda es el que más se repite.|Moda = dato de mayor frecuencia|¿Cuál es la moda de estos datos? {a}, {b}, {a}, {c}, {a}, {b}|statistics|moda([{a},{b},{a},{c},{a},{b}])|
azar|¿Puede ocurrir?|Es seguro si todos los resultados posibles lo cumplen. Es imposible si ninguno lo cumple.|Casos favorables = 0 en un suceso imposible.|Una bolsa tiene {a} fichas azules y {b} rojas. ¿Cuántas fichas verdes podrías sacar de esa bolsa?|arithmetic|{a} + {b} - {sum}|
promedio|Promedio|Reparte el total en partes iguales para representar al grupo con un valor.|Promedio = suma de los datos ÷ cantidad de datos|¿Cuál es el promedio de {a}, {b} y {c}?|statistics|media([{a},{b},{c}])|
resta_fraccion|Resta de fracciones|Escribe las dos fracciones con el mismo denominador. Resta los numeradores y deja ese denominador.|Con el mismo denominador, resta las partes que cuentas.|Calcula la diferencia entre {a} ÷ {b} y 1 ÷ {b}. Escribe una fracción.|arithmetic|{a}/{b} - 1/{b}|
fraccion_operador|Fracción de una cantidad|Primero divide el total en tantas partes como dice el denominador. Luego toma las partes que indica el numerador.|Fracción de un total = total ÷ denominador × numerador|¿Cuánto es 2 ÷ {a} de un total de {prod} fichas?|arithmetic|({prod}/{a}) * 2|
decimal_producto|Multiplicar decimales|Multiplica sin el punto. En el resultado deja tantos decimales como tienen los factores en total.|Si un factor tiene dos decimales y el otro uno, deja tres decimales.|Calcula {a}.25 × {b}.5.|arithmetic|{a}.25 * {b}.5|
equilibrio6|Igualdades y valores desconocidos|Quita la misma cantidad de los dos lados. Luego divide los dos lados por el número que multiplica a la incógnita.|Si ax + b = c, entonces x = (c − b) ÷ a|¿Cuánto vale x? {a} cajas iguales y {b} fichas sueltas suman {linear} fichas.|equation|{a}*x + {b} = {linear}|
circulo|Área del círculo|Eleva el radio al cuadrado y multiplica por π.|A = π × radio²|El radio es {a} cm. ¿Cuál es el área en cm²? Usa π o pi.|geometry|area_circulo({a})|
escala|Mapas a escala|Cada centímetro del mapa equivale a varias unidades reales. Multiplica por esa equivalencia.|Distancia real = medida en el mapa × equivalencia|En un plano, 1 cm representa {b} m. ¿Cuántos metros representan {a} cm?|arithmetic|{a} * {b}|
racionales|Operaciones con racionales|Usa la doble C. Coloca una fracción encima de la otra. Multiplica el primer número y el último para obtener el numerador. Multiplica los dos números del medio para obtener el denominador. Al final, simplifica la fracción.|(a ÷ b) ÷ (c ÷ d) = (a × d) ÷ (b × c)|Calcula y simplifica.|arithmetic|({a}/{b}) / ({c}/{b})|
mcm|Mínimo común múltiplo|Busca el menor múltiplo positivo que comparten los dos números. Sirve para encontrar cuándo coinciden dos ciclos.|MCM = producto de los enteros positivos ÷ MCD|Un aviso se repite cada {a} minutos y otro cada {b}. Acaban de sonar juntos. ¿En cuántos minutos coinciden otra vez?|arithmetic|mcm({a},{b})|
progresion|Progresiones aritméticas|Encuentra la diferencia entre dos términos seguidos. Desde el primero hasta el término n hay n − 1 saltos.|aₙ = a₁ + (n − 1) × d|La sucesión empieza {a}, {p1}, {p2}. ¿Cuál es el término en la posición {c}?|arithmetic|{a} + ({c} - 1) * {b}|
angulos1|Ángulos de un triángulo|Los tres ángulos interiores de un triángulo suman 180°. Resta los dos que conoces.|Ángulo faltante = 180° − suma de los otros dos|Dos ángulos miden {deg1}° y {deg2}°. ¿Cuántos grados mide el tercero?|arithmetic|180 - ({deg1} + {deg2})|
mediana|Mediana|Ordena los datos. Con una cantidad impar, el dato del centro es la mediana.|Con n impar, la posición central es (n + 1) ÷ 2.|Halla la mediana de {a}, {b}, {c}, {sum}, {prod}.|statistics|mediana([{a},{b},{c},{sum},{prod}])|
proporcion_inversa|Proporcionalidad inversa|Para el mismo trabajo, multiplicar la cantidad de personas reduce el tiempo en la misma proporción si todas avanzan al mismo ritmo.|Personas × tiempo = constante|{a} personas tardan {b} horas. Al mismo ritmo, ¿cuántas horas tardan {double} personas?|arithmetic|({a} * {b}) / {double}|
afin|Función afín|Multiplica la cantidad por la tarifa variable y suma el monto fijo.|f(x) = ax + b|Un envío cuesta {b} soles más {a} soles por kilo. ¿Cuánto cuesta enviar {c} kilos?|function|{a}*x + {b}|{c}
traslacion|Traslaciones|Suma a cada coordenada el desplazamiento en su dirección. La forma conserva tamaño y orientación.|(x, y) → (x + h, y + k)|Traslada ({a}, {b}) en {c} unidades a la izquierda. ¿Cuál es la primera coordenada?|arithmetic|{a} - {c}|
frecuencia_rel|Frecuencia relativa|Divide las veces que salió una opción entre la cantidad total de observaciones.|fᵣ = frecuencia ÷ total|De {sum} votos, {a} fueron por la opción A. Escribe su frecuencia relativa como fracción.|arithmetic|{a}/{sum}|
cientifica|Notación científica|Para exponentes positivos, multiplica por una potencia de 10. Mueve la coma tantos lugares como indique el exponente.|N = a × 10ⁿ, con 1 ≤ a < 10|Escribe el número en forma decimal.|arithmetic|{a}.5 * 10^{power}|
interes_simple|Interés simple|Calcula el interés de un periodo sobre el capital inicial. Multiplica por el número de periodos.|Interés = capital × tasa × tiempo|Inviertes {capital} soles al {percent}% anual. ¿Cuánto interés simple ganas en {c} años?|arithmetic|{capital} * ({percent}/100) * {c}|
semejanza|Triángulos semejantes|En figuras semejantes, cada lado cambia por el mismo factor. Halla ese factor con dos lados correspondientes.|Lado nuevo = lado original × factor de escala|Un lado de {a} cm pasa a {prod} cm. ¿Cuánto mide el nuevo lado correspondiente a {c} cm?|arithmetic|{c} * ({prod} / {a})|
datos_agrupados|Media de datos agrupados|Usa el punto medio de cada intervalo como representante. Multiplica cada punto medio por su frecuencia, suma y divide entre el total de observaciones.|Media estimada = suma de marcas de clase × frecuencias, dividida entre el total|El intervalo de 0 a 10 tiene {a} datos y el de 10 a 20 tiene {b}. Estima la media usando las marcas de clase.|arithmetic|(5 * {a} + 15 * {b}) / {sum}|
irracionales|Números irracionales|Extrae un cuadrado perfecto de la raíz. El factor que queda dentro mantiene el resultado exacto.|√(a² × b) = a × √b para a ≥ 0|Simplifica la raíz. Puedes escribir √(2) o sqrt(2).|arithmetic|sqrt({radical})|
progresion_geo|Progresiones geométricas|Multiplica por la razón en cada salto. Para hallar el término n desde el primero, da n − 1 saltos.|aₙ = a₁ × rⁿ⁻¹|La sucesión empieza {a}, {prod}, {g2}. ¿Cuánto vale el término número {position}?|arithmetic|{a} * {b}^({position} - 1)|
azar_independiente|Sucesos independientes|Con reposición, la primera extracción no cambia la probabilidad de la segunda. Multiplica las dos probabilidades.|P(A y B) = P(A) × P(B) si son independientes.|Hay {a} fichas azules y {b} rojas. Sacas una ficha, la devuelves y sacas otra. ¿Qué probabilidad hay de sacar dos azules?|arithmetic|({a}/{sum}) * ({a}/{sum})|
interes_compuesto|Interés compuesto|Cada periodo se aplica al saldo acumulado. Multiplica por el mismo factor de crecimiento en cada periodo.|Monto = capital × (1 + tasa)ⁿ|Depositas {capital} soles al {percent}% anual. ¿Cuál es el monto después de {position} años? Da el valor exacto.|arithmetic|{capital} * (1 + {percent}/100)^{position}|
cilindro|Volumen del cilindro|Primero calcula el área de la base circular. Después multiplícala por la altura.|V = π × radio² × altura|El radio mide {a} cm y la altura {b} cm. ¿Qué volumen tiene en cm³?|arithmetic|pi * {a}^2 * {b}|
circunferencia|Ecuación de la circunferencia|Sustituye las coordenadas del centro y eleva el radio al cuadrado en el lado derecho.|(x − h)² + (y − k)² = r²|El centro es ({a}, {b}) y el radio es {c}. ¿Qué número va al lado derecho de la ecuación?|arithmetic|{c}^2|
desviacion|Desviación estándar|Calcula la varianza y toma su raíz cuadrada. El resultado vuelve a las unidades originales.|σ = √(varianza poblacional)|Halla la desviación estándar poblacional de {a}, {b} y {c}.|statistics|desviacion([{a},{b},{c}])|
azar_dependiente|Sucesos dependientes|Sin reposición queda una ficha menos. Si la primera fue azul, también queda una azul menos.|P(A y B) = P(A) × P(B dado A)|Hay {a} fichas azules y {b} rojas. Sacas dos sin devolver la primera. ¿Qué probabilidad hay de sacar dos azules?|arithmetic|({a}/{sum}) * (({a} - 1)/({sum} - 1))|
dominio|Dominio de una función|El denominador de una fracción no puede valer cero. Iguala el denominador a cero para hallar la entrada excluida.|En 1 ÷ (x − a), excluye x = a.|¿Qué valor debes excluir del dominio de 1 ÷ (x − {a})?|equation|x - {a} = 0|
composicion|Composición de funciones|Calcula primero g(x). Sustituye ese valor como entrada de f.|(f ∘ g)(x) = f(g(x))|Si f(x) = {a} × x y g(x) = x + {b}, halla (f ∘ g)({c}).|arithmetic|{a} * ({c} + {b})|
optimizacion|Optimización con derivadas|Iguala la derivada a cero. Si la función es una parábola abierta hacia abajo, el punto crítico da el máximo.|Para f(x) = −ax² + bx, el máximo está en x = b ÷ (2a), si a > 0.|¿En qué valor de x alcanza el máximo f(x) = −{a}x² + {b}x?|equation|-2*{a}*x + {b} = 0|
sustitucion|Integración por sustitución|Elige como u la expresión interior. Su diferencial reemplaza el factor constante que acompaña a la potencia.|Con u = ax + b, du = a dx.|Encuentra una primitiva usando u = {a}x + {b}.|integral|{a}*({a}*x + {b})^{power}|
matriz_inv|Inversa de una matriz|Calcula el determinante. Si no es cero, intercambia la diagonal principal, cambia el signo de la secundaria y divide por el determinante.|A⁻¹ = adj(A) ÷ det(A)|Halla la inversa. Escribe [[a,b],[c,d]].|matrix|inversa([[{a},1],[0,{b}]])|
derivada_parcial|Derivadas parciales|Con respecto a x, trata y como una constante. Deriva cada término usando esa regla.|∂(x × y) ÷ ∂x = y|Halla la derivada parcial respecto a x.|derivative|{a}*x^2 + {b}*x*y + {c}*y^2|
euler|Método de Euler|Calcula la pendiente con el valor inicial. Avanza un paso en esa dirección para aproximar el siguiente valor.|y₁ = y₀ + h × f(x₀, y₀)|Para y′ = {a}y, y(0) = {b} y paso h = 0.1, aproxima y(0.1) con un paso de Euler.|arithmetic|{b} + 0.1 * ({a} * {b})|
combinaciones|Combinaciones|Cuenta los grupos de dos sin importar el orden. Cada pareja ordenada se cuenta dos veces.|C(n, 2) = n × (n − 1) ÷ 2|¿Cuántas parejas distintas puedes formar con {sum} personas?|arithmetic|{sum} * ({sum} - 1) / 2|
binomial|Distribución binomial|Para exactamente un acierto, multiplica la probabilidad de un acierto y dos fallos por las tres posiciones posibles del acierto.|P(X = 1) = 3 × p × (1 − p)²|Haces tres intentos independientes, cada uno con probabilidad de acierto {percent}%. ¿Qué probabilidad hay de acertar exactamente una vez?|arithmetic|3 * ({percent}/100) * (1 - {percent}/100)^2|
condicional|Probabilidad condicional|Limita los casos posibles a los que cumplen la condición. Cuenta los que además cumplen el suceso buscado.|P(A dado B) = P(A y B) ÷ P(B)|En un grupo hay {a} estudiantes de ciencias y {b} de letras que usan bicicleta. Si eliges a alguien que usa bicicleta, ¿qué probabilidad hay de que sea de ciencias?|arithmetic|{a}/{sum}|
error_estandar|Error estándar de la media|Para observaciones independientes con desviación poblacional conocida, divide esa desviación entre la raíz del tamaño de la muestra.|EE = σ ÷ √n|Una población tiene desviación estándar {b}. ¿Cuál es el error estándar de una media de {square} observaciones independientes?|arithmetic|{b} / sqrt({square})|
'''.strip()

ADDITIONS = ADDITIONS.strip() + '\n' + EXTRA_SCHOOL
