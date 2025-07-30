import React, { useEffect, useState } from "react";
import { Table, message, Button, Checkbox, Dropdown, Menu, Space } from "antd";
import axios from "axios";

const UserRoleManager = ({ currentUser, apiBaseUrl }) => {
  const [userList, setUserList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [userRoleMap, setUserRoleMap] = useState({}); 
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState({}); 

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/user`, {
        headers: { Authorization: "Bearer " + currentUser.token },
      });
      if (res.data.success) {
        setUserList(res.data.data || []);
      }
    } catch (err) {
      message.error("Failed to fetch users.");
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/roles`, {
        headers: { Authorization: "Bearer " + currentUser.token },
      });
      if (res.data.success) {
        setRolesList(res.data.data || []);
      }
    } catch (err) {
      message.error("Failed to fetch roles.");
    }
  };

  const fetchUserRoles = async () => {
    try {
      const res = await axios.get(`${apiBaseUrl}/api/user-roles`, {
        headers: { Authorization: "Bearer " + currentUser.token },
      });

      if (res.data.success) {
        console.log(res.data.data)
        const map = {};
        res.data.data.forEach((ur) => {
          if (!map[ur.userId]) map[ur.userId] = [];
          map[ur.userId].push(ur.roleId);
        });
        setUserRoleMap(map);
      }
    } catch (err) {
      message.error("Failed to fetch user-role mappings.");
    }
  };

  const init = async () => {
    setLoading(true);
    await Promise.all([fetchUsers(), fetchRoles(), fetchUserRoles()]);
    setLoading(false);
  };

  useEffect(() => {
    init();
  }, []);

  const handleRoleChange = (userId, checkedValues) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [userId]: checkedValues,
    }));
  };

  const handleSaveRoles = async (userId) => {
  const newRoles = selectedRoles[userId] || [];

  if (newRoles.length === 0) {
    message.warning("No roles selected to save.");
    return;
  }

  try {
    const res = await axios.post(
      `${apiBaseUrl}/api/user-roles`,
      newRoles.map((roleId) => ({
        id: 0, // Include this if required by backend
        userId,
        roleId,
        createUser: currentUser.username || "system",
        updateUser: currentUser.username || "system",
      })),
      {
        headers: {
          Authorization: "Bearer " + currentUser.token,
          "Content-Type": "application/json",
        },
      }
    );

    if (res.data.success) {
      message.success("Roles updated.");
      await fetchUserRoles(); 
    } else {
      message.error(res.data.message || "Update failed.");
    }
  } catch (err) {
    console.error("POST error:", err.response?.data || err.message);
    message.error(err.response?.data?.message || "Failed to update roles.");
  }
};


  const columns = [
    {
      title: "Username",
      dataIndex: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
    },
    {
      title: "Roles",
      render: (_, record) => {
        const assignedRoles = userRoleMap[record.userId] || [];
        const currentSelection = selectedRoles[record.userId] || assignedRoles;

        return (
          <Dropdown
            trigger={["click"]}
            overlay={
              <Menu>
                <Menu.Item key="checkbox-group" disabled>
                  <Checkbox.Group
                    style={{ display: "flex", flexDirection: "column", padding: "8px" }}
                    value={currentSelection}
                    onChange={(vals) => handleRoleChange(record.userId, vals)}
                  >
                    {rolesList.map((role) => (
                      <Checkbox key={role.id} value={role.id}>
                        {role.name}
                      </Checkbox>
                    ))}
                  </Checkbox.Group>
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item key="save">
                  <Button type="primary" size="small" block onClick={() => handleSaveRoles(record.userId)}>
                    Save Roles
                  </Button>
                </Menu.Item>
              </Menu>
            }
          >
            <Button size="small">Manage Roles</Button>
          </Dropdown>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="userId"
      columns={columns}
      dataSource={userList}
      loading={loading}
      pagination={false}
    />
  );
};

export default UserRoleManager;
