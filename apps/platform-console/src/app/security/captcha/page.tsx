'use client';

import { usePageTitle } from '@autional-cn/shared';
import {
	useCaptchaConfig,
	useUpdateCaptchaConfig,
	type CaptchaConfig,
} from '@/hooks/use-captcha-config';
import CaptchaConfigForm from '@/components/security/CaptchaConfigForm';
import { PageLoading, PageError } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';

export default function CaptchaConfigPage() {
	usePageTitle('CAPTCHA 安全配置');

	const { data: config, isLoading, error, refetch } = useCaptchaConfig();
	const updateMutation = useUpdateCaptchaConfig();

	const handleSave = async (values: CaptchaConfig) => {
		await updateMutation.mutateAsync(values);
	};

	if (isLoading) {
		return <PageLoading tip="加载 CAPTCHA 配置中…" />;
	}

	if (error) {
		return <PageError message="加载 CAPTCHA 配置失败" retry={refetch} />;
	}

	if (!config) {
		return <PageLoading />;
	}

	return (
		<div>
			<ConsolePageHeader
				title="CAPTCHA 安全配置"
			/>
			<CaptchaConfigForm data={config} onSave={handleSave} />
		</div>
	);
}
