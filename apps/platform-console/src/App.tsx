import { lazy } from 'react';
import { Routes, Route, Outlet, Navigate, useParams, useLocation } from 'react-router';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { AppShell, ErrorBoundary } from '@autional-cn/ui';
import { NavMenu } from './components/layout/NavMenu';
import { HeaderActions } from './components/layout/HeaderActions';
import { Breadcrumb } from './components/layout/Breadcrumb';
import {
	PlatformGuard,
	RequireAuth,
	TenantIndexGuard,
	TenantRootRedirect,
	OAuthCallbackPage,
	useBootstrap,
	useTenantSlug,
	TenantSlugProvider,
	extractSlugFromPath,
} from '@autional-cn/shared';
import { ROUTE } from './lib/route-paths';

/**
 * 角色不满足时的落点：/403 在本站是租户段内路由（/:tenantSlug/403），
 * 必须带上当前 slug —— 裸 /403 会被当成租户 slug '403'。
 */
function ForbiddenRedirect() {
	const tenantSlug = useTenantSlug();
	return (
		<Navigate to={tenantSlug ? `/${tenantSlug}${ROUTE.FORBIDDEN}` : ROUTE.FORBIDDEN} replace />
	);
}

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
import PlatformNotificationsPage from './app/notifications/page';
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

/**
 * 挂载级闸门：/demo/... 交给共享 RequireAuth（含 F-W6 未知 slug 闸门与同域 PKCE）；
 * 首段解析不出 slug 的裸路径（/403、/agents —— 站内注册为业务段的单段路径）
 * 一律本地 404 —— 不进入 RequireAuth，避免其无 slug 分支的 buildLoginUrl
 * 弹跳与 auth 侧回跳构成无限往返（F-W7 只覆盖未注册 slug，未覆盖此类）。
 */
function PlatformMountGate({ children }: { children: React.ReactNode }) {
	if (typeof window === 'undefined') return null;
	if (!extractSlugFromPath(window.location.pathname)) return <NotFoundPage />;
	return <RequireAuth notFound={<NotFoundPage />}>{children}</RequireAuth>;
}

function LayoutWrapper() {
	const bootstrap = useBootstrap();
	const { tenantSlug } = useParams();
	const { t } = useTranslation();
	const { pathname } = useLocation();

	// 外壳（侧栏框架 + sticky 顶栏 + 移动端抽屉 + 内容滚动容器）来自设计系统，
	// 本站只提供内容：品牌、菜单、面包屑、右上角控件。
	return (
		<TenantSlugProvider value={tenantSlug}>
			<AppShell
				brand={<span className="truncate text-lg font-bold">{t('app.brand')}</span>}
				nav={<NavMenu />}
				headerLeft={<Breadcrumb />}
				headerRight={<HeaderActions />}
			>
				{bootstrap === 'loading' ? (
					<div className="flex h-64 items-center justify-center">
						<Spin indicator={<LoadingOutlined spin />} size="large" />
					</div>
				) : (
					// 页面级边界：单页渲染崩溃时保留导航壳（PL-26 伴修——此前由外层
					// 整页边界兜底，崩溃即侧栏顶栏全消失，无路可走）。key=pathname 让
					// 路由切换复位错误态，否则边界持续渲染错误页、切路由也出不来。
					<ErrorBoundary key={pathname} devMode={import.meta.env.DEV}>
						<Outlet />
					</ErrorBoundary>
				)}
			</AppShell>
		</TenantSlugProvider>
	);
}

