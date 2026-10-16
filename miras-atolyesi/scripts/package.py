#!/usr/bin/env python3
"""Package all game sources and repository launchers; verify every ZIP member."""
import argparse
import hashlib
from pathlib import Path
import sys
from zipfile import ZIP_DEFLATED, ZipFile
from build import build

ROOT = Path(__file__).resolve().parents[1]


def package(output):
    repo = ROOT.parent
    has_launchers = (repo / 'package.json').is_file() and (repo / 'index.html').is_file()
    build(ROOT, repo_entry=has_launchers)
    files = [p for p in ROOT.rglob('*') if p.is_file() and not any(part in {'__pycache__', '.git', 'test-results'} for part in p.relative_to(ROOT).parts) and p.suffix not in {'.pyc', '.zip'}]
    if has_launchers:
        files += [repo / name for name in ['.gitignore', 'README.md', 'index.html', 'package.json'] if (repo / name).is_file()]
        base = repo
    else:
        base = ROOT
    output = Path(output).resolve()
    if output in files:
        raise ValueError('ZIP çıktısı kaynak dosyalardan birinin üzerine yazamaz.')
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, 'w', ZIP_DEFLATED) as archive:
        for file in sorted(files):
            archive.write(file, Path('miras-atolyesi-paket') / file.relative_to(base))
    with ZipFile(output) as archive:
        assert archive.testzip() is None, 'ZIP CRC doğrulaması başarısız.'
        assert len(archive.namelist()) == len(files)
        for file in files:
            name = str(Path('miras-atolyesi-paket') / file.relative_to(base))
            assert archive.read(name) == file.read_bytes(), f'ZIP içeriği farklı: {name}'
    print(f'ZIP doğrulandı: {output.name}, {len(files)} dosya, {output.stat().st_size} bayt')
    print('SHA-256:', hashlib.sha256(output.read_bytes()).hexdigest())


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path, default=ROOT.parent / 'downloads' / 'miras-atolyesi.zip')
    args = parser.parse_args()
    try:
        package(args.output)
    except (ValueError, OSError) as error:
        print(f'Paketleme başarısız: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
