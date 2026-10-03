'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Form, InputNumber, Select, Button, Card, Spin } from 'antd';
import { message } from '@/lib/antd-app';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { extractItem, usePageTitle } from '@autional-cn/shared';
import { getInvitationConfig, updateInvitationConfig } from '@/lib/api.generated';
import { handleApiError } from '@/lib/error-handler';
import { PageError } from '@autional-cn/ui/antd';

interface InvitationConfigData {
	inviteExpiryDays?: number;
	defaultInviteRole?: string;
	dailyInviteLimit?: number;
}

export default function InvitationConfigPage() {
	usePageTitle('邀请配置');
	const { id: tenantId } = useParams<{ id: string }>();
	const [form] = Form.useForm<InvitationConfigData>();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [data, setData] = useState<InvitationConfigData>({
		inviteExpiryDays: 7,
		defaultInviteRole: 'member',
		dailyInviteLimit: 50,
	});

	const fetchConfig = async () => {
		if (!tenantId) return;
		setLoading(true);
		setError(null);
		try {
			const res = await getInvitationConfig(tenantId);
			const item = extractItem<InvitationConfigData>(res);
			if (item) {
				setData(item);
				form.setFieldsValue(item);
			}
		} catch (err) {
			setError(err instanceof Error ? err : new Error(String(err)));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchConfig();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId]);

	const handleSave = async (values: InvitationConfigData) => {
		if (!tenantId) return;
		try {
			await updateInvitationConfig(tenantId, {
				inviteExpiryDays: values.inviteExpiryDays,
				defaultInviteRole: values.defaultInviteRole,
			});
			message.success('邀请配置保存成功');
		} catch (err) {
			handleApiError(err, '保存失败');
		}
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-semibold">邀请配置</h1>
				<Button icon={<ReloadOutlined />} onClick={fetchConfig}>
					刷新
				</Button>
			</div>

			{error && <PageError message="加载邀请配置失败" retry={fetchConfig} className="mb-4" />}

			<Spin spinning={loading}>
				<Card title="邀请设置" className="max-w-2xl">
					<Form form={form} layout="vertical" onFinish={handleSave} initialValues={data}>
						<Form.Item
							name="inviteExpiryDays"
							label="邀请过期天数"
							rules={[{ required: true, message: '请输入邀请过期天数' }]}
						>
							<InputNumber min={1} max={180} style={{ width: '100%' }} placeholder="7" />
						</Form.Item>

						<Form.Item
							name="defaultInviteRole"
							label="默认邀请角色"
							rules={[{ required: true, message: '请选择默认角色' }]}
						>
							<Select placeholder="选择角色">
								<Select.Option value="member">成员 (Member)</Select.Option>
								<Select.Option value="admin">管理员 (Admin)</Select.Option>
							</Select>
						</Form.Item>

						<Form.Item
							name="dailyInviteLimit"
							label="每日邀请上限"
							rules={[{ required: true, message: '请输入每日邀请上限' }]}
						>
							<InputNumber min={1} max={10000} style={{ width: '100%' }} placeholder="50" />
						</Form.Item>

						<Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
							保存配置
						</Button>
					</Form>
				</Card>
			</Spin>
		</div>
	);
}
