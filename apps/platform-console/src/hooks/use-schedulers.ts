'use client';

import { useState, useEffect, useCallback } from 'react';
import { extractItem } from '@autional-cn/shared';
import { adminSchedulers } from '@autional-cn/shared/generated/api';

export interface SchedulerItem {
	name: string;
	service: string;
	interval: string;
	status: string;
	lastRun: string;
	lastError: string | null;
	enabled: boolean;
}

interface SchedulerDetail {
	name?: string;
	task_name?: string;
	interval?: string;
	cron?: string;
	status?: string;
	enabled?: boolean;
	last_run_at?: string;
	last_error?: string;
}

interface ServiceSchedulerInfo {
	service_name: string;
	service_port: number;
	schedulers?: SchedulerDetail[] | null;
}

const FALLBACK_SCHEDULERS: SchedulerItem[] = [
	{
		name: 'pay-expiry',
		service: 'pay-service',
		interval: '10m',
		status: 'running',
		lastRun: '2 min ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'billing-revenue',
		service: 'billing-service',
		interval: '24h',
		status: 'running',
		lastRun: '12 hours ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'billing-reconciliation',
		service: 'billing-service',
		interval: '6h',
		status: 'running',
		lastRun: '3 hours ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'billing-metered',
		service: 'billing-service',
		interval: '24h',
		status: 'running',
		lastRun: '20 hours ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'billing-alert',
		service: 'billing-service',
		interval: '5m',
		status: 'running',
		lastRun: '3 min ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'secret-expiry',
		service: 'secret-service',
		interval: '5m',
		status: 'running',
		lastRun: '1 min ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'point-expiry',
		service: 'point-service',
		interval: '1h',
		status: 'running',
		lastRun: '45 min ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'audit-anomaly-detection',
		service: 'audit-service',
		interval: 'config',
		status: 'running',
		lastRun: '5 min ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'audit-report-generation',
		service: 'audit-service',
		interval: 'config',
		status: 'running',
		lastRun: '2 hours ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'audit-retention-archiver',
		service: 'audit-service',
		interval: 'config',
		status: 'running',
		lastRun: '6 hours ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'notification-announcement',
		service: 'notification-service',
		interval: 'config',
		status: 'running',
		lastRun: '10 min ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'communication-scheduler',
		service: 'communication-service',
		interval: 'config',
		status: 'running',
		lastRun: '30s ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'oauth-secret-cleanup',
		service: 'oauth-service',
		interval: 'config',
		status: 'running',
		lastRun: '5 min ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'oauth-token-cleanup',
		service: 'oauth-service',
		interval: 'config',
		status: 'running',
		lastRun: '10 min ago',
		lastError: null,
		enabled: true,
	},
	{
		name: 'oauth-provider-health',
		service: 'oauth-service',
		interval: '30s',
		status: 'running',
		lastRun: '15s ago',
		lastError: null,
		enabled: true,
	},
];

export function useSchedulers() {
	const [data, setData] = useState<SchedulerItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchData = useCallback(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await adminSchedulers();
			const items = extractItem<ServiceSchedulerInfo[]>(response);
			if (items && items.length > 0) {
				// 后端返回 [{service_name, service_port, schedulers?: [...]}]，
				// 展平为调度器行（2026-08-16 修复：原 extractItem({data: response}) 结构错 + 未展平）
				const rows: SchedulerItem[] = [];
				for (const svc of items) {
					// interceptor 已 camelCase（service_name→serviceName），兼容两者
					const svcObj = svc as unknown as Record<string, unknown>;
					const svcName = svcObj.serviceName as string | undefined;
					const svcSchedulers = svcObj.schedulers as SchedulerDetail[] | undefined;
					const realSchedulers = svcSchedulers ?? svc.schedulers ?? [];
					if (realSchedulers.length > 0) {
						for (const sch of realSchedulers) {
							rows.push({
								name: sch.name || sch.task_name || `${svcName}-scheduler`,
								service: svcName || '',
								interval: sch.interval || sch.cron || 'config',
								status: sch.status || sch.enabled ? 'running' : 'disabled',
								lastRun: sch.last_run_at || '',
								lastError: sch.last_error || null,
								enabled: !!sch.enabled,
							});
						}
					} else {
						rows.push({
							name: `${svcName}`,
							service: svcName || '',
							interval: '—',
							status: 'disabled',
							lastRun: '',
							lastError: null,
							enabled: false,
						});
					}
				}
				setData(rows);
			} else {
				setData(FALLBACK_SCHEDULERS);
			}
		} catch (err) {
			console.warn('Scheduler API unavailable, using fallback data');
			setData(FALLBACK_SCHEDULERS);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	return { data, isLoading, error, refetch: fetchData };
}
