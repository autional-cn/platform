'use client';

import React from 'react';
import { Card, Statistic, Tag, Descriptions, Spin } from 'antd';
import {
	CloudServerOutlined,
	CheckCircleOutlined,
	CloseCircleOutlined,
	QuestionCircleOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ops } from '@/lib/api.generated';
import { PageLoading, PageError } from '@/components/ui/page-status';

interface RateLimitData {
	available: boolean;
	providerName: string;
}

export default function SystemRateLimitsPage() {
	const { t } = useTranslation();

	const { data, isLoading, error, refetch } = useQuery<RateLimitData>({
		queryKey: ['system', 'rate-limits'],
		staleTime: 30000,
		queryFn: async () => {
			const raw = await ops.rateLimits();
			const inner = raw?.data ?? raw;
			return {
				available: inner?.available ?? false,
				providerName: inner?.providerName ?? inner?.provider_name ?? 'unknown',
			};
		},
	});

	if (isLoading) return <PageLoading />;
	if (error)
		return (
			<PageError message={t('rateLimits.loadError', '加载限流状态失败')} retry={() => refetch()} />
		);
	if (!data) return null;

	return (
		<div>
			<PageHeader
				title={t('rateLimits.title', '限流状态')}
				subtitle={t('rateLimits.subtitle', '网关限流器提供方状态')}
			/>

			<Spin spinning={false}>
				<Card
					className="mt-6 max-w-lg"
					title={
						<span>
							<CloudServerOutlined className="mr-2" />
							{t('rateLimits.providerStatus', '提供方状态')}
						</span>
					}
				>
					<Descriptions bordered column={1} size="middle">
						<Descriptions.Item label={t('rateLimits.available', '是否可用')}>
							{data.available ? (
								<Tag icon={<CheckCircleOutlined />} color="success">
									{t('rateLimits.yes', '可用')}
								</Tag>
							) : (
								<Tag icon={<CloseCircleOutlined />} color="error">
									{t('rateLimits.no', '不可用')}
								</Tag>
							)}
						</Descriptions.Item>
						<Descriptions.Item label={t('rateLimits.provider', '提供方')}>
							<Tag icon={<QuestionCircleOutlined />} color="blue">
								{data.providerName}
							</Tag>
						</Descriptions.Item>
					</Descriptions>
				</Card>
			</Spin>
		</div>
	);
}
