import React, { useState } from 'react';
// import React, { useState, useEffect, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxModal from '../components/BoxModal';
import BoxSlider from '../components/BoxSlider';
import BoxMain from '../components/BoxMain';

import '../styles/Global.css';
import '../styles/HomePage.css'

// 이후 삭제
// import productsData from '../product';

function HomePage() {
  // const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showBoxModal, setShowBoxModal] = useState(false);

  // const handleNavigate = (path) => {
  //   navigate(path);
  // };

  const handleBoxClick = (product) => {
    setSelectedProduct(product);
    setShowBoxModal(true);
  };

  const handleCloseModal = () => {
    setShowBoxModal(false);
    setSelectedProduct(null);
  };

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <BoxSlider 
          title="월간 인기 Top5"
          handleBoxClick={handleBoxClick}
        />
        <BoxSlider 
          title="인기 예약 Top5"
          handleBoxClick={handleBoxClick}
        />
        <BoxSlider 
          title="테마 Top5"
          handleBoxClick={handleBoxClick}
        />
      </BoxMain>
      
      {showBoxModal && (
        <BoxModal
          productData={selectedProduct}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default HomePage;