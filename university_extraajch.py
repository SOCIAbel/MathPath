EXTRA_LESSONS = '''
u_log_prop|Propiedades de los logaritmos|El logaritmo de un producto es la suma de los logaritmos. El de una potencia baja el exponente como factor.|log_b(xy) = log_b x + log_b y y log_b(xⁿ) = n·log_b x|Calcula log₂(2^{a} · 2^{b}).|arithmetic|{a}+{b}|
u_ec_exponencial|Ecuaciones exponenciales|Escribe ambos miembros como potencias de la misma base. Como la exponencial es inyectiva, iguala los exponentes.|bᵘ = bᵛ ⇒ u = v (b > 0, b ≠ 1)|Resuelve 2^(x + {a}) = 2^{sum}.|equation|2**(x+{a}) = 2**{sum}|
u_tramos|Funciones definidas por tramos|Primero decide en qué tramo está el valor de entrada. Solo después aplica la regla de ese tramo.|f(x) = g(x) si x < k; h(x) si x ≥ k|Sea f(x) = {a}x + 1 si x < 0 y f(x) = x² + {b} si x ≥ 0. Halla f({c}).|arithmetic|{c}**2+{b}|
u_abs_ec|Ecuaciones con valor absoluto|abs(u) = k con k > 0 da dos casos: u = k o u = −k. Resuelve ambos.|abs(u) = k ⇔ u = k o u = −k|Resuelve abs(x − {a}) = {b}.|equation|abs(x-{a}) = {b}|
u_angulo_doble|Identidades de ángulo doble|Si conoces el seno y el coseno de x, el seno del ángulo doble es el doble de su producto.|sen(2x) = 2·sen(x)·cos(x)|Si sen(x) = 3/5 y cos(x) = 4/5, halla sen(2x).|arithmetic|2*(3/5)*(4/5)|
u_raices_poli|Raíces de un polinomio|Saca factor común x y factoriza el trinomio que queda. Cada factor lineal aporta una raíz.|x(x − p)(x − q) = 0 ⇒ x ∈ {{0, p, q}}|Halla todas las raíces de x³ − {sum}x² + {prod}x = 0.|equation|x**3 - {sum}*x**2 + {prod}*x = 0|
u_implicita|Derivación implícita|Deriva ambos lados respecto de x tratando y como función de x. Luego despeja y′.|Para x² + y² = r², y′ = −x ÷ y|Para x² + y² = {sumsq2}, halla dy/dx en el punto ({a}, {b}).|arithmetic|-{a}/{b}|
u_lhopital|Regla de L'Hôpital|Si el límite da 0 ÷ 0 o ∞ ÷ ∞, deriva numerador y denominador por separado y vuelve a calcular el límite.|lim f ÷ g = lim f′ ÷ g′ en forma indeterminada|Calcula el límite cuando x tiende a 0.|limit|sin({a}*x)/({b}*x)|0
u_lhopital_exp|L'Hôpital con exponenciales|La forma 0 ÷ 0 aparece al sustituir. La derivada de e^(ax) es a·e^(ax).|lim (e^(ax) − 1) ÷ x = a cuando x → 0|Calcula el límite cuando x tiende a 0.|limit|(exp({a}*x)-1)/x|0
u_razon_cambio|Razones de cambio relacionadas|Deriva la relación respecto del tiempo con la regla de la cadena y sustituye los valores del instante.|Si y = x³, dy/dt = 3x²·dx/dt|Si y = x³ y dx/dt = {a}, halla dy/dt cuando x = {b}.|arithmetic|3*{b}**2*{a}|
u_aprox_lineal|Aproximación lineal|Cerca de un punto, la función se parece a su recta tangente. Usa f(a) + f′(a)(x − a).|√(a² + h) ≈ a + h ÷ (2a)|Aproxima √({square} + {b}) con la recta tangente a √x en x = {square}.|arithmetic|{a}+{b}/(2*{a})|
u_inflexion|Concavidad y puntos de inflexión|La concavidad cambia donde la segunda derivada cambia de signo. Iguala f″(x) a cero.|Punto de inflexión: f″(x) = 0 con cambio de signo|Halla la abscisa del punto de inflexión de f(x) = x³ − {triple}x² + {b}x.|arithmetic|{a}|
u_deriv_atan|Derivada de funciones trigonométricas inversas|La derivada de arctan(u) es u′ ÷ (1 + u²). Para arcsen(u) es u′ ÷ √(1 − u²).|d/dx arctan(ax) = a ÷ (1 + a²x²)|Deriva la expresión con respecto a x.|derivative|atan({a}*x)|
u_deriv_log|Derivada logarítmica|La derivada de ln(u) es u′ ÷ u. Deriva el argumento y divídelo entre el argumento.|d/dx ln(u) = u′ ÷ u|Deriva la expresión con respecto a x.|derivative|ln({a}*x**2+{b})|
u_extremos|Extremos absolutos en un intervalo cerrado|Evalúa la función en los puntos críticos interiores y en los extremos del intervalo. Compara los valores.|El mínimo absoluto es el menor de esos valores|Halla el valor mínimo absoluto de f(x) = x² − {double}x en [0, {sum}].|arithmetic|-{square}|
u_valor_medio|Teorema del valor medio|Existe un c donde la pendiente de la tangente iguala a la pendiente de la secante entre los extremos.|f′(c) = (f(b) − f(a)) ÷ (b − a)|Para f(x) = x² en [0, {double}], halla el c del teorema del valor medio.|arithmetic|{a}|
u_int_trig|Integrales trigonométricas|Reduce las potencias pares con identidades de ángulo doble antes de integrar.|sen²x = (1 − cos 2x) ÷ 2|Halla una primitiva. Puedes escribir + C.|integral|sin(x)**2|
u_sust_trig|Sustitución trigonométrica|Con √(a² − x²) usa x = a·sen θ. La raíz se convierte en a·cos θ.|∫ dx ÷ √(a² − x²) = arcsen(x ÷ a) + C|Halla una primitiva. Puedes escribir + C.|integral|1/sqrt({square}-x**2)|
u_impropia|Integrales impropias|Integra hasta un extremo b y toma el límite cuando b tiende a infinito.|∫₀^∞ e^(−ax) dx = 1 ÷ a|Calcula la integral impropia.|integral|exp(-{a}*x)|0,oo
u_impropia_p|Integrales impropias de tipo p|∫ dx ÷ xᵖ desde 1 hasta infinito converge si p > 1 y vale 1 ÷ (p − 1).|∫₁^∞ x⁻ᵖ dx = 1 ÷ (p − 1) si p > 1|Calcula la integral impropia.|integral|1/x**{a}|1,oo
u_longitud_arco|Longitud de arco|La longitud es la integral de √(1 + (y′)²). Para y = (2/3)x^(3/2), queda √(1 + x).|L = ∫ √(1 + f′(x)²) dx|Halla la longitud de y = (2/3)x^(3/2) entre x = 0 y x = {sq_minus}.|arithmetic|2/3*({a}**3-1)|
u_tfc|Teorema fundamental del cálculo|Derivar una integral con límite superior variable devuelve el integrando evaluado en ese límite.|d/dx ∫ₐˣ f(t) dt = f(x)|Si F(x) = ∫₀ˣ (t² + {a}) dt, halla F′({b}).|arithmetic|{b}**2+{a}|
u_int_log|Integrales que dan logaritmos|Si el numerador es la derivada del denominador, la primitiva es el logaritmo del denominador.|∫ u′ ÷ u dx = ln(abs(u)) + C|Halla una primitiva. Puedes escribir + C.|integral|(2*x+{a})/(x**2+{a}*x+{b})|
u_cramer|Regla de Cramer|Cada incógnita es un cociente de determinantes: el del sistema con la columna de términos independientes en su lugar, entre el del sistema.|x = det(Aₓ) ÷ det(A)|Resuelve el sistema.|system|x + y = {sum}; x - y = {difference}|
u_gauss3|Eliminación de Gauss|Usa una ecuación para eliminar una incógnita de las demás. Repite hasta tener una forma triangular y sustituye hacia atrás.|Forma escalonada ⇒ sustitución regresiva|Resuelve el sistema de tres ecuaciones.|system|x + y + z = {abc_sum}; x - y = {difference}; y - z = {bc_diff}|
u_producto_cruz|Producto vectorial|La componente z de u × v es u₁v₂ − u₂v₁. El resultado es perpendicular a ambos vectores.|(u × v)₃ = u₁v₂ − u₂v₁|Para u = ({a}, {b}, 0) y v = ({c}, 1, 0), halla la componente z de u × v.|arithmetic|{a}-{b}*{c}|
u_proyeccion|Proyección escalar|Divide el producto escalar entre la norma del vector sobre el que proyectas.|comp_v u = (u · v) ÷ ‖v‖|Halla la proyección escalar de u = ({a}, {b}) sobre v = (3, 4).|arithmetic|(3*{a}+4*{b})/5|
u_singular|Matrices singulares|Una matriz cuadrada no tiene inversa cuando su determinante es cero.|det([[a, b], [k, c]]) = ac − bk = 0|¿Para qué valor de k la matriz [[{a}, {b}], [k, {c}]] es singular?|arithmetic|{a}*{c}/{b}|
u_independencia|Independencia lineal|Dos vectores del plano son dependientes si uno es múltiplo del otro, es decir, si su determinante es cero.|(1, a) y (b, k) dependientes ⇔ k = ab|¿Para qué k los vectores (1, {a}) y ({b}, k) son linealmente dependientes?|arithmetic|{a}*{b}|
u_traza|Traza y autovalores|La suma de los autovalores de una matriz es su traza y su producto es el determinante.|λ₁ + λ₂ = traza(A) y λ₁λ₂ = det(A)|Halla la suma de los autovalores de [[{a}, {b}], [{c}, {sum}]].|arithmetic|{a}+{sum}|
u_autovalores_sim|Autovalores de una matriz simétrica|Resuelve det(A − λI) = 0. Para [[a, b], [b, a]] el polinomio característico es (a − λ)² − b².|λ = a ± b|Halla los autovalores de [[{a}, {b}], [{b}, {a}]].|equation|(x-{a})**2 - {b}**2 = 0|
u_integral_triple|Integrales triples|Sobre una caja, integra una variable cada vez. Si el integrando se separa, la integral es el producto de tres integrales simples.|∫∫∫ x dV sobre [0,a]×[0,b]×[0,c] = a²bc ÷ 2|Calcula la integral de f(x,y,z) = x sobre la caja [0, {a}] × [0, {b}] × [0, {c}].|arithmetic|{a}**2*{b}*{c}/2|
u_polares|Integrales dobles en coordenadas polares|Cambia a polares: x² + y² = r² y dA = r dr dθ. Integra r de 0 al radio y θ de 0 a 2π.|∫∫ (x² + y²) dA sobre el disco de radio a = πa⁴ ÷ 2|Calcula la integral de x² + y² sobre el disco de radio {a}. Usa pi para π.|arithmetic|pi*{a}**4/2|
u_lagrange|Multiplicadores de Lagrange|En el óptimo con restricción, el gradiente de la función es paralelo al de la restricción.|∇f = λ∇g|Halla el valor máximo de f(x, y) = xy sujeto a x + y = {double}.|arithmetic|{square}|
u_hessiano|Hessiano y clasificación de puntos críticos|El determinante del hessiano decide: positivo con fₓₓ > 0 es mínimo, negativo es punto de silla.|D = fₓₓ·fᵧᵧ − (fₓᵧ)²|Para f(x, y) = {a}x² + {b}y² + {c}xy, halla el determinante del hessiano.|arithmetic|4*{a}*{b}-{c}**2|
u_cadena_mv|Regla de la cadena en varias variables|Suma la contribución de cada variable intermedia: derivada parcial por la derivada de esa variable respecto de t.|dz/dt = zₓ·x′(t) + zᵧ·y′(t)|Si z = x² + y², x = t e y = {a}t, halla dz/dt en t = 1.|arithmetic|2+2*{a}**2|
u_jacobiano|Jacobiano de las coordenadas polares|El jacobiano mide cuánto se estira el área al cambiar de variables. En polares vale r.|∂(x, y) ÷ ∂(r, θ) = r|Halla el jacobiano del cambio a polares en r = {a}, θ = π/4.|arithmetic|{a}|
u_separables|Ecuaciones de variables separables|Separa y con dy y x con dx a cada lado. Integra ambos lados y despeja y.|dy ÷ y = k·x dx ⇒ y = C·e^(kx²/2)|Resuelve la ecuación diferencial.|ode|y' = {a}*x*y|
u_lineal1|Ecuación lineal de primer orden|Multiplica por el factor integrante e^(∫p dx). El lado izquierdo se vuelve la derivada de un producto.|y′ + p·y = q ⇒ (μy)′ = μq con μ = e^(∫p dx)|Resuelve la ecuación diferencial.|ode|y' = {prod} - {a}*y|
u_caracteristica|Ecuación característica|Para y″ + p y′ + q y = 0 prueba y = e^(rx). Las raíces de r² + pr + q = 0 dan las soluciones.|y = C₁e^(r₁x) + C₂e^(r₂x) si r₁ ≠ r₂|Halla las raíces de la ecuación característica de y″ − {sum}y′ + {prod}y = 0.|equation|x**2 - {sum}*x + {prod} = 0|
u_oscilador|Raíces complejas de la ecuación característica|Si la ecuación característica es r² + ω² = 0, las soluciones son cos(ωx) y sen(ωx).|y″ + ω²y = 0 ⇒ y = C₁cos(ωx) + C₂sen(ωx)|Para y″ + {square}y = 0, halla ω.|arithmetic|{a}|
u_wronskiano|Wronskiano|El wronskiano de dos soluciones es el determinante de la matriz con las funciones y sus derivadas. Si no es cero, son independientes.|W(f, g) = f·g′ − f′·g|Halla W(e^({a}x), e^({b}x)) en x = 0.|arithmetic|{b}-{a}|
u_exactas|Ecuaciones exactas|Si ∂M/∂y = ∂N/∂x, existe F con Fₓ = M y Fᵧ = N. La solución es F(x, y) = C.|M dx + N dy = 0 exacta ⇔ Mᵧ = Nₓ|La ecuación (2xy + {a})dx + (x² + {b})dy = 0 es exacta. Halla su función potencial F con F(0, 0) = 0 y evalúa F(1, 1).|arithmetic|1+{a}+{b}|
u_permutaciones|Permutaciones|Para ordenar k elementos elegidos entre n importa el orden. Multiplica n por los k − 1 números siguientes hacia abajo.|P(n, k) = n! ÷ (n − k)!|¿De cuántas formas se ordenan 2 elementos elegidos entre {n_small}?|arithmetic|{n_small}*({n_small}-1)|
u_poisson|Distribución de Poisson|Modela el número de sucesos en un intervalo con media λ.|P(X = k) = e^(−λ)λᵏ ÷ k!|Si X sigue una Poisson con λ = {a}, halla P(X = 0).|arithmetic|exp(-{a})|
u_uniforme|Distribución uniforme continua|En [a, b] la densidad es constante. La probabilidad de un subintervalo es su longitud entre la longitud total.|P(X ≤ x) = (x − a) ÷ (b − a)|Si X es uniforme en [0, {sum}], halla P(X ≤ {a}).|arithmetic|{a}/{sum}|
u_var_lineal|Varianza de una transformación lineal|Sumar una constante no cambia la dispersión. Multiplicar por k multiplica la varianza por k².|Var(kX + m) = k²·Var(X)|Si Var(X) = {a}, halla Var({b}X + {c}).|arithmetic|{b}**2*{a}|
u_esp_lineal|Esperanza de una transformación lineal|La esperanza es lineal: el factor sale multiplicando y la constante se suma.|E(kX + m) = k·E(X) + m|Si E(X) = {c}, halla E({a}X + {b}).|arithmetic|{a}*{c}+{b}|
u_exponencial_dist|Distribución exponencial|Modela tiempos de espera. Su media es el inverso de la tasa λ.|E(X) = 1 ÷ λ|Si X es exponencial con tasa λ = {a}, halla E(X).|arithmetic|1/{a}|
u_circunferencia|Ecuación de la circunferencia|Completa cuadrados para llevar la ecuación a (x − h)² + (y − k)² = r².|x² + y² − 2hx − 2ky + (h² + k² − r²) = 0|Halla el radio de x² + y² − {double}x − {b2}y {circ_term} = 0.|arithmetic|{c}|
u_hiperbola|Hipérbola|En x²/a² − y²/b² = 1 la distancia del centro a cada foco cumple c² = a² + b².|c = √(a² + b²)|Halla c para la hipérbola x²/{leg1sq} − y²/{leg2sq} = 1.|arithmetic|5*{a}|
u_dist_recta|Distancia de un punto a una recta|Sustituye el punto en la ecuación general de la recta, toma valor absoluto y divide entre la norma del vector normal.|d = abs(Ax₀ + By₀ + C) ÷ √(A² + B²)|Halla la distancia del punto ({a}, {b}) a la recta 3x + 4y = 0.|arithmetic|(3*{a}+4*{b})/5|
u_perpendiculares|Vectores perpendiculares|Dos vectores son perpendiculares cuando su producto escalar es cero.|u · v = 0 ⇔ u ⟂ v|¿Para qué k los vectores ({a}, {b}) y (k, {c}) son perpendiculares?|arithmetic|-{b}*{c}/{a}|
u_recta_espacio|Rectas en el espacio|Una recta paramétrica parte de un punto y avanza en la dirección de su vector director multiplicado por t.|r(t) = P₀ + t·v|La recta pasa por ({a}, {b}, {c}) con dirección (1, 2, 3). Halla la coordenada z en t = 2.|arithmetic|{c}+6|
u_vertice|Vértice de una parábola|Completa el cuadrado: x² − 2hx + h² + k = (x − h)² + k. El vértice es (h, k).|y = (x − h)² + k ⇒ V = (h, k)|Halla la ordenada del vértice de y = x² − {double}x + {vertex_c}.|arithmetic|{b}|
u_razon|Criterio de la razón|Calcula el límite del cociente entre términos consecutivos. Si es menor que 1, la serie converge.|L = lim abs(aₙ₊₁ ÷ aₙ); L < 1 ⇒ converge|Para la serie de aₙ = n ÷ {b}ⁿ, halla L del criterio de la razón.|arithmetic|1/{b}|
u_radio|Radio de convergencia|Aplica el criterio de la razón a la serie de potencias. El radio es el valor de abs(x) donde L = 1.|Σ xⁿ ÷ aⁿ converge si abs(x) < a|Halla el radio de convergencia de la serie Σ xⁿ ÷ {a}ⁿ.|arithmetic|{a}|
u_maclaurin|Series de Maclaurin|Los coeficientes son las derivadas en 0 divididas entre k!. Para cos(ax) solo aparecen potencias pares.|cos(u) = 1 − u²/2! + u⁴/4! − ...|Halla el coeficiente de x² en el desarrollo de cos({a}x).|arithmetic|-{a}**2/2|
u_alternante|Series alternantes|Una serie geométrica de razón negativa alterna signos. Si abs(r) < 1, suma a₁ ÷ (1 − r).|Σ (−1/a)ⁿ desde n = 0 = a ÷ (a + 1)|Halla la suma de Σ (−1/{a})ⁿ desde n = 0 hasta infinito.|arithmetic|{a}/({a}+1)|
u_serie_exp|Serie de la exponencial|La serie de potencias de eˣ tiene coeficientes 1 ÷ n!. Evaluarla en x = a da e^a.|Σ aⁿ ÷ n! = e^a|Halla la suma de Σ {a}ⁿ ÷ n! desde n = 0 hasta infinito.|arithmetic|exp({a})|
u_limite_e|El número e como límite|La sucesión (1 + a/n)ⁿ crece hacia e^a cuando n tiende a infinito.|lim (1 + a/n)ⁿ = e^a|Calcula el límite cuando n tiende a infinito.|limit|(1+{a}/n)**n|oo
u_secante|Método de la secante|Reemplaza la derivada de Newton por la pendiente de la recta que une las dos últimas aproximaciones.|x₂ = x₁ − f(x₁)(x₁ − x₀) ÷ (f(x₁) − f(x₀))|Para f(x) = x² − {a} con x₀ = 1 y x₁ = {b}, halla x₂.|arithmetic|{b}-({b}**2-{a})*({b}-1)/(({b}**2-{a})-(1-{a}))|
u_punto_fijo|Iteración de punto fijo|Escribe la ecuación como x = g(x) y aplica g repetidamente desde una aproximación inicial.|xₙ₊₁ = g(xₙ)|Con g(x) = (x + {a} ÷ x) ÷ 2 y x₀ = {b}, halla x₁.|arithmetic|({b}+{a}/{b})/2|
u_interpolacion|Interpolación lineal de Lagrange|El polinomio de grado 1 que pasa por dos puntos es la recta que los une. Evalúalo en el punto pedido.|P(x) = y₀(x − x₁) ÷ (x₀ − x₁) + y₁(x − x₀) ÷ (x₁ − x₀)|El polinomio pasa por (0, {b}) y (1, {sum}). Halla P({c}).|arithmetic|{b}+{a}*{c}|
u_heun|Método de Euler mejorado|Promedia la pendiente al inicio y la pendiente estimada al final del paso.|yₙ₊₁ = yₙ + h(k₁ + k₂) ÷ 2|Para y′ = y con y(0) = {a} y h = 1/10, da un paso de Euler mejorado.|arithmetic|{a}*(1+1/10+1/200)|
u_rk4|Método de Runge-Kutta de orden 4|Combina cuatro pendientes con pesos 1, 2, 2 y 1. Para y′ = y reproduce el desarrollo de e^h hasta h⁴.|yₙ₊₁ = yₙ(1 + h + h²/2 + h³/6 + h⁴/24) para y′ = y|Para y′ = y con y(0) = 1 y h = 1/{b}, da un paso de RK4.|arithmetic|1+1/{b}+1/(2*{b}**2)+1/(6*{b}**3)+1/(24*{b}**4)|
u_jacobi|Método de Jacobi|Despeja cada incógnita de su ecuación y usa los valores de la iteración anterior en todas las demás.|xₖ₊₁ = (b₁ − a₁₂yₖ) ÷ a₁₁|Para 4x + y = {a} y x + 4y = {b}, empezando en (0, 0), halla x₁.|arithmetic|{a}/4|
u_error_relativo|Error absoluto y relativo|El error relativo divide el error absoluto entre el valor real. Indica el tamaño del error respecto de la cantidad.|Eᵣ = abs(aprox − real) ÷ abs(real)|El valor real es {ten_a} y la aproximación es {ten_a1}. Halla el error relativo.|arithmetic|1/(10*{a})|
u_cx_producto|Producto de números complejos|Multiplica como binomios y usa i² = −1. La parte real reúne los productos sin i.|(a + bi)(c + di) = (ac − bd) + (ad + bc)i|Halla la parte real de ({a} + {b}i)({c} + i).|arithmetic|{a}*{c}-{b}|
u_cx_modulo|Módulo de un número complejo|El módulo es la distancia al origen en el plano complejo. Aplica Pitágoras a la parte real e imaginaria.|abs(a + bi) = √(a² + b²)|Halla el módulo de {leg1} + {leg2}i.|arithmetic|5*{a}|
u_cx_conjugado|Conjugado de un número complejo|El conjugado cambia el signo de la parte imaginaria. Un complejo por su conjugado da el cuadrado del módulo.|(a + bi)(a − bi) = a² + b²|Calcula ({a} + {b}i)({a} − {b}i).|arithmetic|{a}**2+{b}**2|
u_cx_division|División de números complejos|Multiplica numerador y denominador por el conjugado del denominador para dejar un denominador real.|(a + bi) ÷ i = b − ai|Halla la parte real de ({a} + {b}i) ÷ i.|arithmetic|{b}|
u_cx_polar|Forma polar y argumento|El argumento es el ángulo con el eje real positivo. Para a + a√3·i, tan θ = √3.|z = r(cos θ + i sen θ)|Halla el argumento principal de z = {a} + {a}√3·i. Usa pi para π.|arithmetic|pi/3|
u_cx_moivre|Fórmula de De Moivre|Para elevar a una potencia, eleva el módulo y multiplica el argumento.|[r(cos θ + i sen θ)]ⁿ = rⁿ(cos nθ + i sen nθ)|Halla el módulo de (1 + i)^{double}.|arithmetic|2**{a}|
u_cx_euler|Fórmula de Euler|e^(iθ) = cos θ + i sen θ. Así la forma polar se escribe r·e^(iθ).|e^(iθ) = cos θ + i sen θ|Halla la parte real de {a}·e^(iπ/3).|arithmetic|{a}/2|
u_cx_raices|Raíces n-ésimas de un complejo|Las n raíces tienen todas el mismo módulo, la raíz n-ésima del módulo, y se reparten cada 2π ÷ n.|Las raíces de z tienen módulo r^(1/n)|Halla el módulo de las raíces cúbicas de z = {cube}·i.|arithmetic|{a}|
u_logica|Lógica proposicional|Una tabla de verdad recorre todas las combinaciones de valores. Cada variable duplica el número de filas.|n variables ⇒ 2ⁿ filas|¿Cuántas filas tiene la tabla de verdad de una fórmula con {a} variables?|arithmetic|2**{a}|
u_conjuntos|Conjuntos y principio de inclusión-exclusión|Al sumar los dos conjuntos, la intersección se cuenta dos veces. Réstala una vez.|card(A ∪ B) = card(A) + card(B) − card(A ∩ B)|Si card(A) = {prod}, card(B) = {prod2} y card(A ∩ B) = {b}, halla card(A ∪ B).|arithmetic|{prod}+{prod2}-{b}|
u_induccion|Inducción matemática|Se prueba el caso base y que si vale para n, vale para n + 1. Así se demuestra, por ejemplo, que la suma de impares es n².|1 + 3 + ... + (2n − 1) = n²|Usa la fórmula probada por inducción para hallar 1 + 3 + ... + (2·{n_small} − 1).|arithmetic|{n_small}**2|
u_congruencias|Congruencias|a ≡ b (mod m) si m divide a a − b. El residuo de un producto es el residuo del producto de los residuos.|(a·b) mod m = ((a mod m)(b mod m)) mod m|Halla el residuo de {a} · {b} al dividir entre {c}.|arithmetic|{mod_ab}|
u_recurrencias|Relaciones de recurrencia|Calcula cada término a partir de los anteriores, empezando por las condiciones iniciales.|aₙ = aₙ₋₁ + aₙ₋₂|Si a₀ = {a}, a₁ = {b} y aₙ = aₙ₋₁ + aₙ₋₂, halla a₄.|arithmetic|2*{a}+3*{b}|
u_grafo_completo|Grafos completos|En un grafo completo cada vértice se une con todos los demás. Cada arista conecta dos vértices.|K_n tiene n(n − 1) ÷ 2 aristas|¿Cuántas aristas tiene el grafo completo con {n_small} vértices?|arithmetic|{n_small}*({n_small}-1)/2|
u_apreton|Lema del apretón de manos|Cada arista aporta 1 al grado de cada uno de sus dos extremos. La suma de grados es el doble del número de aristas.|Σ grados = 2·card(E)|Un grafo tiene {prod} aristas. ¿Cuánto suman los grados de todos sus vértices?|arithmetic|2*{prod}|
u_palomar|Principio del palomar|Si se reparten más objetos que cajas, alguna caja recibe al menos el techo del cociente.|Alguna caja tiene al menos techo(n ÷ k) objetos|Se reparten {pigeons} objetos en {a} cajas. ¿Cuál es el mínimo garantizado en la caja más llena?|arithmetic|{b}+1|
u_binomio|Binomio de Newton|El coeficiente de xᵏ en (x + a)ⁿ es el combinatorio C(n, k) por a elevado a n − k.|(x + a)ⁿ = Σ C(n, k)xᵏaⁿ⁻ᵏ|Halla el coeficiente de x² en (x + {a})⁴.|arithmetic|6*{a}**2|
u_lap_exp|Transformada de Laplace de la exponencial|La transformada integra e^(−st)f(t) desde 0 hasta infinito. Para e^(at) converge si s > a.|L{{e^(at)}}(s) = 1 ÷ (s − a)|Evalúa L{{e^({a}t)}} en s = {sum}.|arithmetic|1/{b}|
u_lap_potencia|Transformada de Laplace de una potencia|Integrando por partes repetidamente se obtiene n! ÷ sⁿ⁺¹.|L{{tⁿ}}(s) = n! ÷ sⁿ⁺¹|Evalúa L{{t²}} en s = {a}.|arithmetic|2/{a}**3|
u_lap_seno|Transformada de Laplace del seno|La transformada de sen(bt) es b ÷ (s² + b²).|L{{sen(bt)}}(s) = b ÷ (s² + b²)|Evalúa L{{sen({b}t)}} en s = {a}.|arithmetic|{b}/({a}**2+{b}**2)|
u_lap_traslacion|Primer teorema de traslación|Multiplicar por e^(at) desplaza la transformada: F(s) pasa a F(s − a).|L{{e^(at)f(t)}}(s) = F(s − a)|Evalúa L{{t·e^({a}t)}} en s = {sum}.|arithmetic|1/{b}**2|
u_lap_inversa|Transformada inversa de Laplace|Reconoce la forma de una tabla: a ÷ (s − b) es la transformada de a·e^(bt).|L⁻¹{{a ÷ (s − b)}} = a·e^(bt)|Si F(s) = {a} ÷ (s − {b}), halla f(0).|arithmetic|{a}|
u_lap_edo|Ecuaciones diferenciales con Laplace|Transforma la ecuación: L{{y′}} = sY − y(0). Despeja Y(s) y aplica la inversa.|y′ = ay, y(0) = b ⇒ Y(s) = b ÷ (s − a)|Para y′ = {a}y con y(0) = {b}, resuelve con Laplace y halla y(1).|arithmetic|{b}*exp({a})|
u_fourier_bn|Coeficientes de Fourier en senos|Para una función impar en [−π, π] solo aparecen senos. Para f(x) = x, bₙ = 2(−1)ⁿ⁺¹ ÷ n.|bₙ = (1/π) ∫ f(x) sen(nx) dx|Para f(x) = x en [−π, π], halla b_{a}.|arithmetic|2*(-1)**({a}+1)/{a}|
u_fourier_an|Coeficientes de Fourier en cosenos|Si la función ya es una suma de cosenos, sus coeficientes se leen directamente por ortogonalidad.|aₙ = (1/π) ∫ f(x) cos(nx) dx|Para f(x) = {a} + {b}cos({c}x), halla a_{c}.|arithmetic|{b}|
u_divergencia|Divergencia de un campo vectorial|La divergencia suma las derivadas de cada componente respecto de su propia variable.|div F = ∂P/∂x + ∂Q/∂y + ∂R/∂z|Halla la divergencia de F = ({a}x, {b}y, {c}z).|arithmetic|{a}+{b}+{c}|
u_rotacional|Rotacional|La componente z del rotacional es ∂Q/∂x − ∂P/∂y. Mide el giro del campo en el plano xy.|(rot F)₃ = ∂Q/∂x − ∂P/∂y|Halla la componente z del rotacional de F = (−{a}y, {a}x, 0).|arithmetic|2*{a}|
u_integral_linea|Integrales de línea|Parametriza la curva, sustituye en el campo y multiplica escalarmente por r′(t). Integra en t.|∫ F · dr = ∫ F(r(t)) · r′(t) dt|Para el campo constante F = ({a}, {b}) a lo largo del segmento de (0, 0) a (1, 1), halla ∫ F · dr.|arithmetic|{a}+{b}|
u_green|Teorema de Green|La circulación en una curva cerrada es la integral doble del rotacional en la región interior. Con F = (−y, x)/2 se obtiene el área.|∮ P dx + Q dy = ∫∫ (Qₓ − Pᵧ) dA|Usa Green con F = (−y/2, x/2) para hallar el área del círculo de radio {a}. Usa pi para π.|arithmetic|pi*{a}**2|
u_conservativo|Campos conservativos|Si F = ∇f, la integral de línea solo depende de los extremos: f(final) − f(inicial).|∫ ∇f · dr = f(B) − f(A)|Para F = ({double}x, {b2}y), halla ∫ F · dr de (0, 0) a (1, 1).|arithmetic|{a}+{b}|
u_flujo|Teorema de la divergencia|El flujo saliente por una superficie cerrada es la integral de la divergencia en el volumen.|∯ F · n dS = ∭ div F dV|Halla el flujo de F = (x, y, z) a través de la esfera de radio {a}. Usa pi para π.|arithmetic|4*pi*{a}**3|
u_curva_param|Longitud de una curva paramétrica|Integra la norma de la velocidad r′(t). Para una circunferencia de radio a, la norma es constante e igual a a.|L = ∫ ‖r′(t)‖ dt|Halla la longitud de r(t) = ({a}cos t, {a}sen t) para t de 0 a 2π. Usa pi para π.|arithmetic|2*pi*{a}|
'''.strip()

