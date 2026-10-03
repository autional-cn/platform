'use client';

import { useQuery } from '@tanstack/react-query';
import { extractItem } from '@autional-cn/shared';
import { adminSystemRuntime, developerStatus } from '@autional-cn/shared/generated/api';
import { getTenantStats } from '@/lib/api.generated';
import { queryKeys } from '@/lib/query-keys';

export type ServiceCategory =
	| 'authentication'
	| 'user-data'
	| 'business-platform'
	| 'operations'
	| 'infrastructure';
export type ServiceStatus = 'healthy' | 'unhealthy' | 'unknown';
export type InfraStatus = ServiceStatus;

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
	authentication: '认证',
	'user-data': '用户数据',
	'business-platform': '业务平台',
	operations: '运营',
	infrastructure: '基础设施',
};

export interface ServiceInfo {
	name: string;
	port: number;
	status: ServiceStatus;
	category: ServiceCategory;
}

export interface InfraComponent {
	name: string;
	status: InfraStatus;
}

export interface TenantOverview {
	total: number;
	active: number;
	suspended: number;
	planDistribution: { plan: string; count: number }[];
}

export interface SecurityPosture {
	passwordsExpired: number;
	weakPasswords: number;
	expiringSecrets: number;
	passwordPepperEnabled: boolean;
	hibpEnabled: boolean;
}

export interface SystemOverview {
	services: ServiceInfo[];
	infrastructure: InfraComponent[];
	tenants: TenantOverview;
	security: SecurityPosture;
}

interface RuntimeService {
	name: string;
	port: number;
	category: string;
}

interface RuntimeResponse {
	services: RuntimeService[];
}

interface HealthItem {
	name: string;
	status: string;
	port: number;
}

const PLACEHOLDER_INFRA: InfraComponent[] = [
	{ name: 'PostgreSQL', status: 'unknown' },
	{ name: 'Redis', status: 'unknown' },
	{ name: 'RabbitMQ', status: 'unknown' },
	{ name: 'MongoDB', status: 'unknown' },
	{ name: 'MinIO', status: 'unknown' },
];

const PLACEHOLDER_TENANTS: TenantOverview = {
	total: 0,
	active: 0,
	suspended: 0,
	planDistribution: [
		{ plan: 'Free', count: 0 },
		{ plan: 'Starter', count: 0 },
		{ plan: 'Professional', count: 0 },
		{ plan: 'Enterprise', count: 0 },
	],
};

const PLACEHOLDER_SECURITY: SecurityPosture = {
	passwordsExpired: 0,
	weakPasswords: 0,
	expiringSecrets: 0,
	passwordPepperEnabled: false,
	hibpEnabled: false,
};

const VALID_CATEGORIES: Set<string> = new Set([
	'authentication',
	'user-data',
	'business-platform',
	'operations',
	'infrastructure',
]);

function mapHealthStatus(raw: string): ServiceStatus {
	if (raw === 'healthy' || raw === 'up' || raw === 'ok') return 'healthy';
	if (raw === 'unhealthy' || raw === 'down' || raw === 'error') return 'unhealthy';
	return 'unknown';
}

function normalizeCategory(raw: string | undefined): ServiceCategory {
	if (raw && VALID_CATEGORIES.has(raw)) return raw as ServiceCategory;
	if (raw === 'core' || raw === 'auth') return 'authentication';
	if (raw === 'business') return 'business-platform';
	if (raw === 'infra') return 'infrastructure';
	return 'infrastructure';
}

export function useSystemOverview() {
	return useQuery<SystemOverview>({
		queryKey: queryKeys.systemOverview.all,
		staleTime: 30000,
		queryFn: async () => {
			// 不写初值：try 与 catch 都必然赋值，初值从来没被读到过
			// （ESLint 10 的 no-useless-assignment 抓到的就是这一处）
			let runtimeServices: RuntimeService[];
			try {
				const runtimeData = await adminSystemRuntime();
				const extracted = extractItem<RuntimeResponse>({ data: runtimeData });
				runtimeServices = extracted?.services ?? [];
			} catch {
				runtimeServices = [];
			}

			let healthMap: Record<string, string> = {};
			try {
				const healthRes = await developerStatus();
				const healthData = extractItem<any>(healthRes);
				if (healthData?.services && Array.isArray(healthData.services)) {
					for (const svc of healthData.services as HealthItem[]) {
						healthMap[svc.name] = svc.status;
					}
				}
			} catch {
				healthMap = {};
			}

			const services: ServiceInfo[] = runtimeServices.map((svc) => ({
				name: svc.name,
				port: svc.port,
				status: healthMap[svc.name] ? mapHealthStatus(healthMap[svc.name]) : 'unknown',
				category: normalizeCategory(svc.category),
			}));

			// 从真实 API 获取租户统计数据
			let tenants = PLACEHOLDER_TENANTS;
			try {
				const statsRes = await getTenantStats();
				const data = extractItem<{ stats: TenantOverview }>(statsRes);
				if (data?.stats) {
					tenants = { ...data.stats };
					// API 返回 by_plan 对象 {free:12, platform:1}，页面期望 planDistribution 数组
					// （2026-08-16 修复：原直接赋 data.stats 导致 planDistribution undefined → .map 崩溃）
					const statsObj = data.stats as unknown as Record<string, unknown>;
					// interceptor 已 camelCase（by_plan→byPlan），两种都兼容
					const byPlan =
						(statsObj.byPlan as Record<string, number> | undefined) ??
						(statsObj.by_plan as Record<string, number> | undefined);
					if (byPlan && typeof byPlan === 'object') {
						tenants.planDistribution = Object.entries(byPlan).map(([plan, count]) => ({
							plan,
							count,
						}));
					}
				}
			} catch {
				// API 不可用时使用占位符
			}

			return {
				services,
				infrastructure: PLACEHOLDER_INFRA,
				tenants,
				security: PLACEHOLDER_SECURITY,
			};
		},
	});
}
