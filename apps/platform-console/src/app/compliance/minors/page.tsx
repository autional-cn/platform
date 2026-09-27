'use client';

import React, { useState, useEffect } from 'react';
import {
	Card,
	Form,
	InputNumber,
	Switch,
	Button,
	message,
	Spin,
	TimePicker,
	Space,
	Statistic,
	Row,
	Col,
	Tabs,
	Table,
	Tag,
} from 'antd';
import {
	SafetyCertificateOutlined,
	SaveOutlined,
	ReloadOutlined,
	UserOutlined,
	AuditOutlined,
} from '@ant-design/icons';
import { handleApiError } from '@/lib/error-handler';
import { apiClient, extractList, extractItem } from '@autional-cn/shared';
import {
	adminTenantsMinorsProtectionByTenants,
	adminTenantsMinorsProtectionByTenantsPut,
	adminUsers,
} from '@autional-cn/shared/generated/api';
import { PageHeader, SectionCard } from '@autional-cn/ui';
import dayjs from 'dayjs';

const IDENTITY_API = '/admin';

interface MinorsProtectionConfig {
	tenant_id: string;
	daily_usage_limit_min: number;
	night_mode_start: string;
	night_mode_end: string;
	night_mode_enabled: boolean;
	monthly_spend_limit: number;
	live_stream_blocked_under_16: boolean;
	content_filter_enabled: boolean;
	child_default_max_privacy: boolean;
	minor_data_retention_days: number;
}

interface MinorUser {
	id: string;
	tenant_id: string;
	email: string;
	phone: string;
	username: string;
	status: string;
	is_minor: boolean;
	age_group: string;
	birth_date: string;
	pending_parental_consent: boolean;
	created_at: string;
}

interface ConsentRecord {
	id: string;
	user_id: string;
	parent_email: string;
	parent_phone: string;
	status: string;
	verified: boolean;
	method: string;
	recorded_at: string;
	verified_at?: string;
}

const AGE_GROUP_LABELS: Record<string, string> = {
	'under-14': '14岁以下',
	'14-16': '14-16岁',
	'16-18': '16-18岁',
	adult: '成人',
};

const STATUS_COLORS: Record<string, string> = {
	pending: 'orange',
	verified: 'green',
	expired: 'default',
	denied: 'red',
};

