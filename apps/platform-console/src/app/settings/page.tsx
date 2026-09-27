import { Typography } from 'antd';
import { usePageTitle } from '@autional-cn/shared';

const { Title } = Typography;

export default function SettingsPage() {
	usePageTitle('设置');

	return (
		<div>
			<Title level={3}>设置</Title>
		</div>
	);
}
