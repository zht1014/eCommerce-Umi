import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, InputNumber, Button, Popconfirm, message, Image, Spin, Modal, Select } from 'antd';
import axios from 'axios';
import FacePaymentModal from '@/components/FacePaymentModal';

interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  productName: string;
  productImage: string;
  price: number;
}

const ShoppingCart: React.FC = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCheckoutModalVisible, setIsCheckoutModalVisible] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<CartItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [isFacePayment, setIsFacePayment] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);  // For storing user addresses
  const [selectedAddress, setSelectedAddress] = useState<string>('');  // Store selected address

  const localUserStr = localStorage.getItem('currentUser');
  const currentUser = localUserStr ? JSON.parse(localUserStr) : null;

  // Fetch cart items
  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const cartRes = await axios.get(`http://167.71.210.84:30080/shoppingcarts/cart/items?userId=${currentUser.id}`, {
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
      const cartData = cartRes.data.data || [];

      const detailedCart = await Promise.all(
        cartData.map(async (item: any) => {
          const productRes = await axios.get(`http://167.71.210.84:30080/products/products/${item.productId}`, {
            headers: {
              'Authorization': 'Bearer ' + currentUser.token,
            },
          });
          const product = productRes.data.data;
          return {
            id: item.id,
            userId: item.userId,
            productId: item.productId,
            quantity: item.quantity,
            productName: product.name,
            productImage: product.coverImageUrl || 'https://via.placeholder.com/80',
            price: product.price,
          };
        })
      );
      setCartItems(detailedCart);
    } catch (err) {
      console.error(err);
      message.error('Failed to load cart items. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user addresses
  const fetchUserAddresses = async () => {
    try {
      const res = await axios.get(`http://167.71.210.84:30080/users/api/addresses/user/${currentUser.id}`, {
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
      setAddresses(res.data || []);
      setSelectedAddress(res.data[0] || '');  // Set default address
    } catch (err) {
      console.error('Error fetching addresses:', err);
      message.error('Failed to load addresses');
    }
  };

  useEffect(() => {
    fetchCartItems();
    fetchUserAddresses(); // Fetch user addresses on component mount
  }, []);

  // Handle checkout
  const handleCheckout = (product: CartItem) => {
    setSelectedProductForOrder(product);
    setSelectedQuantity(product.quantity);
    setIsCheckoutModalVisible(true);  // Show checkout modal
  };

  // Normal payment function (without face recognition)
  const handleNormalPayment = async () => {
    if (!currentUser) {
      message.error('Please login first');
      return;
    }

    try {
      const response = await axios.post('http://167.71.210.84:30080/orders/orders/fromCart', {
        userId: currentUser.id,
        shippingAddress: selectedAddress,
        paymentMethod: "WeChat"
      }, {
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });

      if (response.data.success) {
        message.success('Order placed successfully!');
      } else {
        message.error('Order failed: ' + response.data.message);
      }
    } catch (err) {
      console.error('Order failed:', err);
      message.error('Order failed');
    }
  };

  // Columns for the cart table
  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (_: any, record: CartItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src={record.productImage} width={60} height={60} alt={record.productName} />
          <span>{record.productName}</span>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `￥${price}`,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_: any, record: CartItem) => (
        <InputNumber
          min={1}
          value={record.quantity}
          onChange={(value) => {
            setCartItems(prev => prev.map(item => item.id === record.id ? { ...item, quantity: value } : item));
          }}
        />
      ),
    },
    {
      title: 'Subtotal',
      key: 'subtotal',
      render: (_: any, record: CartItem) => `￥${(record.price * record.quantity).toFixed(2)}`,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: CartItem) => (
        <Popconfirm
          title="Are you sure you want to remove this product?"
          onConfirm={() => setCartItems(prev => prev.filter(item => item.id !== record.id))}
          okText="Delete"
          cancelText="Cancel"
        >
          <Button danger size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <PageContainer>
      <Card>
        {loading ? (
          <Spin />
        ) : (
          <>
            <Table<CartItem> dataSource={cartItems} columns={columns} rowKey="id" pagination={false} />
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>Total: ￥{cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</div>

              {/* Address dropdown */}
              <Select
                style={{ width: 200 }}
                value={selectedAddress}
                onChange={(value) => setSelectedAddress(value)}
                placeholder="Select address"
              >
                {addresses.map((addr: any, index) => {
                  const formattedAddress = `${addr.street}, ${addr.city}, ${addr.state}`; // 拼接地址字段为字符串
                  return (
                    <Select.Option key={index} value={formattedAddress}>
                      {formattedAddress} {/* 显示拼接后的地址 */}
                    </Select.Option>
                  );
                })}
              </Select>


              {/* Checkout Button */}
              <Button type="primary" disabled={cartItems.length === 0 || !selectedAddress} onClick={() => handleCheckout(cartItems[0])}>
                Checkout
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Checkout Modal */}
      <Modal
        title="Choose Payment Method"
        visible={isCheckoutModalVisible}
        onCancel={() => setIsCheckoutModalVisible(false)}
        footer={null}
      >
        <Button
          type="primary"
          onClick={handleNormalPayment}
          style={{ width: '100%', marginBottom: 10 }}
        >
          Pay with Normal Payment
        </Button>
        <Button
          type="primary"
          onClick={() => {
            setIsFacePayment(true);
            setIsCheckoutModalVisible(false);
          }}
          style={{ width: '100%' }}
        >
          Pay with Face Recognition
        </Button>
      </Modal>

      {/* Face Payment Modal */}
      {isFacePayment && selectedProductForOrder && (
        <FacePaymentModal
          visible={isFacePayment}
          onClose={() => setIsFacePayment(false)}
          productid={selectedProductForOrder.productId}
          quantity={selectedQuantity}
          shippingAddress={selectedAddress}
          userid={currentUser.id}
          paymentMethod="WeChat"
        />
      )}
    </PageContainer>
  );
};

export default ShoppingCart;
