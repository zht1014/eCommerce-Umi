import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Card, Empty, Input, Modal, Tag, Image, message, Spin, List, Rate, Select, InputNumber, Row, Col, Pagination, } from 'antd';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { ShoppingCartOutlined, ShoppingOutlined } from '@ant-design/icons';
import Chat from './Chat/Chat';
import FacePaymentModal from '@/components/FacePaymentModal';

/**
 * 
 * @param param0
 * @returns
 */
export interface Product {
  id: number;
  name: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  rating: number;
  category: string;
  status: string;
  coverImageUrl: string;
  sellerId: number;
  createUser: string;
  updateUser: string;
  createDatetime: string | null;
  updateDatetime: string | null;
}

const ItemCard = styled.div`
  width: 100%;
  position: relative;
`;

const Cover = styled.img`
  width: 100%;
  border-radius: 8px;
  height: 150px;
  object-fit: cover;
  background: #eee;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 10px;
  gap: 4px;
`;

const Name = styled.div`
  font-size: 16px;
  font-weight: bold;
  color: #3670f7;
  flex: 1;
  overflow: hidden;
  margin-right: 20px;
  text-overflow: ellipsis;
  word-break: keep-all;
  white-space: nowrap;
`;

const Status = styled.div`
  position: absolute;
  width: 100%;
  background: rgba(61,64,59,.6);
  padding: 2px 5px;
  color: #fff;
  border-radius: 8px 8px 0 0;
`;

