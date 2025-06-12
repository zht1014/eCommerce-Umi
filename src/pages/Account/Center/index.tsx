import { PageContainer, ProField, ProFieldFCMode } from "@ant-design/pro-components";
import { useModel } from "@umijs/max";
import { Avatar, Card, Descriptions, Button, Modal, List, Tag, message, Tooltip } from "antd";
import { useState } from "react";
import { EnvironmentOutlined, FileDoneOutlined } from "@ant-design/icons";
import axios from "axios";

const Center: React.FC = () => {
    const [state, setState] = useState<ProFieldFCMode>('read');
    const [plain, setPlain] = useState<boolean>(false);
    const { initialState } = useModel('@@initialState');
    const localUserStr = localStorage.getItem('currentUser');
    const currentUser = localUserStr ? JSON.parse(localUserStr) : null;

    const [ordersVisible, setOrdersVisible] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);

    const [addressModalVisible, setAddressModalVisible] = useState(false);
    const [addresses, setAddresses] = useState<any[]>([]);

    const fetchUserAddresses = async () => {
        if (!currentUser) {
            message.warning('Please log in!');
            return;
        }
        try {
            const res = await axios.get(`http://146.190.90.142:30080/users/api/addresses/user/${currentUser.id}`,{
                headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
            });
            setAddresses(res.data || []);
            setAddressModalVisible(true);
        } catch (err) {
            console.error(err);
            message.error('Error fetching addresses');
        }
    };

    const fetchUserOrders = async () => {
        if (!currentUser) return;
        setLoadingOrders(true);
        try {
            const res = await axios.get(`http://146.190.90.142:30080/orders/orders/user/${currentUser.id}`,{
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
                                onClick={fetchUserAddresses}
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

            <Modal
                title="Your Addresses"
                open={addressModalVisible}
                onCancel={() => setAddressModalVisible(false)}
                footer={null}
            >
                {addresses.length > 0 ? (
                    <List
                        dataSource={addresses}
                        renderItem={(address) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={`Address ID: ${address.id}`}
                                    description={`${address.street}, ${address.city}, ${address.state}`}
                                />
                            </List.Item>
                        )}
                    />
                ) : (
                    <p>No addresses found.</p>
                )}
            </Modal>
        </PageContainer>
    );
};

export default Center;