export default function MinorsProtectionPage() {
	const [config, setConfig] = useState<MinorsProtectionConfig | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [users, setUsers] = useState<MinorUser[]>([]);
	const [usersLoading, setUsersLoading] = useState(false);
	const [userTotal, setUserTotal] = useState(0);
	const [consents, setConsents] = useState<ConsentRecord[]>([]);
	const [consentsLoading, setConsentsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState('config');
	const [form] = Form.useForm();
	const tenantId = 'self';

	useEffect(() => {
		loadConfig();
	}, []);

	const loadConfig = async () => {
		try {
			const res = await adminTenantsMinorsProtectionByTenants(tenantId);
			setConfig(res as MinorsProtectionConfig);
			const d = res as MinorsProtectionConfig;
			form.setFieldsValue({
				daily_usage_limit_min: d.daily_usage_limit_min,
				monthly_spend_limit: d.monthly_spend_limit,
				night_mode_enabled: d.night_mode_enabled,
				night_mode_start: d.night_mode_start
					? dayjs(d.night_mode_start, 'HH:mm')
					: dayjs('22:00', 'HH:mm'),
				night_mode_end: d.night_mode_end
					? dayjs(d.night_mode_end, 'HH:mm')
					: dayjs('06:00', 'HH:mm'),
				live_stream_blocked_under_16: d.live_stream_blocked_under_16,
				content_filter_enabled: d.content_filter_enabled,
				child_default_max_privacy: d.child_default_max_privacy,
				minor_data_retention_days: d.minor_data_retention_days,
			});
		} catch {
			// config may not exist yet, will be auto-created on first write
		} finally {
			setLoading(false);
		}
	};

	const loadUsers = async () => {
		setUsersLoading(true);
		try {
			const data = await adminUsers({ is_minor: 'true', page_size: 100 } as any);
			setUsers(extractList(data));
			setUserTotal(extractItem<{ total?: number }>(data)?.total || 0);
		} catch (err) {
			handleApiError(err, '加载未成年用户列表失败');
		} finally {
			setUsersLoading(false);
		}
	};

	const loadConsents = async () => {
		setConsentsLoading(true);
		try {
			const res = await apiClient.get(`${IDENTITY_API}/consents`, { params: { page_size: 100 } }); // @generated-api-exempt — no generated endpoint
			setConsents(extractList(res.data));
		} catch {
			// consent API may be separate
		} finally {
			setConsentsLoading(false);
		}
	};

	const handleTabChange = (key: string) => {
		setActiveTab(key);
		if (key === 'users' && users.length === 0) loadUsers();
		if (key === 'consents' && consents.length === 0) loadConsents();
	};

	const handleSave = async () => {
		try {
			const values = await form.validateFields();
			setSaving(true);
			const payload: Record<string, unknown> = {};
			payload.daily_usage_limit_min = values.daily_usage_limit_min;
			payload.monthly_spend_limit = values.monthly_spend_limit;
			payload.night_mode_enabled = values.night_mode_enabled;
			payload.live_stream_blocked_under_16 = values.live_stream_blocked_under_16;
			payload.content_filter_enabled = values.content_filter_enabled;
			payload.child_default_max_privacy = values.child_default_max_privacy;
			payload.minor_data_retention_days = values.minor_data_retention_days;
			if (values.night_mode_start)
				payload.night_mode_start = values.night_mode_start.format('HH:mm');
			if (values.night_mode_end) payload.night_mode_end = values.night_mode_end.format('HH:mm');
			await adminTenantsMinorsProtectionByTenantsPut(tenantId, payload as any);
			message.success('未成年人保护配置已更新');
			loadConfig();
		} catch (err) {
			handleApiError(err, '保存配置失败');
		} finally {
			setSaving(false);
		}
	};

	const userColumns = [
		{ title: '用户ID', dataIndex: 'id', key: 'id', width: 200, ellipsis: true },
		{ title: '邮箱', dataIndex: 'email', key: 'email' },
		{ title: '手机', dataIndex: 'phone', key: 'phone' },
		{
			title: '年龄组',
			key: 'age_group',
			render: (_: unknown, r: any) => {
				const v = (r.ageGroup as string) ?? (r.age_group as string) ?? '';
				return (
					<Tag color={v === 'under-14' ? 'red' : v === '14-16' ? 'orange' : 'blue'}>
						{AGE_GROUP_LABELS[v] || v}
					</Tag>
				);
			},
		},
		{
			title: '家长同意',
			key: 'pending_parental_consent',
			render: (_: unknown, r: any) => {
				const v = (r.pendingParentalConsent as boolean) ?? (r.pending_parental_consent as boolean);
				return v ? <Tag color="orange">待验证</Tag> : <Tag color="green">已通过</Tag>;
			},
		},
		{ title: '状态', dataIndex: 'status', key: 'status' },
		{
			title: '注册时间',
			key: 'created_at',
			width: 180,
			render: (_: unknown, r: any) =>
				(r.createdAt as string) ?? (r.created_at as string) ?? '-',
		},
	];

	if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

	return (
		<div style={{ padding: 24 }}>
			<PageHeader title="未成年人保护" subtitle="配置防沉迷策略、查看未成年用户、管理家长同意" />

			<Row gutter={16} style={{ marginBottom: 24 }}>
				<Col span={8}>
					<Card>
						<Statistic title="未成年用户数" value={userTotal} prefix={<UserOutlined />} />
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title="每日时长限制"
							value={config?.daily_usage_limit_min || 0}
							suffix="分钟"
						/>
					</Card>
				</Col>
				<Col span={8}>
					<Card>
						<Statistic
							title="宵禁"
							value={
								config?.night_mode_enabled
									? `${config.night_mode_start}-${config.night_mode_end}`
									: '关闭'
							}
							prefix={<SafetyCertificateOutlined />}
						/>
					</Card>
				</Col>
			</Row>

			<Tabs
				activeKey={activeTab}
				onChange={handleTabChange}
				items={[
					{
						key: 'config',
						label: '策略配置',
						children: (
							<>
								<SectionCard title="防沉迷与宵禁">
									<Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
										<Form.Item
											name="daily_usage_limit_min"
											label="每日使用时长上限 (分钟)"
											tooltip="0 表示不限制"
										>
											<InputNumber min={0} max={1440} style={{ width: '100%' }} />
										</Form.Item>
										<Form.Item name="night_mode_enabled" label="启用宵禁" valuePropName="checked">
											<Switch />
										</Form.Item>
										<Form.Item
											shouldUpdate={(prev, cur) =>
												prev.night_mode_enabled !== cur.night_mode_enabled
											}
										>
											{({ getFieldValue }) =>
												getFieldValue('night_mode_enabled') ? (
													<Space>
														<Form.Item name="night_mode_start" label="宵禁开始">
															<TimePicker format="HH:mm" />
														</Form.Item>
														<Form.Item name="night_mode_end" label="宵禁结束">
															<TimePicker format="HH:mm" />
														</Form.Item>
													</Space>
												) : null
											}
										</Form.Item>
									</Form>
								</SectionCard>

								<div style={{ marginTop: 16 }}>
									<SectionCard title="消费与功能限制">
										<Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
											<Form.Item
												name="monthly_spend_limit"
												label="每月消费上限 (分)"
												tooltip="0 表示不限制"
											>
												<InputNumber min={0} style={{ width: '100%' }} />
											</Form.Item>
											<Form.Item
												name="live_stream_blocked_under_16"
												label="禁止16岁以下直播"
												valuePropName="checked"
											>
												<Switch />
											</Form.Item>
											<Form.Item
												name="content_filter_enabled"
												label="启用内容过滤"
												valuePropName="checked"
											>
												<Switch />
											</Form.Item>
										</Form>
									</SectionCard>
								</div>

								<div style={{ marginTop: 16 }}>
									<SectionCard title="数据隐私">
										<Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
											<Form.Item
												name="child_default_max_privacy"
												label="未成年人默认最高隐私设置"
												valuePropName="checked"
											>
												<Switch />
											</Form.Item>
											<Form.Item name="minor_data_retention_days" label="未成年人数据保留天数">
												<InputNumber min={30} max={3650} style={{ width: '100%' }} />
											</Form.Item>
										</Form>
									</SectionCard>
								</div>

								<div style={{ marginTop: 24, textAlign: 'right' }}>
									<Button onClick={loadConfig} icon={<ReloadOutlined />} style={{ marginRight: 8 }}>
										重置
									</Button>
									<Button
										type="primary"
										onClick={handleSave}
										loading={saving}
										icon={<SaveOutlined />}
									>
										保存配置
									</Button>
								</div>
							</>
						),
					},
					{
						key: 'users',
						label: `未成年用户 (${userTotal})`,
						children: (
							<Table
								columns={userColumns}
								dataSource={users}
								rowKey="id"
								loading={usersLoading}
								pagination={{
									pageSize: 20,
									total: userTotal,
									showSizeChanger: true,
									showTotal: (t) => `共 ${t} 人`,
								}}
								scroll={{ x: 800 }}
							/>
						),
					},
					{
						key: 'consents',
						label: '家长同意管理',
						children: (
							<Table
								columns={[
									{
										title: '用户ID',
										key: 'user_id',
										width: 200,
										ellipsis: true,
										render: (_: unknown, r: any) =>
											(r.userId as string) ?? (r.user_id as string) ?? '-',
									},
									{
										title: '家长邮箱',
										key: 'parent_email',
										render: (_: unknown, r: any) =>
											(r.parentEmail as string) ?? (r.parent_email as string) ?? '-',
									},
									{ title: '验证方式', dataIndex: 'method', key: 'method' },
									{
										title: '状态',
										dataIndex: 'status',
										key: 'status',
										render: (v: string) => <Tag color={STATUS_COLORS[v]}>{v}</Tag>,
									},
									{
										title: '已验证',
										dataIndex: 'verified',
										key: 'verified',
										render: (v: boolean) => (v ? <Tag color="green">是</Tag> : <Tag>否</Tag>),
									},
									{ title: '记录时间', dataIndex: 'recorded_at', key: 'recorded_at', width: 180 },
								]}
								dataSource={consents}
								rowKey="id"
								loading={consentsLoading}
								pagination={{ pageSize: 20 }}
							/>
						),
					},
				]}
			/>
		</div>
	);
}
