'use client';

import { Button, Empty, Spin } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

/** 全页 Loading 占位（居中 Spin） */
export function PageLoading({ tip = '加载中…' }: { tip?: string }) {
	return (
		<div className="flex h-64 items-center justify-center">
			<Spin size="large" tip={tip} />
		</div>
	);
}

/** 全页 Error 占位（可重试） */
export function PageError({
	message = '数据加载失败',
	retry,
	className = '',
}: {
	message?: string;
	retry?: () => void;
	className?: string;
}) {
	return (
		<div className={`flex h-64 flex-col items-center justify-center gap-4 ${className}`}>
			<Empty description={message} image={Empty.PRESENTED_IMAGE_SIMPLE} />
			{retry && (
				<Button icon={<ReloadOutlined />} onClick={retry}>
					重试
				</Button>
			)}
		</div>
	);
}
