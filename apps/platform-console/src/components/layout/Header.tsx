import { useTranslation } from 'react-i18next';
import { Layout, Typography } from 'antd';
import {
	useAuth,
	useLogout,
	usePortalCatalog,
	useTenantSlug,
	getPortalUrl,
} from '@autional-cn/shared';
import {
	LanguageSwitcher,
	PortalSwitcher,
	ThemeToggle,
	UserMenu,
	type PortalLink,
} from '@autional-cn/ui';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export function Header() {
	const { t } = useTranslation();
	const { user, currentTenantId } = useAuth();
	const tenantSlug = useTenantSlug();
	const handleLogout = useLogout();

	// 管理面平面（audiences [admin, platform]）：平台控制台走 admin 受众端点
	const { portals: catalogPortals, isError } = usePortalCatalog({
		tenantId: currentTenantId,
		slug: tenantSlug,
		audience: 'admin',
	});

	// U94：平台租户打目录端点 403（平台平面守卫）⇒ 目录失败即静态清单兜底 [platform, admin]
	const fallbackPortals: PortalLink[] = [
		{ code: 'platform', url: getPortalUrl('platform', tenantSlug ?? undefined) },
		{ code: 'admin', url: getPortalUrl('admin', tenantSlug ?? undefined) },
	];
	const portals = isError ? fallbackPortals : catalogPortals;

	return (
		<AntHeader className="sticky top-0 z-10 flex items-center justify-between px-6 h-[var(--layout-header-height)] bg-[var(--color-bg-surface)] border-b border-[var(--color-border)]">
			<Text strong>{t('app.brand')}</Text>
			<div className="flex items-center gap-4">
				<PortalSwitcher portals={portals} currentPortal="platform" />
				<LanguageSwitcher />
				<ThemeToggle />
				<UserMenu
					user={user}
					items={[{ key: 'logout', type: 'logout', onClick: handleLogout }]}
				/>
			</div>
		</AntHeader>
	);
}
