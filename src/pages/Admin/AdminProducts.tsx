import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Upload,
  Popconfirm,
} from "antd";
import axios from "axios";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;

const API_BASE = "http://146.190.90.142:30080/products";
const IMGBB_API_KEY = "4c1937ac35a3505be09b861109eb14d3";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const localUserStr = localStorage.getItem("currentUser");
  const currentUser = localUserStr ? JSON.parse(localUserStr) : null;

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/products`, {
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
      });
      if (response.data.success) {
        setProducts(response.data.data);
        console.log(response.data.data)
      }
    } catch (err) {
      message.error("Failed to fetch products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Upload image to ImgBB
  const handleUpload = async (file: any) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post(
        `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
        formData
      );

      if (response.data && response.data.success) {
        const imageUrl = response.data.data.url;
        message.success("Image uploaded successfully");
        form.setFieldsValue({ coverImageUrl: imageUrl });
        setFileList([file]);
      } else {
        message.error("Image upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.error("Upload failed");
    }
    return false;
  };

const handleAddProduct = async (values: any) => {
  setLoading(true);
  try {
    // 1. 创建产品
    const productRes = await axios.post(
      `${API_BASE}/products`,
      {
        ...values,
        createUser: "admin",
        updateUser: "admin",
        status: "AVAILABLE",
        rating: 0,
      },
      {
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
      }
    );

    // 2. 创建成功后获取 productId
    const productId = productRes.data?.data?.id;
    const imageUrl = values.coverImageUrl;

    // 3. 如果有图片 URL，就调用 POST /media 绑定到产品
    if (productId && imageUrl) {
      await axios.post(
        `${API_BASE}/media`,
        {
          productId,
          mediaType: "IMAGE",
          url: imageUrl,
          createUser: "admin",
          updateUser: "admin",
        },
        {
          headers: {
            Authorization: "Bearer " + currentUser.token,
          },
        }
      );
    }

    message.success("Product added successfully");
    setIsModalOpen(false);
    form.resetFields();
    setFileList([]);
    fetchProducts();
  } catch (err) {
    message.error("Failed to add product");
    console.error(err);
  } finally {
    setLoading(false);
  }
};


  // Delete product
  const handleDelete = async (id: number) => {
    try {
      const res = await axios.delete(`${API_BASE}/products/${id}`, {
        headers: {
          Authorization: "Bearer " + currentUser.token,
        },
      });
      if (res.data.success) {
        message.success("Product deleted");
        fetchProducts();
      } else {
        message.error(res.data.message || "Delete failed");
      }
    } catch (error) {
      console.error("Delete error:", error);
      message.error("Failed to delete product");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id" },
    { title: "Name", dataIndex: "name" },
    { title: "Category", dataIndex: "category" },
    { title: "Price", dataIndex: "price" },
    { title: "Stock", dataIndex: "stock" },
    { title: "Rating", dataIndex: "rating" },
    { title: "Title", dataIndex: "title" },
    {
      title: "Image",
      dataIndex: "coverImageUrl",
      render: (url: string) =>
        url ? <img src={url} alt="product" width={50} /> : "-",
    },
    {
      title: "Action",
      render: (_: any, record: any) => (
        <Popconfirm
          title="Are you sure to delete this product?"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button icon={<DeleteOutlined />} danger size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Button
        type="primary"
        onClick={() => setIsModalOpen(true)}
        style={{ marginBottom: 16 }}
      >
        Add New Product
      </Button>

      <Table rowKey="id" columns={columns} dataSource={products} />

      <Modal
        title="Add Product"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setFileList([]);
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleAddProduct}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="stock"
            label="Stock"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="sellerId"
            label="Seller ID"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="Smartphones">Smartphones</Option>
              <Option value="Laptops">Laptops</Option>
              <Option value="Pad">Pad</Option>
            </Select>
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="coverImage" label="Upload Cover Image">
            <Upload
              beforeUpload={handleUpload}
              onChange={({ fileList }) => setFileList(fileList)}
              fileList={fileList}
              showUploadList={true}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Click to Upload</Button>
            </Upload>
          </Form.Item>

          {/* Hidden field to store image URL */}
          <Form.Item name="coverImageUrl" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminProducts;
