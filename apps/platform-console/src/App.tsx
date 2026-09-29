import { lazy } from 'react';
import { Routes, Route, Outlet, Navigate, useParams } from 'react-router';
import { Layout, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { ErrorBoundary } from '@autional-cn/ui';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Breadcrumb } from './components/layout/Breadcrumb';
import { PlatformGuard, OAuthCallbackPage, useBootstrap, TenantSlugProvider } from '@autional-cn/shared';
import { ROUTE } from './lib/route-paths';

const Forbidden = <Navigate to={ROUTE.FORBIDDEN} replace />;

import DashboardPage from './app/page';
import ForbiddenPage from './app/403/page';
import NotFoundPage from './app/not-found/page';
import SettingsPage from './app/settings/page';

import TenantsPage from './app/tenants/page';
import InvitationConfigPage from './app/tenants/[id]/invitation-config/page';
import QuotaPage from './app/tenants/[id]/quota/page';
import AnnouncementsPage from './app/announcements/page';
import IncidentsPage from './app/status/incidents/page';
import MaintenancesPage from './app/status/maintenances/page';
import OpsPage from './app/ops/page';
import PlatformNotificationsPage from './app/platform/notifications/page';
import SystemOverviewPage from './app/system/overview/page';
import SystemConfigPage from './app/system/config/page';
import SystemSecretsInventoryPage from './app/system/secrets-inventory/page';
import SystemRateLimitsPage from './app/system/rate-limits/page';
import SystemSchedulersPage from './app/system/schedulers/page';
import AgentsPage from './app/agents/page';
import AgentDetailPage from './app/agents/[id]/page';
import RobotsPage from './app/robots/page';
import RobotDetailPage from './app/robots/[id]/page';
import DevicesPage from './app/devices/page';
import DeviceDetailPage from './app/devices/[id]/page';
import FeatureGatesPage from './app/feature-gates/page';
import NhiPolicyPage from './app/policies/nhi/page';
import CompliancePolicyPage from './app/compliance/policy/page';
import MinorsProtectionPage from './app/compliance/minors/page';
import GdprErasurePage from './app/gdpr-erasure/page';
import EnvVarsPage from './app/env-vars/page';
import InfraCredentialsPage from './app/infra-credentials/page';
import FeatureFlagsPage from './app/feature-flags/page';
import ImpersonatePage from './app/impersonate/page';
import CaptchaPage from './app/security/captcha/page';

const { Content } = Layout;

function LayoutWrapper() {
	const bootstrap = useBootstrap();
	const { tenantSlug } = useParams();

	return (
		<TenantSlugProvider value={tenantSlug}>
			<Layout className="min-h-screen">
				<Sidebar />
				<Layout>
					<Header />
					<Content className="m-6 p-6 bg-[var(--color-bg-surface)] rounded-lg min-h-[calc(100vh-112px)]">
						<Breadcrumb />
						{bootstrap === 'loading' ? (
							<div className="flex items-center justify-center h-64">
								<Spin indicator={<LoadingOutlined spin />} size="large" />
							</div>
						) : (
							<Outlet />
						)}
					</Content>
				</Layout>
			</Layout>
		</TenantSlugProvider>
	);
}

export default function App() {
	return (
		<ErrorBoundary
			devMode={import.meta.env.DEV}
			title="页面出错了"
			message="发生意外错误，请刷新页面重试。"
			retryLabel="刷新页面"
		>
			<Routes>
				<Route path="/oauth/callback" element={<OAuthCallbackPage />} />
				<Route path="/403" element={<LayoutWrapper />}>
					<Route index element={<ForbiddenPage />} />
				</Route>

				<Route element={<LayoutWrapper />}>{appRoutes()}</Route>

				{/* 未知路径 → 404（此前无匹配路由 = 空白页 + 控制台路由告警；全舰队其余站均有 catch-all） */}
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
		</ErrorBoundary>
	);
}

