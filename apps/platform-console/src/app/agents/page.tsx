'use client';

import React, { useState } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { Button, Space, Tag, Modal, Form, Input, Select, Popconfirm, Skeleton } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { usePageTitle, useTenantSlug } from '@autional-cn/shared';
import { PageHeader, StatusBadge, EmptyState, ErrorState } from '@autional-cn/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
	adminAgents,
	adminAgentsPost,
	adminAgentsByAgentsDelete,
} from '@autional-cn/shared/generated/api';
import { useNavigate } from 'react-router';
import { message } from '@/lib/antd-app';
import { handleApiError } from '@/lib/error-handler';
import { queryKeys } from '@/lib/query-keys';
import { ROUTE } from '@/lib/route-paths';
import { buildNavHref } from '@/lib/nav';

interface AgentRecord {
	id: string;
	name: string;
	description: string;
	workloadSubtype?: string;
	workload_subtype?: string;
	status: string;
	ownerName?: string;
	owner_name?: string;
	rotationDays?: number;
	rotation_days?: number;
	jitTtl?: string;
	jit_ttl?: string;
	createdAt?: string;
	created_at?: string;
}

const SUBTYPE_LABELS: Record<string, string> = {
	agent: 'Agent',
	service_account: 'Service Account',
	automation: 'Automation',
};

const SUBTYPE_COLORS: Record<string, string> = {
	agent: 'blue',
	service_account: 'green',
	automation: 'orange',
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
	active: 'success',
	disabled: 'danger',
	suspended: 'warning',
	provisioning: 'info',
};

function statusVariant(s: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
	return STATUS_VARIANT[s] || 'neutral';
}

function formatDate(iso: string): string {
	if (!iso) return '-';
	return new Date(iso).toLocaleDateString('zh-CN');
}

async function fetchAgents(): Promise<AgentRecord[]> {
	const data = await adminAgents(); // tenant_id 从 JWT claims 读取，不需传参
	if (data?.items) return data.items;
	if (Array.isArray(data)) return data;
	return [];
}

async function createAgent(values: Record<string, unknown>): Promise<AgentRecord> {
	return adminAgentsPost(values as any);
}

async function deleteAgent(id: string): Promise<void> {
	await adminAgentsByAgentsDelete(id);
}

