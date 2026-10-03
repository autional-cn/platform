import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@autional-cn/shared', () => ({
	usePageTitle: vi.fn(),
	apiClient: {
		post: vi.fn(),
	},
}));

vi.mock('@autional-cn/ui', () => ({
	ConsolePageHeader: ({ title, description }: { title: string; description?: string }) => (
		<div data-testid="page-header">
			<h3>{title}</h3>
			{description && <p>{description}</p>}
		</div>
	),
	SectionCard: ({
		title,
		children,
	}: {
		title?: string;
		children: React.ReactNode;
		padding?: string;
	}) => (
		<div data-testid="section-card">
			{title && <h4>{title}</h4>}
			{children}
		</div>
	),
}));

vi.mock('@tanstack/react-query', () => ({
	useMutation: () => ({
		mutate: vi.fn(),
		isPending: false,
		isError: false,
		isSuccess: false,
		error: null,
		data: undefined,
		reset: vi.fn(),
	}),
}));

vi.mock('@/lib/antd-app', () => ({
	message: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock('@/lib/error-handler', () => ({
	handleApiError: vi.fn(),
}));

import ImpersonatePage from '@/app/impersonate/page';

describe('ImpersonatePage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders warning alert with audit message', () => {
		render(<ImpersonatePage />);
		expect(screen.getByText(/模拟用户操作将被完整审计/)).toBeInTheDocument();
	});

	it('renders user ID input field', () => {
		render(<ImpersonatePage />);
		expect(screen.getByLabelText('目标用户 ID')).toBeInTheDocument();
	});

	it('renders reason textarea', () => {
		render(<ImpersonatePage />);
		expect(screen.getByLabelText('模拟原因')).toBeInTheDocument();
	});

	it('renders confirmation checkbox and submit is disabled until checked', () => {
		render(<ImpersonatePage />);
		expect(screen.getByText('我确认此操作将产生审计记录')).toBeInTheDocument();
		const submitButton = screen.getByRole('button', { name: /开始模拟/ });
		expect(submitButton).toBeDisabled();
	});

	it('renders submit button', () => {
		render(<ImpersonatePage />);
		expect(screen.getByRole('button', { name: /开始模拟/ })).toBeInTheDocument();
	});
});
