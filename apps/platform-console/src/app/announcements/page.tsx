'use client';

import React, { useState } from 'react';
import { Button, Space, Tag, Modal, Form, Input, Select, Popconfirm } from 'antd';
import { message } from '@/lib/antd-app';
import {
	PlusOutlined,
	EditOutlined,
	DeleteOutlined,
	SendOutlined,
	RollbackOutlined,
} from '@ant-design/icons';
import {
	useAnnouncements,
	useCreateAnnouncement,
	useUpdateAnnouncement,
	useDeleteAnnouncement,
	usePublishAnnouncement,
	useUnpublishAnnouncement,
} from '@/hooks/use-announcements';
import { handleApiError } from '@/lib/error-handler';
import { PageError, DataTable } from '@autional-cn/ui/antd';
import { ConsolePageHeader } from '@autional-cn/ui';

const { Option } = Select;
const { TextArea } = Input;

interface AnnouncementRecord {
	id: string;
	title: string;
	type: 'global' | 'targeted';
	status: 'draft' | 'published' | 'archived' | 'scheduled';
	publishedAt?: string;
	content?: string;
	targets?: string[];
}

export default function AnnouncementsPage() {
	const [modalVisible, setModalVisible] = useState(false);
	const [editing, setEditing] = useState<AnnouncementRecord | null>(null);
	const [form] = Form.useForm();

	const { data = [], isLoading, error, refetch } = useAnnouncements();
	const createMut = useCreateAnnouncement();
	const updateMut = useUpdateAnnouncement();
	const deleteMut = useDeleteAnnouncement();
	const publishMut = usePublishAnnouncement();
	const unpublishMut = useUnpublishAnnouncement();

	const handleSave = async (values: any) => {
		try {
			const payload = {
				title: values.title,
				content: values.content,
				type: values.type,
				targets: values.type === 'targeted' ? values.targets : undefined,
				status: values.status || 'published',
			};
			if (editing) {
				await updateMut.mutateAsync({ id: editing.id, data: payload });
				message.success('公告更新成功');
			} else {
				await createMut.mutateAsync(payload);
				message.success('公告创建成功');
			}
			setModalVisible(false);
			setEditing(null);
			form.resetFields();
		} catch (err) {
			handleApiError(err, '保存失败');
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteMut.mutateAsync(id);
			message.success('删除成功');
		} catch (err) {
			handleApiError(err, '删除失败');
		}
	};

	const handlePublish = async (id: string) => {
		try {
			await publishMut.mutateAsync(id);
			message.success('公告已发布');
		} catch (err) {
			handleApiError(err, '发布失败');
		}
	};

	const handleUnpublish = async (id: string) => {
		try {
			await unpublishMut.mutateAsync(id);
			message.success('公告已撤回');
		} catch (err) {
			handleApiError(err, '撤回失败');
		}
	};

	const type = Form.useWatch('type', form);

	const columns = [
		{ title: '标题', dataIndex: 'title', key: 'title' },
		{
			title: '类型',
			dataIndex: 'type',
			key: 'type',
			render: (v: string) => (
				<Tag color={v === 'global' ? 'blue' : 'orange'}>{v === 'global' ? '全局' : '定向'}</Tag>
			),
		},
		{
			title: '发布状态',
			dataIndex: 'status',
			key: 'status',
			render: (v: string) => (
				<Tag color={v === 'published' ? 'success' : v === 'draft' ? 'default' : 'gray'}>
					{v === 'published' ? '已发布' : v === 'draft' ? '草稿' : '已归档'}
				</Tag>
			),
		},
		{
			title: '发布时间',
			dataIndex: 'publishedAt',
			key: 'publishedAt',
			render: (v?: string) => v || '-',
		},
		{
			title: '操作',
			key: 'action',
			render: (_: any, record: AnnouncementRecord) => (
				<Space size="small">
					<Button
						type="text"
						size="small"
						icon={<EditOutlined />}
						onClick={() => {
							setEditing(record);
							form.setFieldsValue({
								title: record.title,
								content: record.content,
								type: record.type,
								status: record.status,
								targets: record.targets,
							});
							setModalVisible(true);
						}}
					>
						编辑
					</Button>
					{(record.status === 'draft' || record.status === 'scheduled') && (
						<Button
							type="text"
							size="small"
							icon={<SendOutlined />}
							onClick={() => handlePublish(record.id)}
							loading={publishMut.isPending}
						>
							发布
						</Button>
					)}
					{record.status === 'published' && (
						<Button
							type="text"
							size="small"
							icon={<RollbackOutlined />}
							onClick={() => handleUnpublish(record.id)}
							loading={unpublishMut.isPending}
						>
							撤回
						</Button>
					)}
					<Popconfirm title="确认删除该公告？" onConfirm={() => handleDelete(record.id)}>
						<Button type="text" danger size="small" icon={<DeleteOutlined />}>
							删除
						</Button>
					</Popconfirm>
				</Space>
			),
		},
	];

	return (
		<div>
			<ConsolePageHeader
				title="平台公告"
				actions={
					<>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={() => {
								setEditing(null);
								form.resetFields();
								setModalVisible(true);
							}}
						>
							发布公告
						</Button>
					</>
				}
			/>

			{error && <PageError message="加载公告列表失败" retry={refetch} className="mb-4" />}
			<DataTable
				rowKey="id"
				columns={columns}
				dataSource={data}
				loading={isLoading}
				pagination={{ pageSize: 10 }}
			/>

			<Modal
				title={editing ? '编辑公告' : '发布公告'}
				open={modalVisible}
				onCancel={() => {
					setModalVisible(false);
					setEditing(null);
					form.resetFields();
				}}
				onOk={() => form.submit()}
				width={640}
				destroyOnHidden
			>
				<Form form={form} layout="vertical" onFinish={handleSave}>
					<Form.Item name="title" label="标题" rules={[{ required: true }]}>
						<Input placeholder="公告标题" />
					</Form.Item>
					<Form.Item name="content" label="内容" rules={[{ required: true }]}>
						<TextArea rows={6} placeholder="公告正文，支持 HTML" />
					</Form.Item>
					<Form.Item name="type" label="类型" rules={[{ required: true }]} initialValue="global">
						<Select placeholder="选择类型">
							<Option value="global">全局</Option>
							<Option value="targeted">定向</Option>
						</Select>
					</Form.Item>
					{type === 'targeted' && (
						<Form.Item name="targets" label="目标租户 / 用户组">
							<Select mode="tags" placeholder="输入租户ID或用户组，按回车确认" />
						</Form.Item>
					)}
					<Form.Item name="status" label="发布状态" initialValue="published">
						<Select>
							<Option value="published">立即发布</Option>
							<Option value="draft">保存草稿</Option>
						</Select>
					</Form.Item>
				</Form>
			</Modal>
		</div>
	);
}
