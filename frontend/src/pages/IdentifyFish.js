import React, { useState, useRef } from "react";
import axios from "axios";
import "../styles/global.css";
import "../styles/IdentifyFish.css";

function IdentifyFish() {
  const videoRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null); // Blob
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null);

  // Start camera
  const startCamera = async () => {
    if (!videoRef.current) {
      alert("Video element not ready!");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // back camera
      });
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play();
      setStream(mediaStream);
    } catch (err) {
      console.error("Camera error:", err);
      alert(
        "Cannot access camera! Please allow camera permissions and access the app via your laptop IP."
      );
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      setCapturedImage(blob);
    }, "image/jpeg");
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Upload captured photo
  const handleUpload = async () => {
    if (!capturedImage) return alert("Please capture an image first!");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", capturedImage, "fish.jpg");

    try {
      // Backend URL using your laptop's IP + backend port
      const response = await axios.post(
        "http://10.174.79.194:8000/classify",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      let rawResponse = response.data.description || "";
      // Remove ```json ... ``` wrappers if present
      rawResponse = rawResponse.replace(/```json|```/g, "").trim();

      let parsedData;
      try {
        parsedData = JSON.parse(rawResponse);
      } catch (err) {
        console.error("Error parsing JSON:", err);
        parsedData = {
          fish_type: response.data.fish_name || "Unknown",
          description: response.data.description || "N/A",
          habitat: "Unknown",
          edibility: "Unknown",
        };
      }

      setResult(parsedData);
    } catch (error) {
      console.error(error);
      alert("Error classifying fish! Check backend and network connection.");
    }

    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h1>🐟 Samudra Sahayak – Fish Identifier</h1>
        <p>Capture an image of a fish and our AI will classify it with extra insights!</p>

        {!stream && (
          <button onClick={startCamera} style={{ marginBottom: "10px" }}>
            Start Camera
          </button>
        )}

        {stream && (
          <div>
            <video
              ref={videoRef}
              style={{ width: "100%", maxWidth: "400px", border: "1px solid gray" }}
            />
            <div style={{ marginTop: "10px" }}>
              <button onClick={capturePhoto}>Capture Photo</button>
              <button onClick={stopCamera} style={{ marginLeft: "10px" }}>
                Stop Camera
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div style={{ marginTop: "10px" }}>
            <h3>Captured Image:</h3>
            <img
              src={URL.createObjectURL(capturedImage)}
              alt="Captured"
              style={{ width: "100%", maxWidth: "400px" }}
            />
          </div>
        )}

        <button onClick={handleUpload} style={{ marginTop: "10px" }}>
          Identify Fish
        </button>

        {loading && <p>Loading...</p>}

        {result && (
          <div className="result">
            <h2>Result: {result.fish_type}</h2>
            <p>
              <strong>Description:</strong> {result.description}
            </p>
            <p>
              <strong>Habitat:</strong> {result.habitat || "Unknown"}
            </p>
            <p>
              <strong>Edibility:</strong> {result.edibility || "Unknown"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default IdentifyFish;
