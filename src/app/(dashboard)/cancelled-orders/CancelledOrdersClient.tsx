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
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CopyOutlined,
  ReloadOutlined,
  InboxOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { SessionUser } from "@/lib/auth/session";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title } = Typography;
const { TextArea } = Input;

interface CancelledOrder {
  id: number;
  orderNumber: string;
  cancellationReason: string;
  systemName: string;
  paymentMethod: string;
  cardholderName?: string;
  totalAmount?: string;
  notes?: string;
  employeeName: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  archivedAt?: string;
}

interface DropdownOption {
  id: number;
  name?: string;
  reason?: string;
}

interface FormValues {
  orderNumber: string;
  cancellationReasonId: number;
  systemId: number;
  paymentMethod: string;
  cardholderName?: string;
  totalAmount?: number;
  notes?: string;
}

interface CancelledOrdersClientProps {
  session: SessionUser;
}

const PAYMENT_METHODS = [
  "Cash on Delivery",
  "Pay in Installment",
  "Pay using Visa/Master card",
  "Zain Cash",
];

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  "Cash on Delivery": "green",
  "Pay in Installment": "blue",
  "Pay using Visa/Master card": "purple",
  "Zain Cash": "orange",
};

export default function CancelledOrdersClient({
  session,
}: CancelledOrdersClientProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [orders, setOrders] = useState<CancelledOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [paymentMethodFilters, setPaymentMethodFilters] = useState<string[]>(
    []
  );
  const [systemFilters, setSystemFilters] = useState<number[]>([]);
  const [reasonFilters, setReasonFilters] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CancelledOrder | null>(null);

  const [systems, setSystems] = useState<DropdownOption[]>([]);
  const [cancellationReasons, setCancellationReasons] = useState<
    DropdownOption[]
  >([]);

  // Watch payment method to show/hide conditional fields
  const selectedPaymentMethod = Form.useWatch("paymentMethod", form);

  // Fetch dropdown options
  useEffect(() => {
    fetchOptions();
  }, []);

  // Fetch orders when filters change
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchText,
    showArchived,
    paymentMethodFilters,
    systemFilters,
    reasonFilters,
  ]);

  const fetchOptions = async () => {
    try {
      const response = await fetch("/api/cancelled-orders/options");
      if (response.ok) {
        const data = await response.json();
        setSystems(data.systems);
        setCancellationReasons(data.cancellationReasons);
      }
    } catch (error) {
      console.error("Failed to fetch options:", error);
      message.error("Failed to load dropdown options");
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      params.append("archived", showArchived.toString());
      if (paymentMethodFilters.length > 0) {
        params.append("paymentMethods", paymentMethodFilters.join(","));
      }
      if (systemFilters.length > 0) {
        params.append("systemIds", systemFilters.join(","));
      }
      if (reasonFilters.length > 0) {
        params.append("reasonIds", reasonFilters.join(","));
      }

      const response = await fetch(`/api/cancelled-orders?${params}`);
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

  const handleEdit = (order: CancelledOrder) => {
    setEditingOrder(order);
    const system = systems.find((s) => s.name === order.systemName);
    const reason = cancellationReasons.find(
      (r) => r.reason === order.cancellationReason
    );

    form.setFieldsValue({
      orderNumber: order.orderNumber,
      systemId: system?.id,
      cancellationReasonId: reason?.id,
      paymentMethod: order.paymentMethod,
      cardholderName: order.cardholderName,
      totalAmount: order.totalAmount
        ? parseFloat(order.totalAmount)
        : undefined,
      notes: order.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (order: CancelledOrder) => {
    modal.confirm({
      title: "Delete Order",
      content: `Are you sure you want to delete order ${order.orderNumber}?`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/cancelled-orders/${order.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("Order deleted successfully");
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

  const handleSubmit = async (values: FormValues) => {
    try {
      const url = editingOrder
        ? `/api/cancelled-orders/${editingOrder.id}`
        : "/api/cancelled-orders";

      const method = editingOrder ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
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

  const copyTableToClipboard = async () => {
    try {
      const headers = [
        "Order Number",
        "System",
        "Payment Method",
        "Cancellation Reason",
        "Cardholder Name",
        "Total Amount",
        "Employee",
      ];

      const rows = orders.map((order) => [
        order.orderNumber,
        order.systemName,
        order.paymentMethod,
        order.cancellationReason,
        order.cardholderName || "-",
        order.totalAmount
          ? `$${parseFloat(order.totalAmount).toFixed(2)}`
          : "-",
        order.employeeName,
      ]);

      const table = document.createElement("table");
      table.style.borderCollapse = "collapse";
      table.style.width = "100%";
      table.style.fontFamily = "Arial, sans-serif";
      table.style.fontSize = "14px";
      table.style.border = "2px solid #333";

      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      headerRow.style.backgroundColor = "#4285f4";
      headerRow.style.color = "white";

      headers.forEach((header) => {
        const th = document.createElement("th");
        th.textContent = header;
        th.style.border = "1px solid #333";
        th.style.padding = "10px";
        th.style.textAlign = "center";
        th.style.fontWeight = "bold";
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      rows.forEach((row, index) => {
        const tr = document.createElement("tr");
        tr.style.backgroundColor = index % 2 === 0 ? "#f0f0f0" : "#ffffff";

        row.forEach((cell) => {
          const td = document.createElement("td");
          td.textContent = cell;
          td.style.border = "1px solid #333";
          td.style.padding = "8px";
          td.style.textAlign = "center";
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);

      table.style.position = "fixed";
      table.style.left = "-9999px";
      document.body.appendChild(table);

      const range = document.createRange();
      range.selectNode(table);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);

      document.execCommand("copy");

      window.getSelection()?.removeAllRanges();
      document.body.removeChild(table);

      message.success("Table copied! Paste it into Gmail.");
    } catch (error) {
      console.error("Copy to clipboard error:", error);
      message.error("Failed to copy table to clipboard");
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        "Order Number",
        "System",
        "Payment Method",
        "Cancellation Reason",
        "Cardholder Name",
        "Total Amount",
        "Notes",
        "Employee",
      ];

      const rows = orders.map((order) => [
        order.orderNumber,
        order.systemName,
        order.paymentMethod,
        order.cancellationReason,
        order.cardholderName || "",
        order.totalAmount ? parseFloat(order.totalAmount).toFixed(2) : "",
        order.notes || "",
        order.employeeName,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `cancelled_orders_${dayjs().format("YYYY-MM-DD")}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("CSV file downloaded!");
    } catch (error) {
      console.error("Export to CSV error:", error);
      message.error("Failed to export CSV");
    }
  };

  const columns: ColumnsType<CancelledOrder> = [
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 150,
      fixed: "left" as const,
    },
    {
      title: "System",
      dataIndex: "systemName",
      key: "systemName",
      width: 120,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      width: 180,
      render: (method: string) => (
        <Tag color={PAYMENT_METHOD_COLORS[method] || "default"}>{method}</Tag>
      ),
    },
    {
      title: "Cancellation Reason",
      dataIndex: "cancellationReason",
      key: "cancellationReason",
      width: 200,
    },
    {
      title: "Cardholder Name",
      dataIndex: "cardholderName",
      key: "cardholderName",
      width: 150,
      render: (name: string) => name || "-",
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 120,
      render: (amount: string) =>
        amount ? `$${parseFloat(amount).toFixed(2)}` : "-",
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      width: 150,
      ellipsis: true,
      render: (notes: string) => notes || "-",
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
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD HH:mm"),
    },
    ...(showArchived
      ? [
          {
            title: "Archived At",
            dataIndex: "archivedAt",
            key: "archivedAt",
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
      render: (_: any, record: CancelledOrder) => (
        <Space size="small">
          {!showArchived && (
            <Tooltip title="Edit">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
              />
            </Tooltip>
          )}
          {session.role === "admin" && !showArchived && (
            <Tooltip title="Delete">
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
          Cancelled Orders
        </Title>
        <Space wrap>
          <Input
            placeholder="Search by order number, employee, or cardholder"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 350 }}
            allowClear
          />
          <Select
            mode="multiple"
            placeholder="Filter by payment method"
            value={paymentMethodFilters}
            onChange={setPaymentMethodFilters}
            style={{ minWidth: 250 }}
            allowClear
            maxTagCount="responsive"
          >
            {PAYMENT_METHODS.map((method) => (
              <Select.Option key={method} value={method}>
                {method}
              </Select.Option>
            ))}
          </Select>
          <Select
            mode="multiple"
            placeholder="Filter by system"
            value={systemFilters}
            onChange={setSystemFilters}
            style={{ minWidth: 200 }}
            allowClear
            maxTagCount="responsive"
          >
            {systems.map((system) => (
              <Select.Option key={system.id} value={system.id}>
                {system.name}
              </Select.Option>
            ))}
          </Select>
          <Select
            mode="multiple"
            placeholder="Filter by cancellation reason"
            value={reasonFilters}
            onChange={setReasonFilters}
            style={{ minWidth: 250 }}
            allowClear
            maxTagCount="responsive"
          >
            {cancellationReasons.map((reason) => (
              <Select.Option key={reason.id} value={reason.id}>
                {reason.reason}
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
          <Button icon={<ReloadOutlined />} onClick={fetchOrders}>
            Refresh
          </Button>
          <Button icon={<CopyOutlined />} onClick={copyTableToClipboard}>
            Copy Table
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportToCSV}>
            Export CSV
          </Button>
          {!showArchived && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Order
            </Button>
          )}
        </Space>
      </Space>

      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1800 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} orders`,
        }}
      />

      <Modal
        title={editingOrder ? "Edit Cancelled Order" : "Add Cancelled Order"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
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
            name="systemId"
            label="System"
            rules={[{ required: true, message: "Please select a system" }]}
          >
            <Select placeholder="Select system">
              {systems.map((system) => (
                <Select.Option key={system.id} value={system.id}>
                  {system.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[
              { required: true, message: "Please select payment method" },
            ]}
          >
            <Select placeholder="Select payment method">
              {PAYMENT_METHODS.map((method) => (
                <Select.Option key={method} value={method}>
                  {method}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="cancellationReasonId"
            label="Cancellation Reason"
            rules={[
              { required: true, message: "Please select cancellation reason" },
            ]}
          >
            <Select placeholder="Select cancellation reason" showSearch>
              {cancellationReasons.map((reason) => (
                <Select.Option key={reason.id} value={reason.id}>
                  {reason.reason}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Conditional fields - only show for "Pay in Installment" */}
          {selectedPaymentMethod === "Pay in Installment" && (
            <>
              <Form.Item
                name="cardholderName"
                label="Cardholder Name"
                rules={[
                  {
                    required: true,
                    message: "Please enter cardholder name",
                  },
                ]}
              >
                <Input placeholder="Enter cardholder name" />
              </Form.Item>

              <Form.Item
                name="totalAmount"
                label="Total Amount"
                rules={[
                  { required: true, message: "Please enter total amount" },
                  {
                    type: "number",
                    min: 0,
                    message: "Amount must be positive",
                  },
                ]}
              >
                <InputNumber
                  placeholder="Enter amount"
                  style={{ width: "100%" }}
                  prefix="$"
                  precision={2}
                  min={0}
                />
              </Form.Item>

              <Form.Item name="notes" label="Notes (Optional)">
                <TextArea
                  placeholder="Enter any additional notes"
                  rows={4}
                  maxLength={500}
                  showCount
                />
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
                {editingOrder ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
