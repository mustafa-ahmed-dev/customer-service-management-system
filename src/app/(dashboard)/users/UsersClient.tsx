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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
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
  createdAt: string;
  deactivatedAt?: string;
}

interface FormValues {
  email: string;
  password?: string;
  fullName: string;
  role: string;
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

      // Don't send password if it's empty during edit
      const payload = { ...values };
      if (editingUser && !values.password) {
        delete payload.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success(
          editingUser
            ? "User updated successfully"
            : "User created successfully"
        );
        setIsModalOpen(false);
        form.resetFields();
        fetchUsers();
      } else {
        const data = await response.json();
        message.error(data.error || "Failed to save user");
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Failed to save user");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "red";
      case "moderator":
        return "blue";
      case "user":
        return "green";
      default:
        return "default";
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      width: 200,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 250,
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 120,
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
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
        title={editingUser ? "Edit User" : "Add User"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 24 }}
        >
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Please enter email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input placeholder="email@elryan.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label={
              editingUser
                ? "Password (leave blank to keep current)"
                : "Password"
            }
            rules={
              editingUser
                ? []
                : [{ required: true, message: "Please enter password" }]
            }
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select a role" }]}
          >
            <Select placeholder="Select role">
              <Select.Option value="user">User</Select.Option>
              <Select.Option value="moderator">Moderator</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