EXTRA_ROUTES = {
    'Precálculo': 'u_log_prop u_ec_exponencial u_tramos u_abs_ec u_angulo_doble u_raices_poli',
    'Cálculo diferencial': 'u_implicita u_lhopital u_lhopital_exp u_razon_cambio u_aprox_lineal u_inflexion u_deriv_atan u_deriv_log u_extremos u_valor_medio',
    'Cálculo integral': 'u_int_trig u_sust_trig u_impropia u_impropia_p u_longitud_arco u_tfc u_int_log',
    'Álgebra lineal': 'u_cramer u_gauss3 u_producto_cruz u_proyeccion u_singular u_independencia u_traza u_autovalores_sim',
    'Cálculo multivariable': 'u_integral_triple u_polares u_lagrange u_hessiano u_cadena_mv u_jacobiano',
    'Ecuaciones diferenciales': 'u_separables u_lineal1 u_caracteristica u_oscilador u_wronskiano u_exactas',
    'Probabilidad y estadística': 'u_permutaciones u_poisson u_uniforme u_var_lineal u_esp_lineal u_exponencial_dist',
    'Geometría analítica': 'u_circunferencia u_hiperbola u_dist_recta u_perpendiculares u_recta_espacio u_vertice',
    'Sucesiones y series': 'u_razon u_radio u_maclaurin u_alternante u_serie_exp u_limite_e',
    'Métodos numéricos': 'u_secante u_punto_fijo u_interpolacion u_heun u_rk4 u_jacobi u_error_relativo',
}
NEW_COURSES = (
    ('Números complejos', 'u_cx_producto u_cx_modulo u_cx_conjugado u_cx_division u_cx_polar u_cx_moivre u_cx_euler u_cx_raices'),
    ('Matemática discreta', 'u_logica u_conjuntos u_induccion u_congruencias u_recurrencias u_grafo_completo u_apreton u_palomar u_binomio'),
    ('Transformadas de Laplace y Fourier', 'u_lap_exp u_lap_potencia u_lap_seno u_lap_traslacion u_lap_inversa u_lap_edo u_fourier_bn u_fourier_an'),
    ('Cálculo vectorial', 'u_divergencia u_rotacional u_integral_linea u_green u_conservativo u_flujo u_curva_param'),
)

