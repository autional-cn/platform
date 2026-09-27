import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

const mockNavigate = vi.fn();

vi.mock('react-router', async () => {
	const actual = await vi.importActual('react-router');
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

vi.mock('@autional-cn/shared', () => ({
	usePageTitle: vi.fn(),
}));

import ForbiddenPage from '@/app/403/page';

describe('ForbiddenPage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders 403 status', () => {
		render(
			<MemoryRouter>
				<ForbiddenPage />
			</MemoryRouter>,
		);
		expect(screen.getByText('403')).toBeInTheDocument();
	});

	it('has Back to Dashboard button', () => {
		render(
			<MemoryRouter>
				<ForbiddenPage />
			</MemoryRouter>,
		);
		expect(screen.getByRole('button', { name: '返回仪表盘' })).toBeInTheDocument();
	});
});