export default function App() {
	// 文案不再在这里写死：设计系统的 ErrorBoundary 自带中英字典（按 <html lang> 选语言）。
	// 原先写死的三段与字典的中文只差一个词（「发生意外错误」vs「发生了未知错误」）——
	// 同一个组件在四个门户显示不同措辞，正是 §2.1 记的那类漂移。这里只留 devMode。
	return (
		<ErrorBoundary devMode={import.meta.env.DEV}>
			<Routes>
				<Route path="/oauth/callback" element={<OAuthCallbackPage />} />

				{/* 裸根漏斗：有会话直达 /<slug>/，否则整页跳 brand 选品牌（user/security/authenticator 同口径） */}
				<Route path="/" element={<TenantRootRedirect />} />

				<Route
					path="/:tenantSlug"
					element={
						/* 控制台为租户段挂载应用：slug 是 OAuth client 解析与鉴权上下文的唯一来源 */
						<PlatformMountGate>
							<LayoutWrapper />
						</PlatformMountGate>
					}
				>
					{appRoutes()}
				</Route>

				{/* 未知路径 → 404（此前无匹配路由 = 空白页 + 控制台路由告警；全舰队其余站均有 catch-all） */}
				<Route path="*" element={<NotFoundPage />} />
			</Routes>
		</ErrorBoundary>
	);
}

/**
 * path 一律用**字面量**（如 "settings"），不要改写成 ROUTE.X.slice(1) 之类的表达式：
 * ui 仓 check-non-tenant 守卫按字面量推导业务路由首段，表达式对它不可见 ⇒ 名单会被
 * 判成「多出」（NT4）。改路由时同步 non-tenant-segments.ts。
 */
function appRoutes() {
	return (
		<>
			<Route
				index
				element={
					<TenantIndexGuard notFound={<NotFoundPage />}>
						<PlatformGuard fallback={<ForbiddenRedirect />}>
							<DashboardPage />
						</PlatformGuard>
					</TenantIndexGuard>
				}
			/>

			{/* 租户管理 — 从 API 风格路径改为短路径 */}
			<Route
				path="tenants"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<TenantsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="tenants/:id/invitation-config"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<InvitationConfigPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="tenants/:id/quota"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<QuotaPage />
					</PlatformGuard>
				}
			/>

			{/* 公告 */}
			<Route
				path="announcements"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<AnnouncementsPage />
					</PlatformGuard>
				}
			/>

			{/* 状态管理 */}
			<Route
				path="status/incidents"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<IncidentsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="status/maintenances"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<MaintenancesPage />
					</PlatformGuard>
				}
			/>

			{/* NHI 管理 */}
			<Route
				path="agents"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<AgentsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="agents/:id"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<AgentDetailPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="robots"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<RobotsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="robots/:id"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<RobotDetailPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="devices"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<DevicesPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="devices/:id"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<DeviceDetailPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="policies/nhi"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<NhiPolicyPage />
					</PlatformGuard>
				}
			/>

			{/* 平台通知 */}
			<Route
				path="notifications"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<PlatformNotificationsPage />
					</PlatformGuard>
				}
			/>

			{/* Feature Management */}
			<Route
				path="feature-gates"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<FeatureGatesPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="feature-flags"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<FeatureFlagsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="gdpr-erasure"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<GdprErasurePage />
					</PlatformGuard>
				}
			/>
			<Route
				path="impersonate"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<ImpersonatePage />
					</PlatformGuard>
				}
			/>

			{/* 合规 */}
			<Route
				path="compliance/policy"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<CompliancePolicyPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="compliance/minors"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<MinorsProtectionPage />
					</PlatformGuard>
				}
			/>

			{/* 系统 */}
			<Route
				path="ops"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<OpsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/overview"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<SystemOverviewPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/config"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<SystemConfigPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/secrets-inventory"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<SystemSecretsInventoryPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/rate-limits"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<SystemRateLimitsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="system/schedulers"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<SystemSchedulersPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="env-vars"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<EnvVarsPage />
					</PlatformGuard>
				}
			/>
			<Route
				path="infra-credentials"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<InfraCredentialsPage />
					</PlatformGuard>
				}
			/>

			{/* 设置 */}
			<Route
				path="settings"
				element={
					<PlatformGuard fallback={<ForbiddenRedirect />}>
						<SettingsPage />
					</PlatformGuard>
				}
			/>

			{/* 403 与站内 404 都在租户段内（/:tenantSlug/403）；裸 /403 由 PlatformMountGate 判为无 slug → 本地 404
			    （字面量 "403" 同时供 check-non-tenant 守卫推导首段名单，勿改表达式） */}
			<Route path="403" element={<ForbiddenPage />} />
			<Route path="*" element={<NotFoundPage />} />
		</>
	);
}
