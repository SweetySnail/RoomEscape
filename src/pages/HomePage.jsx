import React, { useState } from 'react';

import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxModal from '../components/BoxModal';
import BoxSlider from '../components/BoxSlider';
import BoxMain from '../components/BoxMain';

import '../styles/Global.css';
import '../styles/HomePage.css';

function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <BoxSlider
          title="월간 인기 Top5"
          sortBy="rating"
          handleBoxClick={(p) => setSelectedProduct(p)} interval={3000}
        />
        <BoxSlider
          title="인기 예약 Top5"
          sortBy="reviewCount"
          handleBoxClick={(p) => setSelectedProduct(p)} interval={4500}
        />
        <BoxSlider
          title="테마 Top5"
          handleBoxClick={(p) => setSelectedProduct(p)} interval={6000}
        />
      </BoxMain>

      {selectedProduct && (
        <BoxModal
          productData={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

export default HomePage;