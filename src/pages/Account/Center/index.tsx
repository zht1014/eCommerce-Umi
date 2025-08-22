import { PageContainer, ProField} from "@ant-design/pro-components";
import { useModel } from "@umijs/max";
import { Avatar, Card, Descriptions, Button, Modal, List, Tag, message, Tooltip } from "antd";
import { useState } from "react";
import { EnvironmentOutlined, FileDoneOutlined } from "@ant-design/icons";
import axios from "axios";

const Center: React.FC = () => {
    const { initialState } = useModel('@@initialState');
    const localUserStr = localStorage.getItem('currentUser');
    const currentUser = localUserStr ? JSON.parse(localUserStr) : null;

    const [ordersVisible, setOrdersVisible] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);
    const [newAddressModalVisible, setNewAddressModalVisible] = useState(false);
    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        state: '',
    });

    const fetchUserAddresses = async () => {
        if (!currentUser) {
            message.warning('Please log in!');
            return;
        }
        try {
            console.log(currentUser)
            const res = await axios.get(`https://104-248-98-53.nip.io/users/api/addresses/user/${currentUser.id}`, {
                headers: {
                    'Authorization': 'Bearer ' + currentUser.token,
                },
            });
            setAddresses(res.data || []);
            setAddressModalVisible(true);  // Show modal when addresses are fetched
        } catch (err) {
            console.error(err);
            message.error('Error fetching addresses');
        }
    };

    const fetchUserOrders = async () => {
        if (!currentUser) return;
        setLoadingOrders(true);
        try {
            const res = await axios.get(`https://104-248-98-53.nip.io/orders/orders/user/${currentUser.id}`, {
                headers: {
                    'Authorization': 'Bearer ' + currentUser.token,
                },
            });
            if (res.data.success) {
                setOrders(res.data.data || []);
                setOrdersVisible(true);
            } else {
                message.error('Failed to fetch orders');
            }
        } catch (err) {
            console.error('Fetch orders failed', err);
            message.error('Failed to fetch orders');
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleCreateAddress = async () => {
        if (!currentUser) {
            message.warning('Please log in!');
            return;
        }

        try {
            const payload = {
                userId: currentUser.id,
                street: newAddress.street,
                city: newAddress.city,
                state: newAddress.state,
                createUser: currentUser.name,
                updateUser: currentUser.name,
                createDatetime: new Date().toISOString(),
                updateDatetime: new Date().toISOString(),
            };

            const res = await axios.post('https://104-248-98-53.nip.io/users/api/addresses', payload, {
                headers: {
                    'Authorization': 'Bearer ' + currentUser.token,
                },
            });

            message.success('Address created successfully!');
            setNewAddressModalVisible(false);
            setNewAddress({ street: '', city: '', state: '' });
            fetchUserAddresses(); // Refresh address list after creation
        } catch (err) {
            console.error(err);
            message.error('Failed to create address');
        }
    };

    return (
        <PageContainer>
            <Card
                style={{
                    borderRadius: 8,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 16,
                        marginBottom: 50
                    }}
                >
                    <Avatar size={128} src={<img src={"https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png"} alt="avatar" />} />
                    <span style={{ fontSize: 30, fontWeight: 'bold' }}>
                        {initialState?.currentUser?.name}
                    </span>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 24,
                        marginBottom: 50,
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <Tooltip title="View Orders">
                            <Button
                                shape="circle"
                                icon={<FileDoneOutlined />}
                                onClick={fetchUserOrders}
                                type="primary"
                                size="large"
                                style={{ fontSize: 24 }}
                            />
                        </Tooltip>
                        <div style={{ fontSize: 14, marginTop: 4 }}>View Orders</div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <Tooltip title="Manage Address">
                            <Button
                                shape="circle"
                                icon={<EnvironmentOutlined />}
                                onClick={() => {
                                    fetchUserAddresses();  // Fetch user addresses when managing address
                                    setAddressModalVisible(true);
                                }}
                                type="primary"
                                size="large"
                                style={{ fontSize: 24 }}
                            />
                        </Tooltip>
                        <div style={{ fontSize: 14, marginTop: 4 }}>Manage Address</div>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 30,
                    }}
                >
                    <Descriptions column={2}>
                        <Descriptions.Item label="Username">
                            <ProField
                                text={currentUser?.name || 'N/A'}
                                valueType="text"
                                mode="read"
                            />
                        </Descriptions.Item>

                        <Descriptions.Item label="Email">
                            <ProField
                                text={currentUser?.email || 'N/A'}
                                valueType="text"
                                mode="read"
                            />
                        </Descriptions.Item>

                        <Descriptions.Item label="User ID">
                            <ProField
                                text={currentUser?.id?.toString() || 'N/A'}
                                valueType="text"
                                mode="read"
                            />
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            </Card>

            {/* 订单 Modal */}
            <Modal
                title="My Orders"
                open={ordersVisible}
                onCancel={() => setOrdersVisible(false)}
                footer={null}
                width={700}
            >
                {loadingOrders ? (
                    <p>Loading orders...</p>
                ) : orders.length > 0 ? (
                    <List
                        itemLayout="vertical"
                        dataSource={orders}
                        renderItem={(order) => (
                            <List.Item key={order.orderId}>
                                <List.Item.Meta
                                    title={<span>Order ID: {order.orderId}</span>}
                                    description={`Total: ￥${order.totalAmount} | Status: ${order.orderStatus}`}
                                />
                                <div>
                                    <Tag color="blue">{order.paymentStatus}</Tag>
                                    <div>Shipping: {order.shippingAddress}</div>
                                    <div>Created: {order.createDatetime ? new Date(order.createDatetime).toLocaleString() : 'N/A'}</div>
                                </div>
                            </List.Item>
                        )}
                    />
                ) : (
                    <p>No orders found.</p>
                )}
            </Modal>

            {/* 地址 Modal */}
            <Modal
                title="Your Addresses"
                open={addressModalVisible}
                onCancel={() => setAddressModalVisible(false)}
                footer={null}
                width={700}
            >
                <div>
                    {addresses.length > 0 ? (
                        <List
                            itemLayout="vertical"
                            dataSource={addresses}
                            renderItem={(address) => (
                                <List.Item key={address.id}>
                                    <List.Item.Meta
                                        title={`Address ID: ${address.id}`}
                                        description={`${address.street}, ${address.city}, ${address.state}`}
                                    />
                                </List.Item>
                            )}
                        />
                    ) : (
                        <div>
                            <p>No addresses found. Please add a new address:</p>
                        </div>
                    )}

                    <Button onClick={() => setNewAddressModalVisible(true)} type="primary">
                        Add New Address
                    </Button>
                </div>

            </Modal>

            {/* 新增地址 Modal */}
            <Modal
                title="Add New Address"
                open={newAddressModalVisible}
                onCancel={() => setNewAddressModalVisible(false)}
                onOk={handleCreateAddress}
                okText="Submit"
            >
                <div style={{ marginBottom: 16 }}>
                    <label>Street:</label>
                    <input
                        style={{ width: '100%' }}
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label>City:</label>
                    <input
                        style={{ width: '100%' }}
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label>State:</label>
                    <input
                        style={{ width: '100%' }}
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    />
                </div>
            </Modal>
        </PageContainer>
    );
};

export default Center;
