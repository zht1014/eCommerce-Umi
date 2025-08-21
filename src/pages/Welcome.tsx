import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Button, Card, Empty, Input, Modal, Tag, theme, Image, message, Spin, List, Rate, Select, InputNumber, Row, Col, Pagination, } from 'antd';
import React, { useEffect, useState } from 'react';
import axios from 'axios'
import styled from 'styled-components';
import { ShoppingCartOutlined, ShoppingOutlined } from '@ant-design/icons';
import Chat from './Chat/Chat';
import FacePaymentModal from '@/components/FacePaymentModal';
import { filter } from 'lodash';


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
  const [currentKeyword, setCurrentKeyword] = useState('')
  const [relatedMap, setRelatedMap] = useState<Record<number, Product[]>>({});
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [recProduct, setRecProduct] = useState<any[]>([]);
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false); // 控制支付方式选择弹窗的显示
  const [isFacePayment, setIsFacePayment] = useState(false); // 是否选择人脸支付


  const localUserStr = localStorage.getItem('currentUser');
  const currentUser = localUserStr ? JSON.parse(localUserStr) : null;
  console.log(currentUser)
  console.log(loading)


  const handleFilter = async (nextFilters?: Filters) => {
    const appliedFilters = nextFilters || filters;
    setFilters({ ...appliedFilters});
    setLoading(true);
    try {
      const response = await axios.get(`https://104.248.98.53/products/products/sort`, {
        params: {
          name: appliedFilters.name,
          minPrice: appliedFilters.minPrice,
          maxPrice: appliedFilters.maxPrice,
          category: appliedFilters.category,
          rating: appliedFilters.rating,
          page: currentPage,
          size: pageSize
        },
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
      if (response.data.success) {
        setProducts(response.data.data.records || []);
        setTotal(response.data.data.total || 0);
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
      const response = await axios.get(`https://104.248.98.53/products/products/sort`, {
        params: {
          name: filters.name,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          category: filters.category,
          rating: filters.rating,
          page: currentPage,
          size: pageSize
        },
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
      if (response.data.success) {
        setProducts(response.data.data.records || []);
        setTotal(response.data.data.total || 0);
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
      /* const response = await axios.get(`https://104.248.98.53/products/products/page?page=${page}&size=${size}`, {
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      }); */
      const response = await axios.get(`https://104.248.98.53/products/products/sort`, {
        params: {
          name: filters.name,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          category: filters.category,
          rating: filters.rating,
          page: page,
          size: size
        },
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

      const res = await axios.post('https://104.248.98.53/shoppingcarts/cart/add', {
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
    setOrderModalVisible(true)
    setSelectedProductForOrder(product);
    setSelectedQuantity(1);
    const res = await axios.get(`https://104.248.98.53/users/api/addresses/user/${currentUser.id}`, {
      headers: {
        'Authorization': 'Bearer ' + currentUser.token,
      },
    });
    const addresses = res.data || [];
    const formattedAddresses = addresses.map((addr: any) => `${addr.street}, ${addr.city}, ${addr.state}`);

    setSelectedAddress(formattedAddresses[0]);
    setAddressOptions(formattedAddresses);

  }


  const getRecommendation = async () => {
    try {
      /* const response = await axios.get(`https://104.248.98.53/products/products/recommend/user/${currentUser.id}/top`) */
      const response = await axios.get(`https://104.248.98.53/products/products/recommend/user/1/top`, {
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      })
      if (response.data.success) {
        setRecProduct(response.data.data)
      }
    } catch (err) {
      message.error('Recommendation failed');
    } finally {
      setLoading(false);
    }
  }

  const confirmOrder = async () => {
    console.log({
      "productId": selectedProductForOrder.id,
      "quantity": selectedQuantity,
      "shippingAddress": selectedAddress,
      "userId": currentUser.id
    })
    if (!selectedProductForOrder) return;

    try {
      const response = await axios.post('https://104.248.98.53/orders/orders/direct', {
        "productId": selectedProductForOrder.id,
        "quantity": selectedQuantity,
        "useFaceRecognition": false,
        "shippingAddress": selectedAddress,
        "userId": currentUser.id,
        "paymentMethod": "WeChat"
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

  interface Filters {
    name?: string;
    category: string;
    minPrice?: number | null;
    maxPrice?: number | null;
    rating?: number | null;
  }



  const fetchFeedback = async (productId: number) => {
    try {
      setLoadingFeedback(true);
      const response = await axios.get(`https://104.248.98.53/products/feedback/product/${productId}`, {
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
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


  const handlePreview = async (product: Product) => {
    setSelectedProduct(product);
    setModalVisible(true);
    fetchFeedback(product.id);

    const productId = Number(product.id);

    if (!relatedMap[productId]) {
      setLoadingRelated(true);
      try {
        const res = await axios.get(`https://104.248.98.53/products/products/recommend/related/${productId}`, {
          headers: {
            'Authorization': 'Bearer ' + currentUser.token,
          },
        });
        const related = res.data.data || [];
        setRelatedMap((prev) => ({ ...prev, [productId]: related }));
      } catch (err) {
        console.error('Failed to get relevant recommendations', err);
      } finally {
        setLoadingRelated(false);
      }
    }
  };


  const getProduct = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://104.248.98.53/products/products', {
        headers: {
          'Authorization': 'Bearer ' + currentUser.token,
        },
      });
      if (res.data.success) {
        console.log(res)
        setProducts(res.data.data);
        const productList = res.data.data;
        setProducts(productList);

      }
    } catch (err) {
      console.error('failed getting products', err);
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    getProduct();
    getRecommendation();
  }, []);

  // 普通支付
  const handleNormalPayment = () => {
    setIsFacePayment(false);
    setPaymentMethodModalVisible(false); // 关闭支付方式选择弹窗
    confirmOrder(); // 执行普通支付
  }

  // 人脸支付
  const handleFacePayment = () => {
    console.log(selectedProduct)
    setIsFacePayment(true);
    setPaymentMethodModalVisible(false); // 关闭支付方式选择弹窗
  }


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
              placeholder="Search products by keyword..."
              enterButton="Search"
              style={{
                maxWidth: 400,
                width: '100%',
              }}
              onSearch={(value) => {
                handleSearch(value);
                setCurrentKeyword(value)
                setCurrentPage(1);
                const newFilters = { ...filters, name: value };
                setFilters(newFilters);
              }}
              onChange={(e) => {
                setCurrentKeyword(e.target.value)
                console.log(currentKeyword)
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
                  onChange={(value) => {
                    const newFilters = { ...filters, category: value };
                    setFilters(newFilters);
                    handleFilter(newFilters);
                  }}
                  style={{ width: '100%' }}
                >
                  <Option value="">All</Option>
                  <Option value="Smartphones">Smartphones</Option>
                  <Option value="Laptops">Laptops</Option>
                  <Option value="Pad">Pad</Option>
                </Select>
              </Col>
              <Col span={6}>
                <InputNumber
                  placeholder="Min price"
                  value={filters.minPrice}
                  onChange={(value) => {
                    const newFilters = { ...filters, minPrice: value };
                    setFilters(newFilters);
                    handleFilter(newFilters);
                  }}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={6}>
                <InputNumber
                  placeholder="Max price"
                  value={filters.maxPrice}
                  onChange={(value) => {
                    const newFilters = { ...filters, maxPrice: value };
                    setFilters(newFilters);
                    handleFilter(newFilters);
                  }}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={6}>
                <Select
                  placeholder="Rating"
                  value={filters.rating}
                  onChange={(value) => {
                    const newFilters = { ...filters, rating: value };
                    setFilters(newFilters);
                    handleFilter(newFilters);
                  }}
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
                      <ShoppingOutlined key="buy" onClick={() => handleBuyClick(product)} />
                    ]}
                  >
                    <ItemCard onClick={() => handlePreview(product)}>
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
            <Modal
              title="Confirm Order"
              open={orderModalVisible}
              onCancel={() => setOrderModalVisible(false)}
              onOk={() => {
                setPaymentMethodModalVisible(true)
                setOrderModalVisible(false)
              }}
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
              title="Select Payment Method"
              visible={paymentMethodModalVisible}
              onCancel={() => setPaymentMethodModalVisible(false)}
              footer={null}
            >
              <div>
                <Button type="primary" onClick={handleNormalPayment} style={{ width: '100%', marginBottom: 10 }}>
                  Normal Payment
                </Button>
                <Button type="primary" onClick={handleFacePayment} style={{ width: '100%' }}>
                  Face Payment
                </Button>
              </div>
            </Modal>

            {isFacePayment && (
              <FacePaymentModal
                visible={isFacePayment}
                onClose={() => setIsFacePayment(false)}
                productid={selectedProductForOrder.id}
                quantity={selectedQuantity}
                shippingAddress={selectedAddress}
                userid={currentUser.id}
                paymentMethod="WeChat"  // 可以根据需要设置支付方式
              //useFaceRecognition={true}  
              />

            )}



            <Modal
              title={selectedProduct?.name}
              open={modalVisible}
              onCancel={() => setModalVisible(false)}
              footer={[
                <Button key="add" type="primary" onClick={() => handleAddToCart(selectedProduct)}>
                  Add to Cart
                </Button>,
                <Button
                  key="buy"
                  onClick={() => {
                    setModalVisible(false);
                    handleBuyClick(selectedProduct);
                  }}
                >
                  Buy Now
                </Button>,
              ]}
            >
              {selectedProduct && (
                <div style={{ textAlign: 'center' }}>
                  <Image src={selectedProduct.coverImageUrl} width={320} height={200} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  <p style={{ marginTop: 12 }}>{selectedProduct.description}</p>
                  <div>
                    <Tag color="#55acee">{selectedProduct.category}</Tag>
                    <Tag color="#2fd661">￥{selectedProduct.price}</Tag>
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

                  <div style={{ textAlign: 'left', marginTop: 24, maxHeight: 260, overflowY: 'auto' }}>
                    <h3>Relevant Recommendations</h3>
                    {loadingRelated ? (
                      <Spin />
                    ) : relatedMap[Number(selectedProduct.id)]?.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {relatedMap[Number(selectedProduct.id)].map((rel) => (
                          <div
                            key={rel.id}
                            onClick={() => {
                              setModalVisible(false);
                              handlePreview(rel);
                              console.log(rel)
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', maxHeight: 80, overflow: 'hidden' }}
                          >
                            <div
                              style={{
                                width: 80,
                                height: 60,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f5f5f5',
                                borderRadius: 4,
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={rel.coverImageUrl}
                                alt={rel.name}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain',
                                  borderRadius: 4,
                                }}
                              />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>{rel.name}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: '#999' }}>No recommendation</p>
                    )}
                  </div>
                </div>
              )}
            </Modal>
          </div>
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size || 10);
              }}
              showSizeChanger
              pageSizeOptions={['5', '10', '20', '50']}
            />
          </div>

          <div style={{ overflowX: 'auto', padding: '16px' }}>
            <h2 style={{ marginBottom: '12px' }}>Recommended Products</h2>
            <div style={{ display: 'flex', gap: '16px' }}>
              {recProduct.length > 0 ? (
                recProduct.map((product) => {
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
                        flex: '0 0 auto', // Prevent flex items from shrinking
                      }}
                      actions={[
                        <ShoppingCartOutlined key="add" onClick={() => handleAddToCart(product)} />,
                        <ShoppingOutlined key="buy" onClick={() => handleBuyClick(product)} />,
                      ]}
                    >
                      <ItemCard onClick={() => handlePreview(product)}>
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
              <Chat />
            </div>
          </div>

        </div>
      </Card>

    </PageContainer>
  );
};

export default Welcome;