import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router';
import { ROUTE } from '@/lib/route-paths';
import {
	DashboardOutlined,
	TeamOutlined,
	NotificationOutlined,
	WarningOutlined,
	RobotOutlined,
	ControlOutlined,
	SafetyOutlined,
	SafetyCertificateOutlined,
	CloudServerOutlined,
	SettingOutlined,
	DesktopOutlined,
	ApiOutlined,
	KeyOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';

const { Sider } = Layout;
const { Text } = Typography;

type MenuItem = {
	key: string;
	icon?: React.ReactNode;
	label: string;
	children?: MenuItem[];
};

function findMenuKey(items: MenuItem[], path: string): string | null {
	for (const item of items) {
		if (item.key === path) return item.key;
		if (item.children) {
			const found = findMenuKey(item.children, path);
			if (found) return found;
		}
	}
	return null;
}

export function Sidebar() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const [collapsed] = useState(false);

	const allMenuItems: MenuItem[] = useMemo(
		() => [
			{ key: ROUTE.DASHBOARD, icon: <DashboardOutlined />, label: t('nav.dashboard') },
			{
				key: 'tenants-section',
				icon: <TeamOutlined />,
				label: t('nav.tenants'),
				children: [{ key: ROUTE.TENANTS, label: t('nav.tenants') }],
			},
			{ key: ROUTE.ANNOUNCEMENTS, icon: <NotificationOutlined />, label: t('nav.announcements') },
			{
				key: 'status-section',
				icon: <WarningOutlined />,
				label: t('nav.status'),
				children: [
					{ key: ROUTE.INCIDENTS, label: t('nav.incidents') },
					{ key: ROUTE.MAINTENANCES, label: t('nav.maintenances') },
				],
			},
			{
				key: 'nhi-section',
				icon: <RobotOutlined />,
				label: t('nav.nhiSection'),
				children: [
					{ key: ROUTE.AGENTS, label: t('nav.agents') },
					{ key: ROUTE.ROBOTS, label: t('nav.robots') },
					{ key: ROUTE.DEVICES, label: t('nav.devices') },
					{ key: ROUTE.NHI_POLICY, label: t('nav.nhiPolicy') },
				],
			},
			{
				key: ROUTE.PLATFORM_NOTIFICATIONS,
				icon: <DesktopOutlined />,
				label: t('nav.platformNotifications'),
			},
			{
				key: 'features-section',
				icon: <ControlOutlined />,
				label: t('nav.featureManagement', '功能管理'),
				children: [
					{ key: ROUTE.FEATURE_GATES, label: t('nav.featureGates') },
					{ key: ROUTE.FEATURE_FLAGS, label: t('nav.featureFlags') },
				],
			},
			{
				key: 'compliance-section',
				icon: <SafetyOutlined />,
				label: t('nav.complianceSection'),
				children: [
					{ key: ROUTE.COMPLIANCE_POLICY, label: t('nav.compliancePolicy') },
					{ key: ROUTE.MINORS_PROTECTION, label: t('nav.minorsProtection') },
					{ key: ROUTE.GDPR_ERASURE, label: t('nav.gdprErasure') },
				],
			},
			{
				key: 'security-section',
				icon: <SafetyCertificateOutlined />,
				label: t('nav.securitySection'),
				children: [{ key: ROUTE.SECURITY_CAPTCHA, label: t('nav.captchaConfig') }],
			},
			{
				key: 'system-section',
				icon: <CloudServerOutlined />,
				label: t('nav.systemSection'),
				children: [
					{ key: ROUTE.OPS, label: t('nav.ops') },
					{ key: ROUTE.SYSTEM_OVERVIEW, label: t('nav.systemOverview') },
					{ key: ROUTE.SYSTEM_CONFIG, label: t('nav.systemConfig') },
					{ key: ROUTE.SYSTEM_SCHEDULERS, label: t('nav.systemSchedulers') },
					{ key: ROUTE.SECRETS_INVENTORY, icon: <KeyOutlined />, label: t('nav.secretsInventory') },
					{ key: ROUTE.RATE_LIMITS, icon: <ApiOutlined />, label: t('nav.rateLimits') },
					{ key: ROUTE.ENV_VARS, label: t('nav.envVars') },
					{ key: ROUTE.INFRA_CREDENTIALS, label: t('nav.infraCredentials') },
					{ key: ROUTE.IMPERSONATE, label: t('nav.impersonate') },
				],
			},
			{ key: ROUTE.SETTINGS, icon: <SettingOutlined />, label: t('nav.settings') },
		],
		[t],
	);

	const selectedKeys = useMemo(() => {
		const path = location.pathname;
		if (path === '/') return ['/'];
		const matched = findMenuKey(allMenuItems, path);
		return matched ? [matched] : [];
	}, [location.pathname, allMenuItems]);

	const defaultOpenKeys = useMemo(() => {
		const path = location.pathname;
		const keys: string[] = [];
		for (const item of allMenuItems) {
			if (item.children?.some((c) => path.startsWith(c.key))) {
				keys.push(item.key);
			}
		}
		return keys;
	}, [location.pathname, allMenuItems]);

	const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
		navigate(key);
	};

	const convertItems = (items: MenuItem[]): any[] =>
		items.map((item) => ({
			key: item.key,
			icon: item.icon,
			label: item.label,
			children: item.children ? convertItems(item.children) : undefined,
		}));

	return (
		<Sider
			trigger={null}
			collapsible
			collapsed={collapsed}
			theme="light"
			className="border-r border-[var(--color-border)]"
		>
			<div className="flex h-16 items-center justify-center border-b border-[var(--color-border)]">
				<Text strong className="text-lg">
					{collapsed ? 'P' : t('app.brand')}
				</Text>
			</div>
			<Menu
				mode="inline"
				selectedKeys={selectedKeys}
				defaultOpenKeys={defaultOpenKeys}
				items={convertItems(allMenuItems)}
				onClick={handleMenuClick}
				className="border-r-0"
			/>
		</Sider>
	);
}
