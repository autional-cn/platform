import { describe, it, expect } from 'vitest';
import { normalizeNhiPolicy, diffNhiPolicy } from '@/lib/nhi-policy';

describe('normalizeNhiPolicy', () => {
	it('reads camelCase keys (post-interceptor contract)', () => {
		const policy = normalizeNhiPolicy({
			agentMaxCount: 100,
			agentDefaultTtl: '1h',
			robotMaxCount: 100,
			deviceMaxPerOwner: 10,
			rotationDaysDefault: 90,
		});
		expect(policy.robotMaxCount).toBe(100);
		expect(policy.agentDefaultTtl).toBe('1h');
	});

	it('falls back to snake_case keys (contract regression guard)', () => {
		// PL-33 回归锁：线上真值为 robot_max_count=100，修复前 UI 回落初始值 50。
		const policy = normalizeNhiPolicy({ agent_max_count: 100, robot_max_count: 100 });
		expect(policy.robotMaxCount).toBe(100);
		expect(policy.agentMaxCount).toBe(100);
	});

	it('returns empty object for null/undefined input', () => {
		expect(normalizeNhiPolicy(null)).toEqual({});
		expect(normalizeNhiPolicy(undefined)).toEqual({});
	});

	it('drops missing fields instead of inventing defaults', () => {
		const policy = normalizeNhiPolicy({ agentMaxCount: 100 });
		expect('robotMaxCount' in policy).toBe(false);
	});
});

describe('diffNhiPolicy', () => {
	const current = {
		agentMaxCount: 100,
		agentDefaultTtl: '1h',
		robotMaxCount: 100,
		deviceMaxPerOwner: 10,
		rotationDaysDefault: 90,
	};

	it('returns no changes when nothing changed', () => {
		expect(diffNhiPolicy(current, { ...current })).toEqual([]);
	});

	it('reports changed fields with from/to', () => {
		const changes = diffNhiPolicy(current, { ...current, robotMaxCount: 50 });
		expect(changes).toHaveLength(1);
		expect(changes[0]).toMatchObject({
			field: 'robotMaxCount',
			label: 'Robot 数量上限',
			from: 100,
			to: 50,
		});
	});

	it('skips fields absent from next (untouched)', () => {
		expect(diffNhiPolicy(current, { robotMaxCount: 100 })).toEqual([]);
	});

	it('treats previously-missing current field as a change', () => {
		const changes = diffNhiPolicy({}, { agentMaxCount: 100 });
		expect(changes).toHaveLength(1);
		expect(changes[0].from).toBeUndefined();
	});
});
