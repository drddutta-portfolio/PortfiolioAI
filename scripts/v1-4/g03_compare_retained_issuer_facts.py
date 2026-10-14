"""Compare retained facts with original NSE tables; this does not accept reviews."""
from decimal import Decimal, InvalidOperation
from html.parser import HTMLParser


class FilingTables(HTMLParser):
    def __init__(self):
        super().__init__()
        self.cell = None
        self.row = []
        self.rows = []

    def handle_starttag(self, tag, attrs):
        if tag == 'tr':
            self.row = []
        if tag in ('td', 'th'):
            self.cell = []

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ('td', 'th') and self.cell is not None:
            self.row.append(' '.join(' '.join(self.cell).split()))
            self.cell = None
        if tag == 'tr' and self.row:
            self.rows.append(self.row)


def cell_after(rows, label):
    for row in rows:
        for i, cell in enumerate(row):
            if cell.casefold() == label.casefold():
                if i + 1 >= len(row) or not row[i + 1]:
                    raise ValueError('MISSING_SOURCE_VALUE')
                return row[i + 1]
    raise ValueError('MISSING_SOURCE_ROW')


def decimal_cell(raw):
    raw = raw.strip().replace(',', '')
    if raw.startswith('(') and raw.endswith(')'):
        raw = '-' + raw[1:-1]
    try:
        value = Decimal(raw)
    except InvalidOperation as error:
        raise ValueError('INVALID_SOURCE_NUMBER') from error
    if not value.is_finite():
        raise ValueError('INVALID_SOURCE_NUMBER')
    return value


def compare_original(html, payload):
    parser = FilingTables()
    parser.feed(html)
    rows = parser.rows
    if (cell_after(rows, 'NSE Symbol') != payload['symbol']
            or cell_after(rows, 'ISIN') != payload['isin']
            or cell_after(rows, 'Nature of report standalone or consolidated').upper()
            != payload['consolidation_scope']
            or cell_after(rows, 'Date of start of reporting period') != '01-04-2026'
            or cell_after(rows, 'Date of end of reporting period') != '30-06-2026'
            or payload['period_start'] != '2026-04-01'
            or payload['period_end'] != '2026-06-30'
            or cell_after(rows, 'Description of presentation currency') != 'INR'
            or cell_after(rows, 'Level of rounding used in financial results') != 'Lakhs'):
        raise ValueError('IDENTITY_PERIOD_SCOPE_OR_UNIT_MISMATCH')
    labels = {
        'OPERATING_REVENUE_QUARTER': 'Revenue from operations',
        'NET_PROFIT_QUARTER': 'Total profit (loss) for period',
        'EPS_DILUTED': 'Diluted earnings (loss) per share from continuing and discontinued operations',
    }
    results = []
    for metric, label in labels.items():
        fact = payload['facts'][metric]
        original = decimal_cell(cell_after(rows, label))
        original_unit, normalized_unit = (('INR_PER_SHARE', 'INR_PER_SHARE') if metric == 'EPS_DILUTED'
                                         else ('INR_LAKH', 'INR_CRORE'))
        normalized = original if metric == 'EPS_DILUTED' else original / Decimal('100')
        if (original != decimal_cell(fact['original_value']) or normalized != decimal_cell(fact['value'])
                or fact['original_unit'] != original_unit or fact['unit'] != normalized_unit):
            raise ValueError('RETAINED_FACT_DOES_NOT_MATCH_ORIGINAL')
        results.append({'metric_code': metric, 'value': str(normalized), 'unit': normalized_unit,
                        'source_table_label': label, 'original_value': str(original),
                        'original_unit': original_unit, 'comparison': 'MATCHED_NOT_ADMITTED'})
    return results
