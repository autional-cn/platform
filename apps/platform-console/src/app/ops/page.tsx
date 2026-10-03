'use client';

import React, { useState } from 'react';
import { Card, Tag, Row, Col, Spin, Statistic } from 'antd';
import { message } from '@/lib/antd-app';
import {
	CheckCircleOutlined,
	CloseCircleOutlined,
	CloudServerOutlined,
	WarningOutlined,
} from '@ant-design/icons';
import { useOpsStatus, useHealth, useServiceHealth, type ServiceHealthItem } from '@/hooks/use-ops';
import { ops } from '@/lib/api.generated';
import { PageError } from '@autional-cn/ui/antd';

interface ServiceHealth {
	name: string;
	status: 'healthy' | 'unhealthy' | 'degraded' | 'unknown';
	latency?: string;
	port?: number;
	checkedAt?: string;
}

export default function OpsPage() {
	const [selectedService, setSelectedService] = useState<string | null>(null);

	const { data: opsStatus, isLoading: opsLoading, error, refetch } = useOpsStatus();
	const { data: health, isLoading: healthLoading } = useHealth();
	const { data: healthData, isLoading: healthDataLoading } = useServiceHealth();

	const loading = opsLoading || healthLoading || healthDataLoading;

	const services: ServiceHealth[] = React.useMemo(() => {
		const svcs: ServiceHealth[] = [];
		if (health?.servicesList && Array.isArray(health.servicesList)) {
			health.servicesList.forEach((svc: ServiceHealthItem) => {
				svcs.push({
					name: svc.name,
					status: (svc.status as ServiceHealth['status']) ?? 'unknown',
					latency: svc.latency,
					port: svc.port,
					checkedAt: svc.checked_at,
				});
			});
			return svcs;
		}
		if ((opsStatus as any)?.services) {
			svcs.push(
				...(opsStatus as any).services.map((s: string) => ({
					name: s.split(':')[0],
					status: 'healthy' as const,
				})),
			);
		}
		if (health?.services) {
			Object.entries(health.services).forEach(([name, status]: [string, any]) => {
				const existing = svcs.find((svc) => svc.name === name);
				if (existing) existing.status = status;
				else svcs.push({ name, status });
			});
		}
		return svcs;
	}, [opsStatus, health]);

	return (
		<div>
			{error && <PageError message="加载运维状态失败" retry={refetch} className="mb-4" />}

			<div className="flex items-center justify-between mb-6">
				<h1 className="text-xl font-semibold">运维视图</h1>
			</div>

			<Spin spinning={loading}>
				{healthData && (
					<Row gutter={[16, 16]} className="mb-6">
						<Col xs={24} sm={8}>
							<Card>
								<Statistic
									title="服务总数"
									value={healthData.servicesTotal}
									prefix={<CloudServerOutlined />}
								/>
							</Card>
						</Col>
						<Col xs={24} sm={8}>
							<Card>
								<Statistic
									title="健康服务"
									value={healthData.servicesHealthy}
									suffix={`/ ${healthData.servicesTotal}`}
									valueStyle={{ color: 'var(--color-success-text)' }}
									prefix={<CheckCircleOutlined />}
								/>
							</Card>
						</Col>
						<Col xs={24} sm={8}>
							<Card>
								<Statistic
									title="活跃事件"
									value={healthData.activeIncidents}
									valueStyle={{ color: healthData.activeIncidents > 0 ? 'var(--color-danger-text)' : undefined }}
									prefix={<WarningOutlined />}
								/>
							</Card>
						</Col>
					</Row>
				)}

				<Row gutter={[16, 16]} className="mb-6">
					{services.map((svc) => (
						<Col xs={24} sm={12} md={8} lg={6} key={svc.name}>
							<Card hoverable onClick={() => setSelectedService(svc.name)}>
								<div className="flex items-center justify-between mb-1">
									<div className="font-medium">{svc.name}</div>
									<Tag
										icon={
											svc.status === 'healthy' ? <CheckCircleOutlined /> : <CloseCircleOutlined />
										}
										color={
											svc.status === 'healthy'
												? 'success'
												: svc.status === 'degraded'
													? 'warning'
													: 'error'
										}
									>
										{svc.status === 'healthy'
											? '正常'
											: svc.status === 'degraded'
												? '降级'
												: '异常'}
									</Tag>
								</div>
								{svc.latency && (
									<div className="text-xs text-gray-400">
										延迟: {svc.latency}
										{svc.port != null && ` | 端口: ${svc.port}`}
									</div>
								)}
							</Card>
						</Col>
					))}
				</Row>

				<Card title="服务总览 (Grafana)" className="mb-6">
					<iframe
						src={ops.grafanaOverviewUrl}
						width="100%"
						height="500"
						style={{ border: 'none' }}
						title="Grafana 总览面板"
					/>
				</Card>

				{selectedService && (
					<Card
						title={`${selectedService} 详情 (Grafana)`}
						className="mb-6"
						extra={<Tag color="blue">Grafana</Tag>}
					>
						<iframe
							src={ops.grafanaServicesUrl(selectedService)}
							width="100%"
							height="400"
							style={{ border: 'none' }}
							title={`Grafana ${selectedService} 面板`}
						/>
					</Card>
				)}
			</Spin>
		</div>
	);
}
