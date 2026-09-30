import { useLocation } from 'react-router';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTenantSlug } from '@autional-cn/shared';
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

export function Breadcrumb() {
	const { t } = useTranslation();
	const location = useLocation();
	const tenantSlug = useTenantSlug();
	const pathParts = location.pathname.split('/').filter(Boolean);
	// 剥租户段（'/demo/tenants' → ['tenants']），routeLabels 键均为站内相对路径
	const segments = tenantSlug && pathParts[0] === tenantSlug ? pathParts.slice(1) : pathParts;

	if (segments.length === 0) return null;

	const items = segments.map((part, index) => {
		const path = '/' + segments.slice(0, index + 1).join('/');
		const labelKey = routeLabels[path];
		return {
			title: labelKey ? t(labelKey) : part,
		};
	});

	return <AntBreadcrumb items={[{ title: t('nav.dashboard') }, ...items]} className="mb-4" />;
}
