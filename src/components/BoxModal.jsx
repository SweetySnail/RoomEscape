import React from 'react';
import '../styles/BoxModal.css';


function BoxModal({ productData, onClose }) {
  if (!productData) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>×</button>
        <h3>{productData.title}</h3>
        <p>⭐ {productData.rating} ({productData.reviewCount} 리뷰)</p>
        <p>테마: {productData.theme}</p>
        <p>가격: {productData.price}</p>
        <hr />
        <h4>상세 설명</h4>
        <p>{productData.detailedDescription}</p>
        <hr />
        <h4>리뷰 상세</h4>
        <ul>
          {productData.detailedReviews.map((review, index) => (
            <li key={index}>{review}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default BoxModal;