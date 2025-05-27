import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Card, Empty, Input, Modal, Tag, theme, Image, message, Spin, List, Rate, Select, InputNumber, Row, Col, } from 'antd';
import React, { useEffect, useState } from 'react';
import axios from 'axios'
import styled from 'styled-components';
import { DeleteOutlined, DeploymentUnitOutlined, EditOutlined, EllipsisOutlined, EyeInvisibleOutlined, EyeOutlined, PlusOutlined, SettingOutlined, ShareAltOutlined, ShoppingCartOutlined, ShoppingOutlined, TwitterOutlined } from '@ant-design/icons';

/**
 * 每个单独的卡片，为了复用样式抽成了组件
 * @param param0
 * @returns
 */

const ProCardWrap = styled.span`
  .ant-pro-card-body{
    padding: 8px;
  }
`

const ItemCard = styled.div`
  width: 100%;
  position: relative;
`
const Cover = styled.img`
  width: 100%;
  border-radius: 8px;
  height: 150px;
  object-fit: cover;
  background: #eee;
`

const Info = styled.div`
 display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 10px;
  gap: 4px;
`

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
`
const Status = styled.div`
  position: absolute;
  width: 100%;
  background: rgba(61,64,59,.6);
  padding: 2px 5px;
  color: #fff;
  border-radius: 8px 8px 0 0;
