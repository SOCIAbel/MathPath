import base64
import binascii
import json
import re
import threading
import time
import unicodedata
from pathlib import Path

MODELS = Path(__file__).resolve().parent / 'vendor' / 'models'
VOSK_DIR = MODELS / 'vosk-es'
MFR_DIR = MODELS / 'mfr'

UNITS = {'cero': 0, 'un': 1, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5, 'seis': 6, 'siete': 7,
         'ocho': 8, 'nueve': 9, 'diez': 10, 'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
         'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18, 'diecinueve': 19, 'veinte': 20, 'veintiun': 21,
         'veintiuno': 21, 'veintidos': 22, 'veintitres': 23, 'veinticuatro': 24, 'veinticinco': 25,
         'veintiseis': 26, 'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29}
TENS = {'treinta': 30, 'cuarenta': 40, 'cincuenta': 50, 'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90}
HUNDREDS = {'cien': 100, 'ciento': 100, 'doscientos': 200, 'trescientos': 300, 'cuatrocientos': 400,
            'quinientos': 500, 'seiscientos': 600, 'setecientos': 700, 'ochocientos': 800, 'novecientos': 900}
POWERS = {'cuadrado': 2, 'cuadrada': 2, 'cubo': 3, 'cuarta': 4, 'quinta': 5, 'sexta': 6, 'septima': 7,
          'octava': 8, 'novena': 9, 'decima': 10}
DENOMINATORS = {'medio': 2, 'medios': 2, 'tercio': 3, 'tercios': 3, 'cuarto': 4, 'cuartos': 4, 'quinto': 5,
                'quintos': 5, 'sexto': 6, 'sextos': 6, 'septimo': 7, 'septimos': 7, 'octavo': 8, 'octavos': 8,
                'noveno': 9, 'novenos': 9, 'decimo': 10, 'decimos': 10}
VARIABLES = {'x': 'x', 'equis': 'x', 'ye': 'y', 'z': 'z', 'zeta': 'z', 'seta': 'z',
             't': 't', 'te': 't', 'ce': 'C', 'c': 'C', 'constante': 'C', 'a': None, 'be': 'b', 'ene': 'n',
             'pi': 'pi', 'infinito': 'oo', 'e': 'e'}
FUNCTIONS = {'raiz': 'sqrt', 'seno': 'sin', 'sen': 'sin', 'coseno': 'cos', 'tangente': 'tan',
             'logaritmo': 'log', 'exponencial': 'exp', 'valor': 'Abs'}
FILLER = {'de', 'del', 'la', 'el', 'es', 'son', 'respuesta', 'resultado', 'mi', 'que', 'da', 'seria', 'queda',
          'entonces', 'pues', 'eh', 'este', 'los', 'las', 'absoluto', 'natural', 'cuadrada', 'parentesis', 'sea'}
GRAMMAR_WORDS = sorted((set(UNITS) | set(TENS) | set(HUNDREDS) | set(POWERS) | set(DENOMINATORS) |
                       {w for w in VARIABLES if len(w) > 1} | set(FUNCTIONS) | FILLER |
                       {'mas', 'menos', 'por', 'multiplicado', 'entre', 'sobre', 'dividido', 'partido', 'elevado',
                        'al', 'a', 'y', 'mil', 'coma', 'punto', 'abre', 'abrir', 'cierra', 'cerrar', 'igual',
                        'equis', 'griega', 'ele', 'ene', 'natural', 'negativo', 'positivo', 'se', 'e',
                        'cúbica', 'paréntesis', 'séptima', 'séptimo', 'más', 'raíz'}
                       ) - {'cubica', 'cúbica', 'infinito', 'novenos', 'parentesis', 'septima', 'septimo', 'septimos'})


def plain_ajch(text):
    text = unicodedata.normalize('NFD', str(text).lower())
    return ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')


def read_number_ajch(words, i):
    total = current = 0
    start = i
    while i < len(words):
        word = words[i]
        if word.isdigit():
            current = current * 10 ** len(word) + int(word) if current else int(word)
        elif word in UNITS:
            current += UNITS[word]
        elif word in TENS:
            current += TENS[word]
        elif word in HUNDREDS:
            current += HUNDREDS[word]
        elif word == 'mil':
            total += (current or 1) * 1000
            current = 0
        elif word == 'y' and i + 1 < len(words) and words[i + 1] in UNITS and current >= 30 and current % 10 == 0:
            pass
        else:
            break
        i += 1
    if i == start:
        return None, start
    text = str(total + current)
    if i + 1 < len(words) and words[i] in ('coma', 'punto') and (words[i + 1] in UNITS or words[i + 1].isdigit()):
        digits = []
        i += 1
        while i < len(words) and (words[i] in UNITS and UNITS[words[i]] < 10 or words[i].isdigit()):
            digits.append(words[i] if words[i].isdigit() else str(UNITS[words[i]]))
            i += 1
        text += '.' + ''.join(digits)
    return text, i


def spoken_to_expression_ajch(text, variable='x'):
    words = re.findall(r'[a-z]+|\d+', plain_ajch(text).replace('y griega', 'ye'))
    if words and words[-1] in ('te', 'se', 'ce') and len(words) > 1 and words[-2] in ('mas', 'menos'):
        if words[-1] != 'te' or variable != 't':
            words[-1] = 'ce'
    out = []
    pending_ajch = []
    depth = 0
    last_operand = False

    def close_functions_ajch():
        nonlocal last_operand
        while pending_ajch and pending_ajch[-1] == depth and last_operand:
            pending_ajch.pop()
            out.append(')')

    def operand(token_ajch):
        nonlocal last_operand
        if last_operand:
            out.append('' if re.fullmatch(r'[\d.]+', out[-1]) and re.match(r'[a-zA-Z(]', token_ajch) else '*')
        out.append(token_ajch)
        last_operand = True

    def operator(symbol):
        nonlocal last_operand
        close_functions_ajch()
        out.append(symbol)
        last_operand = False

    def power(exponent):
        nonlocal last_operand
        simple = re.fullmatch(r'\d+(\.\d+)?|[a-zA-Z]+', exponent)
        out.append('^' + (exponent if simple else '(' + exponent + ')'))
        last_operand = True

    i = 0
    while i < len(words):
        word = words[i]
        nxt = words[i + 1] if i + 1 < len(words) else ''
        number, after = read_number_ajch(words, i)
        if number is not None:
            if after < len(words) and words[after] in DENOMINATORS:
                operand('(' + number + '/' + str(DENOMINATORS[words[after]]) + ')')
                i = after + 1
            else:
                operand(number)
                i = after
            continue
        if word in ('mas', 'positivo'):
            operator('+')
        elif word in ('menos', 'negativo'):
            operator('-')
        elif word == 'por' or word == 'multiplicado':
            operator('*')
            if word == 'multiplicado' and nxt == 'por':
                i += 1
        elif word in ('entre', 'sobre'):
            operator('/')
        elif word in ('dividido', 'partido'):
            operator('/')
            if nxt in ('entre', 'por'):
                i += 1
        elif word == 'igual':
            operator('=')
            if nxt == 'a':
                i += 1
        elif word in POWERS and last_operand:
            power(str(POWERS[word]))
        elif word in ('al', 'a') and last_operand and nxt:
            j = i + 1
            if words[j] == 'la' and j + 1 < len(words):
                j += 1
            negative = words[j] == 'menos'
            if negative and j + 1 < len(words):
                j += 1
            if words[j] in POWERS:
                exponent, j = str(POWERS[words[j]]), j + 1
            else:
                exponent, k = read_number_ajch(words, j)
                if exponent is not None:
                    j = k
                    if j < len(words) and VARIABLES.get(words[j]) and VARIABLES[words[j]] not in ('C', 'oo'):
                        exponent, j = exponent + VARIABLES[words[j]], j + 1
                elif VARIABLES.get(words[j]):
                    exponent, j = VARIABLES[words[j]], j + 1
            if exponent is None:
                i += 1
                continue
            power(('-' if negative else '') + exponent)
            i = j
            continue
        elif word == 'ele' and nxt == 'ene':
            if last_operand:
                out.append('*')
            out.append('ln(')
            pending_ajch.append(depth)
            last_operand = False
            i += 2
            continue
        elif word in FUNCTIONS:
            name = FUNCTIONS[word]
            if word == 'raiz' and nxt == 'cubica':
                name = 'cbrt'
                i += 1
            if word == 'logaritmo' and nxt == 'natural':
                name = 'ln'
                i += 1
            if last_operand:
                out.append('*')
            out.append(name + '(')
            pending_ajch.append(depth)
            last_operand = False
        elif word in ('abre', 'abrir'):
            if last_operand:
                out.append('*')
            out.append('(')
            depth += 1
            last_operand = False
            if nxt == 'parentesis':
                i += 1
        elif word in ('cierra', 'cerrar'):
            close_functions_ajch()
            out.append(')')
            depth = max(0, depth - 1)
            last_operand = True
            if nxt == 'parentesis':
                i += 1
        elif VARIABLES.get(word):
            operand(VARIABLES[word])
        i += 1
    last_operand = True
    while pending_ajch:
        pending_ajch.pop()
        out.append(')')
    expression = ''.join(out)
    expression = re.sub(r'([+\-*/=])', r' \1 ', expression)
    expression = re.sub(r'\s+', ' ', expression).replace('( ', '(').replace(' )', ')').strip()
    expression = re.sub(r'^\s*[+*/=]\s*', '', expression)
    expression = re.sub(r'^\s*-\s*', '-', expression)
    expression = re.sub(r'^[a-zA-Z]\s*=\s*', '', expression)
    expression = re.sub(r'\^\(- ', '^(-', expression)
    expression = re.sub(r'\((\d+) / (\d+)\)', r'(\1/\2)', expression)
    expression = re.sub(r'cbrt\(([^()]*)\)', r'(\1)^(1/3)', expression)
    return expression.strip()


_vosk = None
_speech_session = None
_speech_lock = threading.RLock()
SPEECH_RATE = 16000
SPEECH_CHUNK_BYTES = 8000
SPEECH_MAX_SECONDS = 60
SPEECH_MAX_BYTES = 2 * 1024 * 1024
_SESSION_ID = re.compile(r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', re.I)


def _voice_model_ajch():
    global _vosk
    if not VOSK_DIR.is_dir():
        raise ValueError('Falta el modelo de voz en vendor/models/vosk-es.')
    import vosk
    if _vosk is None:
        vosk.SetLogLevel(-1)
        _vosk = vosk.Model(str(VOSK_DIR))
    return _vosk


def _voice_recognizer_ajch(restricted=True):
    import vosk
    model = _voice_model_ajch()
    if restricted:
        return vosk.KaldiRecognizer(model, SPEECH_RATE, json.dumps(GRAMMAR_WORDS + ['[unk]'], ensure_ascii=False))
    return vosk.KaldiRecognizer(model, SPEECH_RATE)


def _voice_text_ajch(result, key='text'):
    return re.sub(r'\s+', ' ', str(json.loads(result).get(key, '')).replace('[unk]', ' ')).strip()


def _close_speech_session_ajch():
    global _speech_session
    session, _speech_session = _speech_session, None
    if session is not None:
        session['timer'].cancel()


def _expire_speech_session_ajch(session_id, started):
    with _speech_lock:
        if (_speech_session is not None and _speech_session['id'] == session_id
                and _speech_session['started'] == started):
            _close_speech_session_ajch()


def _speech_snapshot_ajch(session, tail='', done=False):
    heard = ' '.join(session['texts'] + ([tail] if tail else []))
    return {'heard': heard, 'answer': spoken_to_expression_ajch(heard, session['variable']) if heard else '',
            'partial': not done, 'done': done}


def speech_stream_ajch(args):
    global _speech_session
    if not isinstance(args, dict):
        raise ValueError('La solicitud de dictado no es válida.')
    action, session_id = args.get('action'), args.get('session')
    if action not in ('start', 'chunk', 'stop', 'cancel'):
        raise ValueError('La acción de dictado no es válida.')
    if not isinstance(session_id, str) or not _SESSION_ID.fullmatch(session_id):
        raise ValueError('La sesión de dictado no es válida.')
    session_id = session_id.lower()
    with _speech_lock:
        if action == 'start':
            variable = args.get('variable', 'x')
            if variable not in ('x', 'y', 'z', 't'):
                raise ValueError('La variable de dictado no es válida.')
            _close_speech_session_ajch()
            recognizer = _voice_recognizer_ajch()
            started = time.monotonic()
            timer = threading.Timer(SPEECH_MAX_SECONDS, _expire_speech_session_ajch, args=(session_id, started))
            timer.daemon = True
            _speech_session = {'id': session_id, 'variable': variable, 'recognizer': recognizer,
                               'texts': [], 'bytes': 0, 'started': started, 'timer': timer}
            timer.start()
            return _speech_snapshot_ajch(_speech_session)
        session = _speech_session
        if action == 'cancel':
            if session is not None and session['id'] == session_id:
                _close_speech_session_ajch()
            return {'heard': '', 'answer': '', 'partial': False, 'done': True, 'canceled': True}
        if session is None or session['id'] != session_id:
            raise ValueError('El dictado terminó o cambió. Vuelve a pulsar Dictar.')
        if time.monotonic() - session['started'] > SPEECH_MAX_SECONDS:
            _close_speech_session_ajch()
            raise ValueError('El dictado superó los 60 segundos. Vuelve a pulsar Dictar.')
        if action == 'stop':
            try:
                return _speech_snapshot_ajch(session, _voice_text_ajch(session['recognizer'].FinalResult()), done=True)
            finally:
                _close_speech_session_ajch()
        try:
            encoded = args.get('pcm')
            if (not isinstance(encoded, str) or not encoded or len(encoded) % 4
                    or len(encoded) > ((SPEECH_CHUNK_BYTES + 2) // 3) * 4):
                raise ValueError('El tramo de audio no es válido o es demasiado grande.')
            try:
                data = base64.b64decode(encoded, validate=True)
            except (ValueError, binascii.Error):
                raise ValueError('El tramo de audio no es un PCM válido.') from None
            if (not data or len(data) % 2 or len(data) > SPEECH_CHUNK_BYTES
                    or base64.b64encode(data).decode('ascii') != encoded):
                raise ValueError('Cada tramo debe contener hasta 4000 muestras PCM de 16 bits.')
            total = session['bytes'] + len(data)
            if total > SPEECH_MAX_BYTES or total > SPEECH_RATE * 2 * SPEECH_MAX_SECONDS:
                raise ValueError('El dictado superó los 60 segundos de audio. Vuelve a pulsar Dictar.')
            session['bytes'] = total
            recognizer = session['recognizer']
            if recognizer.AcceptWaveform(data):
                committed = _voice_text_ajch(recognizer.Result())
                if committed:
                    session['texts'].append(committed)
                tail = ''
            else:
                tail = _voice_text_ajch(recognizer.PartialResult(), 'partial')
            return _speech_snapshot_ajch(session, tail)
        except Exception:
            _close_speech_session_ajch()
            raise


def transcribe_ajch(pcm_path):
    data = Path(pcm_path).read_bytes()
    if len(data) % 2:
        raise ValueError('El audio PCM debe contener muestras de 16 bits completas.')
    for restricted in (True, False):
        recognizer = _voice_recognizer_ajch(restricted)
        texts = []
        for start in range(0, len(data), SPEECH_CHUNK_BYTES):
            if recognizer.AcceptWaveform(data[start:start + SPEECH_CHUNK_BYTES]):
                text = _voice_text_ajch(recognizer.Result())
                if text:
                    texts.append(text)
        texts.append(_voice_text_ajch(recognizer.FinalResult()))
        text = ' '.join(part for part in texts if part)
        if text:
            return text
    return ''


def speech_answer_ajch(pcm_path, variable='x'):
    heard = transcribe_ajch(pcm_path)
    if not heard:
        return {'heard': '', 'answer': ''}
    return {'heard': heard, 'answer': spoken_to_expression_ajch(heard, variable)}


_mfr = None


def _load_mfr_ajch():
    global _mfr
    if _mfr is None:
        if not (MFR_DIR / 'encoder_model.onnx').is_file():
            raise RuntimeError('Falta el modelo de escaneo en vendor/models/mfr.')
        import onnxruntime as ort
        from tokenizers import Tokenizer
        options = ort.SessionOptions()
        options.log_severity_level = 3
        providers = ['CPUExecutionProvider']
        _mfr = (ort.InferenceSession(str(MFR_DIR / 'encoder_model.onnx'), options, providers=providers),
                ort.InferenceSession(str(MFR_DIR / 'decoder_model.onnx'), options, providers=providers),
                Tokenizer.from_file(str(MFR_DIR / 'tokenizer.json')))
    return _mfr


def _prepare_ajch(path):
    import numpy as np
    from PIL import Image, ImageOps
    image = ImageOps.exif_transpose(Image.open(path)).convert('L')
    image.thumbnail((1600, 1600))
    pixels = np.asarray(image, dtype=np.float32)
    background = np.percentile(pixels, 90)
    ink = pixels < background - max(25.0, (background - np.percentile(pixels, 2)) * .35)
    rows, cols = np.where(ink)
    if rows.size > 20:
        pad = max(8, int(0.06 * max(np.ptp(rows), np.ptp(cols))))
        top, bottom = max(0, rows.min() - pad), min(pixels.shape[0], rows.max() + pad)
        left, right = max(0, cols.min() - pad), min(pixels.shape[1], cols.max() + pad)
        pixels = pixels[top:bottom, left:right]
        ink = ink[top:bottom, left:right]
    cleaned = np.where(ink, np.clip(pixels * .6, 0, 255), 255).astype(np.uint8)
    image = Image.fromarray(cleaned).convert('RGB').resize((384, 384), Image.BICUBIC)
    array = (np.asarray(image, dtype=np.float32) / 255.0 - 0.5) / 0.5
    return array.transpose(2, 0, 1)[None]


def read_formula_ajch(path, max_tokens=160):
    import numpy as np
    encoder, decoder, tokenizer = _load_mfr_ajch()
    hidden = encoder.run(None, {'pixel_values': _prepare_ajch(path)})[0]
    tokens = [1]
    for _ in range(max_tokens):
        logits = decoder.run(None, {'input_ids': np.array([tokens], dtype=np.int64), 'encoder_hidden_states': hidden})[0]
        token_ajch = int(logits[0, -1].argmax())
        if token_ajch == 2:
            break
        tokens.append(token_ajch)
    return tokenizer.decode(tokens[1:], skip_special_tokens=True).strip()


FUNCTION_NAMES = ('arcsin', 'arccos', 'arctan', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'log', 'exp', 'ln')
X_LOOKALIKES = {r'\varkappa', r'\kappa', r'\chi', r'\aleph', r'\varkappa'}
SKIPPED = {r'\left', r'\right', r'\big', r'\Big', r'\bigg', r'\Bigg', r'\displaystyle', r'\mathrm', r'\mathit',
           r'\operatorname', r'\text', r'\mathbf', r'\boldsymbol', r'\quad', r'\qquad', r'\,', r'\;', r'\!', r'\ '}


def _latex_tokens_ajch(text):
    raw = re.findall(r'\\[a-zA-Z]+|\\.|[a-zA-Z]|\d+(?:\.\d+)?|\S', text)
    tokens, i = [], 0
    while i < len(raw):
        for name in FUNCTION_NAMES:
            size = len(name)
            if all(len(t) == 1 for t in raw[i:i + size]) and ''.join(raw[i:i + size]) == name:
                tokens.append('\\' + name)
                i += size
                break
        else:
            tokens.append(raw[i])
            i += 1
    return tokens


def _wrap_ajch(text):
    return text if re.fullmatch(r'-?(\d+(\.\d+)?|[a-zA-Z]+)', text) else '(' + text + ')'


def latex_to_expression_ajch(latex):
    tokens = _latex_tokens_ajch(str(latex).strip().strip('$'))
    position = 0

    def peek_ajch():
        return tokens[position] if position < len(tokens) else None

    def take():
        nonlocal position
        position += 1
        return tokens[position - 1]

    def argument_ajch():
        while peek_ajch() in SKIPPED:
            take()
        token_ajch = peek_ajch()
        if token_ajch is None:
            return ''
        if token_ajch in ('{', '(', '['):
            take()
            closing = {'{': '}', '(': ')', '[': ']'}[token_ajch]
            return render_ajch(sequence(closing))
        items = sequence(None, single=True)
        return render_ajch(items)

    def sequence(closing, single=False):
        items = []
        while peek_ajch() is not None:
            token_ajch = peek_ajch()
            if token_ajch == closing:
                take()
                break
            if closing is None and not single and token_ajch in ('}', ')', ']'):
                take()
                continue
            take()
            atom = None
            if token_ajch in SKIPPED:
                continue
            if token_ajch in ('{', '('):
                atom = '(' + render_ajch(sequence('}' if token_ajch == '{' else ')')) + ')'
            elif token_ajch == '[':
                atom = '(' + render_ajch(sequence(']')) + ')'
            elif token_ajch == '|':
                atom = 'Abs(' + render_ajch(sequence('|')) + ')'
            elif token_ajch in (r'\frac', r'\dfrac', r'\tfrac'):
                top, bottom = argument_ajch(), argument_ajch()
                atom = _wrap_ajch(top) + '/' + _wrap_ajch(bottom)
                atom = '(' + atom + ')'
            elif token_ajch in (r'\sqrt', r'\surd'):
                index = ''
                if peek_ajch() == '[':
                    take()
                    index = render_ajch(sequence(']'))
                body = argument_ajch()
                atom = '(' + body + ')^(1/' + index + ')' if index else 'sqrt(' + body + ')'
            elif token_ajch.lstrip('\\') in FUNCTION_NAMES and token_ajch.startswith('\\'):
                name = token_ajch[1:].replace('arc', 'a')
                exponent = ''
                if peek_ajch() == '^':
                    take()
                    exponent = argument_ajch()
                atom = name + '(' + argument_ajch() + ')' + ('^' + _wrap_ajch(exponent) if exponent else '')
            elif token_ajch == '^':
                if items and items[-1][0] == 'atom':
                    items[-1] = ('atom', items[-1][1] + '^' + _wrap_ajch(argument_ajch()))
                continue
            elif token_ajch == '_':
                if items and items[-1][0] == 'atom':
                    argument_ajch()
                continue
            elif token_ajch in ('+', '-', '='):
                items.append(('op', token_ajch))
            elif token_ajch in ('*', r'\cdot', r'\times', r'\ast'):
                items.append(('op', '*'))
            elif token_ajch in ('/', r'\div'):
                items.append(('op', '/'))
            elif token_ajch == r'\pi':
                atom = 'pi'
            elif token_ajch == r'\infty':
                atom = 'oo'
            elif token_ajch in X_LOOKALIKES:
                atom = 'x'
            elif re.fullmatch(r'\d+(\.\d+)?|[a-zA-Z]', token_ajch):
                atom = {'X': 'x', 'c': 'C'}.get(token_ajch, token_ajch) if token_ajch in 'Xc' else token_ajch
            if atom is not None:
                items.append(('atom', atom))
            if single and items and items[-1][0] == 'atom':
                if peek_ajch() == '^':
                    take()
                    items[-1] = ('atom', items[-1][1] + '^' + _wrap_ajch(argument_ajch()))
                break
        return items

    def render_ajch(items):
        text, previous = '', None
        for kind, value in items:
            if kind == 'op':
                text += {'+': ' + ', '-': ' - ', '=': ' = '}.get(value, value)
            else:
                if previous == 'atom':
                    letter = re.match(r'[a-zA-Z]+', value)
                    text += '' if text[-1].isdigit() and letter and len(letter.group()) == 1 else '*'
                text += value
            previous = kind
        return text.strip()

    expression = render_ajch(sequence(None))
    expression = re.sub(r'(?<![\w^])\((-?(\d+(\.\d+)?|[a-zA-Z]))\)', r'\1', expression)
    expression = re.sub(r'(?<![\w^)])\((\([^()]*\)/[\w.]+|[\w.]+/[\w.]+|\([^()]*\)/\([^()]*\))\)(?!\^)', r'\1', expression)
    expression = re.sub(r'(?<![\w.^])(\d+)\*([a-zA-Z])(?![a-zA-Z(])', r'\1\2', expression)
    expression = re.sub(r'\+\s*c\b', '+ C', expression)
    expression = re.sub(r'^[a-zA-Z]\s*=\s*', '', expression)
    expression = re.sub(r'\s+', ' ', expression).strip()
    return re.sub(r'^- ', '-', expression)


def scan_answer_ajch(path):
    latex = read_formula_ajch(path)
    return {'latex': latex, 'answer': latex_to_expression_ajch(latex) if latex else ''}
