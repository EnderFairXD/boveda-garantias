export interface ParsedReceipt {
  storeName: string | null;
  amount: number | null;
  /** Fecha detectada (caducidad, garantía o fecha del ticket), en formato ISO yyyy-mm-dd. */
  date: string | null;
}

const SPANISH_MONTHS: Record<string, string> = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
};

const NUMERIC_DATE_RE = /\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})\b/;
const ISO_DATE_RE = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/;
const SPANISH_DATE_RE = new RegExp(
  `\\b(\\d{1,2})\\s+de\\s+(${Object.keys(SPANISH_MONTHS).join('|')})\\s+de\\s+(\\d{4})\\b`,
  'i',
);

const AMOUNT_RE = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*(?:€|eur)?\b/i;
const TOTAL_LINE_RE = /\b(total|importe|a pagar)\b/i;

function pad(value: string): string {
  return value.padStart(2, '0');
}

function normalizeYear(year: string): string {
  if (year.length === 4) return year;
  const num = Number(year);
  return num < 70 ? `20${pad(year)}` : `19${pad(year)}`;
}

/** Busca una fecha en el texto del ticket y la normaliza a ISO (yyyy-mm-dd). */
function findDate(lines: string[]): string | null {
  const text = lines.join('\n');

  const spanish = text.match(SPANISH_DATE_RE);
  if (spanish) {
    const [, day, monthName, year] = spanish;
    const month = SPANISH_MONTHS[monthName.toLowerCase()];
    return `${year}-${month}-${pad(day)}`;
  }

  const iso = text.match(ISO_DATE_RE);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const numeric = text.match(NUMERIC_DATE_RE);
  if (numeric) {
    const [, day, month, year] = numeric;
    return `${normalizeYear(year)}-${pad(month)}-${pad(day)}`;
  }

  return null;
}

/** Busca el importe total: prioriza líneas con "total"/"importe", si no, el mayor importe del ticket. */
function findAmount(lines: string[]): number | null {
  const totalLine = lines.find((line) => TOTAL_LINE_RE.test(line) && AMOUNT_RE.test(line));
  const source = totalLine ? [totalLine] : lines;

  let best: number | null = null;
  for (const line of source) {
    const match = line.match(AMOUNT_RE);
    if (!match) continue;
    const normalized = match[1].replace(/\.(?=\d{3})/g, '').replace(',', '.');
    const value = Number(normalized);
    if (Number.isNaN(value)) continue;
    if (best === null || value > best) best = value;
  }

  return best;
}

/** Heurística simple: la primera línea no vacía suele ser el nombre de la tienda en un ticket. */
function findStoreName(lines: string[]): string | null {
  const first = lines.find((line) => line.trim().length > 1);
  return first ? first.trim() : null;
}

export function parseReceiptText(lines: string[]): ParsedReceipt {
  return {
    storeName: findStoreName(lines),
    amount: findAmount(lines),
    date: findDate(lines),
  };
}
