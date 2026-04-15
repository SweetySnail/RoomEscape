import React, { useState, useEffect, useRef } from 'react';
import '../styles/Global.css';
import '../styles/BoxSlider.css';
import productsData from '../data/products';

function BoxSlider({ title, sortBy, handleBoxClick }) {
  const itemsPerPage = 5;
  const itemWidth = 150 + (10 * 2);
  const trackRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sortedProducts = [...productsData]
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'reviewCount') return b.reviewCount - a.reviewCount;
      return 0;
    })
    .slice(0, 10);

  const clonedProducts = [
    ...sortedProducts.slice(sortedProducts.length - itemsPerPage),
    ...sortedProducts,
    ...sortedProducts.slice(0, itemsPerPage)
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= clonedProducts.length - itemsPerPage) {
          if (trackRef.current) {
            trackRef.current.style.transition = 'none';
            trackRef.current.style.transform = `translateX(-${sortedProducts.length * itemWidth}px)`;
            setTimeout(() => {
              if (trackRef.current) {
                trackRef.current.style.transition = 'transform 0.8s ease-in-out';
              }
            }, 0);
          }
          return sortedProducts.length;
        }
        return nextIndex;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [clonedProducts.length, sortedProducts.length, itemWidth, itemsPerPage]);

  const goToNextSlide = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= clonedProducts.length - itemsPerPage) {
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = `translateX(-${sortedProducts.length * itemWidth}px)`;
          setTimeout(() => {
            if (trackRef.current) {
              trackRef.current.style.transition = 'transform 0.8s ease-in-out';
            }
          }, 0);
        }
        return sortedProducts.length;
      }
      return nextIndex;
    });
  };

  const goToPrevSlide = () => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex - 1;
      if (nextIndex < sortedProducts.length) {
        if (trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = `translateX(-${(sortedProducts.length * 2) * itemWidth}px)`;
          setTimeout(() => {
            if (trackRef.current) {
              trackRef.current.style.transition = 'transform 0.8s ease-in-out';
            }
          }, 0);
        }
        return (sortedProducts.length * 2) - 1;
      }
      return nextIndex;
    });
  };

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translateX(-${sortedProducts.length * itemWidth}px)`;
      setCurrentIndex(sortedProducts.length);
      setTimeout(() => {
        if (trackRef.current) {
          trackRef.current.style.transition = 'transform 0.8s ease-in-out';
        }
      }, 50);
    }
  }, []);

  return (
    <div className="container">
      <h2 style={{ fontSize: '1.8em', marginBottom: '8px', marginTop: '0' }}>{title}</h2>
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
              <img
                src={product.imageUrl}
                alt={product.title}
                style={{
                  width: '100%',
                  height: '100px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  display: 'block'
                }}
              />
              <span style={{ fontSize: '0.8em', marginTop: '6px', display: 'block', textAlign: 'center' }}>
                {product.title}
              </span>
            </div>
          ))}
        </div>
        <button className="carousel-button prev" onClick={goToPrevSlide}>&#10094;</button>
        <button className="carousel-button next" onClick={goToNextSlide}>&#10095;</button>
      </div>
    </div>
  );
}

export default BoxSlider;