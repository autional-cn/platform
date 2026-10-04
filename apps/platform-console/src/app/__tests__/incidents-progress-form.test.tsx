/**
 * PL-22 回归：事件详情抽屉「添加进展」表单跨记录复位。
 *
 * 旧行为：updateForm 无 key，initialValue={drawerIncident.status} 只在字段首次注册时
 * 生效；切换记录后 rc-field-form 已存在的字段值不会被新 initialValue 覆盖，
 * Select 仍显示上一条记录的默认状态。
 * 判据：切换记录后「更新状态」显示新记录的状态，且「进展描述」不残留上一条的草稿。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
	incidentA: {
		id: 'inc-a',
		title: '事件 A',
		description: 'A 描述',
		severity: 'major',
		status: 'investigating',
	},
	incidentB: {
		id: 'inc-b',
		title: '事件 B',
		description: 'B 描述',
		severity: 'minor',
		status: 'resolved',
	},
}));

vi.mock('@/hooks/use-status', () => ({
	useIncidents: () => ({
		data: [mocks.incidentA, mocks.incidentB],
		isLoading: false,
		error: null,
		refetch: vi.fn(),
	}),
	useIncident: (id: string) => ({
		data: id === 'inc-a' ? mocks.incidentA : id === 'inc-b' ? mocks.incidentB : undefined,
		isLoading: false,
	}),
	useCreateIncident: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useUpdateIncident: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useDeleteIncident: () => ({ mutateAsync: vi.fn(), isPending: false }),
	useAddIncidentUpdate: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock('@/lib/antd-app', () => ({
	message: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
	modal: { confirm: vi.fn() },
}));

vi.mock('@/lib/error-handler', () => ({
	handleApiError: vi.fn(),
}));

import IncidentsPage from '@/app/status/incidents/page';

describe('IncidentsPage (PL-22 添加进展表单跨记录复位)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('切换记录：更新状态回落到新记录的状态，进展描述不残留', async () => {
		const user = userEvent.setup();
		render(<IncidentsPage />);

		const detailButtons = await screen.findAllByRole('button', { name: /详情/ });
		await user.click(detailButtons[0]); // 打开事件 A

		const dialog = await screen.findByRole('dialog');
		// A 的「更新状态」默认值 = A 的状态
		expect(within(dialog).getByTitle('调查中')).toBeInTheDocument();

		// 在 A 上输入进展草稿，验证不残留到 B
		await user.type(within(dialog).getByLabelText('进展描述'), 'A 的进展草稿');

		await user.click(detailButtons[1]); // 切到事件 B

		// B 的「更新状态」默认值 = B 的状态（旧实现仍显示 调查中）
		await waitFor(() => {
			expect(within(dialog).getByTitle('已解决')).toBeInTheDocument();
		});
		expect((within(dialog).getByLabelText('进展描述') as HTMLTextAreaElement).value).toBe('');
	}, 20000);
});
