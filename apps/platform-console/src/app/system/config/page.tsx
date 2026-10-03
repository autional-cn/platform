'use client';

import React, { useState, useMemo } from 'react';
import { DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';
import { Card, Tabs, Tag, Input, Descriptions, Badge, Alert, Tooltip, Spin } from 'antd';
import {
	CloudServerOutlined,
	DatabaseOutlined,
	EnvironmentOutlined,
	ExperimentOutlined,
	SearchOutlined,
} from '@ant-design/icons';
import {
	useServiceList,
	useEnvVars,
	useFeatureFlags,
	useServiceDetail,
	infraComponents,
	getStatusColor,
	getStatusLabel,
	getFeatureLabel,
	type ServiceInfo,
	type InfraComponent,
	type EnvVarItem,
	type FeatureFlagItem,
	type ServiceDetail,
	type ServiceStatus,
	type FeatureStatus,
} from '@/hooks/use-system-config';

const { Search } = Input;

function ServiceExpandableRow({ serviceKey }: { serviceKey: string }) {
	const { data: detail, isLoading } = useServiceDetail(serviceKey);

	if (isLoading || !detail) {
		return (
			<div className="p-4 bg-neutral-50 rounded">
				<Spin size="small" />
			</div>
		);
	}

	return (
		<div className="p-4 bg-neutral-50 rounded">
			<Descriptions title="运行时详情" column={3} size="small" bordered>
				<Descriptions.Item label="版本">{detail.version}</Descriptions.Item>
				<Descriptions.Item label="Go 版本">{detail.goVersion}</Descriptions.Item>
				<Descriptions.Item label="运行时长">{detail.uptime}</Descriptions.Item>
				<Descriptions.Item label="数据库状态">
					<Tag color={getStatusColor(detail.dbStatus)}>{getStatusLabel(detail.dbStatus)}</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="缓存状态">
					<Tag color={getStatusColor(detail.cacheStatus)}>{getStatusLabel(detail.cacheStatus)}</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="消息队列状态">
					<Tag color={getStatusColor(detail.mqStatus)}>{getStatusLabel(detail.mqStatus)}</Tag>
				</Descriptions.Item>
				<Descriptions.Item label="最近部署">{detail.lastDeploy}</Descriptions.Item>
				<Descriptions.Item label="HTTP 端口">
					<code>{serviceKey.split('-')[0]}</code>
				</Descriptions.Item>
				<Descriptions.Item label="gRPC 端口">
					<code>—</code>
				</Descriptions.Item>
			</Descriptions>
		</div>
	);
}

function ServicesTab() {
	const { data: serviceList, isLoading } = useServiceList();

	const columns = [
		{
			title: '服务名称',
			dataIndex: 'name',
			key: 'name',
			width: 200,
			render: (text: string, record: ServiceInfo) => (
				<span className="font-mono text-sm">{text}</span>
			),
		},
		{
			title: 'HTTP 端口',
			dataIndex: 'httpPort',
			key: 'httpPort',
			width: 100,
			render: (v: number) => <code>{v}</code>,
		},
		{
			title: 'gRPC 端口',
			dataIndex: 'grpcPort',
			key: 'grpcPort',
			width: 100,
			render: (v: number) => <code>{v}</code>,
		},
		{
			title: '分类',
			dataIndex: 'categoryLabel',
			key: 'categoryLabel',
			width: 100,
			render: (text: string) => <Tag>{text}</Tag>,
		},
		{
			title: '状态',
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status: ServiceStatus) => (
				<Badge
					status={
						status === 'running'
							? 'success'
							: status === 'degraded'
								? 'warning'
								: status === 'stopped'
									? 'error'
									: 'default'
					}
					text={getStatusLabel(status)}
				/>
			),
		},
		{
			title: '描述',
			dataIndex: 'description',
			key: 'description',
		},
	];

	return (
		<DataTable
			rowKey="key"
			columns={columns}
			dataSource={serviceList ?? []}
			loading={isLoading}
			expandable={{
				expandedRowRender: (record) => <ServiceExpandableRow serviceKey={record.key} />,
				rowExpandable: () => true,
			}}
			pagination={false}
			size="middle"
			locale={{ emptyText: '暂无服务数据' }}
		/>
	);
}

