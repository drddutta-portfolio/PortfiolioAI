"""Alternate table segmentation of original PDF renders, without pixel editing."""
import csv
import io
import subprocess

MODES = (6, 11)

class TableOCRPage:
    def __init__(self, page, dpi, segmentation_mode, clip=None):
        if segmentation_mode not in MODES:
            raise ValueError('UNAPPROVED_TABLE_SEGMENTATION_MODE')
        if dpi not in (200, 300, 350, 400, 450, 500):
            raise ValueError('UNAPPROVED_TABLE_RENDER_DPI')
        self.page = page
        pixmap = page.get_pixmap(dpi=dpi, alpha=False) if clip is None else page.get_pixmap(dpi=dpi,alpha=False,clip=clip)
        try:
            process = subprocess.run(
                ['timeout', '--signal=TERM', '--kill-after=5s', '85s',
                 'tesseract', 'stdin', 'stdout', '-l', 'eng', '--dpi', str(dpi),
                 '--psm', str(segmentation_mode), 'tsv'],
                input=pixmap.tobytes('png'), stdout=subprocess.PIPE,
                stderr=subprocess.PIPE, timeout=90, check=True)
        except subprocess.TimeoutExpired as error:
            raise ValueError('TABLE_OCR_RENDER_TIMEOUT') from error
        except (OSError, subprocess.CalledProcessError) as error:
            raise ValueError('TABLE_OCR_RENDER_FAILED') from error
        records = csv.DictReader(io.StringIO(process.stdout.decode('utf-8')),
                                 delimiter='\t', quoting=csv.QUOTE_NONE)
        words = []
        lines = {}
        scale = 72 / dpi
        offset_x=pixmap.x*scale if clip is not None else 0
        offset_y=pixmap.y*scale if clip is not None else 0
        for record in records:
            if record.get('level') != '5' or not record.get('text', '').strip():
                continue
            x, y, width, height = (int(record[k]) for k in ('left', 'top', 'width', 'height'))
            if min(x, y, width, height) < 0 or x + width > pixmap.width or y + height > pixmap.height:
                raise ValueError('TABLE_OCR_WORD_GEOMETRY_OUTSIDE_PAGE')
            text = record['text']
            words.append((x * scale+offset_x, y * scale+offset_y, (x + width) * scale+offset_x,
                          (y + height) * scale+offset_y, text))
            key = tuple(record[k] for k in ('page_num', 'block_num', 'par_num', 'line_num'))
            lines.setdefault(key, []).append(text)
        self.words = tuple(words)
        self.text = '\n'.join(' '.join(tokens) for tokens in lines.values())

    def get_text(self, kind='text', **kwargs):
        if kind == 'words':
            return list(self.words)
        if kind == 'text':
            return self.text
        raise ValueError('UNSUPPORTED_TABLE_OCR_TEXT_MODE')
