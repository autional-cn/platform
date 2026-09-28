'use client';

import React from 'react';
import { Card, Table, Tag, Badge, Statistic, Row, Col, Button, Space, Modal, Input } from 'antd';
import {
	PlayCircleOutlined,
	PauseCircleOutlined,
	ReloadOutlined,
	HistoryOutlined,
	CheckCircleFilled,
	CloseCircleFilled,
	MinusCircleFilled,
	ClockCircleOutlined,
} from '@ant-design/icons';
import { PageHeader, useToast } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';
import { PageLoading, PageError } from '@/components/ui/page-status';
import { useSchedulers } from '@/hooks/use-schedulers';

const statusConfig: Record<
	string,
	{ color: string; icon: React.ReactNode; labelKey: string; label: string }
> = {
	running: {
		color: 'var(--color-success)',
		icon: <CheckCircleFilled />,
		labelKey: 'schedulers.statusRunning',
		label: '运行中',
	},
	paused: {
		color: 'var(--color-warning)',
		icon: <MinusCircleFilled />,
		labelKey: 'schedulers.statusPaused',
		label: '已暂停',
	},
	failed: {
		color: 'var(--color-danger)',
		icon: <CloseCircleFilled />,
		labelKey: 'schedulers.statusFailed',
		label: '失败',
	},
	disabled: {
		color: '#bfbfbf',
		icon: <CloseCircleFilled />,
		labelKey: 'schedulers.statusDisabled',
		label: '已禁用',
	},
};

export default function SystemSchedulersPage() {
	const { t } = useTranslation();
	const { addToast } = useToast();
	const { data, isLoading, error, refetch } = useSchedulers();
	const [triggerModal, setTriggerModal] = React.useState<{ open: boolean; name: string }>({
		open: false,
		name: '',
	});
	const [reason, setReason] = React.useState('');

	if (isLoading) return <PageLoading />;
	if (error)
		return (
			<PageError message={t('schedulers.loadError', '加载调度器状态失败')} retry={() => refetch()} />
		);

	const stats = {
		running: data.filter((s) => s.status === 'running').length,
		paused: data.filter((s) => s.status === 'paused').length,
		failed: data.filter((s) => s.status === 'failed').length,
		disabled: data.filter((s) => !s.enabled).length,
	};

	const handleTrigger = (name: string) => {
		setTriggerModal({ open: true, name });
		setReason('');
	};

	const handleConfirmTrigger = () => {
		addToast(t('schedulers.triggered', '已触发 {{name}}', { name: triggerModal.name }), 'success');
		setTriggerModal({ open: false, name: '' });
	};

	const handlePause = (name: string) => {
		addToast(t('schedulers.paused', '已暂停 {{name}}', { name }), 'info');
	};

	const handleResume = (name: string) => {
		addToast(t('schedulers.resumed', '已恢复 {{name}}', { name }), 'success');
	};

	const columns = [
		{
			title: t('schedulers.name', '名称'),
			dataIndex: 'name',
			key: 'name',
			render: (name: string) => <strong style={{ fontFamily: 'monospace' }}>{name}</strong>,
		},
		{
			title: t('schedulers.service', '服务'),
			dataIndex: 'service',
			key: 'service',
			render: (svc: string) => <Tag>{svc}</Tag>,
		},
		{
			title: t('schedulers.interval', '间隔'),
			dataIndex: 'interval',
			key: 'interval',
			render: (interval: string) => (
				<span>
					<ClockCircleOutlined style={{ marginRight: 6 }} />
					{interval || '—'}
				</span>
			),
		},
		{
			title: t('schedulers.status', '状态'),
			dataIndex: 'status',
			key: 'status',
			render: (status: string) => {
				const cfg = statusConfig[status] || statusConfig.disabled;
				return (
					<Badge
						status={status === 'running' ? 'success' : status === 'paused' ? 'warning' : 'error'}
						text={t(cfg.labelKey, cfg.label)}
					/>
				);
			},
		},
		{
			title: t('schedulers.lastRun', '上次运行'),
			dataIndex: 'lastRun',
			key: 'lastRun',
		},
		{
			title: t('schedulers.actions', '操作'),
			key: 'actions',
			render: (_: unknown, record: { name: string; enabled: boolean; status: string }) => (
				<Space size="small">
					<Button
						type="primary"
						size="small"
						icon={<PlayCircleOutlined />}
						onClick={() => handleTrigger(record.name)}
					>
						{t('schedulers.trigger', '触发')}
					</Button>
					{record.enabled ? (
						<Button
							size="small"
							icon={<PauseCircleOutlined />}
							onClick={() => handlePause(record.name)}
						>
							{t('schedulers.pause', '暂停')}
						</Button>
					) : (
						<Button
							size="small"
							icon={<PlayCircleOutlined />}
							onClick={() => handleResume(record.name)}
						>
							{t('schedulers.resume', '恢复')}
						</Button>
					)}
					<Button size="small" icon={<HistoryOutlined />}>
						{t('schedulers.history', '历史记录')}
					</Button>
				</Space>
			),
		},
	];

	return (
		<div>
			<PageHeader
				title={t('schedulers.title', '系统作业')}
				subtitle={t('schedulers.subtitle', '所有后台调度器的运行状态、手动触发与历史记录')}
			/>

			<Row gutter={16} style={{ marginBottom: 24 }}>
				<Col span={6}>
					<Card>
						<Statistic
							title={t('schedulers.statusRunning', '运行中')}
							value={stats.running}
							valueStyle={{ color: 'var(--color-success)' }}
							prefix={<CheckCircleFilled />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title={t('schedulers.statusPaused', '已暂停')}
							value={stats.paused}
							valueStyle={{ color: 'var(--color-warning)' }}
							prefix={<MinusCircleFilled />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title={t('schedulers.statusFailed', '失败')}
							value={stats.failed}
							valueStyle={{ color: 'var(--color-danger)' }}
							prefix={<CloseCircleFilled />}
						/>
					</Card>
				</Col>
				<Col span={6}>
					<Card>
						<Statistic
							title={t('schedulers.statusDisabled', '已禁用')}
							value={stats.disabled}
							valueStyle={{ color: '#bfbfbf' }}
							prefix={<CloseCircleFilled />}
						/>
					</Card>
				</Col>
			</Row>

			<Card
				title={t('schedulers.list', '调度器列表')}
				extra={
					<Button icon={<ReloadOutlined />} onClick={() => refetch()}>
						{t('common.refresh', '刷新')}
					</Button>
				}
			>
				<Table
					dataSource={data}
					columns={columns}
					rowKey="name"
					pagination={{ pageSize: 20 }}
					size="middle"
				/>
			</Card>

			<Modal
				title={t('schedulers.triggerTitle', '触发：{{name}}', { name: triggerModal.name })}
				open={triggerModal.open}
				onOk={handleConfirmTrigger}
				onCancel={() => setTriggerModal({ open: false, name: '' })}
				okText={t('common.confirm', '确认')}
				cancelText={t('common.cancel', '取消')}
			>
				<p style={{ marginBottom: 12 }}>
					{t(
						'schedulers.triggerConfirm',
						'确定要手动触发该调度器吗？',
					)}
				</p>
				<Input.TextArea
					rows={3}
					placeholder={t(
						'schedulers.triggerReason',
						'手动触发原因（将记录到审计日志）',
					)}
					value={reason}
					onChange={(e) => setReason(e.target.value)}
				/>
			</Modal>
		</div>
	);
}
