import { Button, Result } from 'antd';
import { useNavigate } from 'react-router';
import { usePageTitle, useTenantSlug } from '@autional-cn/shared';
import { buildNavHref } from '@/lib/nav';

export default function ForbiddenPage() {
	usePageTitle('403 禁止访问');
	const navigate = useNavigate();
	const tenantSlug = useTenantSlug();

	return (
		<Result
			status="403"
			title="403"
			subTitle="抱歉，你没有权限访问此页面。"
			extra={
				<Button type="primary" onClick={() => navigate(buildNavHref('/', tenantSlug))}>
					返回仪表盘
				</Button>
			}
		/>
	);
}
