'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractItem } from '@autional-cn/shared';
import {
	adminEnvVars,
	adminFeatureFlags,
	adminSystemRuntime,
} from '@autional-cn/shared/generated/api';
import { queryKeys } from '@/lib/query-keys';

export type ServiceCategory =
	| 'authentication'
	| 'user-data'
	| 'business-platform'
	| 'operations'
	| 'infrastructure';
export type ServiceStatus = 'running' | 'degraded' | 'stopped' | 'unknown';
export type FeatureStatus = 'enabled' | 'disabled' | 'not_applicable';
export type InfraType = 'database' | 'cache' | 'message_queue' | 'object_storage' | 'document_db';

export interface ServiceInfo {
	key: string;
	name: string;
	httpPort: number;
	grpcPort: number;
	category: ServiceCategory;
	categoryLabel: string;
	status: ServiceStatus;
	version: string;
	description: string;
}

export interface ServiceDetail {
	version: string;
	uptime: string;
	dbStatus: ServiceStatus;
	cacheStatus: ServiceStatus;
	mqStatus: ServiceStatus;
	lastDeploy: string;
	goVersion: string;
}

export interface InfraComponent {
	key: string;
	name: string;
	hostPort: string;
	credentialLocation: string;
	type: InfraType;
	typeLabel: string;
	status: ServiceStatus;
	description: string;
}

export interface EnvVarItem {
	key: string;
	name: string;
	value: string;
	masked: boolean;
	category: string;
	description: string;
}

export interface FeatureFlagItem {
	key: string;
	name: string;
	description: string;
	services: Record<string, FeatureStatus>;
}

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
	authentication: '认证',
	'user-data': '用户数据',
	'business-platform': '业务平台',
	operations: '运营',
	infrastructure: '基础设施',
};

const CATEGORY_SERVICE_MAP: Record<string, ServiceCategory> = {
	'identity-service': 'authentication',
	'profile-service': 'user-data',
	'tenant-service': 'user-data',
	'session-service': 'authentication',
	'mfa-service': 'authentication',
	'oauth-service': 'authentication',
	'wallet-service': 'business-platform',
	'point-service': 'business-platform',
	'audit-service': 'operations',
	'notification-service': 'operations',
	'communication-service': 'operations',
	'storage-service': 'infrastructure',
	'billing-service': 'business-platform',
	'compliance-service': 'operations',
	'status-service': 'operations',
	'secret-service': 'infrastructure',
	'pay-service': 'business-platform',
	'saml-service': 'authentication',
};

const SERVICE_DESCRIPTIONS: Record<string, string> = {
	'identity-service': '身份认证与用户管理',
	'profile-service': '用户资料管理',
	'tenant-service': '多租户管理',
	'session-service': '会话管理',
	'mfa-service': '多因素认证',
	'oauth-service': 'OAuth 2.0 / OIDC 认证',
	'wallet-service': '钱包与余额管理',
	'point-service': '积分管理',
	'audit-service': '审计日志与合规',
	'notification-service': '通知推送中心',
	'communication-service': '邮件/短信发送',
	'storage-service': '文件存储管理',
	'billing-service': '计费与订阅',
	'compliance-service': '合规框架管理',
	'status-service': '服务状态页',
	'secret-service': '密钥管理',
	'pay-service': '支付处理',
	'saml-service': 'SAML 2.0 联合认证',
};

export const INFRA_TYPE_LABELS: Record<InfraType, string> = {
	database: '数据库',
	cache: '缓存',
	message_queue: '消息队列',
	object_storage: '对象存储',
	document_db: '文档数据库',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
	running: '运行中',
	degraded: '降级',
	stopped: '已停止',
	unknown: '未知',
};

const FEATURE_LABELS: Record<FeatureStatus, string> = {
	enabled: '✅',
	disabled: '❌',
	not_applicable: '—',
};

interface RuntimeService {
	name: string;
	port: number;
	category: string;
}

interface RuntimeResponse {
	services: RuntimeService[];
}

export const serviceDetailDefaults: ServiceDetail = {
	version: 'v1.0.0',
	uptime: '—',
	dbStatus: 'unknown',
	cacheStatus: 'unknown',
	mqStatus: 'unknown',
	lastDeploy: '—',
	goVersion: 'go1.25',
};

export const infraComponents: InfraComponent[] = [
	{
		key: 'postgres',
		name: 'PostgreSQL',
		hostPort: 'postgres:5432',
		credentialLocation: '.env / POSTGRES_PASSWORD',
		type: 'database',
		typeLabel: '数据库',
		status: 'unknown',
		description: '关系型数据库，PgBouncer 连接池 :6432',
	},
	{
		key: 'redis',
		name: 'Redis',
		hostPort: 'redis:6379',
		credentialLocation: '.env / REDIS_PASSWORD',
		type: 'cache',
		typeLabel: '缓存',
		status: 'unknown',
		description: '缓存与会话存储',
	},
	{
		key: 'rabbitmq',
		name: 'RabbitMQ',
		hostPort: 'rabbitmq:5672 / :15672 (管理)',
		credentialLocation: '.env / RABBITMQ_PASSWORD',
		type: 'message_queue',
		typeLabel: '消息队列',
		status: 'unknown',
		description: '事件总线与消息队列',
	},
	{
		key: 'mongodb',
		name: 'MongoDB',
		hostPort: 'mongodb:27018',
		credentialLocation: '.env / MONGO_PASSWORD',
		type: 'document_db',
		typeLabel: '文档数据库',
		status: 'unknown',
		description: '审计日志存储',
	},
	{
		key: 'minio',
		name: 'MinIO',
		hostPort: 'minio:9000 / :9001 (控制台)',
		credentialLocation: '.env / MINIO_ROOT_PASSWORD',
		type: 'object_storage',
		typeLabel: '对象存储',
		status: 'unknown',
		description: 'S3 兼容对象存储',
	},
];

