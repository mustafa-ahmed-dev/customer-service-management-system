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
  Switch,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  InboxOutlined,
  ReloadOutlined,
  UndoOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { SessionUser } from "@/lib/auth/session";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

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
  employeeId: number;
  employeeName: string;
  notes?: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

interface PaymentMethod {
  id: number;
  name: string;
}

interface User {
  id: number;
  fullName: string;
  role: string;
}

interface FormValues {
  phoneNumber: string;
  orderNumber?: string;
  customerName: string;
  paymentMethodId: number;
  amount: number;
  status: string;
  employeeId: number;
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnarchiveModalOpen, setIsUnarchiveModalOpen] = useState(false);
  const [unarchivingTransaction, setUnarchivingTransaction] =
    useState<FinanceTransaction | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<FinanceTransaction | null>(null);

  // Check if user has full finance access
  const hasFullAccess = session.hasFinanceAccess;

  useEffect(() => {
    fetchTransactions();
    fetchPaymentMethods();
  }, [searchText, statusFilter, paymentMethodFilter, showArchived]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      if (statusFilter) params.append("status", statusFilter);
      if (paymentMethodFilter)
        params.append("paymentMethodId", paymentMethodFilter);
      params.append("archived", showArchived.toString());

      console.log("Fetching with params:", params.toString()); // DEBUG
      console.log("Show archived:", showArchived); // DEBUG

      const response = await fetch(`/api/finance?${params}`);

      console.log("Response status:", response.status); // DEBUG

      if (response.ok) {
        const data = await response.json();
        console.log("Received data:", data); // DEBUG
        console.log("Transactions count:", data.transactions?.length); // DEBUG
        setTransactions(data.transactions);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData); // DEBUG
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
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch options:", error);
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
      employeeId: transaction.employeeId,
      notes: transaction.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    if (!hasFullAccess) {
      message.warning("You don't have permission to archive transactions");
      return;
    }

    modal.confirm({
      title: "Archive Transaction",
      content: "Are you sure you want to archive this transaction?",
      okText: "Archive",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/finance/${id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("Transaction archived successfully");
            fetchTransactions();
          } else {
            message.error("Failed to archive transaction");
          }
        } catch (error) {
          console.error("Failed to archive transaction:", error);
          message.error("Failed to archive transaction");
        }
      },
    });
  };

  const handleUnarchive = (transaction: FinanceTransaction) => {
    if (!hasFullAccess) {
      message.warning("You don't have permission to unarchive transactions");
      return;
    }
    setUnarchivingTransaction(transaction);
    setIsUnarchiveModalOpen(true);
  };

  const handleUnarchiveSubmit = async (values: { unarchiveNote: string }) => {
    if (!unarchivingTransaction) return;

    try {
      const response = await fetch(
        `/api/finance/${unarchivingTransaction.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unarchiveNote: values.unarchiveNote }),
        }
      );

      if (response.ok) {
        message.success("Transaction unarchived successfully");
        setIsUnarchiveModalOpen(false);
        form.resetFields();
        fetchTransactions();
      } else {
        const data = await response.json();
        message.error(data.error || "Failed to unarchive transaction");
      }
    } catch (error) {
      console.error("Failed to unarchive transaction:", error);
      message.error("Failed to unarchive transaction");
    }
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      message.warning("No transactions to export");
      return;
    }

    try {
      const headers = [
        "ID",
        "Phone Number",
        "Order Number",
        "Customer Name",
        "Payment Method",
        "Amount (IQD)",
        "Status",
        "Employee",
        "Created By",
        "Notes",
        "Created At",
        "Updated At",
        ...(showArchived ? ["Archived At"] : []),
      ];

      const rows = transactions.map((transaction) => [
        transaction.id,
        transaction.phoneNumber,
        transaction.orderNumber || "",
        transaction.customerName,
        transaction.paymentMethodName,
        parseFloat(transaction.amount).toFixed(2),
        transaction.status,
        transaction.employeeName,
        transaction.createdByName,
        transaction.notes || "",
        new Date(transaction.createdAt).toLocaleString(),
        new Date(transaction.updatedAt).toLocaleString(),
        ...(showArchived && transaction.archivedAt
          ? [new Date(transaction.archivedAt).toLocaleString()]
          : showArchived
          ? [""]
          : []),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `finance_transactions_${
          showArchived ? "archived_" : ""
        }${dayjs().format("YYYY-MM-DD_HHmm")}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success(
        `Exported ${transactions.length} transaction${
          transactions.length !== 1 ? "s" : ""
        } to CSV`
      );
    } catch (error) {
      console.error("Export to CSV error:", error);
      message.error("Failed to export CSV");
    }
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
      title: "Created By",
      dataIndex: "createdByName",
      key: "createdByName",
      width: 150,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date) => new Date(date).toLocaleString(),
    },
    ...(showArchived
      ? [
          {
            title: "Archived At",
            dataIndex: "archivedAt",
            key: "archivedAt",
            width: 180,
            render: (date: string) =>
              date ? new Date(date).toLocaleString() : "-",
          },
        ]
      : []),
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: FinanceTransaction) => (
        <Space>
          {hasFullAccess && !showArchived && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
              />
            </>
          )}
          {hasFullAccess && showArchived && (
            <Button
              type="link"
              icon={<UndoOutlined />}
              onClick={() => handleUnarchive(record)}
            >
              Unarchive
            </Button>
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
          <Space>
            <InboxOutlined />
            <Switch
              checked={showArchived}
              onChange={setShowArchived}
              checkedChildren="Archived"
              unCheckedChildren="Active"
            />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={fetchTransactions}>
            Refresh
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportToCSV}>
            Export CSV
          </Button>
          {hasFullAccess && !showArchived && (
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
            label="Employee"
            name="employeeId"
            rules={[{ required: true, message: "Please select employee" }]}
          >
            <Select
              placeholder="Select employee handling this transaction"
              showSearch
              filterOption={(input, option) =>
                (option?.children as string)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {users.map((user) => (
                <Select.Option key={user.id} value={user.id}>
                  {user.fullName} ({user.role})
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

      {/* Unarchive Modal */}
      <Modal
        title="Unarchive Transaction"
        open={isUnarchiveModalOpen}
        onCancel={() => {
          setIsUnarchiveModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Alert
          message="Unarchive Reason Required"
          description="Please provide a reason for unarchiving this transaction. This note will be appended to the transaction notes."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical" onFinish={handleUnarchiveSubmit}>
          <Form.Item
            label="Unarchive Reason"
            name="unarchiveNote"
            rules={[
              { required: true, message: "Please enter unarchive reason" },
              { min: 10, message: "Reason must be at least 10 characters" },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Explain why this transaction is being unarchived..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Unarchive
              </Button>
              <Button
                onClick={() => {
                  setIsUnarchiveModalOpen(false);
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
