import { ErrorBoundary as SharedErrorBoundary } from '@autional-cn/ui';
import { type ReactNode } from 'react';

interface Props {
	children: ReactNode;
}

export function ErrorBoundary({ children }: Props) {
	return (
		<SharedErrorBoundary
			title="页面出错了"
			message="发生了未知错误，请刷新页面重试。"
			retryLabel="刷新页面"
			devMode={import.meta.env.DEV}
		>
			{children}
		</SharedErrorBoundary>
	);
}
