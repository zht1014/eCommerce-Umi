import React, { useEffect, useState, useCallback } from "react";
import { Table, Button, message, Checkbox, Input, Row, Col, Pagination } from "antd";
import axios from "axios";

const PermissionRoleManager = ({ currentUser, apiBaseUrl }) => {
  const [filteredPermissions, setFilteredPermissions] = useState([]);  // Store filtered permissions
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState({});  // Store multiple roles for each permission
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
          sortBy: 'createDatetime',
          endpoint: searchKeyword,
          direction: 'desc',
        },
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
      });

      if (res.data.success) {
        const permissionsData = res.data.data.content || [];

        setFilteredPermissions(permissionsData);  // Initially display all permissions
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
    if (roles.length > 0 && filteredPermissions.length > 0) {
      const roleMap = {};
      filteredPermissions.forEach((perm) => {
        const roleNames = perm.roles || [];
        // Find matching roles for this permission
        const matchedIds = roles
          .filter((r) => roleNames.includes(r.name))
          .map((r) => r.id);
        // Store the matched roles
        roleMap[perm.id] = matchedIds || [];  // Allow multiple roles
      });
      setSelectedRoles(roleMap);  // Update selectedRoles after both roles and permissions are loaded
    }
  }, [roles, filteredPermissions]);

  // Handle checkbox change (multiple roles per permission)
  const handleCheckboxChange = useCallback((permissionId, checkedValues) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [permissionId]: checkedValues,  // Store multiple roleIds
    }));

    // Remove roles that were unchecked
    const previousSelectedRoles = selectedRoles[permissionId] || [];
    const uncheckedRoles = previousSelectedRoles.filter(roleId => !checkedValues.includes(roleId));

    // If there are unchecked roles, call the DELETE API to remove them
    if (uncheckedRoles.length > 0) {
      uncheckedRoles.forEach(roleId => {
        deleteRoleAssignment(permissionId, roleId);
      });
    }
  }, [selectedRoles]);

  // DELETE API to remove role assignment
  const deleteRoleAssignment = async (permissionId, roleId) => {
    try {
      const res = await axios.delete(`${apiBaseUrl}/api/role-permissions/${permissionId}`, {
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
        data: {
          roleId,
        },
      });

      if (res.data.success) {
        message.success(`Role removed from permission ${permissionId}`);
      } else {
        message.error(`Failed to remove role ${roleId} from permission ${permissionId}`);
      }
    } catch (err) {
      message.error(`Error removing role ${roleId} from permission ${permissionId}`);
    }
  };

  // Bulk assign roles (multiple roles per permission)
  const handleBulkAssign = () => {
    const selectedPermissions = filteredPermissions.filter(
      (permission) => selectedRoles[permission.id] && selectedRoles[permission.id].length > 0
    );

    if (selectedPermissions.length === 0) {
      message.warning("Please select some permissions to assign roles.");
      return;
    }

    const bulkPayload = selectedPermissions.flatMap((permission) =>
      selectedRoles[permission.id].map((roleId) => ({
        permissionId: permission.id,
        roleId: roleId,  // Each roleId is sent separately
        createUser: currentUser.username || "system",
        updateUser: currentUser.username || "system",
      }))
    );

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

  const handleSearch = async () => {
    setLoading(true);  // Show loading indicator

    try {
      // Make GET request to fetch filtered permissions based on the search keyword
      const res = await axios.get(`${apiBaseUrl}/api/permissions`, {
        params: {
          page: currentPage, // Assuming currentPage starts from 1 but the API expects 0-based indexing
          size: pageSize,
          endpoint: searchKeyword,  // Pass searchKeyword as 'endpoint'
          sortBy: 'createDatetime',
          direction: 'desc',
        },
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
      });

      if (res.data.success) {
        const permissionsData = res.data.data.content || [];
        console.log(permissionsData)
        setFilteredPermissions(permissionsData);  // Update filtered permissions
        setTotal(res.data.data.totalElements || 0); // Update total count

        // Update selectedRoles to reflect the search results
        const updatedSelectedRoles = { ...selectedRoles };

        permissionsData.forEach((permission) => {
          if (!updatedSelectedRoles[permission.id]) {
            updatedSelectedRoles[permission.id] = [];
          }

          const selectedRolesForPermission = updatedSelectedRoles[permission.id];
          if (permission.roles && permission.roles.length > 0) {
            permission.roles.forEach(role => {
              if (role.id && !selectedRolesForPermission.includes(role.id)) {
                selectedRolesForPermission.push(role.id);  // Store roleId for this permission
              }
            });
          }
        });

        setSelectedRoles(updatedSelectedRoles);  // Update selected roles after search
      }
    } catch (error) {
      message.error("Failed to load filtered permissions.");
    } finally {
      setLoading(false);  // Hide loading indicator
    }
  };

  // Columns for the table
  const columns = [
    {
      title: "Description",
      dataIndex: "description",
      render: (text) => <div>{text}</div>,
    },
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
        const checkedValues = selectedRoles[permissionId] || [];  // Get selected roles for the current permission
        //console.log('Checked values for permissionId:', checkedValues);
        return (
          <div>
            <Checkbox.Group
              style={{ display: "flex", flexWrap: "wrap", gap: 12 }}
              value={checkedValues}  // Show selected roles
              onChange={(vals) => handleCheckboxChange(permissionId, vals)}  // Allow multiple selection
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

  const onPaginationChange = (page, size) => {
    setCurrentPage(page);
    setPageSize(size);
    fetchPermissions(page, size); // Fetch data based on new page and size
  };

  useEffect(() => {
    // Initial fetch on page load
    fetchRoles();
    fetchPermissions(currentPage, pageSize); // Fetch permissions based on current page
  }, [currentPage, pageSize]);

  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Input
            placeholder="Search by Endpoint"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: "100%" }}
          />
        </Col>
        <Col span={8}>
          <Button
            type="primary"
            onClick={handleSearch} // Trigger search on button click
            style={{ marginLeft: "10px" }}
          >
            Search
          </Button>
        </Col>
        <Col span={8}>
          <Button
            type="primary"
            onClick={handleBulkAssign} // Trigger bulk assign roles
            style={{ marginLeft: "10px" }}
          >
            Bulk Assign Roles
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredPermissions}  // Display filtered permissions
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
