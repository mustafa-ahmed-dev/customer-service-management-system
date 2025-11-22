"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  App,
  Modal,
  Form,
  Select,
  Tag,
  Typography,
  Tooltip,
  Switch,
  Checkbox,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import type { SessionUser } from "@/lib/auth/session";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title } = Typography;

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  hasFinanceAccess: boolean;
  createdAt: string;
  deactivatedAt?: string;
}

interface FormValues {
  email: string;
  password?: string;
  fullName: string;
  role: string;
  hasFinanceAccess: boolean;
}

interface UsersClientProps {
  session: SessionUser;
}

export default function UsersClient({ session }: UsersClientProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showDeactivated, setShowDeactivated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [searchText, showDeactivated]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      params.append("deactivated", showDeactivated.toString());

      const response = await fetch(`/api/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        message.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      message.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      hasFinanceAccess: user.hasFinanceAccess,
      password: "", // Don't populate password
    });
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    if (user.id === session.id) {
      message.error("You cannot deactivate yourself");
      return;
    }

    modal.confirm({
      title: "Deactivate User",
      content: `Are you sure you want to deactivate ${user.fullName}?`,
      okText: "Deactivate",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/users/${user.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("User deactivated successfully");
            fetchUsers();
          } else {
            const data = await response.json();
            message.error(data.error || "Failed to deactivate user");
          }
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to deactivate user");
        }
      },
    });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(
          `User ${editingUser ? "updated" : "created"} successfully`
        );
        setIsModalOpen(false);
        form.resetFields();
        fetchUsers();
      } else {
        const data = await response.json();
        message.error(data.error || "Operation failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Failed to save user");
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "red",
      moderator: "blue",
      user: "green",
    };
    return colors[role] || "default";
  };

  const columns: ColumnsType<User> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a, b) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>{role.toUpperCase()}</Tag>
      ),
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Moderator", value: "moderator" },
        { text: "User", value: "user" },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: "Finance Access",
      dataIndex: "hasFinanceAccess",
      key: "hasFinanceAccess",
      width: 150,
      render: (hasAccess: boolean) =>
        hasAccess ? (
          <Tag icon={<DollarOutlined />} color="success">
            Enabled
          </Tag>
        ) : (
          <Tag color="default">Disabled</Tag>
        ),
      filters: [
        { text: "Enabled", value: true },
        { text: "Disabled", value: false },
      ],
      onFilter: (value, record) => record.hasFinanceAccess === value,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    ...(showDeactivated
      ? [
          {
            title: "Deactivated At",
            dataIndex: "deactivatedAt",
            key: "deactivatedAt",
            width: 180,
            render: (date: string) =>
              date ? dayjs(date).format("YYYY-MM-DD HH:mm") : "-",
          },
        ]
      : []),
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 120,
      render: (_: any, record: User) => (
        <Space size="small">
          {!showDeactivated && (
            <>
              <Tooltip title="Edit">
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  size="small"
                />
              </Tooltip>
              <Tooltip title="Deactivate">
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                  size="small"
                  disabled={record.id === session.id}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          User Management
        </Title>
        <Space wrap>
          <Input
            placeholder="Search by name or email"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Space>
            <UserOutlined />
            <Switch
              checked={showDeactivated}
              onChange={setShowDeactivated}
              checkedChildren="Deactivated"
              unCheckedChildren="Active"
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
            Refresh
          </Button>
          {!showDeactivated && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add User
            </Button>
          )}
        </Space>
      </Space>

      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
      />

      <Modal
        title={editingUser ? "Edit User" : "Add New User"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ hasFinanceAccess: false }}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={
              editingUser
                ? []
                : [{ required: true, message: "Please enter password" }]
            }
            help={editingUser ? "Leave blank to keep current password" : ""}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select placeholder="Select role">
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="moderator">Moderator</Select.Option>
              <Select.Option value="user">User</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="hasFinanceAccess" valuePropName="checked">
            <Checkbox>
              <Space>
                <DollarOutlined />
                <span>Grant Finance Access</span>
              </Space>
            </Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? "Update" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
