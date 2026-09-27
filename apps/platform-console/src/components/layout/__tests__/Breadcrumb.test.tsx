import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Breadcrumb } from '@/components/layout/Breadcrumb';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
		i18n: {
			language: 'zh-CN',
			changeLanguage: vi.fn(),
		},
	}),
	initReactI18next: {
		type: '3rdParty',
		init: () => {},
	},
}));

const renderWithRouter = (path: string) => {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<Breadcrumb />
		</MemoryRouter>,
	);
};

describe('Breadcrumb', () => {
	it('renders dashboard + tenants breadcrumb for /tenants', () => {
		renderWithRouter('/tenants');
		expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
		expect(screen.getByText('nav.tenants')).toBeInTheDocument();
	});

	it('renders breadcrumb items for /system/overview', () => {
		renderWithRouter('/system/overview');
		expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
		expect(screen.getByText('nav.systemOverview')).toBeInTheDocument();
	});

	it('renders breadcrumb items for /agents', () => {
		renderWithRouter('/agents');
		expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
		expect(screen.getByText('nav.agents')).toBeInTheDocument();
	});

	it('renders nothing for root path /', () => {
		const { container } = renderWithRouter('/');
		expect(container.querySelector('.ant-breadcrumb')).not.toBeInTheDocument();
	});

	it('renders nested path breadcrumbs for /status/incidents', () => {
		renderWithRouter('/status/incidents');
		expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
		expect(screen.getByText('nav.incidents')).toBeInTheDocument();
	});
});
