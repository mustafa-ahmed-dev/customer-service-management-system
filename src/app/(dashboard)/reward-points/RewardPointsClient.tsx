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
  DatePicker,
  Typography,
  Tooltip,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CopyOutlined,
  ReloadOutlined,
  DownloadOutlined,
  InboxOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import type { SessionUser } from "@/lib/auth/session";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import ExcelJS from "exceljs";

const { Title } = Typography;
const { TextArea } = Input;

interface RewardPointsRecord {
  id: number;
  orderNumber: string;
  customerName: string;
  orderStatus: string;
  deliveryDate: string;
  notes?: string;
  employeeName: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  archivedAt?: string;
}

interface FormValues {
  orderNumber: string;
  customerName: string;
  orderStatus: string;
  deliveryDate: dayjs.Dayjs;
  notes?: string;
}

interface RewardPointsClientProps {
  session: SessionUser;
}

export default function RewardPointsClient({
  session,
}: RewardPointsClientProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [records, setRecords] = useState<RewardPointsRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RewardPointsRecord | null>(
    null
  );

  const isAdmin = session.role === "admin";

  useEffect(() => {
    fetchRecords();
  }, [searchText, showArchived]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);
      params.append("archived", showArchived.toString());

      const response = await fetch(`/api/reward-points?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
      } else {
        message.error("Failed to fetch records");
      }
    } catch (error) {
      console.error("Failed to fetch records:", error);
      message.error("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: RewardPointsRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      orderNumber: record.orderNumber,
      customerName: record.customerName,
      orderStatus: record.orderStatus,
      deliveryDate: dayjs(record.deliveryDate),
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (record: RewardPointsRecord) => {
    modal.confirm({
      title: "Archive Record",
      content: `Are you sure you want to archive this record for order ${record.orderNumber}?`,
      okText: "Archive",
      okType: "danger",
      onOk: async () => {
        try {
          const response = await fetch(`/api/reward-points/${record.id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            message.success("Record archived successfully");
            fetchRecords();
          } else {
            const data = await response.json();
            message.error(data.error || "Failed to archive record");
          }
        } catch (error) {
          console.error("Archive error:", error);
          message.error("Failed to archive record");
        }
      },
    });
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const url = editingRecord
        ? `/api/reward-points/${editingRecord.id}`
        : "/api/reward-points";

      const method = editingRecord ? "PUT" : "POST";

      const payload = {
        ...values,
        deliveryDate: values.deliveryDate.toISOString(),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success(
          editingRecord
            ? "Record updated successfully"
            : "Record created successfully"
        );
        setIsModalOpen(false);
        form.resetFields();
        fetchRecords();
      } else {
        const data = await response.json();
        message.error(data.error || "Failed to save record");
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Failed to save record");
    }
  };

  const copyTableToClipboard = async () => {
    try {
      const headers = [
        "Order Number",
        "Customer Name",
        "Order Status",
        "Delivery Date",
        "Notes",
        "Employee",
        "Created At",
      ];

      const rows = records.map((record) => [
        record.orderNumber,
        record.customerName,
        record.orderStatus,
        dayjs(record.deliveryDate).format("YYYY-MM-DD"),
        record.notes || "-",
        record.employeeName,
        dayjs(record.createdAt).format("YYYY-MM-DD HH:mm"),
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
        "Customer Name",
        "Order Status",
        "Delivery Date",
        "Notes",
        "Employee",
        "Created At",
      ];

      const rows = records.map((record) => [
        record.orderNumber,
        record.customerName,
        record.orderStatus,
        dayjs(record.deliveryDate).format("YYYY-MM-DD"),
        record.notes || "",
        record.employeeName,
        dayjs(record.createdAt).format("YYYY-MM-DD HH:mm"),
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
        `reward_points_${dayjs().format("YYYY-MM-DD")}.csv`
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

  const columns: ColumnsType<RewardPointsRecord> = [
    {
      title: "Order Number",
      dataIndex: "orderNumber",
      key: "orderNumber",
      width: 150,
      fixed: "left" as const,
    },
    {
      title: "Customer Name",
      dataIndex: "customerName",
      key: "customerName",
      width: 180,
    },
    {
      title: "Order Status",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 150,
    },
    {
      title: "Delivery Date",
      dataIndex: "deliveryDate",
      key: "deliveryDate",
      width: 150,
      render: (date: string) => dayjs(date).format("YYYY-MM-DD"),
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
      render: (_: any, record: RewardPointsRecord) => (
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
          {isAdmin && !showArchived && (
            <Tooltip title="Archive">
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
          Reward Points Addition
        </Title>
        <Space wrap>
          <Input
            placeholder="Search by order number or customer name"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 350 }}
            allowClear
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
          <Button icon={<ReloadOutlined />} onClick={fetchRecords}>
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
              Add Record
            </Button>
          )}
        </Space>
      </Space>

      <Table
        columns={columns}
        dataSource={records}
        loading={loading}
        rowKey="id"
        scroll={{ x: 1500 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} records`,
        }}
      />

      <Modal
        title={
          editingRecord
            ? "Edit Reward Points Record"
            : "Add Reward Points Record"
        }
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
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>

          <Form.Item
            name="orderStatus"
            label="Order Status"
            rules={[{ required: true, message: "Please enter order status" }]}
          >
            <Input placeholder="Enter order status (e.g., Completed, Pending)" />
          </Form.Item>

          <Form.Item
            name="deliveryDate"
            label="Delivery Date"
            rules={[{ required: true, message: "Please select delivery date" }]}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="notes" label="Notes (Optional)">
            <TextArea
              placeholder="Enter any additional notes"
              rows={4}
              maxLength={500}
              showCount
            />
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
                {editingRecord ? "Update" : "Create"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
