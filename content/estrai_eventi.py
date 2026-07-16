#!/usr/bin/env python3
import sys, re, json
import xml.etree.ElementTree as ET
from collections import defaultdict

LABELS = {
    'STORIA E CULTURA GRECA': ('greco', 'misto'),
    'STORIA ROMANA':          ('romano', 'storia'),
    'CULTURA LATINA':         ('romano', 'cultura'),
    'CULTURA ROMANA':         ('romano', 'cultura'),
}
BAND_RE = re.compile(r'Secol[oi]\s+[IVX]+(?:-[IVX]+)?\s*(a\.C\.|d\.C\.)(\s*-\s*[IVX]+\s*d\.C\.)?')
BANNER_WORDS = ('Letteratura latina', 'Tavole cronologiche')
YEAR_TOK_RE = re.compile(r'^(ca\.\s*)?((?:\d{1,4}[-‑])*\d{1,4})\.?\s*(.*)$', re.S)

def text_of(el):
    return ''.join(el.itertext())

tree = ET.parse(sys.argv[1])
root = tree.getroot()

events = []
cur = None            # currently open event dict, keyed by column label context
open_by_col = {}       # label -> open event (persists across pages until re-flushed)
century = None

def flush(lab):
    e = open_by_col.get(lab)
    if e:
        e['text'] = re.sub(r'\s+', ' ', e['text']).strip()
        if e['text']:
            events.append(e)
    open_by_col[lab] = None

for page_idx, page in enumerate(root.findall('page')):
    pw = float(page.get('width'))
    runs = []
    for t in page.findall('text'):
        top = float(t.get('top')); left = float(t.get('left')); width = float(t.get('width'))
        content = text_of(t)
        bold = t.find('b') is not None
        runs.append({'top': top, 'left': left, 'width': width, 'text': content, 'bold': bold})

    # 1) century band: rotated sidebar text has width == 0
    band_runs = [r for r in runs if r['width'] == 0]
    if band_runs:
        # rotated text: run order doesn't reliably follow 'top' -> try both orders
        asc = ' '.join(r['text'].strip() for r in sorted(band_runs, key=lambda r: r['top']))
        desc = ' '.join(r['text'].strip() for r in sorted(band_runs, key=lambda r: -r['top']))
        m = BAND_RE.search(asc) or BAND_RE.search(desc)
        if m:
            century = re.sub(r'\s+', ' ', m.group(0)).strip()

    # 2) column headers: runs whose stripped text exactly matches a known label
    headers = sorted(set((r['left'], lab) for r in runs for lab in LABELS if r['text'].strip() == lab))
    if len(headers) < 2:
        continue  # title/blank page etc.
    bounds = []
    for i in range(len(headers) - 1):
        bounds.append((headers[i][0] + headers[i + 1][0]) / 2)
    def col_of(x):
        for i, b in enumerate(bounds):
            if x < b:
                return headers[i][1]
        return headers[-1][1]

    # 3) body runs: exclude headers, page banners, rotated sidebar, page numbers
    body = []
    for r in runs:
        s = r['text'].strip()
        if not s or r['width'] == 0:
            continue
        if s in LABELS:
            continue
        if any(w in s for w in BANNER_WORDS):
            continue
        if re.fullmatch(r'\d{1,3}', s) and r['top'] < 100:  # page-number folio
            continue
        body.append(r)

    # 4) assign column, cluster into visual lines by proximity in 'top'
    #    (bold runs can sit a couple pt off-baseline from the surrounding text,
    #    so a naive round() sometimes bucket them into the wrong line)
    by_col = defaultdict(list)
    for r in body:
        by_col[col_of(r['left'])].append(r)

    TOL = 4.0
    def cluster_lines(runs):
        runs = sorted(runs, key=lambda r: r['top'])
        clusters = []
        for r in runs:
            if clusters and r['top'] - clusters[-1][-1]['top'] <= TOL:
                clusters[-1].append(r)
            else:
                clusters.append([r])
        return clusters

    for lab_left, lab in headers:
        for cluster in cluster_lines(by_col.get(lab, [])):
            row = sorted(cluster, key=lambda r: r['left'])
            # merge runs on this row into (is_year_start, token, rest_text) segments
            i = 0
            n = len(row)
            while i < n:
                r = row[i]
                tok_text = r['text'].strip()
                m = YEAR_TOK_RE.match(tok_text) if r['bold'] else None
                # "ca." sometimes lands in its own (non-bold) run, followed by a bold year run
                lead_ca = False
                if m is None and tok_text == 'ca.' and i + 1 < n:
                    nxt = row[i + 1]
                    nm = YEAR_TOK_RE.match(nxt['text'].strip()) if nxt['bold'] else None
                    if nm and nm.group(1) is None:
                        m, lead_ca = nm, True
                if m:
                    tok = m.group(2)
                    seed = m.group(3).strip()
                    approx = bool(m.group(1)) or lead_ca
                    if lead_ca:
                        i += 1  # consume the separate "ca." run too
                    flush(lab)
                    amb, tipo = LABELS[lab]
                    nums = [int(x) for x in re.findall(r'\d+', tok)]
                    big = [x for x in nums if x >= 100]
                    raw_year = max(big) if big else max(nums)
                    open_by_col[lab] = {
                        'annoRaw': ('ca. ' if approx else '') + tok.replace('‑', '-'),
                        '_raw': raw_year,
                        '_page': page_idx, '_top': cluster[0]['top'],
                        'approssimato': approx,
                        'ambito': amb, 'tipo': tipo, 'banda': century,
                        'text': seed,
                    }
                    i += 1
                else:
                    if open_by_col.get(lab):
                        open_by_col[lab]['text'] += ' ' + tok_text
                    i += 1
for lab in list(open_by_col):
    flush(lab)

# ---- signed year via century band, BC->AD flip inside the straddle band ----
STRADDLE = 'Secoli I a.C.-I d.C.'
state = {'bc': True, 'prev': 10**9, 'min': 10**9}
def signed(r, band):
    if STRADDLE in (band or ''):
        state['min'] = min(state['min'], r)
        if state['bc'] and r > state['prev'] and state['min'] <= 5:
            state['bc'] = False
        state['prev'] = r
        return -r if state['bc'] else r
    if 'a.C.' in (band or '') and 'd.C.' not in (band or ''):
        return -r
    return r

for e in sorted(events, key=lambda e: (e['_page'], e['_top'])):
    e['anno'] = signed(e['_raw'], e['banda'])
for e in events:
    e.pop('_raw'); e.pop('_page'); e.pop('_top')

seen = set()
out = []
for e in events:
    key = (e['anno'], e['text'])
    if key in seen:
        continue  # source PDF repeats a few entries verbatim across a page break
    seen.add(key)
    out.append({
        'anno': e['anno'], 'annoRaw': e['annoRaw'], 'approssimato': e['approssimato'],
        'ambito': e['ambito'], 'tipo': e['tipo'], 'banda': e['banda'], 'testo': e['text'],
    })
out.sort(key=lambda e: e['anno'])

json.dump(out, open(sys.argv[2], 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print("events:", len(out))
print("ambito:", Counter(e['ambito'] for e in out))
print("range:", out[0]['anno'] if out else None, '->', out[-1]['anno'] if out else None)
print("short(<12) count:", sum(1 for e in out if len(e['testo']) < 12))
for e in out:
    if len(e['testo']) < 12:
        print("  SHORT", e['anno'], repr(e['testo']))
