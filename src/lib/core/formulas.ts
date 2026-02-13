/**
 * Simple framework-agnostic Formula Engine for Tablez
 * Supports Excel-like syntax for row-level calculations.
 */

export interface FormulaResult {
  value: any;
  type: 'number' | 'string' | 'boolean' | 'image' | 'error';
  error?: string;
}

export interface ImageResult {
  _type: 'image';
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

/**
 * Evaluates a formula string against a data record.
 * Syntax: ={price} * {quantity}
 */
export const evaluateFormula = (formula: string, record: Record<string, any>): unknown => {
  if (!formula.startsWith('=')) return formula;

  let expression = formula.substring(1);

  // 1. Replace placeholders {key} with record values
  // Using regex to find all {key} patterns
  expression = expression.replace(/\{(\w+)\}/g, (_, key) => {
    const value = record[key as string];
    if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`;
    if (value === undefined || value === null) return '0';
    return String(value);
  });

  try {
    // 2. Build sandbox environment with common Excel-like functions
    const context = {
      // Logic
      IF: (cond: boolean, t: unknown, f: unknown) => (cond ? t : f),
      AND: (...args: boolean[]) => args.every(Boolean),
      OR: (...args: boolean[]) => args.some(Boolean),
      NOT: (a: boolean) => !a,

      // Math
      SUM: (...args: number[]) => args.reduce((a, b) => a + b, 0),
      AVG: (...args: number[]) => (args.length ? args.reduce((a, b) => a + b, 0) / args.length : 0),
      MIN: Math.min,
      MAX: Math.max,
      ROUND: (val: number, prec: number = 0) => {
        const p = Math.pow(10, prec);
        return Math.round(val * p) / p;
      },
      ABS: Math.abs,

      // String
      CONCAT: (...args: unknown[]) => args.join(''),
      UPPER: (s: string) => String(s).toUpperCase(),
      LOWER: (s: string) => String(s).toLowerCase(),
      LEN: (s: string) => String(s).length,

      // Special: Image
      IMG: (url: string, alt?: string, width?: number, height?: number): ImageResult => ({
        _type: 'image',
        url,
        alt,
        width,
        height,
      }),
    };

    // 3. Evaluate using a Function constructor (minimal sandbox)
    const keys = Object.keys(context);
    const vals = Object.values(context);
    const evalFunc = new Function(...keys, `return ${expression}`);
    return evalFunc(...vals) as unknown;
  } catch (err) {
    console.error('Formula evaluation error:', err, formula);
    return `#ERROR: ${(err as Error).message}`;
  }
};

/**
 * Checks if a value is an ImageResult
 */
export const isImageResult = (val: unknown): val is ImageResult => {
  return val != null && typeof val === 'object' && (val as any)._type === 'image';
};