export default function AgentsPage() {
	usePageTitle('AI 智能体');
	const navigate = useNavigate();
	const tenantSlug = useTenantSlug();
	const queryClient = useQueryClient();
	const [modalVisible, setModalVisible] = useState(false);
	const [form] = Form.useForm();

	const {
		data: agents = [],
		isLoading,
		error,
		refetch,
	} = useQuery({
		queryKey: queryKeys.agents.all,
		queryFn: fetchAgents,
		staleTime: 300000,
	});

	const createMut = useMutation({
		mutationFn: createAgent,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents.all }),
	});

	const deleteMut = useMutation({
		mutationFn: deleteAgent,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.agents.all }),
	});

	const handleCreate = async (values: Record<string, unknown>) => {
		try {
			await createMut.mutateAsync(values);
			message.success('Agent 创建成功');
			setModalVisible(false);
			form.resetFields();
		} catch (err) {
			handleApiError(err, '创建失败');
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteMut.mutateAsync(id);
			message.success('删除成功');
		} catch (err) {
			handleApiError(err, '删除失败');
		}
	};

	const columns = [
		{
			title: '名称',
			dataIndex: 'name',
			key: 'name',
			render: (v: string, record: AgentRecord) => (
				<a
					onClick={() => navigate(buildNavHref(ROUTE.AGENT_DETAIL.replace(':id', record.id), tenantSlug))}
					className="font-medium"
				>
					{v}
				</a>
			),
		},
		{
			title: '子类型',
			key: 'subtype',
			render: (_: unknown, r: AgentRecord) => {
				const v = (r.workloadSubtype ?? r.workload_subtype) || '';
				return (
					<Tag color={SUBTYPE_COLORS[v] || 'default'}>{SUBTYPE_LABELS[v] || v || '-'}</Tag>
				);
			},
		},
		{
			title: '状态',
			dataIndex: 'status',
			key: 'status',
			render: (v: string) => <StatusBadge variant={statusVariant(v)}>{v || '-'}</StatusBadge>,
		},
		{
			title: '所有者',
			key: 'owner',
			render: (_: unknown, r: AgentRecord) => (r.ownerName ?? r.owner_name) || '-',
		},
		{
			title: '创建时间',
			key: 'created',
			render: (_: unknown, r: AgentRecord) =>
				formatDate(r.createdAt ?? r.created_at ?? ''),
		},
		{
			title: '操作',
			key: 'action',
			render: (_: unknown, record: AgentRecord) => (
				<Space size="small">
					<Button
						type="link"
						icon={<EditOutlined />}
						onClick={(e) => {
							e.stopPropagation();
							navigate(buildNavHref(ROUTE.AGENT_DETAIL.replace(':id', record.id), tenantSlug));
						}}
					>
						编辑
					</Button>
					<Popconfirm
						title="确认删除该 Agent？"
						description="此操作不可撤销。"
						onConfirm={() => handleDelete(record.id)}
						okText="删除"
						okButtonProps={{ danger: true }}
						cancelText="取消"
					>
						<Button
							type="link"
							danger
							icon={<DeleteOutlined />}
							onClick={(e) => e.stopPropagation()}
						>
							删除
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div className="p-6">
			<div className="mb-6 flex items-center justify-between">
				<PageHeader
					title="AI 智能体"
					subtitle="管理机器身份与工作负载凭证。"
				/>
				<Button
					type="primary"
					icon={<PlusOutlined />}
					onClick={() => {
						form.resetFields();
						setModalVisible(true);
					}}
				>
					新建 Agent
				</Button>
			</div>

			{isLoading && (
				<div className="space-y-3">
					<Skeleton active />
					<Skeleton active />
					<Skeleton active />
				</div>
			)}

			{!isLoading && error && (
				<ErrorState
					title="加载 Agent 列表失败"
					message="请检查网络连接后重试。"
					onRetry={() => refetch()}
				/>
			)}

			{!isLoading && !error && agents.length === 0 && (
				<div className="flex flex-col items-center gap-4">
					<EmptyState title="暂无 Agent" description="创建第一个 AI 智能体以开始使用。" />
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => {
							form.resetFields();
							setModalVisible(true);
						}}
					>
						新建 Agent
					</Button>
				</div>
			)}

			{!isLoading && !error && agents.length > 0 && (
				<DataTable
					rowKey="id"
					columns={columns}
					dataSource={agents}
					pagination={{ pageSize: 10 }}
					onRow={(record) => ({
						onClick: () => navigate(buildNavHref(ROUTE.AGENT_DETAIL.replace(':id', record.id), tenantSlug)),
						style: { cursor: 'pointer' },
					})}
				/>
			)}

			<Modal
				title="新建 Agent"
				open={modalVisible}
				onCancel={() => {
					setModalVisible(false);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				confirmLoading={createMut.isPending}
				destroyOnHidden
			>
				<Form form={form} layout="vertical" onFinish={handleCreate}>
					<Form.Item name="name" label="名称" rules={[{ required: true }]}>
						<Input placeholder="例如：deploy-bot、ci-runner" />
					</Form.Item>
					<Form.Item name="description" label="描述">
						<Input.TextArea rows={3} placeholder="描述该 Agent 的用途" />
					</Form.Item>
					<Form.Item
						name="workload_subtype"
						label="工作负载子类型"
						rules={[{ required: true }]}
						initialValue="agent"
					>
						<Select
							options={[
								{ value: 'agent', label: 'Agent' },
								{ value: 'service_account', label: '服务账号' },
								{ value: 'automation', label: '自动化' },
							]}
						/>
					</Form.Item>
					<Form.Item name="rotation_days" label="轮换周期（天）" initialValue={90}>
						<Input type="number" placeholder="90" />
					</Form.Item>
					<Form.Item name="jit_ttl" label="JIT TTL" initialValue="1h">
						<Input placeholder="1h, 30m, 5m" />
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
