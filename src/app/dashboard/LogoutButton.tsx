"use client";

import { Button, App } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { message } = App.useApp(); // Use App's message instance

  const handleLogout = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok) {
        message.success("Logged out successfully");
        router.push("/login");
        router.refresh();
      } else {
        message.error("Logout failed");
      }
    } catch (error) {
      message.error("An error occurred");
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      danger
      icon={<LogoutOutlined />}
      onClick={handleLogout}
      loading={loading}
    >
      Logout
    </Button>
  );
}
