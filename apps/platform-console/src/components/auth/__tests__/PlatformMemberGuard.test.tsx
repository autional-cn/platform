import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

/** PL-77 回归锁：平台成员门（token 租户 claim 静态腿 + 平台租户角色行数据腿）+
 *  tri-state（未可判不裁决）+ 两个竞态锁（上下文收敛前不误判）——详见 usePlatformMember 头注释。 */

const mocks = vi.hoisted(() => ({
	authState: {
		currentTenantId: null as string | null,
		tenants: [] as Array<{ id: string; name: string; role: string }>,
	},
	queryState: {
		isFetched: false,
		data: undefined as undefined | Array<{ id: string; name: string; role: string }>,
	},
	token: null as string | null,
}));

vi.mock('@autional-cn/shared', () => ({
	PLATFORM_TENANT_ID: '01KSQCBNVMS6SX64PJS937CE33',
	AuthService: { getAccessToken: () => mocks.token },
	useAuthStore: (selector: (s: typeof mocks.authState) => unknown) => selector(mocks.authState),
	useTenantsQuery: () => mocks.queryState,
	PlatformGuard: ({ children }: { children: ReactNode }) => (
		<div data-testid="platform-guard">{children}</div>
	),
}));

import { PlatformMemberGuard } from '@/components/auth/PlatformMemberGuard';

const PLATFORM_ID = '01KSQCBNVMS6SX64PJS937CE33';
const ACME_ID = '01ACME00000000000000000000';

/** 造可解 JWT（头.载荷.签名三段即可 —— 守卫只 decode 载荷） */
function makeToken(payload: Record<string, unknown>): string {
	return `h.${btoa(JSON.stringify(payload))}.s`;
}

function renderGuard() {
	return render(
		<PlatformMemberGuard fallback={<div>denied</div>}>
			<div>shell</div>
		</PlatformMemberGuard>,
	);
}

function reset(overrides?: {
	token?: string | null;
	currentTenantId?: string | null;
	tenants?: Array<{ id: string; name: string; role: string }>;
	isFetched?: boolean;
	data?: Array<{ id: string; name: string; role: string }>;
}) {
	mocks.token = overrides?.token !== undefined ? overrides.token : null;
	mocks.authState.currentTenantId = overrides?.currentTenantId ?? null;
	mocks.authState.tenants = overrides?.tenants ?? [];
	mocks.queryState.isFetched = overrides?.isFetched ?? false;
	mocks.queryState.data = overrides?.data;
}

const platformRow = { id: PLATFORM_ID, name: 'platform', role: 'super_admin' };

describe('PlatformMemberGuard', () => {
	it('放行：token 租户 claim=平台 + 查询数据含平台租户行', () => {
		reset({
			token: makeToken({ tenant_id: PLATFORM_ID }),
			currentTenantId: PLATFORM_ID,
			isFetched: true,
			data: [platformRow],
		});
		renderGuard();
		expect(screen.getByText('shell')).toBeInTheDocument();
		expect(screen.getByTestId('platform-guard')).toBeInTheDocument();
		expect(screen.queryByText('denied')).not.toBeInTheDocument();
	});

	it('放行：claim=平台（tenantId 驼峰兜底）+ 持久化 store 行 + 查询在飞 —— 不等结算、不闪 403', () => {
		reset({
			token: makeToken({ tenantId: PLATFORM_ID }),
			currentTenantId: PLATFORM_ID,
			tenants: [platformRow],
			isFetched: false,
		});
		renderGuard();
		expect(screen.getByText('shell')).toBeInTheDocument();
	});

	it('放行（竞态锁）：claim=平台 + 持久化行 + 会话上下文仍是旧租户（slug 未收敛）—— 不误判 403', () => {
		reset({
			token: makeToken({ tenant_id: PLATFORM_ID }),
			currentTenantId: ACME_ID,
			tenants: [platformRow],
			isFetched: false,
		});
		renderGuard();
		expect(screen.getByText('shell')).toBeInTheDocument();
		expect(screen.queryByText('denied')).not.toBeInTheDocument();
	});

	it('拒绝：claim 非平台（P4 实证：租户级 super_admin）—— 即使 store 残留平台行 + 查询含平台行', () => {
		reset({
			token: makeToken({ tenant_id: ACME_ID }),
			currentTenantId: PLATFORM_ID,
			tenants: [platformRow],
			isFetched: true,
			data: [platformRow],
		});
		renderGuard();
		expect(screen.getByText('denied')).toBeInTheDocument();
		expect(screen.queryByText('shell')).not.toBeInTheDocument();
	});

	it('拒绝：claim=平台 + 上下文=平台 + 结算后无平台行（经平台 client 登录的非成员）', () => {
		reset({
			token: makeToken({ tenant_id: PLATFORM_ID }),
			currentTenantId: PLATFORM_ID,
			isFetched: true,
			data: [],
		});
		renderGuard();
		expect(screen.getByText('denied')).toBeInTheDocument();
		expect(screen.queryByText('shell')).not.toBeInTheDocument();
	});

	it('拒绝（fail-closed）：claim=平台 + 上下文=平台 + 查询结算失败（无数据、store 空）', () => {
		reset({
			token: makeToken({ tenant_id: PLATFORM_ID }),
			currentTenantId: PLATFORM_ID,
			isFetched: true,
			data: undefined,
		});
		renderGuard();
		expect(screen.getByText('denied')).toBeInTheDocument();
		expect(screen.queryByText('shell')).not.toBeInTheDocument();
	});

	it('拒绝（fail-closed）：claim 不可解（非 JWT 形态）', () => {
		reset({ token: 'opaque-token', currentTenantId: PLATFORM_ID, isFetched: true, data: [platformRow] });
		renderGuard();
		expect(screen.getByText('denied')).toBeInTheDocument();
		expect(screen.queryByText('shell')).not.toBeInTheDocument();
	});

	it('不裁决：claim=平台 + 上下文=平台 + 查询在飞 + store 空 —— null 输出（不闪 403）', () => {
		reset({
			token: makeToken({ tenant_id: PLATFORM_ID }),
			currentTenantId: PLATFORM_ID,
			isFetched: false,
			data: undefined,
		});
		const { container } = renderGuard();
		expect(container).toBeEmptyDOMElement();
	});

	it('不裁决（结算合取锁）：claim=平台但上下文仍是旧租户（slug 未收敛）—— 即使已结算无行也不判非成员', () => {
		reset({
			token: makeToken({ tenant_id: PLATFORM_ID }),
			currentTenantId: ACME_ID,
			isFetched: true,
			data: [],
		});
		const { container } = renderGuard();
		expect(container).toBeEmptyDOMElement();
		expect(screen.queryByText('denied')).not.toBeInTheDocument();
	});

	it('放行（持久化行语义）：claim=平台 + 结算空但 store 有平台行（本人上次会话写入）', () => {
		reset({
			token: makeToken({ tenant_id: PLATFORM_ID }),
			currentTenantId: PLATFORM_ID,
			tenants: [platformRow],
			isFetched: true,
			data: [],
		});
		renderGuard();
		expect(screen.getByText('shell')).toBeInTheDocument();
	});
});
