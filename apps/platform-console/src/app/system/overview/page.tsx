'use client';

import React, { useMemo } from 'react';
import { Card, Col, Row, Tag, Badge, Statistic, Spin, Tooltip } from 'antd';
import {
	CheckCircleFilled,
	CloseCircleFilled,
	QuestionCircleFilled,
	DatabaseOutlined,
	ClusterOutlined,
	SafetyCertificateOutlined,
	WarningOutlined,
	TeamOutlined,
	AppstoreOutlined,
	CloudServerOutlined,
} from '@ant-design/icons';
import { ConsolePageHeader } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';
import { useSystemOverview, CATEGORY_LABELS } from '@/hooks/use-system-overview';
import type { ServiceInfo } from '@/hooks/use-system-overview';
import { PageLoading, PageError } from '@autional-cn/ui/antd';

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
	healthy: { color: 'var(--color-success)', icon: <CheckCircleFilled style={{ color: 'var(--color-success)' }} /> },
	unhealthy: { color: 'var(--color-danger)', icon: <CloseCircleFilled style={{ color: 'var(--color-danger)' }} /> },
	unknown: { color: 'var(--color-text-disabled)', icon: <QuestionCircleFilled style={{ color: 'var(--color-text-disabled)' }} /> },
};

const categoryColors: Record<ServiceInfo['category'], string> = {
	authentication: 'blue',
	'user-data': 'cyan',
	'business-platform': 'purple',
	operations: 'green',
	infrastructure: 'orange',
};

