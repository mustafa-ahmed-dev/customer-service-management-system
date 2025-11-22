"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  App,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { TextArea } = Input;

interface InactiveCouponRecord {
  id: number;
  salesOrder: string;
  couponCode: string;
  notes: string | null;
  createdAt: string;
  createdByName: string;
  updatedAt: string;
}

interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

interface Props {
  session: SessionUser;
}

export default function InactiveCouponsClient({ session }: Props) {
  const { message: antMessage } = App.useApp();
  const [records, setRecords] = useState<InactiveCouponRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<InactiveCouponRecord | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  const canEdit = ["admin", "moderator"].includes(session.role);
  const canDelete = session.role === "admin";

  useEffect(() => {
    fetchRecords();
  }, [searchText]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);

      const res = await fetch(`/api/inactive-coupons?${params}`);
      const data = await res.json();

      if (res.ok) {
        setRecords(data.records);
      } else {
        antMessage.error(data.error || "Failed to fetch records");
      }
    } catch (error) {
      antMessage.error("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: InactiveCouponRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      salesOrder: record.salesOrder,
      couponCode: record.couponCode,
      notes: record.notes,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/inactive-coupons/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        antMessage.success("Record archived successfully");
        fetchRecords();
      } else {
        antMessage.error(data.error || "Failed to archive record");
      }
    } catch (error) {
      antMessage.error("Failed to archive record");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = {
        salesOrder: values.salesOrder,
        couponCode: values.couponCode,
        notes: values.notes || null,
      };

      const url = editingRecord
        ? `/api/inactive-coupons/${editingRecord.id}`
        : "/api/inactive-coupons";

      const res = await fetch(url, {
        method: editingRecord ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        antMessage.success(
          `Record ${editingRecord ? "updated" : "created"} successfully`
        );
        setIsModalOpen(false);
        form.resetFields();
        fetchRecords();
      } else {
        antMessage.error(data.error || "Operation failed");
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleCopy = () => {
    const headers = [
      "Sales Order",
      "Coupon Code",
      "Notes",
      "Created At",
      "Created By",
    ];

    const rows = records.map((r) => [
      r.salesOrder,
      r.couponCode,
      r.notes || "",
      new Date(r.createdAt).toLocaleString(),
      r.createdByName,
    ]);

    const text = [headers, ...rows].map((row) => row.join("\t")).join("\n");

    navigator.clipboard.writeText(text);
    antMessage.success("Table copied to clipboard");
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (searchText) params.append("search", searchText);

      const res = await fetch(`/api/inactive-coupons/export?${params}`);

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `inactive-coupons-${
          new Date().toISOString().split("T")[0]
        }.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        antMessage.success("Export successful");
      } else {
        antMessage.error("Export failed");
      }
    } catch (error) {
      antMessage.error("Export failed");
    }
  };

  const columns: ColumnsType<InactiveCouponRecord> = [
    {
      title: "Sales Order (SO)",
      dataIndex: "salesOrder",
      key: "salesOrder",
      width: 200,
    },
    {
      title: "Coupon Code",
      dataIndex: "couponCode",
      key: "couponCode",
      width: 200,
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      render: (notes: string | null) => notes || "-",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Created By",
      dataIndex: "createdByName",
      key: "createdByName",
      width: 150,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_: any, record: InactiveCouponRecord) => (
        <Space>
          {canEdit && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          )}
          {canDelete && (
            <Popconfirm
              title="Archive this record?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Input
          placeholder="Search sales order or coupon code..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 400 }}
        />

        <Space>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            Copy Table
          </Button>
          {canEdit && (
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              type="default"
            >
              Export Excel
            </Button>
          )}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Inactive Coupon
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} records`,
        }}
      />

      <Modal
        title={editingRecord ? "Edit Inactive Coupon" : "Add Inactive Coupon"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item
            label="Sales Order (SO)"
            name="salesOrder"
            rules={[
              { required: true, message: "Please enter sales order number" },
            ]}
          >
            <Input placeholder="Enter sales order number" />
          </Form.Item>

          <Form.Item
            label="Coupon Code"
            name="couponCode"
            rules={[{ required: true, message: "Please enter coupon code" }]}
          >
            <Input placeholder="Enter coupon code" />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} placeholder="Enter notes (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
