"use client";

import { useState, useEffect } from "react";
import {
  Tabs,
  Table,
  Button,
  Space,
  App,
  Modal,
  Form,
  Input,
  Typography,
  Tooltip,
  Switch,
  Card,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import type { SessionUser } from "@/lib/auth/session";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface ListItem {
  id: number;
  name?: string;
  reason?: string;
  createdAt: string;
  createdByName?: string;
  deactivatedAt?: string;
}

interface FormValues {
  name?: string;
  reason?: string;
}

interface SettingsClientProps {
  session: SessionUser;
}

type TabKey =
  | "cancellation-reasons"
  | "systems"
  | "governorates"
  | "appearance";

export default function SettingsClient({ session }: SettingsClientProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [activeTab, setActiveTab] = useState<TabKey>("cancellation-reasons");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);

  const [cancellationReasons, setCancellationReasons] = useState<ListItem[]>(
    []
  );
  const [systems, setSystems] = useState<ListItem[]>([]);
  const [governoratesData, setGovernoratesData] = useState<ListItem[]>([]);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const canManage = session.role === "admin" || session.role === "moderator";
  const canDelete = session.role === "admin";

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = "";
      let setter: (data: ListItem[]) => void = () => {};

      switch (activeTab) {
        case "cancellation-reasons":
          endpoint =
            "/api/settings/cancellation-reasons?includeDeactivated=true";
          setter = setCancellationReasons;
          break;
        case "systems":
          endpoint = "/api/settings/systems?includeDeactivated=true";
          setter = setSystems;
          break;
        case "governorates":
          endpoint = "/api/settings/governorates?includeDeactivated=true";
          setter = setGovernoratesData;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const items = data.reasons || data.systems || data.governorates || [];
        setter(items);
      } else {
        message.error("Failed to fetch data");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (item: ListItem) => {
    setEditingItem(item);
    if (activeTab === "cancellation-reasons") {
      form.setFieldsValue({ reason: item.reason });
    } else {
      form.setFieldsValue({ name: item.name });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (item: ListItem) => {
    const itemName = item.name || item.reason || "";
    modal.confirm({
      title: "Deactivate Item",
      content: `Are you sure you want to deactivate "${itemName}"?`,
      okText: "Deactivate",
      okType: "danger",
      onOk: async () => {
        try {
          let endpoint = "";
          switch (activeTab) {
            case "cancellation-reasons":
              endpoint = `/api/settings/cancellation-reasons/${item.id}`;
              break;
            case "systems":
              endpoint = `/api/settings/systems/${item.id}`;
              break;
            case "governorates":
              endpoint = `/api/settings/governorates/${item.id}`;
              break;
          }

          const response = await fetch(endpoint, { method: "DELETE" });

          if (response.ok) {
            message.success("Item deactivated successfully");
            fetchData();
          } else {
            const data = await response.json();
            message.error(data.error || "Failed to deactivate item");
          }
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to deactivate item");
        }
      },
    });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      // Auto-populate Arabic fields with English values
      const payload =
        activeTab === "cancellation-reasons"
          ? { reason: values.reason }
          : { name: values.name };

      let endpoint = "";
      const method = editingItem ? "PUT" : "POST";

      switch (activeTab) {
        case "cancellation-reasons":
          endpoint = editingItem
            ? `/api/settings/cancellation-reasons/${editingItem.id}`
            : "/api/settings/cancellation-reasons";
          break;
        case "systems":
          endpoint = editingItem
            ? `/api/settings/systems/${editingItem.id}`
            : "/api/settings/systems";
          break;
        case "governorates":
          endpoint = editingItem
            ? `/api/settings/governorates/${editingItem.id}`
            : "/api/settings/governorates";
          break;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success(
          editingItem
            ? "Item updated successfully"
            : "Item created successfully"
        );
        setIsModalOpen(false);
        form.resetFields();
        fetchData();
      } else {
        const data = await response.json();
        message.error(data.error || "Failed to save item");
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Failed to save item");
    }
  };

  const getColumns = (): ColumnsType<ListItem> => {
    const isReasons = activeTab === "cancellation-reasons";
    const nameField = isReasons ? "reason" : "name";

    return [
      {
        title: "Name",
        dataIndex: nameField,
        key: nameField,
        width: 300,
      },
      {
        title: "Created By",
        dataIndex: "createdByName",
        key: "createdByName",
        width: 150,
        render: (name: string) => name || "-",
      },
      {
        title: "Created At",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
      },
      {
        title: "Status",
        dataIndex: "deactivatedAt",
        key: "status",
        width: 100,
        render: (deactivatedAt: string) =>
          deactivatedAt ? (
            <Text type="danger">Deactivated</Text>
          ) : (
            <Text type="success">Active</Text>
          ),
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right" as const,
        width: 120,
        render: (_: any, record: ListItem) => (
          <Space size="small">
            {canManage && !record.deactivatedAt && (
              <Tooltip title="Edit">
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                  size="small"
                />
              </Tooltip>
            )}
            {canDelete && !record.deactivatedAt && (
              <Tooltip title="Deactivate">
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                  size="small"
                />
              </Tooltip>
            )}
          </Space>
        ),
      },
    ];
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case "cancellation-reasons":
        return cancellationReasons;
      case "systems":
        return systems;
      case "governorates":
        return governoratesData;
      default:
        return [];
    }
  };

  const getModalTitle = () => {
    const action = editingItem ? "Edit" : "Add";
    switch (activeTab) {
      case "cancellation-reasons":
        return `${action} Cancellation Reason`;
      case "systems":
        return `${action} System`;
      case "governorates":
        return `${action} Governorate`;
      default:
        return action;
    }
  };

  const tabItems = [
    {
      key: "cancellation-reasons",
      label: "Cancellation Reasons",
      children: (
        <div>
          <Space
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Manage Cancellation Reasons
            </Title>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchData}>
                Refresh
              </Button>
              {canManage && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add Reason
                </Button>
              )}
            </Space>
          </Space>

          <Table
            columns={getColumns()}
            dataSource={getCurrentData()}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`,
            }}
          />
        </div>
      ),
    },
    {
      key: "systems",
      label: "Systems",
      children: (
        <div>
          <Space
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Manage Systems
            </Title>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchData}>
                Refresh
              </Button>
              {canManage && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add System
                </Button>
              )}
            </Space>
          </Space>

          <Table
            columns={getColumns()}
            dataSource={getCurrentData()}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`,
            }}
          />
        </div>
      ),
    },
    {
      key: "governorates",
      label: "Governorates",
      children: (
        <div>
          <Space
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Manage Governorates
            </Title>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchData}>
                Refresh
              </Button>
              {canManage && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add Governorate
                </Button>
              )}
            </Space>
          </Space>

          <Table
            columns={getColumns()}
            dataSource={getCurrentData()}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} items`,
            }}
          />
        </div>
      ),
    },
    {
      key: "appearance",
      label: "Appearance",
      children: (
        <div>
          <Title level={4} style={{ marginBottom: 24 }}>
            Appearance Settings
          </Title>

          <Card>
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <div>
                <Space align="center">
                  <BulbOutlined style={{ fontSize: 24 }} />
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      Theme
                    </Title>
                    <Text type="secondary">
                      Switch between light and dark mode
                    </Text>
                  </div>
                </Space>
              </div>

              <Space align="center">
                <Text>Light</Text>
                <Switch
                  checked={isDarkMode}
                  onChange={setIsDarkMode}
                  checkedChildren="Dark"
                  unCheckedChildren="Light"
                />
                <Text>Dark</Text>
              </Space>

              <Text type="secondary" style={{ fontSize: 12 }}>
                Note: Theme switching functionality will be implemented soon.
                This toggle is a placeholder for now.
              </Text>
            </Space>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Settings
      </Title>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={tabItems}
      />

      <Modal
        title={getModalTitle()}
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
          {activeTab === "cancellation-reasons" ? (
            <>
              <Form.Item
                name="reason"
                label="Cancellation Reason"
                rules={[
                  {
                    required: true,
                    message: "Please enter cancellation reason",
                  },
                ]}
              >
                <Input placeholder="Enter cancellation reason" />
              </Form.Item>
            </>
          ) : (
            <>
              <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: "Please enter name" }]}
              >
                <Input placeholder="Enter name" />
              </Form.Item>
            </>
          )}

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
                {editingItem ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
