"use client";

import { Typography, Card, Row, Col, Statistic } from "antd";
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

export default function DashboardHome({ session }: DashboardHomeProps) {
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
              value={0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Installment Cancelled"
              value={0}
              prefix={<CreditCardOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Late Orders"
              value={0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Installment Orders"
              value={0}
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
