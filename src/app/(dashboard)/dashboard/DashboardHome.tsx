"use client";

import { useState, useEffect } from "react";
import { Typography, Card, Row, Col, Statistic, Spin } from "antd";
import {
  CloseCircleOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { SessionUser } from "@/lib/auth/session";

const { Title, Paragraph } = Typography;

interface DashboardHomeProps {
  session: SessionUser;
}

interface Stats {
  cancelledOrders: number;
  installmentCancelled: number;
  lateOrders: number;
  installmentOrders: number;
}

export default function DashboardHome({ session }: DashboardHomeProps) {
  const [stats, setStats] = useState<Stats>({
    cancelledOrders: 0,
    installmentCancelled: 0,
    lateOrders: 0,
    installmentOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/statistics/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Welcome back, {session.fullName}! 👋</Title>
      <Paragraph type="secondary">
        Here&apos;s an overview of your customer service system.
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Cancelled Orders"
              value={stats.cancelledOrders}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Late Orders"
              value={stats.lateOrders}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Installment Orders"
              value={stats.installmentOrders}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>Quick Actions</Title>
        <Paragraph>
          Use the sidebar to navigate to different sections of the system.
        </Paragraph>
      </Card>
    </div>
  );
}
