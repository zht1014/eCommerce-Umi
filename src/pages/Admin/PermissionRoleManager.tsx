import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  message,
  Dropdown,
  Menu,
  Checkbox,
} from "antd";
import axios from "axios";


const PermissionRoleManager = ({ currentUser, apiBaseUrl }) => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState({});

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/roles`, {
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
      });
      if (res.data.success) {
        setRoles(res.data.data || []);
      }
    } catch {
      message.error("Failed to load roles.");
    }
  };

  const fetchPermissions = async (page = 0, size = 10) => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}/api/permissions`, {
        params: {
          page,
          size,
          sortBy: "createDatetime",
          direction: "desc",
        },
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
      });

      if (res.data.success) {
        console.log(res.data.data)
        const perms = res.data.data.content || [];
        setPermissions(perms);

        const roleMap = {};
        perms.forEach((perm) => {
          const roleNames = perm.roles || [];
          const matchedIds = roles
            .filter((r) => roleNames.includes(r.name))
            .map((r) => r.id);
          roleMap[perm.id] = matchedIds;
        });
        setSelectedRoles(roleMap);
      }
    } catch {
      message.error("Failed to load permissions.");
    } finally {
      setLoading(false);
    }
  };

  // Save role-permission assignments
  const handleSaveRoles = async (permissionId) => {
    const roleIds = selectedRoles[permissionId] || [];

    const payload = roleIds.map((roleId) => ({
      permissionId,
      roleId,
      createUser: currentUser.username || "system",
      updateUser: currentUser.username || "system",
      createDatetime: new Date().toISOString(),
      updateDatetime: new Date().toISOString(),
    }));

    try {
      const res = await axios.post(
        `${apiBaseUrl}/api/role-permissions`,
        payload,
        {
          headers: {
            Authorization: "Bearer " + currentUser.token,
          },
        }
      );
      if (res.data.success) {
        message.success("Roles updated successfully.");
      } else {
        message.error(res.data.message || "Failed to update roles.");
      }
    } catch {
      message.error("Error updating roles.");
    }
  };

  const handleCheckboxChange = (permissionId, checkedValues) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [permissionId]: checkedValues,
    }));
  };

  const columns = [
    {
      title: "Endpoint",
      dataIndex: "endpoint",
    },
    {
      title: "Method",
      dataIndex: "method",
    },
    {
      title: "Roles",
      render: (_, record) => {
        const permissionId = record.id;
        const checked = selectedRoles[permissionId] || [];

        return (
          <Dropdown
            trigger={["click"]}
            overlay={
              <Menu>
                <Menu.Item key="roles" disabled>
                  <Checkbox.Group
                    style={{ display: "flex", flexDirection: "column", padding: 8 }}
                    value={checked}
                    onChange={(vals) => handleCheckboxChange(permissionId, vals)}
                  >
                    {roles.map((role) => (
                      <Checkbox key={role.id} value={role.id}>
                        {role.name}
                      </Checkbox>
                    ))}
                  </Checkbox.Group>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="save">
                  <Button
                    size="small"
                    type="primary"
                    block
                    onClick={() => handleSaveRoles(permissionId)}
                  >
                    Save
                  </Button>
                </Menu.Item>
              </Menu>
            }
          >
            <Button size="small">Manage</Button>
          </Dropdown>
        );
      },
    },
  ];

  useEffect(() => {
    const init = async () => {
      await fetchRoles();
      await fetchPermissions();
    };
    init();
  }, []);

useEffect(() => {
  if (permissions.length > 0 && roles.length > 0) {
    const roleMap = {};
    permissions.forEach((perm) => {
      const roleNames = perm.roles || [];
      const matchedIds = roles
        .filter((r) => roleNames.includes(r.name))
        .map((r) => r.id);
      roleMap[perm.id] = matchedIds;
    });
    setSelectedRoles(roleMap);
  }
}, [permissions, roles]);


  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={permissions}
      loading={loading}
      pagination={false}
    />
  );
};

export default PermissionRoleManager;
