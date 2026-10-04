// NHI 策略读侧归一与保存前 diff（PL-33）。
// 契约：apiClient 响应拦截器已递归 camel 化，应用层读键一律 camel；
// 此处保留 snake 兜底，防止后端契约回退时再次断链（曾致 robot 上限显示初始值 50、真值 100 被静默覆盖）。

export interface NhiPolicy {
	agentMaxCount?: number;
	agentDefaultTtl?: string;
	robotMaxCount?: number;
	deviceMaxPerOwner?: number;
	rotationDaysDefault?: number;
}

type RawPolicy = Record<string, unknown>;

function pick<T>(raw: RawPolicy, camel: string, snake: string): T | undefined {
	return (raw[camel] as T | undefined) ?? (raw[snake] as T | undefined);
}

export function normalizeNhiPolicy(raw: RawPolicy | null | undefined): NhiPolicy {
	if (!raw || typeof raw !== 'object') return {};
	const out: NhiPolicy = {};
	const agentMaxCount = pick<number>(raw, 'agentMaxCount', 'agent_max_count');
	if (agentMaxCount != null) out.agentMaxCount = agentMaxCount;
	const agentDefaultTtl = pick<string>(raw, 'agentDefaultTtl', 'agent_default_ttl');
	if (agentDefaultTtl != null) out.agentDefaultTtl = agentDefaultTtl;
	const robotMaxCount = pick<number>(raw, 'robotMaxCount', 'robot_max_count');
	if (robotMaxCount != null) out.robotMaxCount = robotMaxCount;
	const deviceMaxPerOwner = pick<number>(raw, 'deviceMaxPerOwner', 'device_max_per_owner');
	if (deviceMaxPerOwner != null) out.deviceMaxPerOwner = deviceMaxPerOwner;
	const rotationDaysDefault = pick<number>(raw, 'rotationDaysDefault', 'rotation_days_default');
	if (rotationDaysDefault != null) out.rotationDaysDefault = rotationDaysDefault;
	return out;
}

export const NHI_POLICY_FIELDS: Array<{ key: keyof NhiPolicy; label: string }> = [
	{ key: 'agentMaxCount', label: 'Agent 数量上限' },
	{ key: 'agentDefaultTtl', label: 'Agent 默认 TTL' },
	{ key: 'robotMaxCount', label: 'Robot 数量上限' },
	{ key: 'deviceMaxPerOwner', label: '每个所有者 Device 上限' },
	{ key: 'rotationDaysDefault', label: '默认轮换周期（天）' },
];

export interface NhiPolicyChange {
	field: keyof NhiPolicy;
	label: string;
	from: number | string | undefined;
	to: number | string | undefined;
}

export function diffNhiPolicy(current: NhiPolicy, next: NhiPolicy): NhiPolicyChange[] {
	const changes: NhiPolicyChange[] = [];
	for (const { key, label } of NHI_POLICY_FIELDS) {
		const to = next[key];
		if (to === undefined) continue;
		const from = current[key];
		if (from !== to) changes.push({ field: key, label, from, to });
	}
	return changes;
}
