import React, { useState } from 'react';
import CameraCapture from './components/CameraCapture';
import PredictionCard from './components/PredictionCard';

function App() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleImageCapture = async (imageBlob) => {
    setLoading(true); // show spinner
    const formData = new FormData();
    formData.append('file', imageBlob, 'fish.jpg');

    try {
      const res = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      // Add new prediction to history
      setHistory((prev) => [
        { image: URL.createObjectURL(imageBlob), result: data },
        ...prev,
      ]);
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to get fish prediction.");
    } finally {
      setLoading(false); // hide spinner
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">🐟 Fish Identifier App</h1>
      <CameraCapture onImageCapture={handleImageCapture} />
      {loading && <div className="spinner">Analyzing Image...</div>}

      <div className="history-container">
        {history.length === 0 && !loading && (
          <p className="no-history">Capture a fish image to see results.</p>
        )}
        {history.map((item, index) => (
          <PredictionCard
            key={index}
            image={item.image}
            result={item.result}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
