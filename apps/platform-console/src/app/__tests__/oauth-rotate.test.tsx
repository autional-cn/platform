/**
 * PL-63 回归：密钥清单 OAuth 页签提供「轮换密钥」操作。
 *  - 点击先弹确认（旧密钥立即失效 / 新密钥仅显示一次）；
 *  - 确认后调用轮换接口，成功弹窗明文展示新密钥（仅显示一次）。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
	rotateOAuth: vi.fn(),
}));

vi.mock('@/hooks/use-secrets-inventory', () => ({
	useSecretsInventoryOverview: () => ({
		data: {
			totalSecrets: 1,
			activeCount: 1,
			expiredCount: 0,
			revokedCount: 0,
			categoryBreakdown: {
				kv: 0,
				encryptionKeys: 0,
				jwtKeys: 0,
				infrastructure: 0,
				apiKeys: 0,
				oauth: 1,
			},
		},
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
	useSecretsInventoryKV: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
	useSecretsInventoryEncryptionKeys: () => ({
		data: [],
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
	useSecretsInventoryJwtKeys: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
	useSecretsInventoryInfrastructure: () => ({
		data: [],
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
	useSecretsInventoryApiKeys: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
	useSecretsInventoryOAuth: () => ({
		data: [{ provider: 'Google', clientId: 'client-1', status: 'active', lastUsed: '' }],
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
	useRotateOAuthClientSecret: () => ({ mutateAsync: mocks.rotateOAuth, isPending: false }),
}));

vi.mock('@/hooks/use-secrets', () => ({
	useRotateSecret: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useRevokeSecret: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useDeleteSecret: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useSecretVersionValue: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/lib/antd-app', () => ({
	message: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
	modal: { confirm: vi.fn() },
}));

vi.mock('@/lib/error-handler', () => ({
	handleApiError: vi.fn(),
}));

import SystemSecretsInventoryPage from '@/app/system/secrets-inventory/page';

describe('SecretsInventoryPage (PL-63 OAuth 密钥轮换)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.rotateOAuth.mockResolvedValue({
			clientId: 'client-1',
			newSecret: 'new-secret-123',
			rotatedAt: '2026-10-04T12:00:00Z',
		});
	});

	it('OAuth 页签：确认前不轮换，确认后明文展示新密钥（仅显示一次）', async () => {
		const user = userEvent.setup();
		render(<SystemSecretsInventoryPage />);

		await user.click(await screen.findByRole('tab', { name: /OAuth/ }));

		// 图标 span 并入 accessible name（sync轮换密钥），尾部锚定正则匹配文案
		const rotateBtn = await screen.findByRole('button', { name: /轮换密钥$/ });
		await user.click(rotateBtn);

		expect(mocks.rotateOAuth).not.toHaveBeenCalled();
		// 页签顶部提示与 Popconfirm 描述都含「仅显示一次」，此处断言确认弹层里的完整文案
		expect(screen.getByText(/新密钥仅显示一次，请立即保存/)).toBeInTheDocument();

		const confirmBtn = await screen.findByRole('button', { name: '确认轮换' });
		await user.click(confirmBtn);

		await waitFor(() => {
			expect(mocks.rotateOAuth).toHaveBeenCalledWith('client-1');
		});
		expect(await screen.findByDisplayValue('new-secret-123')).toBeInTheDocument();
		expect(screen.getByText(/旧密钥已立即失效/)).toBeInTheDocument();
	}, 20000);
});
