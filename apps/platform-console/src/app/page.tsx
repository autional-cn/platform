import { Card, Col, Row, Skeleton, Statistic, Typography } from 'antd';
import {
	TeamOutlined,
	NotificationOutlined,
	CloudServerOutlined,
	WarningOutlined,
} from '@ant-design/icons';
import { usePageTitle } from '@autional-cn/shared';
import { useSystemTenants } from '@/hooks/use-system-overview';
import { useOverview } from '@/hooks/use-status';
import { usePlatformNotificationStats } from '@/hooks/use-platform-stats';

const { Title } = Typography;

export default function DashboardPage() {
	usePageTitle('平台仪表盘');

	const { data: overview, isLoading: overviewLoading, error: overviewError } = useOverview();
	const { data: tenants, isLoading: tenantsLoading, error: tenantsError } = useSystemTenants();
	const { data: stats, isLoading: statsLoading } = usePlatformNotificationStats();

	const loading = overviewLoading || tenantsLoading || statsLoading;

	const totalTenants = tenants?.total ?? '—';
	const activeIncidents = overview?.activeIncidents ?? '—';
	const servicesHealthy = overview?.servicesHealthy ?? '—';
	const notificationsSent = stats?.totalSent ?? '—';

	return (
		<div>
			<Title level={3}>平台仪表盘</Title>
			<Row gutter={[16, 16]} className="mt-4">
				<Col xs={24} sm={12} lg={6}>
					<Card>
						{loading ? (
							<Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
						) : (
							<Statistic
								title="租户总数"
								value={totalTenants}
								prefix={<TeamOutlined />}
								valueStyle={tenantsError ? { color: 'var(--color-warning)' } : undefined}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						{loading ? (
							<Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
						) : (
							<Statistic
								title="活跃事故"
								value={activeIncidents}
								prefix={<WarningOutlined />}
								valueStyle={overviewError ? { color: 'var(--color-warning)' } : undefined}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						{loading ? (
							<Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
						) : (
							<Statistic
								title="健康服务"
								value={servicesHealthy}
								prefix={<CloudServerOutlined />}
								valueStyle={overviewError ? { color: 'var(--color-warning)' } : undefined}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<Card>
						{loading ? (
							<Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
						) : (
							<Statistic
								title="平台通知"
								value={notificationsSent}
								prefix={<NotificationOutlined />}
							/>
						)}
					</Card>
				</Col>
			</Row>
		</div>
	);
}
