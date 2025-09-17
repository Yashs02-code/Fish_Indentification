import React, { useRef, useState } from 'react';

function CameraCapture({ onImageCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      videoRef.current.srcObject = stream;
      setStreaming(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const capturePhoto = () => {
    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    canvasRef.current.width = width;
    canvasRef.current.height = height;
    const ctx = canvasRef.current.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, width, height);

    canvasRef.current.toBlob((blob) => {
      onImageCapture(blob);
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="camera-container">
      <video ref={videoRef} autoPlay className="video-feed"></video>
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
      {!streaming && <button onClick={startCamera} className="btn">Start Camera</button>}
      {streaming && <button onClick={capturePhoto} className="btn">Capture</button>}
    </div>
  );
}

export default CameraCapture;
