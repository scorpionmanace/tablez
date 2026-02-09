import { describe, it, expect } from 'vitest';
import { evaluateFormula, isImageResult } from './formulas';

describe('Formula Engine', () => {
    const record = {
        name: 'Karan',
        price: 100,
        qty: 5,
        active: true,
        empty: null
    };

    it('evaluates basic mathematical expressions', () => {
        expect(evaluateFormula('={price} * {qty}', record)).toBe(500);
        expect(evaluateFormula('={price} / 2', record)).toBe(50);
        expect(evaluateFormula('={price} + {qty} + 10', record)).toBe(115);
    });

    it('evaluates logical functions', () => {
        expect(evaluateFormula("=IF({active}, 'YES', 'NO')", record)).toBe('YES');
        expect(evaluateFormula("=AND({active}, {price} > 50)", record)).toBe(true);
        expect(evaluateFormula("=OR({qty} > 10, {active})", record)).toBe(true);
    });

    it('evaluates math functions', () => {
        expect(evaluateFormula('=SUM(10, 20, 30)', record)).toBe(60);
        expect(evaluateFormula('=MAX({price}, 200)', record)).toBe(200);
        expect(evaluateFormula('=ROUND(123.456, 2)', record)).toBe(123.46);
    });

    it('evaluates string functions', () => {
        expect(evaluateFormula("=CONCAT('Hello ', {name})", record)).toBe('Hello Karan');
        expect(evaluateFormula("=UPPER({name})", record)).toBe('KARAN');
        expect(evaluateFormula("=LEN({name})", record)).toBe(5);
    });

    it('supports IMG function', () => {
        const result = evaluateFormula("=IMG('url', 'alt', 100, 100)", record);
        expect(isImageResult(result)).toBe(true);
        expect(result.url).toBe('url');
        expect(result.width).toBe(100);
    });

    it('returns error string for invalid formulas', () => {
        expect(evaluateFormula('=INVALID()', record)).toContain('#ERROR');
    });

    it('returns original string if not a formula', () => {
        expect(evaluateFormula('Just text', record)).toBe('Just text');
    });
});
