"""Run BEL valuation contracts against the assembled deployment, not branch copies.

The package contains source code only. No API calls, credentials or database
writes are used. Missing test-only dependencies come from this checkout; every
packaged runtime file overrides the checkout before Vitest runs.
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('deployment_spec', type=Path)
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    spec = json.loads(args.deployment_spec.read_text())
    if (spec['name'] != 'p7-ic2-materialize-readiness'
            or spec['project_id'] != 'lrgpjimipfkyoqbpsqzz'
            or spec['verify_jwt'] is not True):
        raise ValueError('EXPECTED_AUTHENTICATED_DEVELOPMENT_CANONICAL_PACKAGE')
    with tempfile.TemporaryDirectory(prefix='bel-preserved-canonical-') as folder:
        root = Path(folder)
        for relative in ['supabase/functions/_shared', 'src/features/research']:
            shutil.copytree(repo / relative, root / relative)
        for item in spec['files']:
            relative = Path(item['name'])
            if relative.is_absolute() or '..' in relative.parts:
                raise ValueError('UNSAFE_PACKAGE_PATH')
            target = root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(item['content'])
        (root / 'node_modules').symlink_to(repo / 'node_modules', target_is_directory=True)
        (root / 'package.json').write_text('{"type":"module"}\n')
        includes = ['supabase/functions/_shared/v14-g03-*-canonical.test.ts',
                    'supabase/functions/_shared/v14-g02-document-canonical.test.ts',
                    'supabase/functions/_shared/v14-reviewed-evidence.test.ts']
        config = root / 'vitest.config.ts'
        config.write_text("import {defineConfig} from 'vitest/config';export default defineConfig({test:"
                          + json.dumps({'environment': 'node', 'include': includes,
                                        'pool': 'threads', 'maxWorkers': 1,
                                        'fileParallelism': False}) + '})\n')
        subprocess.run(['node', str(repo / 'node_modules/vitest/vitest.mjs'), 'run',
                        '--root', str(root), '--config', str(config)], check=True, cwd=repo)


if __name__ == '__main__':
    main()
