"""Compress downloaded CC BY 4.0 textures and record reproducible attribution."""

import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'public' / 'textures'
EXTRAS = {
    'earth-clouds': 'earthcloudmapcolortrans.png',
    'earth-normal': 'earthnormal2k.jpg',
    'saturn-ring': 'saturnringcolortrans.png',
}
manifest = ROOT / 'manifest.json'
entries = json.loads(manifest.read_text(encoding='utf-8')) if manifest.exists() else []
for source in sorted(ROOT.iterdir()):
    if source.suffix not in {'.jpg', '.png'}:
        continue
    target = source.with_suffix('.webp')
    with Image.open(source) as image:
        if source.stem in {'earth-normal', 'earth-clouds'}:
            image.thumbnail((1024, 512), Image.Resampling.LANCZOS)
        # Normal-map channels are data, so use lossless compression.
        image.save(target, 'WEBP', quality=88, method=6,
                   lossless=source.stem == 'earth-normal')
        width, height = image.size
    if source.stem in EXTRAS:
        download = ('https://raw.githubusercontent.com/qt/qt3d/dev/tests/manual/'
                    'planets-qml/images/solarsystemscope/' + EXTRAS[source.stem])
    else:
        folder = 'satellites/' if source.stem == 'moon' else ''
        download = ('https://raw.githubusercontent.com/Sanghel/solar-system-3d/'
                    'develop/public/textures/' + folder + source.name)
    entries = [item for item in entries if item['file'] != target.name]
    entries.append({
        'file': target.name,
        'width': width,
        'height': height,
        'bytes': target.stat().st_size,
        'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'downloadUrl': download,
        'creator': 'Solar System Scope',
        'source': 'https://www.solarsystemscope.com/textures/',
        'license': 'https://creativecommons.org/licenses/by/4.0/',
        'changes': 'WebP conversion; Earth cloud/normal maps limited to 1024 px; normal map lossless',
    })
    source.unlink()
(ROOT / 'manifest.json').write_text(
    json.dumps(entries, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'{len(entries)} textures: {sum(item["bytes"] for item in entries):,} bytes')
