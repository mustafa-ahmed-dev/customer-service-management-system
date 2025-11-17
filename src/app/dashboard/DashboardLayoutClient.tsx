'use client';

import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Button } from 'antd';
import {
  HomeOutlined,
  CloseCircleOutlined,
  CreditCardOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BarChartOutlined,
  InboxOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { usePathname, useRouter } from 'next/navigation';
import type { SessionUser } from '@/lib/auth/session';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  session: SessionUser;
}

export default function DashboardLayoutClient({
  children,
  session,
}: DashboardLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Get menu items based on user role
  const getMenuItems = () => {
    const allItems = [
      {
        key: '/dashboard',
        icon: <HomeOutlined />,
        label: 'Dashboard',
        roles: ['admin', 'moderator', 'user'],
      },
      {
        type: 'divider',
        roles: ['admin', 'moderator', 'user'],
      },
      {
        key: '/cancelled-orders',
        icon: <CloseCircleOutlined />,
        label: 'Cancelled Orders',
        roles: ['admin', 'moderator', 'user'],
      },
      {
        key: '/installment-cancelled',
        icon: <CreditCardOutlined />,
        label: 'Installment Cancelled',
        roles: ['admin', 'moderator', 'user'],
      },
      {
        key: '/late-orders',
        icon: <ClockCircleOutlined />,
        label: 'Late Orders',
        roles: ['admin', 'moderator', 'user'],
      },
      {
        key: '/installment-orders',
        icon: <FileTextOutlined />,
        label: 'Installment Orders',
        roles: ['admin', 'moderator', 'user'],
      },
      {
        type: 'divider',
        roles: ['admin', 'moderator'],
      },
      {
        key: '/statistics',
        icon: <BarChartOutlined />,
        label: 'Statistics',
        roles: ['admin', 'moderator'],
      },
      {
        key: '/archive',
        icon: <InboxOutlined />,
        label: 'Archive',
        roles: ['admin', 'moderator'],
      },
      {
        type: 'divider',
        roles: ['admin', 'moderator'],
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        roles: ['admin', 'moderator'],
      },
      {
        key: '/users',
        icon: <TeamOutlined />,
        label: 'User Management',
        roles: ['admin'],
      },
    ];

    return allItems.filter(
      (item: any) => !item.roles || item.roles.includes(session.role)
    );
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => {
        // TODO: Navigate to profile page
        console.log('Profile clicked');
      },
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: collapsed ? 16 : 20,
            fontWeight: 'bold',
            transition: 'all 0.2s',
          }}
        >
          {collapsed ? 'CS' : 'Customer Service'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={getMenuItems()}
          onClick={({ key }) => {
            router.push(key);
          }}
        />
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  textAlign: 'right',
                  display: 'flex',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <Text strong>{session.fullName}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {session.role.charAt(0).toUpperCase() + session.role.slice(1)}
                </Text>
              </div>
              <Avatar
                size="large"
                style={{ backgroundColor: '#1890ff' }}
                icon={<UserOutlined />}
              />
            </div>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
