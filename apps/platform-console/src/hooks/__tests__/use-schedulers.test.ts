import { describe, it, expect } from 'vitest';
import { deriveStatus, flattenSchedulers } from '@/hooks/use-schedulers';

describe('deriveStatus', () => {
	it('returns disabled when enabled is false even if running is true', () => {
		expect(deriveStatus({ enabled: false, running: true })).toBe('disabled');
	});

	it('returns disabled when enabled is missing', () => {
		expect(deriveStatus({})).toBe('disabled');
	});

	it('returns running when enabled and running', () => {
		expect(deriveStatus({ enabled: true, running: true })).toBe('running');
	});

	it('returns failed when enabled, not running, with lastError', () => {
		expect(deriveStatus({ enabled: true, running: false, lastError: 'boom' })).toBe('failed');
	});

	it('returns paused when enabled, not running, without error', () => {
		expect(deriveStatus({ enabled: true, running: false })).toBe('paused');
	});
});

describe('flattenSchedulers', () => {
	it('flattens services into rows with composite ids', () => {
		const rows = flattenSchedulers([
			{
				serviceName: 'billing-service',
				schedulers: [
					{ name: 'billing-revenue', enabled: true, running: true, interval: '24h' },
					{ name: 'billing-alert', enabled: true, running: false, interval: '5m' },
				],
			},
			{
				serviceName: 'pay-service',
				schedulers: [{ name: 'pay-expiry', enabled: false, interval: '10m' }],
			},
		]);

		expect(rows).toHaveLength(3);
		expect(rows[0]).toMatchObject({
			id: 'billing-service/billing-revenue',
			name: 'billing-revenue',
			service: 'billing-service',
			status: 'running',
			enabled: true,
		});
		expect(rows[1].status).toBe('paused');
		expect(rows[2]).toMatchObject({
			id: 'pay-service/pay-expiry',
			status: 'disabled',
			enabled: false,
		});
	});

	it('reads camelCased lastRun/lastError from interceptor output', () => {
		const rows = flattenSchedulers([
			{
				serviceName: 'audit-service',
				schedulers: [
					{ name: 'audit-anomaly', enabled: true, running: false, lastRun: '2026-10-04T00:00:00Z', lastError: 'timeout' },
				],
			},
		]);

		expect(rows[0].lastRun).toBe('2026-10-04T00:00:00Z');
		expect(rows[0].lastError).toBe('timeout');
		expect(rows[0].status).toBe('failed');
	});

	it('produces no rows for services without schedulers', () => {
		expect(flattenSchedulers([{ serviceName: 'svc-a' }])).toEqual([]);
		expect(flattenSchedulers([{ serviceName: 'svc-a', schedulers: null }])).toEqual([]);
		expect(flattenSchedulers([])).toEqual([]);
	});

	it('defaults missing interval to empty string and lastError to null', () => {
		const rows = flattenSchedulers([
			{ serviceName: 'svc-b', schedulers: [{ name: 's1', enabled: true, running: true }] },
		]);

		expect(rows[0].interval).toBe('');
		expect(rows[0].lastError).toBeNull();
	});
});
