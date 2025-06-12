import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, InputNumber, Button, Popconfirm, message, Image, Spin } from 'antd';
import axios from 'axios';

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

  const localUserStr = localStorage.getItem('currentUser');
  const currentUser = localUserStr ? JSON.parse(localUserStr) : null;

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem('currentUser');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user) {
        message.error('Please login first');
        return;
      }

      const cartRes = await axios.get(`http://146.190.90.142:30080/shoppingcarts/cart/items?userId=${user.id}`,{
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
      const cartData = cartRes.data.data || [];


      const detailedCart = await Promise.all(
        cartData.map(async (item: any) => {
          const productRes = await axios.get(`http://146.190.90.142:30080/products/products/${item.productId}`,{
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

  useEffect(() => {
    fetchCartItems();
  }, []);

  const updateQuantity = (id: number, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const deleteItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
    message.success('Product removed from cart');
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
          onChange={(value) => updateQuantity(record.id, value || 1)}
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
          onConfirm={() => deleteItem(record.id)}
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
              <div style={{ fontSize: 18, fontWeight: 'bold' }}>Total: ￥{totalPrice.toFixed(2)}</div>
              <Button type="primary" disabled={cartItems.length === 0}>
                Checkout
              </Button>
            </div>
          </>
        )}
      </Card>
    </PageContainer>
  );
};

export default ShoppingCart;
