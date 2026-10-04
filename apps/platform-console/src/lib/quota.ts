export const BYTES_PER_GB = 1024 ** 3;

/**
 * 字节 → GB（显示用，保留 3 位小数）。
 * 后端配额以字节存储；配额 GET 的整型 GB 为截断值（100MB→0GB，PL-16），
 * 页面统一从原始字节换算，避免同数据两呈现。
 */
export function gbFromBytes(bytes: number): number {
	return Math.round((bytes / BYTES_PER_GB) * 1000) / 1000;
}

/**
 * 保存侧 max_storage 解析（bytes）：
 * - 未改动（当前值 === 初始显示值）→ 原样回发基线字节，避免 GB 显示舍入造成往返漂移；
 * - 已改动 → GB→bytes 换算（后端 PUT 直收字节，此前把 GB 数当字节发会静默毁配额）。
 */
export function resolveMaxStorageBytes(
	currentGb: number | undefined,
	initialGb: number | undefined,
	baselineBytes: number | undefined,
): number | undefined {
	if (currentGb == null) return undefined;
	if (baselineBytes != null && currentGb === initialGb) return baselineBytes;
	return Math.round(currentGb * BYTES_PER_GB);
}