function InfrastructureTab() {
	const columns = [
		{
			title: '组件名称',
			dataIndex: 'name',
			key: 'name',
			width: 140,
			render: (text: string, record: InfraComponent) => {
				const icons: Record<string, React.ReactNode> = {
					postgres: <DatabaseOutlined className="mr-2 text-blue-500" />,
					redis: <DatabaseOutlined className="mr-2 text-red-500" />,
					rabbitmq: <CloudServerOutlined className="mr-2 text-orange-500" />,
					mongodb: <DatabaseOutlined className="mr-2 text-green-500" />,
					minio: <CloudServerOutlined className="mr-2 text-cyan-500" />,
				};
				return (
					<span>
						{icons[record.key]}
						{text}
					</span>
				);
			},
		},
		{
			title: '类型',
			dataIndex: 'typeLabel',
			key: 'typeLabel',
			width: 100,
			render: (text: string) => <Tag color="blue">{text}</Tag>,
		},
		{
			title: 'Host:Port',
			dataIndex: 'hostPort',
			key: 'hostPort',
			width: 240,
			render: (text: string) => <code className="text-xs">{text}</code>,
		},
		{
			title: '凭证位置',
			dataIndex: 'credentialLocation',
			key: 'credentialLocation',
			width: 240,
			render: (text: string) => (
				<Tooltip title={text}>
					<code className="text-xs">{text}</code>
				</Tooltip>
			),
		},
		{
			title: '状态',
			dataIndex: 'status',
			key: 'status',
			width: 100,
			render: (status: ServiceStatus) => (
				<Badge
					status={
						status === 'running'
							? 'success'
							: status === 'degraded'
								? 'warning'
								: status === 'stopped'
									? 'error'
									: 'default'
					}
					text={getStatusLabel(status)}
				/>
			),
		},
		{
			title: '说明',
			dataIndex: 'description',
			key: 'description',
		},
	];

	return (
		<DataTable
			rowKey="key"
			columns={columns}
			dataSource={infraComponents}
			pagination={false}
			size="middle"
			locale={{ emptyText: '暂无基础设施数据' }}
		/>
	);
}

function EnvironmentVariablesTab() {
	const [searchText, setSearchText] = useState('');
	const { data: envVarList, isLoading } = useEnvVars();

	const filtered = useMemo(() => {
		if (!envVarList) return [];
		if (!searchText.trim()) return envVarList;
		const lower = searchText.toLowerCase();
		return envVarList.filter(
			(item) =>
				item.name.toLowerCase().includes(lower) ||
				item.description.toLowerCase().includes(lower) ||
				item.category.toLowerCase().includes(lower),
		);
	}, [searchText, envVarList]);

	const columns = [
		{
			title: '变量名',
			dataIndex: 'name',
			key: 'name',
			width: 240,
			render: (text: string) => <code className="text-xs">{text}</code>,
		},
		{
			title: '当前值',
			dataIndex: 'value',
			key: 'value',
			width: 300,
			render: (text: string, record: EnvVarItem) =>
				record.masked ? (
					<Tag color="orange" className="font-mono">
						••••••••
					</Tag>
				) : (
					<code className="text-xs">{text}</code>
				),
		},
		{
			title: '分类',
			dataIndex: 'category',
			key: 'category',
			width: 100,
			render: (text: string) => <Tag>{text}</Tag>,
		},
		{
			title: '描述',
			dataIndex: 'description',
			key: 'description',
		},
		{
			title: '敏感',
			dataIndex: 'masked',
			key: 'masked',
			width: 80,
			render: (masked: boolean) =>
				masked ? <Tag color="red">敏感</Tag> : <Tag color="green">公开</Tag>,
		},
	];

	return (
		<div>
			<div className="mb-4">
				<Search
					placeholder="搜索环境变量名称、描述或分类..."
					allowClear
					onChange={(e) => setSearchText(e.target.value)}
					value={searchText}
					prefix={<SearchOutlined />}
					style={{ maxWidth: 480 }}
				/>
			</div>
			<DataTable
				rowKey="key"
				columns={columns}
				dataSource={filtered}
				loading={isLoading}
				pagination={{
					pageSize: 20,
					showSizeChanger: true,
					showTotal: (total) => `共 ${total} 个变量`,
				}}
				size="middle"
				locale={{ emptyText: '未找到匹配的环境变量' }}
			/>
		</div>
	);
}

