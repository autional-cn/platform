import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Sidebar } from '@/components/layout/Sidebar';

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

const renderSidebar = (path = '/') => {
	return render(
		<MemoryRouter initialEntries={[path]}>
			<Sidebar />
		</MemoryRouter>,
	);
};

describe('Sidebar', () => {
	it('renders the Dashboard menu item', () => {
		renderSidebar();
		expect(screen.getByText('nav.dashboard')).toBeInTheDocument();
	});

	it('renders the Tenants menu item', () => {
		renderSidebar();
		expect(screen.getByText('nav.tenants')).toBeInTheDocument();
	});

	it('renders the Announcements menu item', () => {
		renderSidebar();
		expect(screen.getByText('nav.announcements')).toBeInTheDocument();
	});

	it('renders Status section with incidents and maintenances', () => {
		renderSidebar();
		expect(screen.getByText('nav.status')).toBeInTheDocument();
	});

	it('renders NHI section with agents, robots, devices, and policy', () => {
		renderSidebar();
		expect(screen.getByText('nav.nhiSection')).toBeInTheDocument();
	});

	it('renders the Platform Notifications menu item', () => {
		renderSidebar();
		expect(screen.getByText('nav.platformNotifications')).toBeInTheDocument();
	});

	it('renders Feature Management section', () => {
		renderSidebar();
		expect(screen.getByText('nav.featureManagement')).toBeInTheDocument();
	});

	it('renders Compliance section', () => {
		renderSidebar();
		expect(screen.getByText('nav.complianceSection')).toBeInTheDocument();
	});

	it('renders System section', () => {
		renderSidebar();
		expect(screen.getByText('nav.systemSection')).toBeInTheDocument();
	});

	it('renders the Settings menu item', () => {
		renderSidebar();
		expect(screen.getByText('nav.settings')).toBeInTheDocument();
	});

	it('shows the full brand name when not collapsed', () => {
		renderSidebar();
		expect(screen.getByText('app.brand')).toBeInTheDocument();
	});

	it('does not show collapsed letter P when expanded', () => {
		renderSidebar();
		expect(screen.queryByText('P')).not.toBeInTheDocument();
	});
});
