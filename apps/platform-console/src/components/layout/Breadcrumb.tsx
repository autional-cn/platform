import { useMemo } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useTenantSlug } from '@autional-cn/shared';
import { Breadcrumb as SharedBreadcrumb } from '@autional-cn/ui/antd';
import { ROUTE } from '@/lib/route-paths';

const routeLabels: Record<string, string> = {
	[ROUTE.DASHBOARD]: 'nav.dashboard',
	[ROUTE.TENANTS]: 'nav.tenants',
	[ROUTE.ANNOUNCEMENTS]: 'nav.announcements',
	[ROUTE.INCIDENTS]: 'nav.incidents',
	[ROUTE.MAINTENANCES]: 'nav.maintenances',
	[ROUTE.AGENTS]: 'nav.agents',
	[ROUTE.ROBOTS]: 'nav.robots',
	[ROUTE.DEVICES]: 'nav.devices',
	[ROUTE.NHI_POLICY]: 'nav.nhiPolicy',
	[ROUTE.PLATFORM_NOTIFICATIONS]: 'nav.platformNotifications',
	[ROUTE.FEATURE_GATES]: 'nav.featureGates',
	[ROUTE.FEATURE_FLAGS]: 'nav.featureFlags',
	[ROUTE.COMPLIANCE_POLICY]: 'nav.compliancePolicy',
	[ROUTE.MINORS_PROTECTION]: 'nav.minorsProtection',
	[ROUTE.GDPR_ERASURE]: 'nav.gdprErasure',
	[ROUTE.OPS]: 'nav.ops',
	[ROUTE.SYSTEM_OVERVIEW]: 'nav.systemOverview',
	[ROUTE.SYSTEM_CONFIG]: 'nav.systemConfig',
	[ROUTE.SYSTEM_SCHEDULERS]: 'nav.systemSchedulers',
	[ROUTE.SECRETS_INVENTORY]: 'nav.secretsInventory',
	[ROUTE.RATE_LIMITS]: 'nav.rateLimits',
	[ROUTE.ENV_VARS]: 'nav.envVars',
	[ROUTE.INFRA_CREDENTIALS]: 'nav.infraCredentials',
	[ROUTE.IMPERSONATE]: 'nav.impersonate',
	[ROUTE.SETTINGS]: 'nav.settings',
};

/**
 * 面包屑。
 *
 * 这里只剩**业务**：路由 → 文案的映射表（27 条，与另外三个门户不重叠）。
 * 机制在设计系统那一份里。此前本站是 54 行：按段累积但**中间段不可点**、未命中的段**直接丢掉**，
 * 于是面包屑会与实际位置不符（`/demo/announcements/xxx` 只剩「公告」）。换成共同实现后这两点都改了。
 */
export function Breadcrumb() {
	const { t } = useTranslation();
	const location = useLocation();
	const tenantSlug = useTenantSlug();

	const labels = useMemo<Record<string, string>>(
		() => Object.fromEntries(Object.entries(routeLabels).map(([path, key]) => [path, t(key)])),
		[t],
	);

	return (
		<SharedBreadcrumb
			pathname={location.pathname}
			tenantSlug={tenantSlug}
			labels={labels}
			home={{ label: t('nav.dashboard'), href: tenantSlug ? '/' + tenantSlug : '/' }}
			buildHref={(path) => (tenantSlug ? '/' + tenantSlug + path : path)}
		/>
	);
}
