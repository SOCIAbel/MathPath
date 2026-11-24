# MathPath · Autor: Abel Josué Colquehuanca Humpiri
"""More primary and secondary topics, appended at the end of each grade.

Row: id | title | explanation | rule | prompt | engine | expression | parameter.
They go after the original missions of each grade so saved progress and existing worlds stay the same.
"""

EXTRA_SCHOOL = '''
p1_numeros20|Números hasta 20|Diez unidades forman una decena. Para contar más de diez, junta una decena con las unidades que sobran.|10 + unidades|¿Qué número es 10 + {a}?|arithmetic|10 + {a}|
p1_mayor|El número mayor|Compara los números de dos en dos. El mayor es el que está más lejos del cero al contar.|El mayor queda a la derecha en la recta|¿Cuál es el número mayor entre {a}, {b} y {c}?|arithmetic|{max_abc}|
p1_completa10|Completa la decena|Cuenta desde el número hasta llegar a 10. Lo que cuentas es lo que falta.|Lo que falta = 10 − número|¿Cuánto le falta a {a} para llegar a 10?|arithmetic|10 - {a}|
p1_despues|Antes y después|El número que va después se obtiene sumando uno. El que va antes, restando uno.|Después de n viene n + 1|¿Qué número va justo después de {teen}?|arithmetic|{teen} + 1|
p1_largo|Más largo y más corto|Para comparar dos longitudes, resta la menor a la mayor.|Diferencia = mayor − menor|Una cinta mide {a} cm y otra mide {b} cm. ¿Cuántos cm más mide la más larga?|arithmetic|{absdiff}|
p1_frutas|Cuenta en la tabla|Cada dibujo de la tabla representa un objeto. Cuenta cada fila y suma.|Total = fila 1 + fila 2|En la tabla hay {a} manzanas y {b} plátanos. ¿Cuántas frutas hay en total?|arithmetic|{a} + {b}|
p2_cifras|Forma el número mayor|El número mayor lleva la cifra más grande en las decenas.|Mayor = 10 × cifra mayor + cifra menor|Con las cifras {a} y {b}, ¿cuál es el número de dos cifras más grande que puedes formar?|arithmetic|{big_digits}|
p2_llevando|Sumas llevando|Suma primero las unidades. Si pasan de 9, lleva una decena a la columna de las decenas.|10 unidades = 1 decena|Suma los números.|arithmetic|{carry1} + {carry2}|
p2_prestando|Restas prestando|Si arriba hay menos unidades, pide prestada una decena: se convierte en 10 unidades.|1 decena = 10 unidades|Resta los números.|arithmetic|{borrow1} - {borrow2}|
p2_mitad|Doble y mitad|El doble es sumar un número consigo mismo. La mitad es repartir en dos partes iguales.|Doble de n = n + n|¿Cuál es el doble de {a}?|arithmetic|2 * {a}|
p2_saltos5|Saltos de 5 en 5|En la secuencia se suma 5 cada vez. Suma 5 al último número.|Siguiente = anterior + 5|¿Qué número sigue? {a}, {a5}, {a10}, ___|arithmetic|{a} + 15|
p2_semanas|El calendario|Una semana tiene 7 días. Para varias semanas, suma 7 tantas veces como semanas haya.|Días = 7 × semanas|¿Cuántos días hay en {a} semanas?|arithmetic|7 * {a}|
p2_votos|Tablas de votos|Lee cuántos votos tiene cada opción y compáralos restando.|Diferencia = votos mayores − votos menores|A {a} niños les gusta el fútbol y a {b} el vóley. ¿Cuántos votos de diferencia hay?|arithmetic|{absdiff}|
p3_centenas|Números hasta 1000|Cada centena vale 100, cada decena 10 y cada unidad 1. Suma los valores.|n = 100c + 10d + u|¿Qué número tiene {a} centenas, {b} decenas y {c} unidades?|arithmetic|100*{a} + 10*{b} + {c}|
p3_tablas|Tablas de multiplicar|Multiplicar es sumar grupos iguales. Usa la tabla del primer número.|a × b = b × a|Multiplica.|arithmetic|{a} * {b}|
p3_dos_pasos|Problemas de dos pasos|Primero calcula cuánto gastas. Luego resta ese gasto de lo que pagaste.|Vuelto = pago − gasto|Compras {a} cuadernos de {b} soles y pagas con {pay} soles. ¿Cuánto vuelto recibes?|arithmetic|{pay} - {a}*{b}|
p3_recta|Fracciones en la recta|Divide la recta de 0 a 1 en partes iguales. Cada marca avanza una de esas partes.|k marcas de n partes = k/n|La recta de 0 a 1 tiene {ab} partes iguales. ¿Qué fracción marca la marca número {a}?|arithmetic|{a}/{ab}|
p3_secuencia|Secuencias que crecen|Encuentra cuánto aumenta de un número al siguiente y aplica el mismo aumento.|Siguiente = último + salto|¿Qué número sigue? {a}, {ab}, {ab2}, ___|arithmetic|{a} + 3*{b}|
p3_angulos|Ángulos y el ángulo recto|Un ángulo recto mide 90°. Lo que le falta a un ángulo para ser recto se obtiene restando.|Falta = 90° − ángulo|Un ángulo mide {deg_small}°. ¿Cuántos grados le faltan para ser un ángulo recto?|arithmetic|90 - {deg_small}|
p3_escala|Gráfico de barras con escala|Cada cuadrito del gráfico vale lo mismo. Multiplica los cuadritos por ese valor.|Valor = cuadritos × escala|En un gráfico, cada cuadrito vale {b}. Una barra mide {a} cuadritos. ¿Qué valor representa?|arithmetic|{a} * {b}|
p4_millares|Valor posicional|La posición de una cifra indica su valor: unidades, decenas, centenas o millares.|Millares × 1000|En el número {big4}, ¿cuánto vale la cifra de los millares?|arithmetic|1000 * {a}|
p4_residuo|División con residuo|El residuo es lo que sobra después de repartir en grupos iguales. Siempre es menor que el divisor.|Dividendo = divisor × cociente + residuo|¿Cuál es el residuo de dividir {dividend} entre {a}?|arithmetic|{remainder}|
p4_equivalentes|Fracciones equivalentes|Si multiplicas numerador y denominador por el mismo número, la fracción vale lo mismo.|a/b = (a·k)/(b·k)|¿Qué numerador completa {a}/{b} = ?/{bc}?|arithmetic|{a} * {c}|
p4_cuadrito|El número escondido|Para hallar el número del cuadrito, haz la operación contraria con el resultado.|□ + a = s ⇒ □ = s − a|□ + {a} = {sum}. ¿Qué número va en el cuadrito?|arithmetic|{sum} - {a}|
p4_triangulo|Ángulos de un triángulo|Los tres ángulos de un triángulo suman 180°. Resta los conocidos.|A + B + C = 180°|Dos ángulos de un triángulo miden {deg1}° y {deg2}°. ¿Cuánto mide el tercero?|arithmetic|180 - {deg1} - {deg2}|
p4_llano|Dividir un ángulo llano|Un ángulo llano mide 180°. Al repartirlo en partes iguales, divide 180 entre el número de partes.|Cada parte = 180° ÷ partes|Un ángulo llano se divide en {div180} ángulos iguales. ¿Cuánto mide cada uno?|arithmetic|180 / {div180}|
p4_bolsa|Seguro, posible o imposible|La fracción de casos favorables indica qué tan posible es un suceso.|Favorables ÷ total|En una bolsa hay {a} bolas rojas y {b} azules. ¿Qué fracción de las bolas son rojas?|arithmetic|{a} / ({a} + {b})|
p5_mixtos|Números mixtos|Multiplica el entero por el denominador y suma el numerador. Conserva el denominador.|a b/c = (a·c + b)/c|Escribe {a} {b}/{bc_sum} como fracción impropia.|arithmetic|({a}*{bc_sum} + {b}) / {bc_sum}|
p5_suma_decimal|Suma de decimales|Alinea los puntos decimales y suma columna por columna.|Décimos con décimos|Suma los decimales.|arithmetic|{a}.{b} + 0.{c}|
p5_coinciden|¿Cuándo coinciden?|Dos sucesos que se repiten coinciden en los múltiplos comunes. El primero es el mínimo común múltiplo.|Coinciden cada mcm(a, b)|Una luz parpadea cada {a} segundos y otra cada {b}. ¿Cada cuántos segundos parpadean juntas?|arithmetic|mcm({a}, {b})|
p5_constante|Proporcionalidad directa|En una relación directa, el cociente y ÷ x es siempre el mismo: la constante de proporcionalidad.|k = y ÷ x|Si x = {a} corresponde a y = {prod}, ¿cuál es la constante de proporcionalidad?|arithmetic|{prod} / {a}|
p5_trapecio|Área del trapecio|Suma las dos bases, multiplica por la altura y divide entre dos.|A = (B + b) × h ÷ 2|Un trapecio tiene bases de {a} cm y {b} cm y altura {double_c} cm. ¿Cuál es su área en cm²?|arithmetic|({a} + {b}) * {double_c} / 2|
p5_hexagono|Perímetro de polígonos regulares|En un polígono regular todos los lados miden lo mismo. Multiplica el lado por el número de lados.|P = n × lado|Un hexágono regular tiene lados de {a} cm. ¿Cuál es su perímetro en cm?|arithmetic|6 * {a}|
p5_mediana|Mediana|Ordena los datos de menor a mayor. La mediana es el dato del centro.|Dato central de la lista ordenada|Halla la mediana de los datos.|statistics|mediana([{a}, {b}, {c}])|
p6_fracciones|Operaciones con fracciones|Para sumar fracciones de distinto denominador, busca un denominador común.|1/a + 1/b = (a + b)/(ab)|Suma las fracciones.|arithmetic|1/{a} + 1/{b}|
p6_division_decimal|División de decimales|Divide como si fueran enteros y coloca el punto decimal en el cociente en la misma posición.|Reparte cada cifra en orden|Divide.|arithmetic|{double}.{double} / 2|
p6_raiz|Raíz cuadrada exacta|La raíz cuadrada de un número es el valor que, multiplicado por sí mismo, da ese número.|√(n²) = n|Calcula la raíz cuadrada.|arithmetic|sqrt({square})|
p6_ecuacion|Ecuaciones de un paso|Para despejar x, divide ambos lados entre el número que la multiplica.|a·x = b ⇒ x = b ÷ a|Resuelve la ecuación.|equation|{a}*x = {prod}|
p6_prisma|Caras de un prisma|Un prisma tiene dos bases iguales y una cara lateral por cada lado de la base.|Caras = lados de la base + 2|Un prisma tiene bases de {sides} lados. ¿Cuántas caras tiene en total?|arithmetic|{sides} + 2|
p6_rueda|Longitud de la circunferencia|El contorno de un círculo mide dos veces π por el radio.|L = 2πr|Una rueda tiene radio de {a} cm. ¿Cuánto mide su contorno? Usa pi para π.|arithmetic|2*pi*{a}|
p6_circular|Gráfico circular|Un círculo completo tiene 360°. Un porcentaje del círculo ocupa ese porcentaje de 360°.|Grados = porcentaje × 360 ÷ 100|En un gráfico circular, una parte ocupa el {percent}%. ¿Cuántos grados mide su sector?|arithmetic|{percent} * 360 / 100|
s1_absoluto|Valor absoluto|El valor absoluto es la distancia al cero. Siempre es positivo o cero.|abs(−a) = a|Calcula el valor.|arithmetic|abs(-{a}) + abs(-{b})|
s1_potencias|Potencias de números enteros|Si la base es negativa, un exponente par da resultado positivo y uno impar da negativo.|(−a)ⁿ es positivo si n es par|Calcula la potencia.|arithmetic|(-{a})^{power}|
s1_periodicos|Decimales periódicos puros|Un decimal periódico puro de una cifra es esa cifra entre 9.|0.aaa... = a/9|Escribe 0.{digit}{digit}{digit}... como fracción.|arithmetic|{digit}/9|
s1_reduccion|Reducción de términos semejantes|Suma solo los coeficientes de términos con la misma parte literal.|ax + bx = (a + b)x|Reduce la expresión.|simplify|{a}*x + {b}*y - {c}*x + {b}*y|
s1_rectangulo|Perímetro a partir del área|Si conoces el área y la base, divide para hallar la altura. Luego suma los cuatro lados.|h = A ÷ b, P = 2(b + h)|Un rectángulo tiene área {prod} cm² y base {a} cm. ¿Cuál es su perímetro en cm?|arithmetic|2*({a} + {b})|
s1_frecuencias|Tablas de frecuencias|La frecuencia absoluta cuenta cuántas veces aparece cada valor. Su suma es el total de datos.|Total = suma de frecuencias|{a} alumnos tienen 12 años, {b} tienen 13 y {c} tienen 14. ¿Cuántos alumnos hay?|arithmetic|{a} + {b} + {c}|
s2_exponentes|Leyes de exponentes|Al multiplicar potencias de la misma base, se conserva la base y se suman los exponentes.|xᵃ · xᵇ = xᵃ⁺ᵇ|Simplifica la expresión.|simplify|x^{a} * x^{b}|
s2_descuento|Aumentos y descuentos|Un descuento de p% deja el (100 − p)% del precio original.|Nuevo = precio × (100 − p) ÷ 100|Un artículo cuesta {capital} soles y tiene {percent}% de descuento. ¿Cuál es el nuevo precio?|arithmetic|{capital}*(100 - {percent})/100|
s2_ec_fracciones|Ecuaciones con fracciones|Multiplica ambos lados por el denominador para eliminar la fracción y despeja.|x/a + b = c ⇒ x = a(c − b)|Resuelve la ecuación.|equation|x/{a} + {b} = {c}|
s2_pendiente|Pendiente de una recta|La pendiente es el cambio en y dividido entre el cambio en x.|m = (y₂ − y₁) ÷ (x₂ − x₁)|Halla la pendiente de la recta que pasa por (0, {b}) y ({a}, {linear2}).|arithmetic|{c}|
s2_interior|Ángulos de polígonos regulares|Los ángulos interiores de un polígono de n lados suman 180°(n − 2). En uno regular, todos miden lo mismo.|Ángulo = 180°(n − 2) ÷ n|¿Cuánto mide cada ángulo interior de un polígono regular de {sides_poly} lados?|arithmetic|180*({sides_poly} - 2)/{sides_poly}|
s2_media|Media aritmética|Suma todos los datos y divide entre la cantidad de datos.|x̄ = suma ÷ n|Halla la media de los datos.|statistics|media([{a}, {b}, {c}, {prod}])|
s2_rango|Rango de un conjunto de datos|El rango mide la dispersión: el dato mayor menos el dato menor.|Rango = máximo − mínimo|Halla el rango de los datos {a}, {b}, {c} y {prod}.|arithmetic|{range4}|
s3_radicales|Simplificación de radicales|Descompón el radicando y saca de la raíz los factores que son cuadrados perfectos.|√(a²·k) = a√k|Simplifica el radical.|simplify|sqrt({radical})|
s3_ruffini|Teorema del resto|El residuo de dividir un polinomio entre (x − a) es el valor del polinomio en x = a.|Residuo = P(a)|Halla el residuo de dividir x² + {b}x + {c} entre (x − {a}).|arithmetic|{a}**2 + {b}*{a} + {c}|
s3_cuadrados|Diferencia de cuadrados|Una resta de dos cuadrados se factoriza como suma por diferencia de sus raíces.|a² − b² = (a + b)(a − b)|Factoriza la expresión.|factor|x**2 - {square}|
s3_tales|Teorema de Tales|Rectas paralelas cortan segmentos proporcionales en dos transversales.|a ÷ b = c ÷ x|Unas paralelas cortan segmentos de {a} y {b} cm en una transversal, y de {c} cm y x cm en otra. Halla x.|arithmetic|{b}*{c}/{a}|
s3_sector|Área de un sector circular|El sector es una fracción del círculo: su ángulo entre 360°.|A = πr² × θ ÷ 360°|Halla el área de un sector de radio {a} y ángulo {deg_sector}°. Usa pi para π.|arithmetic|pi*{a}**2*{deg_sector}/360|
s3_dado|Probabilidad con un dado|Cuenta los resultados favorables entre los 6 posibles de un dado.|P = favorables ÷ 6|Al lanzar un dado, ¿cuál es la probabilidad de obtener un número mayor que {die}?|arithmetic|(6 - {die})/6|
s4_racionalizar|Racionalización|Multiplica numerador y denominador por la raíz del denominador para quitarla de abajo.|a/√b = a√b/b|Racionaliza la expresión.|simplify|{a}/sqrt({sqfree})|
s4_discriminante|Discriminante|El discriminante b² − 4ac decide cuántas raíces reales tiene la ecuación cuadrática.|Δ = b² − 4ac|Halla el discriminante de x² + {b}x + {c} = 0.|arithmetic|{b}**2 - 4*{c}|
s4_vertice|Vértice de la parábola|La abscisa del vértice de y = ax² + bx + c es −b ÷ (2a).|x_v = −b ÷ (2a)|Halla la abscisa del vértice de y = x² − {double}x + {c}.|arithmetic|{a}|
s4_sustitucion|Sistemas por sustitución|Despeja una incógnita en una ecuación y sustitúyela en la otra.|Si y = ax, entonces x + ax = s|Resuelve el sistema.|system|y = {a}*x; x + y = {sys_sub}|
s4_senos|Ley de senos|En todo triángulo, cada lado es proporcional al seno de su ángulo opuesto.|a ÷ sen A = b ÷ sen B|En un triángulo, a = {a}, A = 30° y B = 90°. Halla el lado b.|arithmetic|2*{a}|
s4_cosenos|Ley de cosenos|Generaliza Pitágoras: resta el doble producto de los lados por el coseno del ángulo comprendido.|c² = a² + b² − 2ab·cos C|Con a = {a}, b = {b} y C = 60°, halla c².|arithmetic|{a}**2 + {b}**2 - {a}*{b}|
s4_combinaciones|Combinaciones|Para elegir 2 de n sin importar el orden, cuenta los pares ordenados y divide entre 2.|C(n, 2) = n(n − 1) ÷ 2|¿De cuántas formas puedes elegir 2 personas de un grupo de {n_small}?|arithmetic|{n_small}*({n_small} - 1)/2|
s5_abs_ineq|Inecuaciones con valor absoluto|abs(x − a) < b significa que x está a menos de b unidades de a.|abs(x − a) < b ⇔ a − b < x < a + b|Resuelve la inecuación.|inequality|abs(x - {a}) < {b}|
s5_log|Función logarítmica|El logaritmo en base 2 de un número es el exponente al que hay que elevar 2 para obtenerlo.|log₂(2ᵏ) = k|Si f(x) = log₂(x), halla f({pow2}).|arithmetic|{power}|
s5_matriz|Determinante de una matriz 2×2|Multiplica la diagonal principal y resta el producto de la otra diagonal.|det = ad − bc|Calcula el determinante.|matrix|det([[{a}, {b}], [{c}, {a}]])|
s5_sumatoria|Sumatorias|La suma de los primeros n naturales es n(n + 1) ÷ 2.|1 + 2 + ... + n = n(n + 1) ÷ 2|Halla 1 + 2 + 3 + ... + {n_sum}.|arithmetic|{n_sum}*({n_sum} + 1)/2|
s5_esfera|Volumen de la esfera|El volumen de una esfera es cuatro tercios de π por el radio al cubo.|V = 4πr³ ÷ 3|Halla el volumen de una esfera de radio {a}. Usa pi para π.|arithmetic|4*pi*{a}**3/3|
s5_condicional|Probabilidad condicional|Restringe el total a los casos de la condición y cuenta los favorables dentro de ellos.|P(A dado B) = casos de A y B ÷ casos de B|En un aula hay {ab} chicas y {a} de ellas usan lentes. Si eliges una chica al azar, ¿qué probabilidad hay de que use lentes?|arithmetic|{a}/{ab}|
'''.strip()