function FeatureFlagsTab() {
	const { data: flags, isLoading: flagsLoading } = useFeatureFlags();
	const { data: serviceList, isLoading: svcLoading } = useServiceList();

	const isLoading = flagsLoading || svcLoading;

	const columns = useMemo(() => {
		if (!serviceList) return [];
		const serviceKeys = serviceList.map((s) => s.key);
		const serviceNames = serviceList.map((s) => s.name);

		return [
			{
				title: '功能特性',
				dataIndex: 'name',
				key: 'name',
				width: 180,
				fixed: 'left' as const,
				render: (text: string, record: FeatureFlagItem) => (
					<div>
						<div className="font-medium">{text}</div>
						<div className="text-xs text-neutral-500">{record.description}</div>
					</div>
				),
			},
			...serviceKeys.map((sk, idx) => ({
				title: (
					<Tooltip title={sk}>
						<span className="text-xs">{serviceNames[idx].replace('-service', '')}</span>
					</Tooltip>
				),
				dataIndex: ['services', sk],
				key: sk,
				width: 72,
				align: 'center' as const,
				render: (status: FeatureStatus) => {
					const label = getFeatureLabel(status);
					const color =
						status === 'enabled'
							? 'var(--color-success)'
							: status === 'disabled'
								? 'var(--color-text-disabled)'
								: undefined;
					return (
						<span
							style={{ color, fontSize: 16 }}
							title={status === 'enabled' ? '已启用' : status === 'disabled' ? '未启用' : '不适用'}
						>
							{label}
						</span>
					);
				},
			})),
		];
	}, [serviceList]);

	return (
		<div>
			<Alert
				message="功能标志矩阵列出了各服务中功能的启用状态。此数据仅供查看，不在本页面提供启停操作。"
				type="info"
				showIcon
				className="mb-4"
			/>
			<DataTable
				rowKey="key"
				columns={columns}
				dataSource={flags ?? []}
				loading={isLoading}
				pagination={false}
				size="small"
				scroll={{ x: 'max-content' }}
				locale={{ emptyText: '暂无功能标志数据' }}
			/>
			<div className="mt-3 text-xs text-neutral-500 flex gap-4">
				<span>✅ 已启用</span>
				<span>❌ 未启用</span>
				<span>— 不适用</span>
			</div>
		</div>
	);
}

export default function SystemConfigPage() {
	const tabItems = [
		{
			key: 'services',
			label: (
				<span>
					<CloudServerOutlined />
					服务列表
				</span>
			),
			children: <ServicesTab />,
		},
		{
			key: 'infrastructure',
			label: (
				<span>
					<DatabaseOutlined />
					基础设施
				</span>
			),
			children: <InfrastructureTab />,
		},
		{
			key: 'env-vars',
			label: (
				<span>
					<EnvironmentOutlined />
					环境变量
				</span>
			),
			children: <EnvironmentVariablesTab />,
		},
		{
			key: 'feature-flags',
			label: (
				<span>
					<ExperimentOutlined />
					功能标志
				</span>
			),
			children: <FeatureFlagsTab />,
		},
	];

	return (
		<div>
			<ConsolePageHeader
				title="系统配置"
				actions={
					<>
						<Tag color="red" className="text-xs">
							仅超级管理员可访问
						</Tag>
					</>
				}
			/>
			<Card>
				<Tabs defaultActiveKey="services" items={tabItems} />
			</Card>
		</div>
	);
}
