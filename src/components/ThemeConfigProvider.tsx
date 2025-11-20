"use client";

import { ConfigProvider, App, theme } from "antd";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeConfigProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme: appTheme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          appTheme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1890ff",
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
