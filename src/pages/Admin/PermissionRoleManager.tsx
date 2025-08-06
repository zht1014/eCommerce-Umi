import React, { useEffect, useState } from "react";
import { Table, Button, message, Checkbox, Input, Row, Col, Pagination } from "antd";
import axios from "axios";

const PermissionRoleManager = ({ currentUser, apiBaseUrl }) => {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  // Fetch roles
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

  // Fetch permissions
  const fetchPermissions = async (page, size) => {
    setLoading(true);
    try {
      const res = await axios.get(`${apiBaseUrl}/api/permissions`, {
        params: {
          page,
          size,
          search: searchKeyword,
          sortBy: 'createDatetime',  // Adjust the sorting based on the API requirements
          direction: 'desc',          // Adjust the sorting direction
        },
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
      });

      if (res.data.success) {
        setPermissions(res.data.data.content || []);
        setTotal(res.data.data.totalElements || 0); // Adjust total count
      }
    } catch {
      message.error("Failed to load permissions.");
    } finally {
      setLoading(false);
    }
  };

  // Map permissions to selectedRoles after fetching roles and permissions
  useEffect(() => {
    if (roles.length > 0 && permissions.length > 0) {
      const roleMap = {};
      permissions.forEach((perm) => {
        const roleNames = perm.roles || [];
        // Find matching roles for this permission
        const matchedIds = roles
          .filter((r) => roleNames.includes(r.name))
          .map((r) => r.id);
        // Store the first matching role for simplicity
        roleMap[perm.id] = matchedIds[0] || null;
      });
      setSelectedRoles(roleMap);  // Update selectedRoles after both roles and permissions are loaded
    }
  }, [roles, permissions]);  // Trigger only after roles and permissions are both loaded

  // Handle checkbox change (single role per permission)
  const handleCheckboxChange = (permissionId, checkedValue) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [permissionId]: checkedValue,
    }));
  };

  // Save roles to permission (single role ID per permission)
  const handleSaveRoles = async (permissionId) => {
    const roleId = selectedRoles[permissionId];

    if (!roleId) {
      message.warning("Please select at least one role.");
      return;
    }

    const payload = [
      {
        permissionId,
        roleId,
        createUser: currentUser.username || "system",
        updateUser: currentUser.username || "system",
      },
    ];

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

  // Bulk assign roles (single role per permission)
  const handleBulkAssign = () => {
    const selectedPermissions = permissions.filter(
      (permission) => selectedRoles[permission.id] !== null
    );

    if (selectedPermissions.length === 0) {
      message.warning("Please select some permissions to assign roles.");
      return;
    }

    const bulkPayload = selectedPermissions.map((permission) => ({
      permissionId: permission.id,
      roleId: selectedRoles[permission.id], // Send single roleId, not an array
      createUser: currentUser.username || "system",
      updateUser: currentUser.username || "system",
    }));

    axios
      .post(`${apiBaseUrl}/api/role-permissions`, bulkPayload, {
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
      })
      .then((res) => {
        if (res.data.success) {
          message.success("Roles assigned successfully to selected permissions.");
        } else {
          message.error(res.data.message || "Failed to assign roles.");
        }
      })
      .catch(() => message.error("Error assigning roles."));
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchKeyword(e.target.value);
    setCurrentPage(1); // Reset to the first page when searching
  };

  // Pagination change
  const onPaginationChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
    fetchPermissions(page, size); // Fetch data based on new page and size
  };

  // Columns for the table
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
        const checked = selectedRoles[permissionId] || null;

        return (
          <div>
            <Checkbox.Group
              style={{ display: "flex", flexWrap: "wrap", gap: 12 }}
              value={checked ? [checked] : []}
              onChange={(vals) => handleCheckboxChange(permissionId, vals[0])} // Only one role per permission
            >
              {roles.map((role) => (
                <Checkbox key={role.id} value={role.id}>
                  {role.name}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </div>
        );
      },
    },
  ];

  // Initial fetch on page load
  useEffect(() => {
    fetchRoles();
    fetchPermissions(currentPage, pageSize); // Fetch permissions based on current page
  }, [currentPage, pageSize]);  // Only trigger fetchPermissions on currentPage or pageSize change

  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Input
            placeholder="Search by Endpoint"
            value={searchKeyword}
            onChange={handleSearch}
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={8}>
          <Button
            type="primary"
            onClick={handleBulkAssign}
            style={{ marginLeft: "10px" }}
          >
            Bulk Assign Roles
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={permissions}
        loading={loading}
        pagination={false}
        style={{ marginTop: "20px" }}
      />

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={total}
        onChange={onPaginationChange} // Ensure pagination change triggers data loading
        showSizeChanger
        pageSizeOptions={["5", "10", "20", "50"]}
        style={{ marginTop: "20px", textAlign: "right" }}
      />
    </div>
  );
};

export default PermissionRoleManager;
