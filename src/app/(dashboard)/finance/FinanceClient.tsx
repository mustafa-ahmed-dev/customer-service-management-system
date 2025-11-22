"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  App,
  Tag,
  InputNumber,
  Alert,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import type { SessionUser } from "@/lib/auth/session";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;

interface FinanceTransaction {
  id: number;
  phoneNumber: string;
  orderNumber?: string;
  customerName: string;
  paymentMethodId: number;
  paymentMethodName: string;
  amount: string;
  status: string;
  notes?: string;
  employeeName: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentMethod {
  id: number;
  name: string;
}

interface FormValues {
  phoneNumber: string;
  orderNumber?: string;
  customerName: string;
  paymentMethodId: number;
  amount: number;
  status: string;
  notes?: string;
}

interface FinanceClientProps {
  session: SessionUser;
}

export default function FinanceClient({ session }: FinanceClientProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<FinanceTransaction | null>(null);

  // Check if user has full finance access
  const hasFullAccess = session.hasFinanceAccess;

  useEffect(() => {
    fetchTransactions();
    fetchPaymentMethods();
  }, [searchText, statusFilter, paymentMethodFilter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      if (statusFilter) params.append("status", statusFilter);
      if (paymentMethodFilter)
        params.append("paymentMethodId", paymentMethodFilter);

      const response = await fetch(`/api/finance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      } else {
        message.error("Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      message.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/finance/options");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    }
  };

  const handleAdd = () => {
    if (!hasFullAccess) {
      message.warning("You don't have permission to add transactions");
      return;
    }
    setEditingTransaction(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (transaction: FinanceTransaction) => {
    if (!hasFullAccess) {
      message.warning("You don't have permission to edit transactions");
      return;
    }
    setEditingTransaction(transaction);
    form.setFieldsValue({
      phoneNumber: transaction.phoneNumber,
      orderNumber: transaction.orderNumber,
      customerName: transaction.customerName,
      paymentMethodId: transaction.paymentMethodId,
      amount: parseFloat(transaction.amount),
      status: transaction.status,
      notes: transaction.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (session.role !== "admin") {
      message.warning("Only admins can delete transactions");
      return;
    }

    modal.confirm({
      title: "Delete Transaction",
      content: "Are you sure you want to delete this transaction?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/finance/${id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("Transaction deleted successfully");
            fetchTransactions();
          } else {
            message.error("Failed to delete transaction");
          }
        } catch (error) {
          console.error("Failed to delete transaction:", error);
          message.error("Failed to delete transaction");
        }
      },
    });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const url = editingTransaction
        ? `/api/finance/${editingTransaction.id}`
        : "/api/finance";
      const method = editingTransaction ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(
          `Transaction ${
            editingTransaction ? "updated" : "created"
          } successfully`
        );
        setIsModalOpen(false);
        form.resetFields();
        fetchTransactions();
      } else {
        const data = await response.json();
        message.error(data.error || "Failed to save transaction");
      }
    } catch (error) {
      console.error("Failed to save transaction:", error);
      message.error("Failed to save transaction");
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "orange",
      completed: "green",
      failed: "red",
      cancelled: "default",
    };
    return colors[status] || "default";
  };

  const columns: ColumnsType<FinanceTransaction> = [
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      width: 150,
    },
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 150,
      render: (text) => text || "-",
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      width: 200,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethodName",
      key: "paymentMethodName",
      width: 150,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amount) => `IQD ${parseFloat(amount).toLocaleString()}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      width: 200,
      ellipsis: true,
      render: (text) => text || "-",
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
      render: (date) => new Date(date).toLocaleString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, record) => (
        <Space>
          {hasFullAccess && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          )}
          {session.role === "admin" && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, marginBottom: 16 }}>
          <DollarOutlined /> Finance Management
        </h1>

        {!hasFullAccess && (
          <Alert
            message="View-Only Access"
            description="You can view finance transactions but cannot create, edit, or delete them. Contact an administrator to request full finance access."
            type="info"
            showIcon
            closable
            style={{ marginBottom: 16 }}
          />
        )}

        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Search by phone, order, or customer..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Input
            placeholder="Filter by status"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Filter by payment method"
            style={{ width: 200 }}
            value={paymentMethodFilter || undefined}
            onChange={setPaymentMethodFilter}
            allowClear
          >
            {paymentMethods.map((method) => (
              <Select.Option key={method.id} value={method.id.toString()}>
                {method.name}
              </Select.Option>
            ))}
          </Select>
          {hasFullAccess && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Transaction
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={transactions}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} transactions`,
        }}
      />

      <Modal
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="07XXXXXXXXX" />
          </Form.Item>

          <Form.Item label="Order Number (Optional)" name="orderNumber">
            <Input placeholder="Order number if applicable" />
          </Form.Item>

          <Form.Item
            label="Customer Name"
            name="customerName"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input placeholder="Customer full name" />
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="paymentMethodId"
            rules={[
              { required: true, message: "Please select payment method" },
            ]}
          >
            <Select placeholder="Select payment method">
              {paymentMethods.map((method) => (
                <Select.Option key={method.id} value={method.id}>
                  {method.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Amount (IQD)"
            name="amount"
            rules={[
              { required: true, message: "Please enter amount" },
              { type: "number", min: 0, message: "Amount must be positive" },
            ]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter amount"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value!.replace(/\$\s?|(,*)/g, "")}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: "Please enter status" }]}
          >
            <Input placeholder="e.g., pending, completed, failed..." />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingTransaction ? "Update" : "Create"}
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
