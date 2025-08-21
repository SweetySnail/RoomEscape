import React, { useState, useEffect, useRef } from 'react';
import '../styles/Global.css';
import '../styles/BoxSlider.css';
import productsData from '../data/products';

function BoxSlider({ title, handleBoxClick }) {
  const itemsPerPage = 5;
  const itemWidth = 150 + (10 * 2);
  const trackRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0); 

  const clonedProducts = [
    ...productsData.slice(productsData.length - itemsPerPage),
    ...productsData,
    ...productsData.slice(0, itemsPerPage)
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        const endOfRealData = productsData.length + itemsPerPage;
        if (nextIndex >= clonedProducts.length - itemsPerPage) {
          if (trackRef.current) {
            trackRef.current.style.transition = 'none';
            trackRef.current.style.transform = `translateX(-${(productsData.length) * itemWidth}px)`;
            setTimeout(() => {
              if (trackRef.current) {
                trackRef.current.style.transition = 'transform 0.8s ease-in-out';
              }
            }, 0);
          }
        return productsData.length;
        }
      return nextIndex;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [clonedProducts.length, itemWidth, itemsPerPage, productsData.length]);

  const goToNextSlide = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      const endOfRealData = productsData.length + itemsPerPage;
      if (nextIndex >= clonedProducts.length - itemsPerPage) {
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = `translateX(-${(productsData.length) * itemWidth}px)`;
          setTimeout(() => {
            if (trackRef.current) {
              trackRef.current.style.transition = 'transform 0.8s ease-in-out';
            }
          }, 0);
        }
        return productsData.length;
      }
      return nextIndex;
    });
  };

  const goToPrevSlide = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex - 1;
      const startOfRealData = productsData.length -1 ;
      if (nextIndex < productsData.length) {
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = `translateX(-${(productsData.length * 2) * itemWidth}px)`;
          setTimeout(() => {
            if (trackRef.current) {
              trackRef.current.style.transition = 'transform 0.8s ease-in-out';
            }
          }, 0);
        }
        return (productsData.length * 2) -1;
      }
      return nextIndex;
    });
  };

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translateX(-${productsData.length * itemWidth}px)`;
      setCurrentIndex(productsData.length);
      setTimeout(() => {
        if (trackRef.current) {
          trackRef.current.style.transition = 'transform 0.8s ease-in-out';
        }
      }, 50);
    }
  }, []);

  return(
    <div className="container">
      <h2>{title}</h2>
      <div className="carousel-container">
        <div
          className="carousel-track"
          ref={trackRef}
          style={{ transform: `translateX(-${currentIndex * itemWidth}px)` }} 
        >
          {clonedProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="empty-box clickable"
              onClick={() => handleBoxClick(product)}
            >
              <strong>{product.title}</strong><br/>
              <span>⭐ {product.rating} ({product.reviewCount} 리뷰)</span>
            </div>
          ))}
        </div>
        <button className="carousel-button prev" onClick={goToPrevSlide}>&#10094;</button>
        <button className="carousel-button next" onClick={goToNextSlide}>&#10095;</button>
        </div>
      </div>
  );
};
export default BoxSlider; 