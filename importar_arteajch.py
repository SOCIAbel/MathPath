import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / 'vendor'))
from PIL import Image

import storyajch as story
WIDTH, HEIGHT = 204, 142
ARENA = Path(__file__).resolve().parent / 'arena'
KNOWN = set(story.ASSET_BASES) | {'dawn-dragon'}


def remove_flat_background_ajch(image):
    image = image.convert('RGBA')
    if image.getextrema()[3][0] < 250:
        return image
    pixels = image.load()
    corner = pixels[0, 0][:3]
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if abs(r - corner[0]) + abs(g - corner[1]) + abs(b - corner[2]) < 40:
                pixels[x, y] = (r, g, b, 0)
    return image


def fit_ajch(image):
    image = remove_flat_background_ajch(image)
    box = image.getchannel('A').point(lambda value: 255 if value > 20 else 0).getbbox()
    if box:
        image = image.crop(box)
    scale = min((WIDTH - 6) / image.width, (HEIGHT - 4) / image.height)
    image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.LANCZOS)
    canvas = Image.new('RGBA', (WIDTH, HEIGHT), (0, 0, 0, 0))
    canvas.alpha_composite(image, ((WIDTH - image.width) // 2, HEIGHT - image.height - 2))
    return canvas


def main(folder):
    folder = Path(folder)
    done, skipped = [], []
    for source in sorted(folder.glob('*.png')) + sorted(folder.glob('*.webp')):
        name = source.stem.lower()
        if name.removesuffix('-attack') not in KNOWN:
            skipped.append(source.name)
            continue
        fit_ajch(Image.open(source)).save(ARENA / f'{name}.webp', 'WEBP', quality=92)
        done.append(name)
    print(f'{len(done)} imágenes importadas en arena/: ' + ', '.join(done))
    if skipped:
        print('Se ignoraron (nombre desconocido): ' + ', '.join(skipped))
    missing = sorted(f'{asset}{suffix}' for asset in KNOWN - {'dawn-dragon'} for suffix in ('', '-attack')
                     if f'{asset}{suffix}' not in done)
    print(f'Siguen con arte provisional: {len(missing)}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1])
