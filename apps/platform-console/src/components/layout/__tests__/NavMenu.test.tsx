import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NavMenu } from '@/components/layout/NavMenu';

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

const renderNav = (path = '/') => {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<NavMenu />
		</MemoryRouter>,
	);
};

describe('NavMenu', () => {
	it('renders the Dashboard menu item', () => {
		renderNav();
		expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
	});

	it('renders the Tenants menu item', () => {
		renderNav();
		expect(screen.getByText('nav.tenants')).toBeInTheDocument();
	});

	it('renders the Announcements menu item', () => {
		renderNav();
		expect(screen.getByText('nav.announcements')).toBeInTheDocument();
	});

	it('renders Status section with incidents and maintenances', () => {
		renderNav();
		expect(screen.getByText('nav.status')).toBeInTheDocument();
	});

	it('renders NHI section with agents, robots, devices, and policy', () => {
		renderNav();
		expect(screen.getByText('nav.nhiSection')).toBeInTheDocument();
	});

	it('renders the Platform Notifications menu item', () => {
		renderNav();
		expect(screen.getByText('nav.platformNotifications')).toBeInTheDocument();
	});

	it('renders Feature Management section', () => {
		renderNav();
		expect(screen.getByText('nav.featureManagement')).toBeInTheDocument();
	});

	it('renders Compliance section', () => {
		renderNav();
		expect(screen.getByText('nav.complianceSection')).toBeInTheDocument();
	});

	it('renders System section', () => {
		renderNav();
		expect(screen.getByText('nav.systemSection')).toBeInTheDocument();
	});

	it('renders the Settings menu item', () => {
		renderNav();
		expect(screen.getByText('nav.settings')).toBeInTheDocument();
	});

});