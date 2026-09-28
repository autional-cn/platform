import { useEffect, useMemo } from 'react';
import { App as AntdApp, ConfigProvider, theme } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTheme } from '@autional-cn/ui';
import { useTranslation } from 'react-i18next';
// antd 主题由设计系统下发，不在这里手写色值。
// 此前这里只设了 algorithm、没有 token，因此 antd 组件渲染的是出厂配色
// （实测侧边栏选中项 .ant-menu-item-selected 是 antd 出厂蓝 rgb(22,119,255)），
// 而 admin 控制台是品牌蓝——同一个产品两个控制台主色不是一个（ui 仓库 KI-011）。
import antdTheme from '@autional-cn/tailwind-preset/antd-theme.mjs';

export let message: MessageInstance;
export let modal: any;

export function AntdAppProvider({ children }: { children: React.ReactNode }) {
	const { theme: appTheme } = useTheme();
	const { i18n } = useTranslation();

	const locale = useMemo(() => (i18n.language === 'zh-CN' ? zhCN : enUS), [i18n.language]);

	return (
		<ConfigProvider
			locale={locale}
			theme={{
				algorithm: appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
				token: (appTheme === 'dark' ? antdTheme.dark : antdTheme.light).token,
			}}
		>
			<AntdApp>
				<AntdAppInit />
				{children}
			</AntdApp>
		</ConfigProvider>
	);
}

function AntdAppInit() {
	const app = AntdApp.useApp();
	useEffect(() => {
		message = app.message;
		modal = app.modal;
	}, [app]);
	return null;
}
