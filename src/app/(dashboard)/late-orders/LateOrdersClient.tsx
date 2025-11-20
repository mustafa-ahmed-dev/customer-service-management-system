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
  Switch,
  DatePicker,
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
const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface LateOrder {
  id: number;
  orderNumber: string;
  governorateName: string;
  orderDate: string;
  notes?: string;
  employeeName: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  archivedAt?: string;
}

interface Governorate {
  id: number;
  name: string;
}

interface FormValues {
  orderNumber: string;
  governorateId: number;
  orderDate: string;
  notes?: string;
}

interface LateOrdersClientProps {
  session: SessionUser;
}

export default function LateOrdersClient({ session }: LateOrdersClientProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [orders, setOrders] = useState<LateOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [governorateFilter, setGovernorateFilter] = useState<number | null>(
    null
  );
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<LateOrder | null>(null);

  const [governorates, setGovernorates] = useState<Governorate[]>([]);

  const isAdmin = session.role === "admin";

  useEffect(() => {
    fetchGovernorates();
    fetchOrders();
  }, [searchText, showArchived, governorateFilter, dateRange]);

  const fetchGovernorates = async () => {
    try {
      // Use existing settings API (only fetches active governorates by default)
      const response = await fetch("/api/settings/governorates");
      if (response.ok) {
        const data = await response.json();
        setGovernorates(data.governorates || []);
      } else {
        message.error("Failed to load governorates");
      }
    } catch (error) {
      console.error("Fetch governorates error:", error);
      message.error("Failed to load governorates");
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchText,
        archived: showArchived.toString(),
      });

      if (governorateFilter) {
        params.append("governorateId", governorateFilter.toString());
      }

      if (dateRange) {
        params.append("fromDate", dateRange[0]);
        params.append("toDate", dateRange[1]);
      }

      const response = await fetch(`/api/late-orders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      } else {
        message.error("Failed to fetch orders");
      }
    } catch (error) {
      console.error("Fetch orders error:", error);
      message.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const calculateDelayedDays = (orderDate: string): number => {
    const today = new Date();
    const order = new Date(orderDate);
    const diffTime = today.getTime() - order.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (order: LateOrder) => {
    setEditingOrder(order);
    form.setFieldsValue({
      orderNumber: order.orderNumber,
      governorateId: governorates.find((g) => g.name === order.governorateName)
        ?.id,
      orderDate: dayjs(order.orderDate).format("YYYY-MM-DD"),
      notes: order.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (order: LateOrder) => {
    modal.confirm({
      title: "Archive Order",
      content: `Are you sure you want to archive order ${order.orderNumber}?`,
      okText: "Archive",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/late-orders/${order.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("Order archived successfully");
            fetchOrders();
          } else {
            const data = await response.json();
            message.error(data.error || "Failed to archive order");
          }
        } catch (error) {
          console.error("Archive error:", error);
          message.error("Failed to archive order");
        }
      },
    });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const url = editingOrder
        ? `/api/late-orders/${editingOrder.id}`
        : "/api/late-orders";

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
        "Governorate",
        "Order Date",
        "Delayed Days",
        "Notes",
        "Employee",
      ];

      const rows = orders.map((order) => [
        order.orderNumber,
        order.governorateName,
        dayjs(order.orderDate).format("YYYY-MM-DD"),
        calculateDelayedDays(order.orderDate).toString(),
        order.notes || "-",
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

      message.success("Table copied! Paste it into Gmail or Word.");
    } catch (error) {
      console.error("Copy to clipboard error:", error);
      message.error("Failed to copy table to clipboard");
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        "Order Number",
        "Governorate",
        "Order Date",
        "Delayed Days",
        "Notes",
        "Employee",
        "Created At",
      ];

      const rows = orders.map((order) => [
        order.orderNumber,
        order.governorateName,
        dayjs(order.orderDate).format("YYYY-MM-DD"),
        calculateDelayedDays(order.orderDate).toString(),
        order.notes || "",
        order.employeeName,
        dayjs(order.createdAt).format("YYYY-MM-DD HH:mm"),
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
        `late_orders_${dayjs().format("YYYY-MM-DD")}.csv`
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

  const exportToExcel = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Late Orders");

      // Add headers
      worksheet.columns = [
        { header: "Order Number", key: "orderNumber", width: 20 },
        { header: "Governorate", key: "governorate", width: 20 },
        { header: "Order Date", key: "orderDate", width: 15 },
        { header: "Delayed Days", key: "delayedDays", width: 15 },
        { header: "Notes", key: "notes", width: 30 },
        { header: "Employee", key: "employee", width: 20 },
        { header: "Created At", key: "createdAt", width: 20 },
      ];

      // Style header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4285F4" },
      };
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

      // Add data
      orders.forEach((order) => {
        worksheet.addRow({
          orderNumber: order.orderNumber,
          governorate: order.governorateName,
          orderDate: dayjs(order.orderDate).format("YYYY-MM-DD"),
          delayedDays: calculateDelayedDays(order.orderDate),
          notes: order.notes || "",
          employee: order.employeeName,
          createdAt: dayjs(order.createdAt).format("YYYY-MM-DD HH:mm"),
        });
      });

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `late_orders_${dayjs().format("YYYY-MM-DD")}.xlsx`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success("Excel file downloaded!");
    } catch (error) {
      console.error("Export to Excel error:", error);
      message.error("Failed to export Excel");
    }
  };

  const columns: ColumnsType<LateOrder> = [
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 150,
      fixed: "left" as const,
    },
    {
      title: "Governorate",
      dataIndex: "governorateName",
      key: "governorateName",
      width: 150,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Order Date",
      dataIndex: "orderDate",
      key: "orderDate",
      width: 120,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
    },
    {
      title: "Delayed Days",
      key: "delayedDays",
      width: 120,
      render: (_: any, record: LateOrder) => {
        const days = calculateDelayedDays(record.orderDate);
        const color = days > 30 ? "red" : days > 14 ? "orange" : "green";
        return <Tag color={color}>{days} days</Tag>;
      },
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      width: 200,
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
      render: (_: any, record: LateOrder) => (
        <Space>
          {!showArchived && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
              {isAdmin && (
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(record)}
                />
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space
        direction="vertical"
        size="large"
        style={{ display: "flex", marginBottom: 16 }}
      >
        <Title level={2}>Late Orders Management</Title>

        <Space wrap size="middle">
          <Input
            placeholder="Search by order number or employee"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Filter by governorate"
            style={{ width: 200 }}
            allowClear
            value={governorateFilter}
            onChange={setGovernorateFilter}
          >
            {governorates.map((gov) => (
              <Select.Option key={gov.id} value={gov.id}>
                {gov.name}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            placeholder={["From Date", "To Date"]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([
                  dates[0].format("YYYY-MM-DD"),
                  dates[1].format("YYYY-MM-DD"),
                ]);
              } else {
                setDateRange(null);
              }
            }}
          />
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
          <Button icon={<DownloadOutlined />} onClick={exportToExcel}>
            Export Excel
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
        scroll={{ x: 1500 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} orders`,
        }}
      />

      <Modal
        title={editingOrder ? "Edit Late Order" : "Add Late Order"}
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
            name="governorateId"
            label="Governorate"
            rules={[{ required: true, message: "Please select a governorate" }]}
          >
            <Select placeholder="Select governorate">
              {governorates.map((gov) => (
                <Select.Option key={gov.id} value={gov.id}>
                  {gov.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="orderDate"
            label="Order Date"
            rules={[{ required: true, message: "Please select order date" }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <TextArea rows={3} placeholder="Optional notes" />
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
