import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

/** PL-77：导航按平台成员状态显隐 —— 判定逻辑本体在 usePlatformMember 测试（经门组件），此处只锁显隐接线。 */
const membershipMock = vi.hoisted(() => ({ state: 'member' as string }));
vi.mock('@/components/auth/usePlatformMember', () => ({
	usePlatformMember: () => membershipMock.state,
}));

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
	beforeEach(() => {
		membershipMock.state = 'member';
	});

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

	it('non-member：全量菜单隐藏（PL-77 —— 非平台成员不得见 11 项菜单）', () => {
		membershipMock.state = 'non-member';
		const { container } = renderNav();
		expect(screen.queryByText('nav.dashboard')).not.toBeInTheDocument();
		expect(screen.queryByText('nav.settings')).not.toBeInTheDocument();
		expect(container).toBeEmptyDOMElement();
	});

	it('unknown（未可判）：同样不渲染 —— 防未裁决时闪出菜单', () => {
		membershipMock.state = 'unknown';
		const { container } = renderNav();
		expect(screen.queryByText('nav.dashboard')).not.toBeInTheDocument();
		expect(container).toBeEmptyDOMElement();
	});

});