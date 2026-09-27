import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@autional-cn/shared', () => ({
	usePageTitle: vi.fn(),
	useBootstrap: () => 'done',
	apiClient: { get: vi.fn(() => Promise.resolve({ data: {} })) },
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

import DashboardPage from '@/app/page';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderPage() {
	return render(
		<QueryClientProvider client={queryClient}>
			<DashboardPage />
		</QueryClientProvider>,
	);
}

describe('DashboardPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		queryClient.clear();
	});

	it('renders the Platform Dashboard title', () => {
		renderPage();
		expect(screen.getByText('平台仪表盘')).toBeInTheDocument();
	});

	it('renders 4 Statistic cards', () => {
		renderPage();
		expect(screen.getByText('租户总数')).toBeInTheDocument();
		expect(screen.getByText('活跃事故')).toBeInTheDocument();
		expect(screen.getByText('健康服务')).toBeInTheDocument();
		expect(screen.getByText('平台通知')).toBeInTheDocument();
	});
});