# grade -> list of (curriculum area index, ids). Areas: 0 Números, 1 Patrones y álgebra, 2 Geometría y medida, 3 Datos y azar.
EXTRA_SCHOOL_ROUTES = {
    (1, 1): [(0, 'p1_numeros20 p1_mayor p1_completa10'), (1, 'p1_despues'), (2, 'p1_largo'), (3, 'p1_frutas')],
    (1, 2): [(0, 'p2_cifras p2_llevando p2_prestando p2_mitad'), (1, 'p2_saltos5'), (2, 'p2_semanas'), (3, 'p2_votos')],
    (1, 3): [(0, 'p3_centenas p3_tablas p3_dos_pasos p3_recta'), (1, 'p3_secuencia'), (2, 'p3_angulos'), (3, 'p3_escala')],
    (1, 4): [(0, 'p4_millares p4_residuo p4_equivalentes'), (1, 'p4_cuadrito'), (2, 'p4_triangulo p4_llano'), (3, 'p4_bolsa')],
    (1, 5): [(0, 'p5_mixtos p5_suma_decimal p5_coinciden'), (1, 'p5_constante'), (2, 'p5_trapecio p5_hexagono'), (3, 'p5_mediana')],
    (1, 6): [(0, 'p6_fracciones p6_division_decimal p6_raiz'), (1, 'p6_ecuacion'), (2, 'p6_prisma p6_rueda'), (3, 'p6_circular')],
    (2, 1): [(0, 's1_absoluto s1_potencias s1_periodicos'), (1, 's1_reduccion'), (2, 's1_rectangulo'), (3, 's1_frecuencias')],
    (2, 2): [(0, 's2_descuento'), (1, 's2_exponentes s2_ec_fracciones s2_pendiente'), (2, 's2_interior'), (3, 's2_media s2_rango')],
    (2, 3): [(0, 's3_radicales'), (1, 's3_ruffini s3_cuadrados'), (2, 's3_tales s3_sector'), (3, 's3_dado')],
    (2, 4): [(0, 's4_racionalizar'), (1, 's4_discriminante s4_vertice s4_sustitucion'), (2, 's4_senos s4_cosenos'), (3, 's4_combinaciones')],
    (2, 5): [(0, 's5_log'), (1, 's5_abs_ineq s5_sumatoria s5_matriz'), (2, 's5_esfera'), (3, 's5_condicional')],
}

