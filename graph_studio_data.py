# MathPath · Autor: Abel Josué Colquehuanca Humpiri
"""Read-only graph studio queries and validation of saved constructions."""

import ast
import copy
import math
import operator
import re

from engine import AbelExpressionParser, AbelInputError
from graphing import axis_bounds, curve_paths, graph_function, surface_mesh


COLORS = ['#6655c9','#197aaa','#c45948','#24825c','#b28124','#9a53ad','#388b8f','#bd6383']
IDENTITY = re.compile(r'[A-Za-z][A-Za-z0-9_-]{0,35}')
PARAMETER = re.compile(r'[a-wA-D]')
DECLARATION = re.compile(r'^\s*([a-z][a-z0-9_]*)\s*\(\s*x\s*\)\s*=\s*(.+)$',re.I)
GEOMETRY_TYPES = {
    'point':(0,0),'midpoint':(2,2),'line':(2,2),'segment':(2,2),'circle':(2,2),
    'polygon':(3,12),'angle':(3,3),'perpendicular':(3,3),'parallel':(3,3),'intersection':(2,2),
}


def number(raw,minimum=-1e6,maximum=1e6):
    if type(raw) not in (int,float) or not math.isfinite(raw) or not minimum<=raw<=maximum:
        raise AbelInputError('Usa valores numéricos dentro del rango indicado.')
    return raw


def bounded_text(raw,limit):
    if not isinstance(raw,str) or len(raw)>limit:
        raise AbelInputError('El texto supera el tamaño permitido.')
    return raw


def parameters(raw):
    if not isinstance(raw,dict) or len(raw)>6:
        raise AbelInputError('Puedes usar hasta seis deslizadores.')
    result={}
    for key,value in raw.items():
        if not isinstance(key,str) or not PARAMETER.fullmatch(key) or key in {'e','E'}:
            raise AbelInputError('Usa una letra como a, b, c, k o t para el deslizador.')
        result[key]=number(value,-1000,1000)
    return result


def expand_expressions(entries,values,mode):
    definitions={}
    texts=[]
    for entry in entries:
        text=bounded_text(entry.get('text',''),220).strip()
        declared=DECLARATION.fullmatch(text) if mode==2 else None
        if declared:
            definitions[declared[1]]=declared[2]
            text=declared[2]
        else:
            prefix=r'^\s*(?:y|[fgh]\(x\))\s*=\s*' if mode==2 else r'^\s*(?:z|f\(x,y\))\s*=\s*'
            text=re.sub(prefix,'',text)
        texts.append(text)

    def substitute(text):
        return re.sub(r'\b[A-Za-z]\b',lambda match:'('+repr(values[match[0]])+')'
                      if match[0] in values else match[0],text)

    def expand(text,stack=()):
        parser=AbelExpressionParser(substitute(text))
        class Functions(ast.NodeTransformer):
            def visit_Call(self,node):
                if isinstance(node.func,ast.Name) and node.func.id in definitions:
                    name=node.func.id
                    if name in stack or len(stack)>=6 or len(node.args)!=1 or node.keywords:
                        raise AbelInputError('Revisa las referencias entre las funciones.')
                    original=AbelExpressionParser(expand(definitions[name],(*stack,name))).root
                    argument=self.visit(node.args[0])
                    class ReplaceX(ast.NodeTransformer):
                        def visit_Name(self,node):
                            return copy.deepcopy(argument) if node.id=='x' else node
                    return ReplaceX().visit(original)
                return self.generic_visit(node)
        tree=Functions().visit(parser.root)
        if sum(1 for _ in ast.walk(tree))>140:
            raise AbelInputError('La función tiene demasiadas operaciones.')
        result=ast.unparse(ast.fix_missing_locations(tree)).replace('**','^')
        if len(result)>220:
            raise AbelInputError('La función expandida es demasiado larga.')
        return result
    return texts,expand


