import React from 'react';
import BoxTop from '../components/BoxTop';
import BoxRight from '../components/BoxRight';
import BoxMain from '../components/BoxMain';

function ListPage() {
  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div style={{
          textAlign: 'center',
          padding: '60px',
          color: 'var(--text-muted)',
        }}>
          <p style={{ fontSize: '2em' }}>🚧</p>
          <p>준비 중인 페이지예요.</p>
        </div>
      </BoxMain>
    </div>
  );
}

export default ListPage;