_SHOWN = set('''
u_ec_exponencial u_abs_ec u_raices_poli u_lhopital u_lhopital_exp u_deriv_atan u_deriv_log u_int_trig u_sust_trig
u_impropia u_impropia_p u_int_log u_cramer u_gauss3 u_separables u_lineal1 u_limite_e
'''.split())


def _unescape_rule_ajch(row):
    fields = row.split('|')
    fields[3] = fields[3].replace('{{', '{').replace('}}', '}')
    return '|'.join(fields)


EXTRA_LESSONS = chr(10).join(_unescape_rule_ajch(row) for row in EXTRA_LESSONS.splitlines())
EXTRA_CONTEXTUAL = frozenset(row.split('|')[0] for row in EXTRA_LESSONS.splitlines()) - _SHOWN
EXTRA_VARIABLES = {'u_limite_e': 'n'}


def extra_values_ajch(values):
    a, b, c = values['a'], values['b'], values['c']
    return dict(
        sumsq2=a*a + b*b, triple=3*a, sq_minus=a*a - 1, b2=2*b,
        circ_term=('+ ' if a*a + b*b - c*c >= 0 else '− ') + str(abs(a*a + b*b - c*c)),
        leg1sq=(3*a)**2, leg2sq=(4*a)**2, mod_ab=(a*b) % c, abc_sum=a + b + c, bc_diff=b - c,
        n_small=a + 3, vertex_c=a*a + b, pigeons=a*b + 1, ten_a=10*a, ten_a1=10*a + 1,
    )