def contours(function,bounds):
    xmin,xmax,ymin,ymax=bounds
    steps=80
    xs=[xmin+(xmax-xmin)*index/steps for index in range(steps+1)]
    ys=[ymin+(ymax-ymin)*index/steps for index in range(steps+1)]
    mesh=[[function(x,y) for x in xs] for y in ys]
    segments=[]
    for row in range(steps):
        for col in range(steps):
            corners=[(xs[col],ys[row],mesh[row][col]),(xs[col+1],ys[row],mesh[row][col+1]),
                     (xs[col+1],ys[row+1],mesh[row+1][col+1]),(xs[col],ys[row+1],mesh[row+1][col])]
            if any(point[2] is None for point in corners):
                continue
            cuts=[]
            for first,last in zip(corners,corners[1:]+corners[:1]):
                a,b=first[2],last[2]
                if (a<=0<b) or (b<=0<a):
                    ratio=a/(a-b)
                    cuts.append([first[0]+ratio*(last[0]-first[0]),first[1]+ratio*(last[1]-first[1])])
            for index in range(0,len(cuts)-1,2):
                segments.append([cuts[index],cuts[index+1]])
    return {'segments':segments,'hasValues':bool(segments)}


def sample(args):
    mode=args.get('mode')
    entries=args.get('entries')
    if mode not in (2,3) or not isinstance(entries,list) or len(entries)>(10 if mode==2 else 1):
        raise AbelInputError('Usa hasta diez funciones en 2D o una superficie en 3D.')
    if any(not isinstance(entry,dict) for entry in entries):
        raise AbelInputError('Revisa las entradas del gráfico.')
    bounds=axis_bounds(args.get('bounds'))
    values=parameters(args.get('parameters',{}))
    texts,expand=expand_expressions(entries,values,mode)
    results=[]
    table=args.get('table')
    xs=[]
    if table is not None:
        if not isinstance(table,list) or len(table)>101:
            raise AbelInputError('La tabla admite hasta 101 valores de x.')
        xs=[number(value) for value in table]
    for entry,text in zip(entries,texts):
        result={'id':str(entry.get('id',''))[:36]}
        try:
            if mode==2 and '=' in text:
                sides=text.split('=')
                if len(sides)!=2 or any(not side.strip() for side in sides):
                    raise AbelInputError('Escribe una sola igualdad completa.')
                expression=expand('('+sides[0]+')-('+sides[1]+')')
                result.update(contours(graph_function(expression,3),bounds))
                result['values']=[None]*len(xs)
                result['implicit']=True
            else:
                expression=expand(text)
                function=graph_function(expression,mode)
                data=surface_mesh(function,bounds) if mode==3 else curve_paths([function],bounds[:],False)
                result.update(data)
                result['values']=[function(x) for x in xs]
                result['expression']=expression
        except (AbelInputError,ValueError,OverflowError,RecursionError) as error:
            result.update(error=str(error),hasValues=False)
        results.append(result)
    return {'bounds':bounds,'entries':results}


def probability(args):
    distribution=args.get('distribution')
    if distribution=='normal':
        mean=number(args.get('mean'),-1e4,1e4)
        sd=number(args.get('sd'),.001,1e4)
        lower=number(args.get('lower'))
        upper=number(args.get('upper'))
        if lower>upper:
            raise AbelInputError('El extremo izquierdo debe ser menor o igual al derecho.')
        cdf=lambda x:(1+math.erf((x-mean)/(sd*math.sqrt(2))))/2
        density=lambda x:math.exp(-.5*((x-mean)/sd)**2)/(sd*math.sqrt(2*math.pi))
        left,right=mean-4.5*sd,mean+4.5*sd
        points=[[left+(right-left)*index/500,density(left+(right-left)*index/500)] for index in range(501)]
        return {'distribution':distribution,'points':points,'probability':max(0,cdf(upper)-cdf(lower)),
                'selected':[lower,upper],'bounds':[left,right,0,density(mean)*1.17]}
    if distribution!='binomial':
        raise AbelInputError('Elige una distribución.')
    n=args.get('n')
    if type(n) is not int or not 1<=n<=150:
        raise AbelInputError('Usa entre 1 y 150 ensayos.')
    p=number(args.get('p'),0,1)
    lower,upper=args.get('lower'),args.get('upper')
    if type(lower) is not int or type(upper) is not int or not 0<=lower<=upper<=n:
        raise AbelInputError('Usa extremos enteros entre 0 y el número de ensayos.')
    points=[[k,math.comb(n,k)*p**k*(1-p)**(n-k)] for k in range(n+1)]
    return {'distribution':distribution,'points':points,
            'probability':sum(value for k,value in points if lower<=k<=upper),
            'selected':[lower,upper],'bounds':[-1,n+1,0,max(value for _,value in points)*1.17]}


