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
  Typography,
  Tooltip,
  Checkbox,
  Upload,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UploadOutlined,
  ClearOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import type { SessionUser } from "@/lib/auth/session";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";

const { Title } = Typography;

interface InstallmentOrder {
  id: number;
  orderNumber: string;
  installmentId: string;
  isAddedToMagento: boolean;
  cardholderName?: string;
  cardholderMotherName?: string;
  cardholderPhoneNumber?: string;
  employeeName: string;
  createdAt: string;
  updatedAt: string;
}

interface FormValues {
  orderNumber: string;
  installmentId: string;
}

interface InstallmentOrdersClientProps {
  session: SessionUser;
}

export default function InstallmentOrdersClient({
  session,
}: InstallmentOrdersClientProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [orders, setOrders] = useState<InstallmentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<InstallmentOrder | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const isAdminOrModerator =
    session.role === "admin" || session.role === "moderator";

  useEffect(() => {
    fetchOrders();
  }, [searchText]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);

      const response = await fetch(`/api/installment-orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else {
        message.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (order: InstallmentOrder) => {
    setEditingOrder(order);
    form.setFieldsValue({
      orderNumber: order.orderNumber,
      installmentId: order.installmentId,
    });
    setIsModalOpen(true);
  };

  const handleToggleMagento = async (order: InstallmentOrder) => {
    try {
      const response = await fetch(`/api/installment-orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          installmentId: order.installmentId,
          isAddedToMagento: !order.isAddedToMagento,
          // Keep existing cardholder data
          cardholderName: order.cardholderName,
          cardholderMotherName: order.cardholderMotherName,
          cardholderPhoneNumber: order.cardholderPhoneNumber,
        }),
      });

      if (response.ok) {
        message.success(
          order.isAddedToMagento ? "Removed from Magento" : "Added to Magento"
        );
        fetchOrders();
      } else {
        const data = await response.json();
        message.error(data.error || "Failed to update");
      }
    } catch (error) {
      console.error("Toggle Magento error:", error);
      message.error("Failed to update");
    }
  };

  const handleCopyInstallmentData = (order: InstallmentOrder) => {
    const text = `رقم الفاتورة: ${order.installmentId}
اسم صاحب البطاقة: ${order.cardholderName || "-"}
اسم ام صاحب البطاقة: ${order.cardholderMotherName || "-"}
رقم الهاتف: ${order.cardholderPhoneNumber || "-"}`;

    navigator.clipboard.writeText(text).then(
      () => {
        message.success("Installment data copied to clipboard!");
      },
      (err) => {
        console.error("Copy failed:", err);
        message.error("Failed to copy data");
      }
    );
  };

  const handleDelete = (order: InstallmentOrder) => {
    modal.confirm({
      title: "Permanently Delete Order",
      content: `Are you sure you want to permanently delete order ${order.orderNumber}? This action CANNOT be undone.`,
      okText: "Delete Permanently",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/installment-orders/${order.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("Order permanently deleted");
            fetchOrders();
          } else {
            const data = await response.json();
            message.error(data.error || "Failed to delete order");
          }
        } catch (error) {
          console.error("Delete error:", error);
          message.error("Failed to delete order");
        }
      },
    });
  };

  const handleBulkDelete = () => {
    modal.confirm({
      title: "Delete All Orders",
      content: `Are you sure you want to permanently delete ALL ${orders.length} orders? This action CANNOT be undone and is typically done at the end of each day.`,
      okText: "Delete All Permanently",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch("/api/installment-orders/bulk-delete", {
            method: "DELETE",
          });

          if (response.ok) {
            const data = await response.json();
            message.success(data.message);
            fetchOrders();
          } else {
            const data = await response.json();
            message.error(data.error || "Failed to delete orders");
          }
        } catch (error) {
          console.error("Bulk delete error:", error);
          message.error("Failed to delete orders");
        }
      },
    });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const url = editingOrder
        ? `/api/installment-orders/${editingOrder.id}`
        : "/api/installment-orders";

      const method = editingOrder ? "PUT" : "POST";

      const payload = {
        orderNumber: values.orderNumber,
        installmentId: values.installmentId,
        isAddedToMagento: false, // Default to false on creation
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success(
          editingOrder
            ? "Order updated successfully"
            : "Order created successfully"
        );
        setIsModalOpen(false);
        form.resetFields();
        fetchOrders();
      } else {
        const data = await response.json();
        message.error(data.error || "Failed to save order");
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Failed to save order");
    }
  };

  const handleImport = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/installment-orders/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        modal.success({
          title: "Import Completed",
          content: (
            <div>
              <p>✅ Updated: {data.updated} orders</p>
              <p>❌ Not found: {data.notFound} orders</p>
              <p>📊 Total rows: {data.total}</p>
              {data.errors && data.errors.length > 0 && (
                <>
                  <p style={{ marginTop: 16, fontWeight: "bold" }}>Errors:</p>
                  <ul style={{ maxHeight: 200, overflow: "auto" }}>
                    {data.errors.map((err: string, idx: number) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          ),
        });
        fetchOrders();
        setFileList([]);
      } else {
        message.error(data.error || "Failed to import data");
      }
    } catch (error) {
      console.error("Import error:", error);
      message.error(
        "Failed to import data. Make sure the file format is correct."
      );
    } finally {
      setUploading(false);
    }
  };

  const columns: ColumnsType<InstallmentOrder> = [
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 150,
      fixed: "left" as const,
    },
    {
      title: "Installment ID",
      dataIndex: "installmentId",
      key: "installmentId",
      width: 150,
    },
    {
      title: "Add to Magento",
      dataIndex: "isAddedToMagento",
      key: "isAddedToMagento",
      width: 150,
      align: "center" as const,
      render: (added: boolean, record: InstallmentOrder) => (
        <Checkbox
          checked={added}
          onChange={() => handleToggleMagento(record)}
          disabled={added && !isAdminOrModerator} // Users cannot uncheck once added
        />
      ),
    },
    {
      title: "Cardholder Name",
      dataIndex: "cardholderName",
      key: "cardholderName",
      width: 180,
      render: (name: string) => name || "-",
    },
    {
      title: "Mother's Name",
      dataIndex: "cardholderMotherName",
      key: "cardholderMotherName",
      width: 180,
      render: (name: string) => name || "-",
    },
    {
      title: "Phone Number",
      dataIndex: "cardholderPhoneNumber",
      key: "cardholderPhoneNumber",
      width: 150,
      render: (phone: string) => phone || "-",
    },
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      width: 150,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 140,
      render: (_: any, record: InstallmentOrder) => {
        // If added to Magento and user is not admin/moderator, show only copy button
        if (record.isAddedToMagento && !isAdminOrModerator) {
          return (
            <Space size="small">
              <Tooltip title="Copy Installment Data">
                <Button
                  type="link"
                  icon={<CopyOutlined />}
                  onClick={() => handleCopyInstallmentData(record)}
                  size="small"
                />
              </Tooltip>
            </Space>
          );
        }

        return (
          <Space size="small">
            <Tooltip title="Copy Installment Data">
              <Button
                type="link"
                icon={<CopyOutlined />}
                onClick={() => handleCopyInstallmentData(record)}
                size="small"
              />
            </Tooltip>
            <Tooltip
              title={
                record.isAddedToMagento ? "Edit (Added to Magento)" : "Edit"
              }
            >
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
                disabled={record.isAddedToMagento && !isAdminOrModerator}
              />
            </Tooltip>
            {isAdminOrModerator && (
              <Tooltip title="Delete Permanently">
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
        );
      },
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
          Installment Orders
        </Title>
        <Space wrap>
          <Input
            placeholder="Search by order, installment ID, or cardholder"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 350 }}
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={fetchOrders}>
            Refresh
          </Button>
          <Upload
            fileList={fileList}
            beforeUpload={(file) => {
              handleImport(file);
              return false;
            }}
            onChange={({ fileList }) => setFileList(fileList)}
            accept=".xlsx,.xls"
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              Import Excel
            </Button>
          </Upload>
          {isAdminOrModerator && orders.length > 0 && (
            <Button danger icon={<ClearOutlined />} onClick={handleBulkDelete}>
              Delete All ({orders.length})
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Order
          </Button>
        </Space>
      </Space>

      {isAdminOrModerator && (
        <Alert
          message="Daily Cleanup Reminder"
          description="Remember to delete all orders at the end of each day using the 'Delete All' button."
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1400 }}
        rowClassName={(record) =>
          record.isAddedToMagento ? "magento-added-row" : ""
        }
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} orders`,
        }}
      />

      <style jsx global>{`
        .magento-added-row td {
          background-color: #f7f6beff !important;
        }
      `}</style>

      <Modal
        title={
          editingOrder ? "Edit Installment Order" : "Add Installment Order"
        }
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
            name="orderNumber"
            label="Order Number"
            rules={[{ required: true, message: "Please enter order number" }]}
          >
            <Input placeholder="Enter order number" />
          </Form.Item>

          <Form.Item
            name="installmentId"
            label="Installment ID"
            rules={[{ required: true, message: "Please enter installment ID" }]}
          >
            <Input placeholder="Enter installment ID (رقم الفاتورة)" />
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
                {editingOrder ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
