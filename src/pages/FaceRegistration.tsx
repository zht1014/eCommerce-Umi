import React, { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const videoConstraints = {
  width: 640,
  height: 480,
  facingMode: "user",
};

const FaceRegistration = () => {
  const webcamRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialUserId = queryParams.get("userId") || "";
  const token = queryParams.get("token") || "";

  const [userId, setUserId] = useState(initialUserId);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState({ front: null, left: null, right: null });
  const [registerResults, setRegisterResults] = useState({});
  const [step, setStep] = useState(0);


  const stepLabels = ["Front Face", "Left Profile", "Right Profile"];
  const stepKeys = ["front", "left", "right"];

  console.log(queryParams)
  const capturePhoto = () => {
    if (!webcamRef.current) return null;
    return webcamRef.current.getScreenshot();
  };

  const handleCapture = () => {
    const imgSrc = capturePhoto();
    if (!imgSrc) {
      setMessage("Failed to capture image");
      setMessageType("error");
      return;
    }

    const newImages = { ...images, [stepKeys[step]]: imgSrc };
    setImages(newImages);
    setMessage(`Captured ${stepLabels[step]}`);
    setMessageType("success");
  };

  const registerImage = async (label, base64Image) => {
    setLoading(true);
    setMessage("");
    setMessageType("");
    try {
      const blob = await fetch(base64Image).then((res) => res.blob());
      const formData = new FormData();
      formData.append("image", blob, `${label}.jpg`);
      formData.append("userId", userId);
      console.log(userId)

      const response = await axios.post(
        "https://104-248-98-53.nip.io/payments/api/face-recognition/register",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "Authorization": "Bearer " + token,
          },
        }
      );

      return { success: true, data: response.data };
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Unknown error during registration.";
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const label = stepKeys[step];
    const imgData = images[label];

    if (!imgData) {
      setMessage(`Please capture ${stepLabels[step]} photo first.`);
      setMessageType("error");
      return;
    }

    setMessage(`⏳ Registering ${stepLabels[step]}...`);
    setMessageType("info");

    const result = await registerImage(label, imgData);

    setRegisterResults((prev) => ({
      ...prev,
      [label]: result,
    }));

    if (result.success) {
      setMessage(`Successfully registered ${stepLabels[step]}`);
      setMessageType("success");

      if (step < 2) setStep(step + 1);
      else setMessage("🎉 All face images registered successfully!");
    } else {
      setMessage(`Failed to register ${stepLabels[step]}: ${result.error}`);
      setMessageType("error");
    }
  };

  const handleReset = () => {
    setImages({ front: null, left: null, right: null });
    setRegisterResults({});
    setStep(0);
    setMessage("");
    setMessageType("");
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif" }}>
      <h2>Face Registration</h2>
      <h3>{stepLabels[step]}</h3>

      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={videoConstraints.width}
        height={videoConstraints.height}
        videoConstraints={videoConstraints}
        onUserMediaError={(err) => {
          console.error("Camera error", err);
          setMessage("Failed to access camera: " + err.message);
          setMessageType("error");
        }}
      />

      <div style={{ marginTop: "10px" }}>
        <button onClick={handleCapture} disabled={loading}>
          Capture {stepLabels[step]}
        </button>
        <button onClick={handleRegister} disabled={loading}>
          {loading ? "⏳ Registering..." : `Register ${stepLabels[step]}`}
        </button>
        <button onClick={handleReset} disabled={loading}>
          Reset
        </button>
        <button onClick={() => navigate("/user/login")} disabled={loading}>
          Back to Login
        </button>
      </div>

      {message && (
        <p
          style={{
            color:
              messageType === "success"
                ? "green"
                : messageType === "error"
                ? "red"
                : "black",
          }}
        >
          {message}
        </p>
      )}

      <h4>Captured Images:</h4>
      <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
        {stepKeys.map((key) => (
          <div key={key}>
            <p>{stepLabels[stepKeys.indexOf(key)]}</p>
            {images[key] ? (
              <img
                src={images[key]}
                alt={key}
                width={100}
                style={{ border: "1px solid #ccc", borderRadius: 5 }}
              />
            ) : (
              <p>Not captured</p>
            )}
          </div>
        ))}
      </div>

      <h4>Registration Results:</h4>
      <pre
        style={{
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          textAlign: "left",
          display: "inline-block",
        }}
      >
        {JSON.stringify(registerResults, null, 2)}
      </pre>
    </div>
  );
};

export default FaceRegistration;
