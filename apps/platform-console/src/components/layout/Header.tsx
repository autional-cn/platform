import { useTranslation } from 'react-i18next';
import { Button, Layout, Typography, theme } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useAuth, getADMIN_CONSOLE_URL } from '@autional-cn/shared';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export function Header() {
	const { t } = useTranslation();
	const { user } = useAuth();

	return (
		<AntHeader className="flex items-center justify-between px-6 h-16 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)]">
			<Text strong>{t('app.brand')}</Text>
			<div className="flex items-center gap-4">
				<Button
					icon={<AppstoreOutlined />}
					onClick={() => {
						window.location.href = getADMIN_CONSOLE_URL();
					}}
					size="small"
				>
					{t('nav.switchToTenantMgmt')}
				</Button>
				{user?.email && <Text className="text-sm">{user.email}</Text>}
			</div>
		</AntHeader>
	);
}
