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

	// PL-39：组段（'/status'、'/policies' 等自身非页面）必须走映射文案，
	// 不能直出原始路由键（英文 "policies"）
	it('maps group segments to labels instead of raw route keys (PL-39)', () => {
		renderWithRouter('/policies/nhi');
		expect(screen.getByText('nav.nhiSection')).toBeInTheDocument();
		expect(screen.queryByText('policies')).not.toBeInTheDocument();
		expect(screen.getByText('nav.nhiPolicy')).toBeInTheDocument();
	});

	// N8：未注册路由的中间段不得给链接（'/policies' 无对应页面，曾是死链）
	it('does not link non-route middle segments (N8 dead-link guard)', () => {
		renderWithRouter('/policies/nhi');
		expect(screen.getByText('nav.nhiSection').closest('a')).toBeNull();
		expect(screen.getByText('nav.dashboard').closest('a')).not.toBeNull();
	});

	// PL-39：详情页 ULID 段显示为 detailLabel（'面包屑.detail' 键），不露出原始 ULID；
	// 其前置的列表路由段是可点的
	it('renders detailLabel for ULID segments on detail pages (PL-39)', () => {
		const ulid = '01JABCDEFG1234567890ABCDE';
		renderWithRouter(`/agents/${ulid}`);
		expect(screen.getByText('breadcrumb.detail')).toBeInTheDocument();
		expect(screen.queryByText(ulid)).not.toBeInTheDocument();
		const agentsLink = screen.getByText('nav.agents').closest('a');
		expect(agentsLink).not.toBeNull();
		expect(agentsLink).toHaveAttribute('href', '/agents');
	});

	// PL-39：'/tenants/:id/quota' 这类动态尾段按当前路径补映射（'资源配额'）；
	// '/tenants/<ULID>' 中间段不可点（无此路由），'/tenants' 段保持可点
	it('labels dynamic subpage tails and keeps navigable segments clickable (PL-39)', () => {
		const ulid = '01JABCDEFG1234567890ABCDE';
		renderWithRouter(`/tenants/${ulid}/quota`);
		expect(screen.getByText('nav.tenantQuota')).toBeInTheDocument();
		expect(screen.queryByText('quota')).not.toBeInTheDocument();
		expect(screen.getByText('breadcrumb.detail').closest('a')).toBeNull();
		const tenantsLink = screen.getByText('nav.tenants').closest('a');
		expect(tenantsLink).not.toBeNull();
		expect(tenantsLink).toHaveAttribute('href', '/tenants');
	});
});
