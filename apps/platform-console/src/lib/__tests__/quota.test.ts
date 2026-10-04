import { describe, it, expect } from 'vitest';
import { BYTES_PER_GB, gbFromBytes, resolveMaxStorageBytes } from '../quota';

// PL-16 回归锁：存储配额 GB↔字节换算与未改动回发。
describe('gbFromBytes', () => {
	it('converts exact GB multiples', () => {
		expect(gbFromBytes(BYTES_PER_GB)).toBe(1);
		expect(gbFromBytes(50 * BYTES_PER_GB)).toBe(50);
	});

	it('keeps sub-1GB quotas visible instead of truncating to 0 (PL-16 evidence case)', () => {
		expect(gbFromBytes(104857600)).toBe(0.098);
	});

	it('rounds to 3 decimals', () => {
		expect(gbFromBytes(1.5 * BYTES_PER_GB)).toBe(1.5);
		expect(gbFromBytes(0)).toBe(0);
	});
});

describe('resolveMaxStorageBytes', () => {
	it('returns untouched baseline bytes verbatim (no round-trip drift)', () => {
		expect(resolveMaxStorageBytes(0.098, 0.098, 104857600)).toBe(104857600);
	});

	it('converts GB to bytes when the value was edited', () => {
		expect(resolveMaxStorageBytes(0.5, 0.098, 104857600)).toBe(536870912);
		expect(resolveMaxStorageBytes(2, 1, BYTES_PER_GB)).toBe(2 * BYTES_PER_GB);
	});

	it('returns undefined when the field is empty (required rule blocks submit anyway)', () => {
		expect(resolveMaxStorageBytes(undefined, 0.098, 104857600)).toBeUndefined();
	});

	it('falls back to conversion when baseline bytes are unavailable', () => {
		expect(resolveMaxStorageBytes(0.098, undefined, undefined)).toBe(105226699);
		expect(resolveMaxStorageBytes(10, undefined, undefined)).toBe(10 * BYTES_PER_GB);
	});
});