function mapCategory(name: string, apiCategory?: string): ServiceCategory {
	if (apiCategory && CATEGORY_LABELS[apiCategory as ServiceCategory]) {
		return apiCategory as ServiceCategory;
	}
	return CATEGORY_SERVICE_MAP[name] ?? 'infrastructure';
}

export function useServiceList() {
	return useQuery<ServiceInfo[]>({
		queryKey: ['system-config', 'services'] as const,
		staleTime: 60000,
		queryFn: async () => {
			try {
				const data = await adminSystemRuntime();
				const extracted = extractItem<RuntimeResponse>({ data });
				const runtimeServices = (extracted as RuntimeResponse)?.services ?? [];

				return runtimeServices.map((svc) => {
					const category = mapCategory(svc.name, svc.category);
					return {
						key: svc.name,
						name: svc.name,
						httpPort: svc.port,
						grpcPort: svc.port + 1000,
						category,
						categoryLabel: CATEGORY_LABELS[category],
						status: 'unknown' as ServiceStatus,
						version: 'v1.0.0',
						description: SERVICE_DESCRIPTIONS[svc.name] ?? '',
					};
				});
			} catch {
				return [];
			}
		},
	});
}

export function useEnvVars() {
	return useQuery<EnvVarItem[]>({
		queryKey: ['system-config', 'env-vars'] as const,
		staleTime: 60000,
		queryFn: async () => {
			try {
				const raw = await adminEnvVars();
				const variables = raw?.data?.variables ?? raw?.variables ?? [];
				return variables.map((v: Record<string, unknown>) => ({
					key: (v.key as string) ?? '',
					name: (v.key as string) ?? '',
					value: v.masked ? '••••••••••••••••' : ((v.value as string) ?? ''),
					masked: (v.masked as boolean) ?? false,
					category: (v.category as string) ?? '',
					description: (v.source as string) ?? '',
				}));
			} catch {
				return [];
			}
		},
	});
}

export function useFeatureFlags() {
	return useQuery<FeatureFlagItem[]>({
		queryKey: ['system-config', 'feature-flags'] as const,
		staleTime: 60000,
		queryFn: async () => {
			try {
				const raw = await adminFeatureFlags();
				const services = raw?.data?.services ?? raw?.services ?? [];

				const flagMap = new Map<
					string,
					{ description: string; services: Record<string, FeatureStatus> }
				>();
				const allServiceKeys: string[] = [];

				for (const svc of services as Record<string, unknown>[]) {
					const serviceKey = (svc.service as string) ?? '';
					if (serviceKey) allServiceKeys.push(serviceKey);

					const flags = (svc.flags as Record<string, unknown>[]) ?? [];
					for (const f of flags) {
						const flagKey = (f.key as string) ?? '';
						const flagValue = (f.value as string) ?? '';
						const status: FeatureStatus =
							flagValue === 'enabled'
								? 'enabled'
								: flagValue === 'disabled'
									? 'disabled'
									: 'not_applicable';

						if (!flagMap.has(flagKey)) {
							flagMap.set(flagKey, {
								description: (f.description as string) ?? '',
								services: Object.fromEntries(
									allServiceKeys.map((k) => [k, 'not_applicable' as FeatureStatus]),
								),
							});
						}

						const entry = flagMap.get(flagKey)!;
						entry.services[serviceKey] = status;
					}
				}

				return Array.from(flagMap.entries()).map(([key, info]) => ({
					key,
					name: key,
					description: info.description,
					services: info.services,
				}));
			} catch {
				return [];
			}
		},
	});
}

export function useServiceDetail(serviceKey: string) {
	return useQuery<ServiceDetail>({
		queryKey: ['system-config', 'service-detail', serviceKey] as const,
		staleTime: 60000,
		queryFn: async () => {
			try {
				const res = await apiClient.get(`/admin/system/runtime/${encodeURIComponent(serviceKey)}`); // @generated-api-exempt — no single-service endpoint
				const data = extractItem<any>(res);
				if (data) {
					return {
						version: data.version ?? serviceDetailDefaults.version,
						uptime: data.uptime ?? serviceDetailDefaults.uptime,
						dbStatus: (data.db_status ?? serviceDetailDefaults.dbStatus) as ServiceStatus,
						cacheStatus: (data.cache_status ?? serviceDetailDefaults.cacheStatus) as ServiceStatus,
						mqStatus: (data.mq_status ?? serviceDetailDefaults.mqStatus) as ServiceStatus,
						lastDeploy: data.last_deploy ?? serviceDetailDefaults.lastDeploy,
						goVersion: data.go_version ?? serviceDetailDefaults.goVersion,
					};
				}
			} catch {
				// fall through to default
			}
			return { ...serviceDetailDefaults };
		},
		enabled: !!serviceKey,
	});
}

export function getStatusColor(status: ServiceStatus): string {
	switch (status) {
		case 'running':
			return 'success';
		case 'degraded':
			return 'warning';
		case 'stopped':
			return 'error';
		default:
			return 'default';
	}
}

export function getStatusLabel(status: ServiceStatus): string {
	return STATUS_LABELS[status];
}

export function getFeatureLabel(status: FeatureStatus): string {
	return FEATURE_LABELS[status];
}