function appRoutes() {
	return (
		<>
			<Route
				index
				element={
					<PlatformGuard fallback={Forbidden}>
						<DashboardPage />
					</PlatformGuard>
				}
			/>

			{/* 租户管理 — 从 API 风格路径改为短路径 */}
			<Route
				path={ROUTE.TENANTS.slice(1)}
				element={
					<PlatformGuard fallback={Forbidden}>
						<TenantsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="tenants/:id/invitation-config"
				element={
					<PlatformGuard fallback={Forbidden}>
						<InvitationConfigPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="tenants/:id/quota"
				element={
					<PlatformGuard fallback={Forbidden}>
						<QuotaPage />
					</PlatformGuard>
				}
			/>

			{/* 公告 */}
			<Route
				path={ROUTE.ANNOUNCEMENTS.slice(1)}
				element={
					<PlatformGuard fallback={Forbidden}>
						<AnnouncementsPage />
					</PlatformGuard>
				}
			/>

			{/* 状态管理 */}
			<Route
				path="status/incidents"
				element={
					<PlatformGuard fallback={Forbidden}>
						<IncidentsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="status/maintenances"
				element={
					<PlatformGuard fallback={Forbidden}>
						<MaintenancesPage />
					</PlatformGuard>
				}
			/>

			{/* NHI 管理 */}
			<Route
				path="agents"
				element={
					<PlatformGuard fallback={Forbidden}>
						<AgentsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="agents/:id"
				element={
					<PlatformGuard fallback={Forbidden}>
						<AgentDetailPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="robots"
				element={
					<PlatformGuard fallback={Forbidden}>
						<RobotsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="robots/:id"
				element={
					<PlatformGuard fallback={Forbidden}>
						<RobotDetailPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="devices"
				element={
					<PlatformGuard fallback={Forbidden}>
						<DevicesPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="devices/:id"
				element={
					<PlatformGuard fallback={Forbidden}>
						<DeviceDetailPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="policies/nhi"
				element={
					<PlatformGuard fallback={Forbidden}>
						<NhiPolicyPage />
					</PlatformGuard>
				}
			/>

			{/* 平台通知 */}
			<Route
				path={ROUTE.PLATFORM_NOTIFICATIONS.slice(1)}
				element={
					<PlatformGuard fallback={Forbidden}>
						<PlatformNotificationsPage />
					</PlatformGuard>
				}
			/>

			{/* Feature Management */}
			<Route
				path="feature-gates"
				element={
					<PlatformGuard fallback={Forbidden}>
						<FeatureGatesPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="feature-flags"
				element={
					<PlatformGuard fallback={Forbidden}>
						<FeatureFlagsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="gdpr-erasure"
				element={
					<PlatformGuard fallback={Forbidden}>
						<GdprErasurePage />
					</PlatformGuard>
				}
			/>
			<Route
				path="impersonate"
				element={
					<PlatformGuard fallback={Forbidden}>
						<ImpersonatePage />
					</PlatformGuard>
				}
			/>

			{/* 安全 */}
			<Route
				path={ROUTE.SECURITY_CAPTCHA.slice(1)}
				element={
					<PlatformGuard fallback={Forbidden}>
						<CaptchaPage />
					</PlatformGuard>
				}
			/>

			{/* 合规 */}
			<Route
				path="compliance/policy"
				element={
					<PlatformGuard fallback={Forbidden}>
						<CompliancePolicyPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="compliance/minors"
				element={
					<PlatformGuard fallback={Forbidden}>
						<MinorsProtectionPage />
					</PlatformGuard>
				}
			/>

			{/* 系统 */}
			<Route
				path="ops"
				element={
					<PlatformGuard fallback={Forbidden}>
						<OpsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/overview"
				element={
					<PlatformGuard fallback={Forbidden}>
						<SystemOverviewPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/config"
				element={
					<PlatformGuard fallback={Forbidden}>
						<SystemConfigPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/secrets-inventory"
				element={
					<PlatformGuard fallback={Forbidden}>
						<SystemSecretsInventoryPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/rate-limits"
				element={
					<PlatformGuard fallback={Forbidden}>
						<SystemRateLimitsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/schedulers"
				element={
					<PlatformGuard fallback={Forbidden}>
						<SystemSchedulersPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="env-vars"
				element={
					<PlatformGuard fallback={Forbidden}>
						<EnvVarsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="infra-credentials"
				element={
					<PlatformGuard fallback={Forbidden}>
						<InfraCredentialsPage />
					</PlatformGuard>
				}
			/>

			{/* 设置 */}
			<Route
				path={ROUTE.SETTINGS.slice(1)}
				element={
					<PlatformGuard fallback={Forbidden}>
						<SettingsPage />
					</PlatformGuard>
				}
			/>
		</>
	);
}
