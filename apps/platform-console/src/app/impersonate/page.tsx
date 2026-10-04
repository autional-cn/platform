'use client';

import React, { useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Typography, Space } from 'antd';
import { WarningOutlined, CopyOutlined } from '@ant-design/icons';
import { usePageTitle } from '@autional-cn/shared';
import { ConsolePageHeader, Result, SectionCard } from '@autional-cn/ui';
import { adminImpersonatePost } from '@autional-cn/shared/generated/api';
import { useMutation } from '@tanstack/react-query';
import { message } from '@/lib/antd-app';
import { handleApiError } from '@/lib/error-handler';

const { TextArea } = Input;
const { Text } = Typography;

interface ImpersonateRequest {
	user_id: string;
	reason: string;
	confirmed?: boolean;
}

interface ImpersonatePayload {
	accessToken: string;
	user: {
		id: string;
		email: string;
	};
}

export default function ImpersonatePage() {
	usePageTitle('管理员模拟登录');
	const [form] = Form.useForm<ImpersonateRequest>();
	const [impersonateResult, setImpersonateResult] = useState<ImpersonatePayload | null>(null);

	const impersonateMut = useMutation({
		mutationFn: async (values: ImpersonateRequest) => {
			return adminImpersonatePost(values as any) as Promise<ImpersonatePayload>;
		},
		onSuccess: (payload) => {
			setImpersonateResult(payload);
			message.success('模拟登录成功');
		},
		onError: (err) => {
			handleApiError(err, '模拟登录失败');
		},
	});

	const handleSubmit = (values: ImpersonateRequest) => {
		impersonateMut.mutate(values);
	};

	const maskToken = (token: string) => {
		if (token.length <= 20) return '*'.repeat(8);
		return token.slice(0, 10) + '****' + token.slice(-6);
	};

	const confirmed = Form.useWatch('confirmed', form);

	if (impersonateResult) {
		return (
			<div>
				<div className="mb-6">
					<ConsolePageHeader title="管理员模拟登录" description="模拟其他用户登录系统" />
				</div>
				<SectionCard padding="lg">
					<Result
						variant="success"
						surface="tinted"
						title="模拟登录成功"
						description={
							<Space direction="vertical" size="small">
								<Text>
									用户: {impersonateResult.user.email} ({impersonateResult.user.id})
								</Text>
								<Space size="small">
									<Text code>{maskToken(impersonateResult.accessToken)}</Text>
									<Button
										type="text"
										size="small"
										icon={<CopyOutlined />}
										onClick={() => {
											navigator.clipboard.writeText(impersonateResult.accessToken);
											message.success('Token 已复制');
										}}
									/>
								</Space>
							</Space>
						}
						action={[
							<Button
								type="primary"
								key="navigate"
								onClick={() => {
									window.open(
										`${window.location.origin}/admin?impersonate_token=${impersonateResult.accessToken}`,
										'_blank',
									);
								}}
							>
								以用户身份访问管理控制台
							</Button>,
							<Button
								key="reset"
								onClick={() => {
									setImpersonateResult(null);
									form.resetFields();
								}}
							>
								返回
							</Button>,
						]}
					/>
				</SectionCard>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6">
				<ConsolePageHeader title="管理员模拟登录" description="以其他用户身份登录系统进行操作" />
			</div>

			<Alert
				type="warning"
				showIcon
				icon={<WarningOutlined />}
				message="模拟用户操作将被完整审计。请谨慎使用。"
				className="mb-6"
			/>

			<SectionCard title="模拟登录表单" padding="lg">
				<Form form={form} layout="vertical" onFinish={handleSubmit}>
					<Form.Item
						name="user_id"
						label="目标用户 ID"
						rules={[{ required: true, message: '请输入目标用户 ID' }]}
					>
						<Input placeholder="输入用户 ID" />
					</Form.Item>

					<Form.Item
						name="reason"
						label="模拟原因"
						rules={[{ required: true, message: '请输入模拟原因' }]}
					>
						<TextArea rows={3} placeholder="请详细说明模拟该用户的原因" />
					</Form.Item>

					<Form.Item
						name="confirmed"
						valuePropName="checked"
						rules={[
							{
								validator: (_, value) =>
									value ? Promise.resolve() : Promise.reject(new Error('请确认此操作')),
							},
						]}
					>
						<Checkbox>我确认此操作将产生审计记录</Checkbox>
					</Form.Item>

					<Form.Item>
						<Button
							type="primary"
							htmlType="submit"
							loading={impersonateMut.isPending}
							disabled={!confirmed}
							size="large"
						>
							开始模拟
						</Button>
					</Form.Item>
				</Form>
			</SectionCard>
		</div>
	);
}