`

const Welcome: React.FC = () => {
  const { token } = theme.useToken();
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

  const handleAddToCart = async (product) => {
  try {
    const localUserStr = localStorage.getItem('currentUser');
    const currentUser = localUserStr ? JSON.parse(localUserStr) : null;

    if (!currentUser) {
      message.warning('请先登录！');
      return;
    }

    const res = await axios.post('http://146.190.90.142:30080/shoppingcarts/cart/add', {
      userId: currentUser.id,
      productId: product.id,
      quantity: 1, // 默认数量1
    }, {
      headers: {
        Authorization: `Bearer ${currentUser.token}`,
      },
    });

    if (res.data.success) {
      message.success('已成功加入购物车！');
    } else {
      message.error('加入购物车失败！');
    }
  } catch (error) {
    console.error('加入购物车失败:', error);
    message.error('加入购物车失败，请稍后再试！');
  }
};

  // 示例地址列表
  const addressOptions = [
    '123 Main Street',
    '456 Park Avenue',
    '789 High Street',
  ];

  // 点击 "购买" 图标时触发
  const handleBuyClick = (product: any) => {
    setSelectedProductForOrder(product);
    setSelectedQuantity(1);
    setSelectedAddress(addressOptions[0]);
    setOrderModalVisible(true);
  };

  // 确认下单
  const confirmOrder = async () => {
    if (!selectedProductForOrder) return;

    try {
      const response = await axios.post('http://146.190.90.142:30082/orders/orders', {
        userId: 1,
        orderStatus: 'Pending',
        totalAmount: selectedQuantity * selectedProductForOrder.price,
        paymentStatus: 'Pending',
        shippingAddress: selectedAddress,
        orderDate: new Date().toISOString(),
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createUser: 'user1',
        updateUser: 'user1',
        createDatetime: new Date().toISOString(),
        updateDatetime: new Date().toISOString(),
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

  interface Filters {
    category: string;
    minPrice?: number | null;
    maxPrice?: number | null;
    rating?: number | null;
  }

  const [filters, setFilters] = useState<Filters>({
    category: '',
    minPrice: undefined,
    maxPrice: undefined,
    rating: undefined,
  });



  // 获取 Feedback 函数
  const fetchFeedback = async (productId: number) => {
    try {
      setLoadingFeedback(true);
      const response = await axios.get(`http://146.190.90.142:30080/products/feedback/product/${productId}`);
      if (response.data.success) {
        setFeedbackList(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      message.error('Failed to load feedback');
    } finally {
      setLoadingFeedback(false);
    }
  };

  // 点击卡片时触发
  const handlePreview = (product: any) => {
    setSelectedProduct(product);
    setModalVisible(true);
    fetchFeedback(product.id)
  };

  const getProduct = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://146.190.90.142:30080/products/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('获取失败', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProduct();
  }, []);

  return (
    <PageContainer>
      <Card
        style={{
          borderRadius: 8,
        }}
        styles={{
          body: {
            backgroundImage:
              initialState?.settings?.navTheme === 'realDark'
                ? 'background-image: linear-gradient(75deg, #1A1B1F 0%, #191C1F 100%)'
                : 'background-image: linear-gradient(75deg, #FBFDFF 0%, #F5F7FF 100%)',
          },
        }}
      >
        <div
          style={{
            backgroundPosition: '100% -30%',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '274px auto',
            backgroundImage:
              "url('https://gw.alipayobjects.com/mdn/rms_a9745b/afts/img/A*BuFmQqsB2iAAAAAAAAAAAAAAARQnAQ')",
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px 0',
            }}
          >
            <Input.Search
              placeholder="..."
              enterButton="Search"
              style={{
                maxWidth: 400,
                width: '100%',
              }}
              onSearch={(value) => {
                // 这里处理搜索逻辑
                console.log('搜索内容:', value);
              }}
            />
          </div>
          <div
            style={{
              margin: '16px 0',
              padding: '16px',
              border: '1px solid #eee',
              borderRadius: 8,
              background: '#fafafa',
            }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Select
                  placeholder="Select category"
                  value={filters.category}
                  onChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                  style={{ width: '100%' }}
                >
                  <Option value="">All</Option>
                  <Option value="Electronics">Electronics</Option>
                  <Option value="Clothing">Clothing</Option>
                  <Option value="Home">Home</Option>
                </Select>
              </Col>
              <Col span={6}>
                <InputNumber
                  placeholder="Min price"
                  value={filters.minPrice}
                  onChange={(value) => setFilters((prev) => ({ ...prev, minPrice: value }))}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={6}>
                <InputNumber
                  placeholder="Max price"
                  value={filters.maxPrice}
                  onChange={(value) => setFilters((prev) => ({ ...prev, maxPrice: value }))}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Rating"
                  value={filters.rating}
                  onChange={(value) => setFilters((prev) => ({ ...prev, rating: value }))}
                  style={{ width: '100%' }}
                >
                  <Option value="">All</Option>
                  <Option value={5}>⭐⭐⭐⭐⭐</Option>
                  <Option value={4}>⭐⭐⭐⭐</Option>
                  <Option value={3}>⭐⭐⭐</Option>
                  <Option value={2}>⭐⭐</Option>
                  <Option value={1}>⭐</Option>
                </Select>
              </Col>
            </Row>
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            {products.length > 0 ? (
              products.map((product, index) => {
                const isOpen = product.status === 'AVAILABLE';
                return (
                  <ProCard
                    key={product.id}
                    colSpan={6}
                    layout="center"
                    hoverable
                    style={{
                      width: 300, // 固定宽度
                      maxWidth: 320, // 或者设最大宽度
                      minHeight: 240, // 固定高度或最小高度
                    }}
                    actions={[
                      <ShoppingCartOutlined key="add"  onClick={() => handleAddToCart(product)}/>,
                      <ShoppingOutlined key="buy" onClick={() => handleBuyClick(product)} />
                    ]}
                  >
                    <ItemCard onClick={() => handlePreview(product)}>
                      {isOpen && <Status></Status>}
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
            <Modal
              title="Confirm Order"
              open={orderModalVisible}
              onCancel={() => setOrderModalVisible(false)}
              onOk={confirmOrder}
              okText="Proceed To Payment"
            >
              {selectedProductForOrder && (
                <div>
                  <p><strong>Product:</strong> {selectedProductForOrder.name}</p>
                  <p><strong>Price :</strong> ￥{selectedProductForOrder.price}</p>
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


            <Modal
              title={selectedProduct?.name}
              open={modalVisible}
              onCancel={() => setModalVisible(false)}
              footer={[
                <Button key="add" type="primary" /* onClick={() => handleAddToCart(selectedProduct)} */>
                  Add to Cart
                </Button>,
                <Button key="buy" /* onClick={() => handleBuyNow(selectedProduct)} */>
                  Buy Now
                </Button>,
              ]}
            >
              {selectedProduct && (
                <div style={{ textAlign: 'center' }}>
                  <Image src={selectedProduct.coverImageUrl} width={200} />
                  <p style={{ marginTop: 12 }}>{selectedProduct.description}</p>
                  <div>
                    <Tag color="#55acee">{selectedProduct.category}</Tag>
                    <Tag color="#2fd661">{`￥${selectedProduct.price}`}</Tag>
                    <div>Rating: {selectedProduct.rating}</div>
                    <div>Stock: {selectedProduct.stock}</div>
                  </div>
                  <h3 style={{ marginTop: 20, textAlign: 'left' }}>Feedback</h3>
                  <div style={{ textAlign: 'left' }}>
                    {loadingFeedback ? (
                      <Spin />
                    ) : feedbackList.length > 0 ? (
                      <List
                        dataSource={feedbackList}
                        renderItem={(item) => (
                          <List.Item>
                            <List.Item.Meta
                              title={<Rate disabled value={item.rating} />}
                              description={item.comment}
                            />
                            <div>{new Date(item.createDatetime).toLocaleString()}</div>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <p>No feedback yet.</p>
                    )}
                  </div>
                </div>
              )}
            </Modal>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Welcome;




/* const InfoCard: React.FC<{
  title: string;
  index: number;
  desc: string;
  href: string;
}> = ({ title, href, index, desc }) => {
  const { useToken } = theme;

  const { token } = useToken();

  return (
    <div
      style={{
        backgroundColor: token.colorBgContainer,
        boxShadow: token.boxShadow,
        borderRadius: '8px',
        fontSize: '14px',
        color: token.colorTextSecondary,
        lineHeight: '22px',
        padding: '16px 19px',
        minWidth: '220px',
        flex: 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            lineHeight: '22px',
            backgroundSize: '100%',
            textAlign: 'center',
            padding: '8px 16px 16px 12px',
            color: '#FFF',
            fontWeight: 'bold',
            backgroundImage:
              "url('https://gw.alipayobjects.com/zos/bmw-prod/daaf8d50-8e6d-4251-905d-676a24ddfa12.svg')",
          }}
        >
          {index}
        </div>
        <div
          style={{
            fontSize: '16px',
            color: token.colorText,
            paddingBottom: 8,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          fontSize: '14px',
          color: token.colorTextSecondary,
          textAlign: 'justify',
          lineHeight: '22px',
          marginBottom: 8,
        }}
      >
        {desc}
      </div>
      <a href={href} target="_blank" rel="noreferrer">
        了解更多 {'>'}
      </a>
    </div>
  );
}; */