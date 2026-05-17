import React, { useState, useEffect } from 'react';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxModal from '../components/BoxModal';
import BoxSlider from '../components/BoxSlider';
import SeasonalSlider from '../components/SeasonalSlider';
import BoxMain from '../components/BoxMain';
import { getTemporaryProducts } from '../services/productService';
import '../styles/Global.css';
import '../styles/HomePage.css';

function HomePage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [seasonalProducts, setSeasonalProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTemporaryProducts();
        setSeasonalProducts(data);
      } catch (e) {
        console.error('시즌 상품 불러오기 실패:', e);
      }
    };
    load();
  }, []);

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <BoxSlider
          title="월간 인기 Top5"
          sortBy="rating"
          handleBoxClick={(p) => setSelectedProduct(p)}
          interval={3000}
        />
        <BoxSlider
          title="인기 예약 Top5"
          sortBy="reviewCount"
          handleBoxClick={(p) => setSelectedProduct(p)}
          interval={4500}
        />

        {/* 시즌 한정 이벤트 섹션 */}
        {seasonalProducts.length > 0 && (
          <SeasonalSlider
            products={seasonalProducts}
            handleBoxClick={(p) => setSelectedProduct(p)}
          />
        )}

        <BoxSlider
          title="테마 Top5"
          handleBoxClick={(p) => setSelectedProduct(p)}
          interval={6000}
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