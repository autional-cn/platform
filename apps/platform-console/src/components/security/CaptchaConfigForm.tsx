'use client';

import React, { useEffect, useState } from 'react';
import { Form, Radio, Slider, Select, Button, Card, Descriptions, Tag } from 'antd';
import { SaveOutlined, UndoOutlined } from '@ant-design/icons';
import { message } from '@/lib/antd-app';
import type { CaptchaConfig } from '@/hooks/use-captcha-config';

const TTL_OPTIONS = [
	{ label: '1 分钟', value: 60 },
	{ label: '3 分钟', value: 180 },
	{ label: '5 分钟', value: 300 },
	{ label: '10 分钟', value: 600 },
];

const FALLBACK_OPTIONS = [
	{ label: '严格 (strict)', value: 'strict' },
	{ label: '仅延迟 (delay_only)', value: 'delay_only' },
	{ label: '绕过 (bypass)', value: 'bypass' },
];

const PROVIDER_LABELS: Record<string, string> = {
	pow: '工作量证明 (PoW)',
	turnstile: 'Cloudflare Turnstile',
};

const FALLBACK_LABELS: Record<string, string> = {
	strict: '严格 — 挑战失败直接拒绝',
	delay_only: '仅延迟 — 降低请求速率',
	bypass: '绕过 — 不执行挑战',
};

interface CaptchaConfigFormProps {
	data: CaptchaConfig;
	onSave: (values: CaptchaConfig) => Promise<void>;
}

function CaptchaConfigForm({ data, onSave }: CaptchaConfigFormProps) {
	const [form] = Form.useForm<CaptchaConfig>();
	const [saving, setSaving] = useState(false);

	const providerValue = Form.useWatch('provider', form);

	useEffect(() => {
		form.setFieldsValue(data);
	}, [data, form]);

	const handleSave = async (values: CaptchaConfig) => {
		setSaving(true);
		try {
			await onSave(values);
			message.success('CAPTCHA 配置已保存');
		} catch (err) {
			message.error(err instanceof Error ? err.message : '保存 CAPTCHA 配置失败');
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		form.setFieldsValue(data);
	};

	const currentProvider = providerValue ?? data.provider;
	const currentDifficulty = Form.useWatch('powDifficulty', form) ?? data.powDifficulty;
	const currentTtl = Form.useWatch('challengeTtl', form) ?? data.challengeTtl;
	const currentFallback = Form.useWatch('fallbackMode', form) ?? data.fallbackMode;

	return (
		<div className="space-y-6">
			<Card title="CAPTCHA 配置">
				<Form
					form={form}
					layout="vertical"
					onFinish={handleSave}
					initialValues={data}
					style={{ maxWidth: 520 }}
				>
					<Form.Item
						name="provider"
						label="验证提供商"
						rules={[{ required: true, message: '请选择验证提供商' }]}
					>
						<Radio.Group>
							<Radio value="pow">工作量证明 (PoW)</Radio>
							<Radio value="turnstile">Cloudflare Turnstile</Radio>
						</Radio.Group>
					</Form.Item>

					{currentProvider === 'pow' && (
						<Form.Item
							name="powDifficulty"
							label="PoW 难度"
							rules={[
								{ required: true, message: '请设置 PoW 难度' },
								{ type: 'number', min: 1, max: 10, message: '难度值范围为 1–10' },
							]}
						>
							<Slider
								min={1}
								max={10}
								marks={{
									1: '1 (低)',
									5: '5',
									10: '10 (高)',
								}}
							/>
						</Form.Item>
					)}

					<Form.Item
						name="challengeTtl"
						label="挑战有效期 (TTL)"
						rules={[
							{ required: true, message: '请选择挑战有效期' },
							{ type: 'number', min: 1, message: 'TTL 必须大于 0' },
						]}
					>
						<Select options={TTL_OPTIONS} placeholder="选择有效期" />
					</Form.Item>

					<Form.Item
						name="fallbackMode"
						label="降级模式"
						rules={[{ required: true, message: '请选择降级模式' }]}
					>
						<Select options={FALLBACK_OPTIONS} placeholder="选择降级模式" />
					</Form.Item>

					<div className="flex gap-3">
						<Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
							保存配置
						</Button>
						<Button icon={<UndoOutlined />} onClick={handleReset}>
							重置
						</Button>
					</div>
				</Form>
			</Card>

			<Card title="当前配置摘要" size="small">
				<Descriptions column={2} size="small" bordered>
					<Descriptions.Item label="验证提供商">
						<Tag color={currentProvider === 'pow' ? 'blue' : 'geekblue'}>
							{PROVIDER_LABELS[currentProvider] ?? currentProvider}
						</Tag>
					</Descriptions.Item>
					{currentProvider === 'pow' && (
						<Descriptions.Item label="PoW 难度">
							<Tag color="purple">{currentDifficulty} / 10</Tag>
						</Descriptions.Item>
					)}
					<Descriptions.Item label="挑战有效期">
						<Tag color="cyan">{currentTtl} 秒</Tag>
					</Descriptions.Item>
					<Descriptions.Item label="降级模式">
						<Tag color="orange">{FALLBACK_LABELS[currentFallback] ?? currentFallback}</Tag>
					</Descriptions.Item>
				</Descriptions>
			</Card>
		</div>
	);
}

export default CaptchaConfigForm;
