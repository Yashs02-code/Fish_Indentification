import React from 'react';

function PredictionCard({ image, result }) {
  return (
    <div className="card">
      <img src={image} alt="Captured Fish" className="card-image" />
      <div className="card-content">
        <h2 className="fish-type">{result.fish_type}</h2>
        <p><strong>Description:</strong> {result.description}</p>
        <p><strong>Habitat:</strong> {result.habitat}</p>
        <p><strong>Edibility:</strong> {result.edibility}</p>
      </div>
    </div>
  );
}

export default PredictionCard;