def sheet(args):
    cells=args.get('cells')
    if (not isinstance(cells,list) or len(cells)!=10 or
            any(not isinstance(row,list) or len(row)!=3 for row in cells)):
        raise AbelInputError('La hoja tiene diez filas y tres columnas.')
    source={f'{col}{index+1}':bounded_text(value,100).strip()
            for index,row in enumerate(cells) for col,value in zip('ABC',row)}
    cache={}
    active=set()
    operations={ast.Add:operator.add,ast.Sub:operator.sub,ast.Mult:operator.mul,
                ast.Div:operator.truediv,ast.Pow:operator.pow}
    aggregates={'SUM':sum,'SUMA':sum,'AVERAGE':lambda values:sum(values)/len(values),
                'PROMEDIO':lambda values:sum(values)/len(values),'MIN':min,'MAX':max}
    def value(key):
        if key in cache:
            return cache[key]
        if key not in source:
            raise AbelInputError('Celda fuera del rango A1:C10.')
        if key in active:
            raise AbelInputError('Referencia circular.')
        active.add(key)
        try:
            raw=source[key]
            if not raw:
                result=0
            elif not raw.startswith('='):
                result=float(raw.replace(',','.'))
            else:
                text=raw[1:].upper().replace('^','**')
                def replace_range(match):
                    a,b=match[1],match[2]
                    c0,c1=ord(a[0])-65,ord(b[0])-65
                    r0,r1=int(a[1:])-1,int(b[1:])-1
                    if not 0<=c0<=c1<3 or not 0<=r0<=r1<10:
                        raise AbelInputError('Rango de celdas no válido.')
                    return ','.join(f'{chr(65+c)}{r+1}' for r in range(r0,r1+1) for c in range(c0,c1+1))
                text=re.sub(r'([A-Z]\d{1,2}):([A-Z]\d{1,2})',replace_range,text)
                tree=ast.parse(text,mode='eval').body
                if sum(1 for _ in ast.walk(tree))>120:
                    raise AbelInputError('Fórmula demasiado larga.')
                def evaluate(node):
                    if isinstance(node,ast.Constant) and type(node.value) in (int,float):
                        return number(node.value,-1e12,1e12)
                    if isinstance(node,ast.Name):
                        return value(node.id)
                    if isinstance(node,ast.UnaryOp) and isinstance(node.op,(ast.UAdd,ast.USub)):
                        v=evaluate(node.operand)
                        return -v if isinstance(node.op,ast.USub) else v
                    if isinstance(node,ast.BinOp) and type(node.op) in operations:
                        a,b=evaluate(node.left),evaluate(node.right)
                        if isinstance(node.op,ast.Pow) and abs(b)>30:
                            raise AbelInputError('Exponente demasiado grande.')
                        return number(operations[type(node.op)](a,b),-1e12,1e12)
                    if isinstance(node,ast.Call) and isinstance(node.func,ast.Name) and not node.keywords:
                        values=[evaluate(arg) for arg in node.args]
                        if node.func.id in aggregates and values:
                            return aggregates[node.func.id](values)
                        if node.func.id=='SQRT' and len(values)==1:
                            return math.sqrt(values[0])
                    raise AbelInputError('Fórmula no admitida.')
                result=evaluate(tree)
            result=number(result,-1e12,1e12)
            cache[key]=result
            return result
        finally:
            active.remove(key)
    rows=[]
    for index in range(10):
        row=[]
        for column in 'ABC':
            key=f'{column}{index+1}'
            try:
                row.append({'value':value(key),'empty':not source[key]})
            except (AbelInputError,ValueError,SyntaxError,ArithmeticError,TypeError):
                row.append({'error':'Revisa la fórmula o las referencias.','value':None})
        rows.append(row)
    return {'rows':rows}


