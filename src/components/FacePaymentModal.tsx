// src/components/FacePaymentModal.tsx
import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { Modal, Button } from 'antd';

const FacePaymentModal = ({
  visible,
  onClose,
  productid,
  quantity,
  shippingAddress,
  userid,
  paymentMethod
}: {
  visible: boolean;
  onClose: () => void;
  productid: number;
  quantity: number;
  shippingAddress: string;
  userid: number;
  paymentMethod: string
}) => {
  const webcamRef = useRef(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const localUserStr = localStorage.getItem('currentUser');
  const currentUser = localUserStr ? JSON.parse(localUserStr) : null;

  const captureAndPay = async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setMessage('Failed to capture image');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');
    setMessageType('');
    setPaymentData(null);

    try {
      const blob = await fetch(imageSrc).then((r) => r.blob());

      const formData = new FormData();
      formData.append('image', blob, 'face.jpg');
      // Append additional order details
      formData.append('productId', productid);
      formData.append('quantity', quantity.toString());
      formData.append('shippingAddress', shippingAddress);
      formData.append('userId', userid.toString());
      formData.append('paymentMethod', paymentMethod);

      const response = await axios.post(
        'https://104-248-98-53.nip.io/payments/api/face-recognition/faceVerify',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': 'Bearer ' + currentUser.token,
          },
        }
      );

      const data = response.data;
      setPaymentData(data);
      setMessage(data.message);
      setMessageType('success');
    } catch (error) {
      const errMsg = error.response?.data?.message || error.response?.data?.error || 'Unexpected error occurred.';
      setMessage(errMsg);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Pay with Face"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnClose
    >
      <div style={{ textAlign: 'center' }}>
        <Webcam ref={webcamRef} screenshotFormat="image/jpeg" width={640} height={480} />
        <br />
        <Button
          onClick={captureAndPay}
          loading={loading}
          type="primary"
          style={{ marginTop: 10 }}
        >
          Pay with Face
        </Button>

        {message && (
          <p
            style={{
              marginTop: '15px',
              color: messageType === 'success' ? 'green' : 'red',
              fontWeight: 'bold',
            }}
          >
            {message}
          </p>
        )}

        {paymentData && (
          <div
            style={{
              marginTop: '20px',
              textAlign: 'left',
              display: 'inline-block',
              backgroundColor: '#f9f9f9',
              padding: '15px',
              borderRadius: '10px',
              maxWidth: '600px',
            }}
          >
            <h4>Payment Response:</h4>
            <pre style={{ textAlign: 'left', whiteSpace: 'pre-wrap' }}>
              {JSON.stringify(paymentData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default FacePaymentModal;