# Topics whose expression is the exercise itself (shown to the student).
SCHOOL_SHOWN = set('''
p1_numeros20 p2_llevando p2_prestando p3_tablas p5_suma_decimal p5_mediana p6_fracciones p6_division_decimal p6_raiz
p6_ecuacion s1_absoluto s1_potencias s1_reduccion s2_exponentes s2_ec_fracciones s2_media s3_radicales s3_cuadrados
s4_racionalizar s4_sustitucion s5_abs_ineq s5_matriz
'''.split())

SCHOOL_VISUALS = {
    'p1_frutas': ('pictogram', '{a}', '{b}'),
    'p3_tablas': ('groups', '{a}', '{b}'),
}

NEW_SCHOOL_IDS = tuple(row.split('|')[0] for row in EXTRA_SCHOOL.splitlines())


def school_values(values):
    a, b, c = values['a'], values['b'], values['c']
    big, small = max(a, b), min(a, b)
    data = [a, b, c, a * b]
    return dict(
        max_abc=max(a, b, c), teen=10 + a, absdiff=abs(a - b), big_digits=10 * big + small,
        carry1=10 * a + 7, carry2=10 * b + 5, borrow1=10 * (a + b) + 2, borrow2=10 * a + 7,
        a5=a + 5, a10=a + 10, pay=a * b + c, ab=a + b, ab2=a + 2 * b, deg_small=10 * min(a, 8),
        big4=1000 * a + 100 * b + 10 * c + 5, dividend=a * b + c % a, remainder=c % a, bc=b * c,
        div180=(2, 3, 4, 5, 6, 9, 10, 12)[(a + b) % 8], bc_sum=b + c, double_c=2 * c,
        digit=a % 9 + 1, linear2=b + a * c, sides_poly=(5, 6, 8, 9, 10, 12)[(a + c) % 6],
        range4=max(data) - min(data), deg_sector=(30, 45, 60, 90, 120, 180)[(a + b) % 6], die=(a + b) % 5 + 1,
        sqfree=(2, 3, 5, 6, 7)[(a + c) % 5], sys_sub=b * (a + 1), pow2=2 ** values['power'], n_sum=10 + a,
    )