def validate_state(raw):
    if not isinstance(raw,dict) or raw.get('version')!=1:
        raise AbelInputError('Selecciona una construcción de MathPath válida.')
    result={'version':1}
    perspective=raw.get('perspective','graph')
    if perspective not in {'graph','geometry','surface','cas','sheet','probability'}:
        raise AbelInputError('La vista de la construcción no es válida.')
    result['perspective']=perspective
    result['bounds']={str(mode):axis_bounds(raw.get('bounds',{}).get(str(mode))) for mode in (2,3)}
    camera=raw.get('camera',[-.63,.51,1])
    if not isinstance(camera,list) or len(camera)!=3:
        raise AbelInputError('La cámara guardada no es válida.')
    result['camera']=[number(camera[0],-100,100),number(camera[1],.11,1.47),number(camera[2],.45,3.5)]
    result['entries']={}
    ids=set()
    for mode in (2,3):
        entries=raw.get('entries',{}).get(str(mode),[])
        if not isinstance(entries,list) or len(entries)>(10 if mode==2 else 1):
            raise AbelInputError('La construcción tiene demasiadas funciones.')
        cleaned=[]
        for entry in entries:
            if not isinstance(entry,dict) or not IDENTITY.fullmatch(str(entry.get('id',''))) or entry['id'] in ids:
                raise AbelInputError('Revisa los identificadores de las funciones.')
            ids.add(entry['id'])
            color=entry.get('color',COLORS[len(cleaned)%len(COLORS)])
            if not isinstance(color,str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',color):
                raise AbelInputError('Color de curva no válido.')
            cleaned.append({'id':entry['id'],'text':bounded_text(entry.get('text',''),220),
                            'visible':entry.get('visible') is not False,'color':color})
        result['entries'][str(mode)]=cleaned
    sliders=raw.get('sliders',[])
    if not isinstance(sliders,list) or len(sliders)>6:
        raise AbelInputError('La construcción tiene demasiados deslizadores.')
    clean_sliders=[]
    names=set()
    for slider in sliders:
        if not isinstance(slider,dict):
            raise AbelInputError('Deslizador no válido.')
        name=slider.get('name')
        parameters({name:slider.get('value')})
        if name in names:
            raise AbelInputError('Los nombres de los deslizadores deben ser distintos.')
        low=number(slider.get('min'),-1000,1000)
        high=number(slider.get('max'),-1000,1000)
        step=number(slider.get('step'),.001,1000)
        if low>=high or not low<=slider['value']<=high:
            raise AbelInputError('Revisa el rango del deslizador.')
        names.add(name)
        clean_sliders.append({'name':name,'value':slider['value'],'min':low,'max':high,'step':step})
    result['sliders']=clean_sliders
    geometry=raw.get('geometry',[])
    if not isinstance(geometry,list) or len(geometry)>40:
        raise AbelInputError('La construcción admite hasta 40 objetos geométricos.')
    cleaned=[]
    for item in geometry:
        if not isinstance(item,dict):
            raise AbelInputError('Objeto geométrico no válido.')
        identity=item.get('id')
        kind=item.get('type')
        if not isinstance(identity,str) or not IDENTITY.fullmatch(identity) or identity in ids or kind not in GEOMETRY_TYPES:
            raise AbelInputError('Identificador geométrico no válido.')
        refs=item.get('refs',[])
        low,high=GEOMETRY_TYPES[kind]
        if not isinstance(refs,list) or not low<=len(refs)<=high or any(not isinstance(ref,str) or ref not in {o['id'] for o in cleaned} for ref in refs):
            raise AbelInputError('Las referencias de los objetos no son válidas.')
        color=item.get('color',COLORS[len(cleaned)%len(COLORS)])
        if not isinstance(color,str) or not re.fullmatch(r'#[0-9a-fA-F]{6}',color):
            raise AbelInputError('Color de objeto no válido.')
        obj={'id':identity,'type':kind,'refs':refs,'label':bounded_text(item.get('label',''),16),
             'visible':item.get('visible') is not False,'color':color}
        if kind=='point':
            position=item.get('position')
            if not isinstance(position,list) or len(position)!=2:
                raise AbelInputError('Coordenadas no válidas.')
            obj['position']=[number(value) for value in position]
        if kind=='intersection':
            obj['branch']=1 if item.get('branch')==1 else 0
        ids.add(identity)
        cleaned.append(obj)
    result['geometry']=cleaned
    options=raw.get('options',{})
    if not isinstance(options,dict):
        raise AbelInputError('Opciones de la vista no válidas.')
    result['options']={key:options.get(key,True) is not False for key in ('grid','axes','equal')}
    result['options']['snap']=options.get('snap') is True
    cells=raw.get('cells',[['']*3 for _ in range(10)])
    sheet({'cells':cells})
    result['cells']=cells
    prob=raw.get('probability',{'distribution':'normal','mean':0,'sd':1,'lower':-1,'upper':1})
    probability(prob)
    allowed=('distribution','mean','sd','lower','upper') if prob['distribution']=='normal' else ('distribution','n','p','lower','upper')
    result['probability']={key:prob[key] for key in allowed}
    return result


def notebook_entry(raw,image_limit):
    state=validate_state(raw.get('studio'))
    mode=3 if state['perspective']=='surface' else 2
    expressions=raw.get('expressions',[])
    if not isinstance(expressions,list) or len(expressions)>10:
        raise AbelInputError('La lista de expresiones no es válida.')
    expressions=[bounded_text(text,220) for text in expressions]
    image=raw.get('image','')
    if not isinstance(image,str) or len(image)>image_limit or not re.fullmatch(r'data:image/jpeg;base64,[A-Za-z0-9+/]+={0,2}',image):
        raise AbelInputError('La vista previa del gráfico no es válida.')
    spec={'mode':mode,'expressions':expressions,'bounds':state['bounds'][str(mode)],'camera':state['camera'],
          'title':bounded_text(raw.get('title','Construcción matemática'),120),'image':image,'studio':state}
    interval=raw.get('interval')
    if isinstance(interval,list) and len(interval)==2:
        spec['interval']=[number(value) for value in interval]
    return spec


def dispatch(args):
    if not isinstance(args,dict):
        raise AbelInputError('Consulta del graficador no válida.')
    action=args.get('action')
    if action=='sample':
        return sample(args)
    if action=='probability':
        return probability(args)
    if action=='sheet':
        return sheet(args)
    if action=='validate':
        return validate_state(args.get('state'))
    if action=='scalar':
        values=args.get('expressions')
        if not isinstance(values,list) or not 1<=len(values)<=3:
            raise AbelInputError('Indica hasta tres valores.')
        entries=[{'text':bounded_text(text,220)} for text in values]
        texts,expand=expand_expressions(entries,parameters(args.get('parameters',{})),2)
        results=[]
        for text in texts:
            value=AbelExpressionParser(expand(text)).scalar()
            if value.free_symbols or value.is_real is not True:
                raise AbelInputError('Usa coordenadas reales, sin x ni y.')
            results.append(number(float(value)))
        return results
    raise AbelInputError('Elige una herramienta del graficador.')
