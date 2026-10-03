'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Form, InputNumber, Button, Card, Spin, Descriptions, Tag } from 'antd';
import { message } from '@/lib/antd-app';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { extractItem, usePageTitle } from '@autional-cn/shared';
import { getTenantQuota, updateTenantQuota } from '@/lib/api.generated';
import { handleApiError } from '@/lib/error-handler';
import { PageError } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';

interface QuotaData {
	plan?: string;
	usersLimit?: number;
	storageGb?: number;
	activeUsers?: number;
	usedStorageGb?: number;
	apiCallsPerMonth?: number;
	usedApiCalls?: number;
}

export default function QuotaPage() {
	usePageTitle('资源配额');
	const { id: tenantId } = useParams<{ id: string }>();
	const [form] = Form.useForm<QuotaData>();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [data, setData] = useState<QuotaData>({});

	const fetchQuota = async () => {
		if (!tenantId) return;
		setLoading(true);
		setError(null);
		try {
			const res = await getTenantQuota(tenantId);
			const item = extractItem<QuotaData>(res);
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
		fetchQuota();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tenantId]);

	const handleSave = async (values: QuotaData) => {
		if (!tenantId) return;
		try {
			await updateTenantQuota(tenantId, {
				maxUsers: values.usersLimit,
				maxStorage: values.storageGb,
				maxBandwidth: values.apiCallsPerMonth,
				maxApiRequests: values.apiCallsPerMonth,
			});
			message.success('资源配额更新成功');
		} catch (err) {
			handleApiError(err, '保存失败');
		}
	};

	return (
		<div>
			<ConsolePageHeader
				title="资源配额"
				actions={
					<>
						<Button icon={<ReloadOutlined />} onClick={fetchQuota}>
							刷新
						</Button>
					</>
				}
			/>

			{error && <PageError message="加载资源配额失败" retry={fetchQuota} className="mb-4" />}

			<Spin spinning={loading}>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card title="当前用量">
						<Descriptions column={1} bordered size="small">
							<Descriptions.Item label="当前套餐">
								<Tag color="blue">{data.plan || '-'}</Tag>
							</Descriptions.Item>
							<Descriptions.Item label="活跃用户">
								{data.activeUsers ?? '-'} / {data.usersLimit ?? '-'}
							</Descriptions.Item>
							<Descriptions.Item label="已用存储">
								{data.usedStorageGb ?? '-'} / {data.storageGb ?? '-'} GB
							</Descriptions.Item>
							<Descriptions.Item label="API 调用量">
								{data.usedApiCalls ?? '-'} / {data.apiCallsPerMonth ?? '-'}
							</Descriptions.Item>
						</Descriptions>
					</Card>

					<Card title="配额设置">
						<Form form={form} layout="vertical" onFinish={handleSave} initialValues={data}>
							<Form.Item
								name="usersLimit"
								label="最大用户数"
								rules={[{ required: true, message: '请输入最大用户数' }]}
							>
								<InputNumber min={1} max={1000000} style={{ width: '100%' }} placeholder="100" />
							</Form.Item>

							<Form.Item
								name="storageGb"
								label="最大存储 (GB)"
								rules={[{ required: true, message: '请输入最大存储容量' }]}
							>
								<InputNumber
									min={1}
									max={100000}
									precision={1}
									style={{ width: '100%' }}
									placeholder="50"
								/>
							</Form.Item>

							<Form.Item
								name="apiCallsPerMonth"
								label="最大 API 请求数 (次/月)"
								rules={[{ required: true, message: '请输入最大 API 请求数' }]}
							>
								<InputNumber
									min={1}
									max={100000000}
									style={{ width: '100%' }}
									placeholder="10000"
								/>
							</Form.Item>

							<Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
								保存配置
							</Button>
						</Form>
					</Card>
				</div>
			</Spin>
		</div>
	);
}
