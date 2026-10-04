import { describe, it, expect } from 'vitest';
import { formatDateTime } from '../format';

// PL-24 回归锁：后端 ISO 微秒串必须本地化渲染，不得原文直出。
describe('formatDateTime', () => {
	it('formats microsecond ISO timestamps instead of leaking the raw string', () => {
		const out = formatDateTime('2026-10-04T10:09:44.867123Z');
		expect(out).toContain('2026');
		expect(out).not.toContain('2026-10-04');
		expect(out).not.toContain('.867123');
	});

	it('formats RFC3339 timestamps', () => {
		const out = formatDateTime('2026-10-04T10:09:44Z');
		expect(out).toContain('2026');
		expect(out).not.toContain('T10:09:44Z');
	});
});
