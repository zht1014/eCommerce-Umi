import React from "react";
import { Card, Typography, Space, Alert } from "antd";
import UserRoleManager from "./UserRoleManager";
import PermissionRoleManager from "./PermissionRoleManager";

const { Title, Text } = Typography;

const UserManagement = () => {
  const localUserStr = localStorage.getItem("currentUser");
  const currentUser = localUserStr ? JSON.parse(localUserStr) : null;
  const apiBaseUrl = "https://104-248-98-53.nip.io/users";

  if (!currentUser || !currentUser.token) {
    return (
      <Alert
        message="Please log in first."
        type="warning"
        showIcon
        style={{ margin: 24 }}
      />
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Space direction="vertical" style={{ marginBottom: 16 }}>
        <Title level={3}>User-Role Management</Title>
        <Text type="secondary">Manage the associations between users and roles</Text>
      </Space>

      <Card>
        <UserRoleManager currentUser={currentUser} apiBaseUrl={apiBaseUrl} />
      </Card>

      <Space direction="vertical" style={{ margin: "32px 0 16px" }}>
        <Title level={3}>Role-Permission Management</Title>
        <Text type="secondary">Manage the associations between roles and permissions</Text>
      </Space>

      <Card>
        <PermissionRoleManager currentUser={currentUser} apiBaseUrl={apiBaseUrl} />
      </Card>
    </div>
  );
};

export default UserManagement;