const Welcome: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const { Option } = Select;
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<any>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [selectedAddress, setSelectedAddress] = useState<string>('Default address');
  const [addressOptions, setAddressOptions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [filters, setFilters] = useState<Filters>({
    name: '',
    category: '',
    minPrice: undefined,
    maxPrice: undefined,
    rating: undefined,
  });
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [relatedMap, setRelatedMap] = useState<Record<number, Product[]>>({});
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [recProduct, setRecProduct] = useState<any[]>([]);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);  // To control the payment method options modal

  const localUserStr = localStorage.getItem('currentUser');
  const currentUser = localUserStr ? JSON.parse(localUserStr) : null;

  const handleFilter = async (nextFilters?: Filters) => {
    const appliedFilters = nextFilters || filters;
    setLoading(true);
    try {
      const response = await axios.get(`http://146.190.90.142:30080/products/products/filter`, {
        params: {
          name: appliedFilters.name || '',
          category: appliedFilters.category || '',
          minPrice: appliedFilters.minPrice || '',
          maxPrice: appliedFilters.maxPrice || '',
          rating: appliedFilters.rating || '',
        },
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
      if (response.data.success) {
        setProducts(response.data.data || []);
        setTotal(response.data.data.length);
      } else {
        message.error('No products found');
      }
    } catch (err) {
      message.error('Filter failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (keyword: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://146.190.90.142:30080/products/products/search?keyword=${keyword}`, {
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
      if (response.data.success) {
        setProducts(response.data.data || []);
        setTotal(response.data.data.length);
      } else {
        message.error('No products found');
      }
    } catch (err) {
      message.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsByPage = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://146.190.90.142:30080/products/products/page?page=${page}&size=${size}`, {
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
      if (response.data.success) {
        setProducts(response.data.data.records || []);
        setTotal(response.data.data.total || 0);
      }
    } catch (err) {
      message.error('Failed to fetch products by page');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsByPage(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const handleAddToCart = async (product: Product) => {
    try {
      if (!currentUser) {
        message.warning('Please log in first!');
        return;
      }

      const res = await axios.post('http://146.190.90.142:30080/shoppingcarts/cart/add', {
        userId: currentUser.id,
        productId: product.id,
        quantity: 1,
        price: product.price
      }, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      if (res.data.success) {
        message.success('Added to cart successfully!');
      } else {
        message.error('Failed to add to cart!');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      message.error('Failed to add to cart, please try again later.');
    }
  };

  const handleBuyClick = async (product: any) => {
    setSelectedProductForOrder(product);
    setSelectedQuantity(1);
    const res = await axios.get(`http://146.190.90.142:30080/users/api/addresses/user/${currentUser.id}`, {
      headers: {
        'Authorization': 'Bearer ' + currentUser.token,
      },
    });
    const addresses = res.data || [];
    const formattedAddresses = addresses.map((addr: any) => `${addr.street}, ${addr.city}, ${addr.state}`);
    setSelectedAddress(formattedAddresses[0]);
    setAddressOptions(formattedAddresses);
    setOrderModalVisible(true);
  };

  const confirmOrder = async () => {
    if (!selectedProductForOrder) return;

    try {
      const response = await axios.post('http://146.190.90.142:30080/orders/orders/direct', {
        "productId": selectedProductForOrder.id,
        "quantity": selectedQuantity,
        "shippingAddress": selectedAddress,
        "userId": currentUser.id
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
    } finally {
      setOrderModalVisible(false);
    }
  };

  const handlePaymentSelection = (paymentMethod: string) => {
    if (paymentMethod === 'normal') {
      confirmOrder();
    } else if (paymentMethod === 'face') {
      setShowFaceModal(true);
    }
    setShowPaymentOptions(false);
  };

  return (
    <PageContainer>
      <Card
        style={{
          borderRadius: 8,
        }}
      >
        <div>
          {/* Your search bar, filters, and other components */}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {products.length > 0 ? (
              products.map((product) => {
                const isOpen = product.status === 'AVAILABLE';

                return (
                  <ProCard
                    key={product.id}
                    colSpan={6}
                    layout="center"
                    hoverable
                    style={{
                      width: 300,
                      maxWidth: 320,
                      minHeight: 260,
                    }}
                    actions={[
                      <ShoppingCartOutlined key="add" onClick={() => handleAddToCart(product)} />,
                      <ShoppingOutlined key="buy" onClick={() => handleBuyClick(product)} />,
                    ]}
                  >
                    <ItemCard onClick={() => setModalVisible(true)}>
                      {isOpen && <Status />}
                      <Cover src={product.coverImageUrl || 'https://res-console.bowell.com/img/bg.08407d40.jpg'} />
                      <Info>
                        <Name>{product.name}</Name>
                        <div>
                          <Tag color="#55acee">{product.category}</Tag>
                          <Tag color="#2fd661">{`￥${product.price}`}</Tag>
                        </div>
                      </Info>
                    </ItemCard>
                  </ProCard>
                );
              })
            ) : (
              <Empty />
            )}
          </div>

          {/* Order Modal */}
          <Modal
            title="Confirm Order"
            open={orderModalVisible}
            onCancel={() => setOrderModalVisible(false)}
            onOk={() => setShowPaymentOptions(true)} // Open payment method options
            okText="Proceed To Payment"
          >
            {selectedProductForOrder && (
              <div>
                <p><strong>Product:</strong> {selectedProductForOrder.name}</p>
                <p><strong>Price:</strong> ￥{selectedProductForOrder.price}</p>
                <p><strong>Quantity:</strong></p>
                <InputNumber
                  min={1}
                  value={selectedQuantity}
                  onChange={(value) => setSelectedQuantity(value || 1)}
                  style={{ width: '100%', marginBottom: 12 }}
                />
                <p><strong>Shipping Address:</strong></p>
                <Select
                  value={selectedAddress}
                  onChange={(value) => setSelectedAddress(value)}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  {addressOptions.map((addr) => (
                    <Select.Option key={addr} value={addr}>
                      {addr}
                    </Select.Option>
                  ))}
                </Select>
                <p><strong>Total Price:</strong> ￥{(selectedQuantity * selectedProductForOrder.price).toFixed(2)}</p>
              </div>
            )}
          </Modal>

          {/* Payment Options Modal */}
          <Modal
            title="Select Payment Method"
            open={showPaymentOptions}
            onCancel={() => setShowPaymentOptions(false)}
            footer={null}
          >
            <div>
              <Button
                type="primary"
                style={{ marginBottom: 16, marginRight: 20 }} // Adding margin-right to create space between buttons
                onClick={() => handlePaymentSelection('normal')}
              >
                Normal Payment
              </Button>
              <Button
                type="primary"
                style={{ marginBottom: 16 }}
                onClick={() => handlePaymentSelection('face')}
              >
                Face Payment
              </Button>
            </div>

          </Modal>

          {/* Face Payment Modal */}
          <FacePaymentModal visible={showFaceModal} onClose={() => setShowFaceModal(false)} />
        </div>
      </Card>
    </PageContainer>
  );
};

export default Welcome;
