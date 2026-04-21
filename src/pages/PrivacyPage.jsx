// src/pages/PrivacyPage.jsx
import React from 'react';
import BoxTop from '../components/BoxTop';
import BoxMain from '../components/BoxMain';
import BoxRight from '../components/BoxRight';

function PrivacyPage() {
  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div style={{ maxWidth: '800px', padding: '20px', lineHeight: '1.8', color: '#333' }}>
          <h1>개인정보처리방침</h1>
          <p>본 서비스는 이용자의 개인정보를 중요시하며, 개인정보보호법을 준수합니다.</p>

          <h2>1. 수집하는 개인정보 항목</h2>
          <p>아이디, 비밀번호, 이메일, 닉네임</p>

          <h2>2. 개인정보 수집 및 이용 목적</h2>
          <p>회원 식별, 서비스 제공, 예약 관리</p>

          <h2>3. 개인정보 보유 및 이용 기간</h2>
          <p>회원 탈퇴 시까지 보유 후 즉시 파기</p>

          <h2>4. 개인정보의 제3자 제공</h2>
          <p>이용자의 동의 없이 제3자에게 제공하지 않습니다.</p>

          <h2>5. 문의</h2>
          <p>개인정보 관련 문의: admin@escapehub.kr</p>
        </div>
      </BoxMain>
    </div>
  );
}

export default PrivacyPage;