export default function SystemOverviewPage() {
	const { t } = useTranslation();
	const { data, isLoading, error, refetch } = useSystemOverview();

	const servicesByCategory = useMemo(() => {
		if (!data?.services) return {};
		return data.services.reduce<Record<string, ServiceInfo[]>>((acc, svc) => {
			const key = svc.category;
			(acc[key] ??= []).push(svc);
			return acc;
		}, {});
	}, [data]);

	if (isLoading) return <PageLoading />;
	if (error)
		return (
			<PageError
				message={t('systemOverview.loadError', '加载系统总览失败')}
				retry={() => refetch()}
			/>
		);
	if (!data) return null;

	return (
		<div>
			<ConsolePageHeader
				title={t('systemOverview.title', '系统总览')}
				description={t('systemOverview.subtitle', '全局服务健康、基础设施状态、租户概览与安全态势')}
			/>

			<Spin spinning={false}>
				<Row gutter={[16, 16]} className="mt-6">
					<Col xs={24} lg={16}>
						<Card
							title={
								<span>
									<CloudServerOutlined className="mr-2" />
									{t('systemOverview.serviceHealth', '服务健康')}
								</span>
							}
							className="h-full"
						>
							{Object.entries(servicesByCategory).map(([category, services]) => (
								<div key={category} className="mb-4 last:mb-0">
									<Tag color={categoryColors[category as ServiceInfo['category']]} className="mb-2">
										{CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category}
									</Tag>
									<Row gutter={[12, 12]}>
										{services.map((svc) => (
											<Col xs={24} sm={12} md={8} lg={8} xl={6} key={svc.name}>
												<Tooltip title={`${svc.name}:${svc.port}`}>
													<Card size="small" className="service-card">
														<div className="flex items-center justify-between">
															<div className="flex-1 min-w-0">
																<div className="font-medium text-sm truncate">{svc.name}</div>
																<div className="text-xs text-neutral-500">:{svc.port}</div>
															</div>
															<div className="ml-2 flex-shrink-0">
																{statusConfig[svc.status].icon}
															</div>
														</div>
													</Card>
												</Tooltip>
											</Col>
										))}
									</Row>
								</div>
							))}
						</Card>
					</Col>

					<Col xs={24} lg={8}>
						<Card
							title={
								<span>
									<DatabaseOutlined className="mr-2" />
									{t('systemOverview.infrastructure', '基础设施')}
								</span>
							}
							className="h-full"
						>
							<div className="space-y-3">
								{(data.infrastructure ?? []).map((infra) => (
									<div
										key={infra.name}
										className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-bg-elevated)]"
									>
										<div className="flex items-center gap-2">
											{statusConfig[infra.status].icon}
											<span className="font-medium text-sm">{infra.name}</span>
										</div>
										<Tag
											color={
												infra.status === 'healthy'
													? 'success'
													: infra.status === 'unhealthy'
														? 'error'
														: 'default'
											}
										>
											{t(`systemOverview.status.${infra.status}`, infra.status)}
										</Tag>
									</div>
								))}
							</div>
						</Card>
					</Col>
				</Row>

				<Row gutter={[16, 16]} className="mt-4">
					<Col xs={24} lg={8}>
						<Card
							title={
								<span>
									<TeamOutlined className="mr-2" />
									{t('systemOverview.tenantOverview', '租户概览')}
								</span>
							}
						>
							<Row gutter={[16, 16]}>
								<Col span={8}>
									<Statistic
										title={t('systemOverview.totalTenants', '总数')}
										value={data.tenants.total}
										prefix={<TeamOutlined className="text-blue-500" />}
									/>
								</Col>
								<Col span={8}>
									<Statistic
										title={t('systemOverview.activeTenants', '活跃')}
										value={data.tenants.active}
										prefix={<CheckCircleFilled className="text-green-500" />}
									/>
								</Col>
								<Col span={8}>
									<Statistic
										title={t('systemOverview.suspendedTenants', '已暂停')}
										value={data.tenants.suspended}
										prefix={<WarningOutlined className="text-orange-500" />}
									/>
								</Col>
							</Row>

							<div className="mt-4">
								<div className="text-sm font-medium text-neutral-600 mb-2">
									{t('systemOverview.planDistribution', '套餐分布')}
								</div>
								<div className="space-y-2">
									{(data.tenants?.planDistribution ?? []).map(({ plan, count }) => (
										<div key={plan} className="flex items-center justify-between">
											<Tag color="blue">{plan}</Tag>
											<span className="text-sm">{count}</span>
										</div>
									))}
								</div>
							</div>
						</Card>
					</Col>

					<Col xs={24} lg={16}>
						<Card
							title={
								<span>
									<SafetyCertificateOutlined className="mr-2" />
									{t('systemOverview.securityPosture', '安全态势')}
								</span>
							}
						>
							<Row gutter={[16, 16]}>
								<Col xs={12} sm={6}>
									<Card size="small">
										<Statistic
											title={t('systemOverview.passwordsExpired', '密码已过期')}
											value={data.security.passwordsExpired}
											prefix={<WarningOutlined className="text-orange-500" />}
										/>
									</Card>
								</Col>
								<Col xs={12} sm={6}>
									<Card size="small">
										<Statistic
											title={t('systemOverview.weakPasswords', '弱密码')}
											value={data.security.weakPasswords}
											prefix={<WarningOutlined className="text-red-500" />}
										/>
									</Card>
								</Col>
								<Col xs={12} sm={6}>
									<Card size="small">
										<Statistic
											title={t('systemOverview.expiringSecrets', '即将过期密钥')}
											value={data.security.expiringSecrets}
											prefix={<WarningOutlined className="text-orange-500" />}
										/>
									</Card>
								</Col>
								<Col xs={12} sm={6}>
									<Card size="small">
										<div className="space-y-3">
											<div>
												<div className="text-xs text-neutral-500 mb-1">PASSWORD_PEPPER</div>
												<Badge
													status={data.security.passwordPepperEnabled ? 'success' : 'error'}
													text={
														data.security.passwordPepperEnabled
															? t('systemOverview.enabled', '已启用')
															: t('systemOverview.notEnabled', '未启用')
													}
												/>
											</div>
											<div>
												<div className="text-xs text-neutral-500 mb-1">HIBP</div>
												<Badge
													status={data.security.hibpEnabled ? 'success' : 'error'}
													text={
														data.security.hibpEnabled
															? t('systemOverview.enabled', '已启用')
															: t('systemOverview.notEnabled', '未启用')
													}
												/>
											</div>
										</div>
									</Card>
								</Col>
							</Row>
						</Card>
					</Col>
				</Row>
			</Spin>
		</div>
	);
}
