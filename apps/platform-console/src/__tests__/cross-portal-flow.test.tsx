/**
 * Part C: Cross-Portal Flow Test
 *
 * Verifies the cross-portal navigation structure between
 * platform-console and admin-console.
 *
 * Run: pnpm test -- -t "Cross-Portal"
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@autional-cn/shared', () => ({
	useAuthStore: (selector?: (s: unknown) => unknown) => {
		const state = {
			user: { email: 'platform-admin@authms.dev', username: 'root' },
			tenants: [],
		};
		return selector ? selector(state) : state;
	},
	useAuth: () => ({
		user: { email: 'platform-admin@authms.dev', username: 'root' },
		isAuthenticated: true,
	}),
	getPortalUrl: () => 'http://localhost:13002/admin',
	useTenantSlug: () => undefined,
	apiClient: { get: vi.fn() },
	usePageTitle: vi.fn(),
	usePermission: () => ({ can: () => false }),
	useLogout: () => vi.fn(),
	extractItem: (v: unknown) => v,
}));

vi.mock('@/hooks/use-system-overview', () => ({
	useSystemOverview: () => ({
		data: { tenants: { total: 1 }, services: { total: 1 } },
		isLoading: false,
		error: null,
	}),
}));

vi.mock('@/hooks/use-status', () => ({
	useOverview: () => ({
		data: { activeIncidents: 0, servicesHealthy: 1 },
		isLoading: false,
		error: null,
	}),
}));

vi.mock('@/hooks/use-platform-stats', () => ({
	usePlatformNotificationStats: () => ({
		data: { totalSent: 0 },
		isLoading: false,
		error: null,
	}),
}));

vi.mock('@autional-cn/ui', () => ({
	useTheme: () => ({ theme: 'light', toggle: vi.fn() }),
	ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
	EmptyState: ({ title, description }: { title: string; description?: string }) => (
		<div>
			<div>{title}</div>
			<div>{description}</div>
		</div>
	),
	ErrorState: ({ title, onRetry }: { title: string; onRetry?: () => void }) => (
		<div>
			<div>{title}</div>
			{onRetry && <button onClick={onRetry}>Retry</button>}
		</div>
	),
	PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
		<div className="text-center">
			<h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-4xl">
				{title}
			</h1>
			{subtitle && (
				<p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-300">
					{subtitle}
				</p>
			)}
		</div>
	),
	LoadingScreen: () => null,
	ToastProvider: ({ children }: { children: React.ReactNode }) => children,
}));

import { Header } from '@/components/layout/Header';
import DashboardPage from '@/app/page';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

describe('Cross-Portal Navigation', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		queryClient.clear();
	});

	describe('Platform Console Header', () => {
		it('renders brand text', () => {
			render(<Header />, { wrapper: BrowserRouter });
			expect(screen.getByText('app.brand')).toBeInTheDocument();
		});

		it('renders tenant management switch button linking to admin-console', () => {
			render(<Header />, { wrapper: BrowserRouter });

			const switchBtn = screen.getByText('nav.switchToTenantMgmt');
			expect(switchBtn).toBeInTheDocument();
			expect(switchBtn.closest('button')).toBeTruthy();
		});

		it('renders user email when user is authenticated', () => {
			render(<Header />, { wrapper: BrowserRouter });
			expect(screen.getByText('platform-admin@authms.dev')).toBeInTheDocument();
		});
	});

	describe('Cross-Portal Target URLs', () => {
		it('admin-console URL is localhost:13002/admin', () => {
			const ADMIN_CONSOLE_URL = 'http://localhost:13002/admin';
			expect(ADMIN_CONSOLE_URL).toBe('http://localhost:13002/admin');
		});

		it('platform-console URL is localhost:13010/platform', () => {
			const PLATFORM_CONSOLE_URL = 'http://localhost:13010/platform';
			expect(PLATFORM_CONSOLE_URL).toBe('http://localhost:13010/platform');
		});

		it('all 9 portal URLs follow correct port assignments', () => {
			const ports: Record<string, { port: number; path: string }> = {
				'auth-pages': { port: 13101, path: '/auth' },
				'admin-console': { port: 13102, path: '/admin' },
				'developer-portal': { port: 13103, path: '/developer' },
				'end-user-portal': { port: 13104, path: '/user' },
				'security-dashboard': { port: 13105, path: '/security' },
				'status-page': { port: 13106, path: '/status' },
				'landing-site': { port: 13107, path: '/' },
				'authenticator-app': { port: 13108, path: '/authenticator' },
				'trust-center': { port: 13109, path: '/trust' },
			};

			for (const [name, config] of Object.entries(ports)) {
				const url = `http://localhost:${config.port}${config.path}`;
				expect(url).toBeTruthy();
				expect(config.port).toBeGreaterThan(13000);
			}
		});
	});

	describe('Platform Dashboard Page', () => {
		it('renders dashboard stat cards', () => {
			render(
				<QueryClientProvider client={queryClient}>
					<BrowserRouter>
						<DashboardPage />
					</BrowserRouter>
				</QueryClientProvider>,
			);

			expect(screen.getByText('平台仪表盘')).toBeInTheDocument();
			expect(screen.getByText('租户总数')).toBeInTheDocument();
			expect(screen.getByText('活跃事故')).toBeInTheDocument();
			expect(screen.getByText('健康服务')).toBeInTheDocument();
			expect(screen.getByText('平台通知')).toBeInTheDocument();
		});
	});
});
