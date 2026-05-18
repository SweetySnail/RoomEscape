// src/pages/PrivacyPage.jsx
import React, { useState } from 'react';
import BoxTop from '../components/BoxTop';
import BoxMain from '../components/BoxMain';
import BoxRight from '../components/BoxRight';
import '../styles/Global.css';
import '../styles/PrivacyPage.css';

function PrivacyPage() {
  const [activeTab, setActiveTab] = useState('privacy');

  return (
    <div className="page-container">
      <BoxTop />
      <BoxRight />
      <BoxMain>
        <div className="privacy-container">
          <div className="privacy-header">
            <h1 className="privacy-main-title">법적 고지</h1>
            <p className="privacy-main-subtitle">RoomEscape 서비스 이용에 관한 약관 및 개인정보 처리방침을 안내해드려요.</p>
          </div>

          {/* 탭 */}
          <div className="privacy-tabs">
            <button
              className={`privacy-tab-btn ${activeTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              🔒 개인정보처리방침
            </button>
            <button
              className={`privacy-tab-btn ${activeTab === 'terms' ? 'active' : ''}`}
              onClick={() => setActiveTab('terms')}
            >
              📋 이용약관
            </button>
          </div>

          {/* 개인정보처리방침 */}
          {activeTab === 'privacy' && (
            <div className="privacy-content">
              <div className="privacy-update-date">최종 업데이트: 2026년 5월 18일</div>

              <section className="privacy-section">
                <h2>제1조 (총칙)</h2>
                <p>
                  RoomEscape(이하 "서비스")는 이용자의 개인정보를 소중히 여기며,
                  「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등
                  관련 법령을 준수합니다. 본 개인정보처리방침은 서비스가 이용자의 개인정보를
                  어떻게 수집, 이용, 보관, 파기하는지에 대해 안내합니다.
                </p>
              </section>

              <section className="privacy-section">
                <h2>제2조 (수집하는 개인정보 항목)</h2>
                <p>서비스는 회원가입 및 서비스 이용 과정에서 다음과 같은 개인정보를 수집합니다.</p>
                <div className="privacy-table">
                  <div className="privacy-table-header">
                    <span>수집 시점</span>
                    <span>수집 항목</span>
                    <span>수집 목적</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>회원가입</span>
                    <span>이메일 주소, 비밀번호, 닉네임</span>
                    <span>본인 확인, 서비스 이용</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>예약 시</span>
                    <span>예약 일시, 인원, 결제 금액</span>
                    <span>예약 관리, 결제 처리</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>서비스 이용</span>
                    <span>리뷰 내용, 포인트 내역, 즐겨찾기</span>
                    <span>서비스 제공, 개선</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>자동 수집</span>
                    <span>접속 IP, 브라우저 정보, 서비스 이용 기록</span>
                    <span>서비스 품질 향상, 보안</span>
                  </div>
                </div>
              </section>

              <section className="privacy-section">
                <h2>제3조 (개인정보의 수집 및 이용 목적)</h2>
                <p>서비스는 수집한 개인정보를 다음의 목적으로 이용합니다.</p>
                <ul className="privacy-list">
                  <li>회원 식별 및 본인 확인</li>
                  <li>방탈출 예약 서비스 제공 및 관리</li>
                  <li>포인트 적립 및 사용 내역 관리</li>
                  <li>공지사항 전달 및 고객 문의 응대</li>
                  <li>서비스 개선 및 신규 서비스 개발</li>
                  <li>불법 이용 방지 및 보안 유지</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>제4조 (개인정보의 보유 및 이용 기간)</h2>
                <p>
                  이용자의 개인정보는 서비스 이용 기간 동안 보유하며,
                  회원 탈퇴 또는 개인정보 삭제 요청 시 지체 없이 파기합니다.
                  단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
                </p>
                <div className="privacy-table">
                  <div className="privacy-table-header">
                    <span>보존 항목</span>
                    <span>보존 기간</span>
                    <span>근거 법령</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>계약 및 청약 철회 기록</span>
                    <span>5년</span>
                    <span>전자상거래법</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>대금 결제 및 재화 공급 기록</span>
                    <span>5년</span>
                    <span>전자상거래법</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>소비자 불만 및 분쟁 처리 기록</span>
                    <span>3년</span>
                    <span>전자상거래법</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>접속 로그, IP 정보</span>
                    <span>3개월</span>
                    <span>통신비밀보호법</span>
                  </div>
                </div>
              </section>

              <section className="privacy-section">
                <h2>제5조 (개인정보의 제3자 제공)</h2>
                <p>
                  서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
                  다만, 다음의 경우는 예외로 합니다.
                </p>
                <ul className="privacy-list">
                  <li>이용자가 사전에 동의한 경우</li>
                  <li>법령의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                  <li>예약한 방탈출 업체에 예약 정보를 전달하는 경우 (예약자 닉네임, 예약 일시, 인원)</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>제6조 (개인정보의 파기)</h2>
                <p>
                  서비스는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가
                  불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
                </p>
                <ul className="privacy-list">
                  <li><strong>전자적 파일 형태:</strong> 복원이 불가능한 방법으로 영구 삭제</li>
                  <li><strong>종이 문서 형태:</strong> 분쇄기로 분쇄하거나 소각하여 파기</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>제7조 (이용자의 권리)</h2>
                <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
                <ul className="privacy-list">
                  <li>개인정보 열람 요청</li>
                  <li>개인정보 정정·삭제 요청</li>
                  <li>개인정보 처리 정지 요청</li>
                  <li>개인정보 이동 요청</li>
                </ul>
                <p>
                  위 권리 행사는 마이페이지에서 직접 처리하거나,
                  아래 개인정보 보호책임자에게 이메일로 요청하실 수 있습니다.
                </p>
              </section>

              <section className="privacy-section">
                <h2>제8조 (쿠키 및 자동 수집 장치)</h2>
                <p>
                  서비스는 세션 스토리지를 사용하여 로그인 상태를 유지합니다.
                  브라우저 설정을 통해 세션 스토리지 사용을 거부할 수 있으나,
                  이 경우 서비스 이용이 제한될 수 있습니다.
                </p>
              </section>

              <section className="privacy-section">
                <h2>제9조 (개인정보 보호책임자)</h2>
                <div className="privacy-contact-box">
                  <div className="privacy-contact-row">
                    <span>서비스명</span>
                    <strong>RoomEscape</strong>
                  </div>
                  <div className="privacy-contact-row">
                    <span>담당자</span>
                    <strong>개인정보 보호책임자</strong>
                  </div>
                  <div className="privacy-contact-row">
                    <span>이메일</span>
                    <strong>
                      <a href="mailto:shwogus1011@gmail.com" style={{ color: 'var(--accent-gold)' }}>
                        shwogus1011@gmail.com
                      </a>
                    </strong>
                  </div>
                  <div className="privacy-contact-row">
                    <span>처리 기간</span>
                    <strong>영업일 기준 3일 이내</strong>
                  </div>
                </div>
                <p style={{ marginTop: '12px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                  개인정보 침해에 관한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다.
                </p>
                <ul className="privacy-list" style={{ fontSize: '0.9em' }}>
                  <li>개인정보 침해 신고센터: <a href="https://privacy.kisa.or.kr" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }}>privacy.kisa.or.kr</a> / 118</li>
                  <li>개인정보 분쟁조정위원회: <a href="https://www.kopico.go.kr" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }}>www.kopico.go.kr</a> / 1833-6972</li>
                  <li>대검찰청 사이버범죄수사단: <a href="https://www.spo.go.kr" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-gold)' }}>www.spo.go.kr</a> / 1301</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>제10조 (개인정보처리방침 변경)</h2>
                <p>
                  본 개인정보처리방침은 법령·정책 또는 보안 기술의 변경에 따라
                  내용의 추가·삭제 및 수정이 있을 수 있습니다.
                  변경 시 서비스 공지사항을 통해 고지할 예정입니다.
                </p>
                <p style={{ marginTop: '8px' }}>
                  <strong>시행일자: 2026년 5월 18일</strong>
                </p>
              </section>
            </div>
          )}

          {/* 이용약관 */}
          {activeTab === 'terms' && (
            <div className="privacy-content">
              <div className="privacy-update-date">최종 업데이트: 2026년 5월 18일</div>

              <section className="privacy-section">
                <h2>제1조 (목적)</h2>
                <p>
                  본 약관은 RoomEscape(이하 "서비스")가 제공하는 방탈출 예약 플랫폼 서비스의
                  이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>
              </section>

              <section className="privacy-section">
                <h2>제2조 (정의)</h2>
                <ul className="privacy-list">
                  <li><strong>"서비스"</strong>란 RoomEscape가 제공하는 방탈출 예약 플랫폼 및 관련 제반 서비스를 의미합니다.</li>
                  <li><strong>"이용자"</strong>란 본 약관에 동의하고 서비스를 이용하는 회원 및 비회원을 의미합니다.</li>
                  <li><strong>"회원"</strong>이란 서비스에 회원가입을 완료하고 서비스를 이용하는 자를 의미합니다.</li>
                  <li><strong>"매장관리자"</strong>란 서비스에 입점한 방탈출 매장을 관리하는 자를 의미합니다.</li>
                  <li><strong>"포인트"</strong>란 서비스 내에서 사용 가능한 가상의 적립 화폐를 의미합니다.</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>제3조 (약관의 효력 및 변경)</h2>
                <p>
                  본 약관은 서비스 화면에 게시하거나 이용자에게 공지함으로써 효력이 발생합니다.
                  서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 공지 후 7일이
                  경과하면 효력이 발생합니다.
                </p>
              </section>

              <section className="privacy-section">
                <h2>제4조 (회원가입)</h2>
                <ul className="privacy-list">
                  <li>회원가입은 이메일 주소와 비밀번호를 입력하여 신청할 수 있습니다.</li>
                  <li>비밀번호는 영문과 특수문자를 포함한 8자 이상이어야 합니다.</li>
                  <li>타인의 정보를 도용하거나 허위 정보를 입력한 경우 서비스 이용이 제한될 수 있습니다.</li>
                  <li>만 14세 미만은 회원가입이 제한됩니다.</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>제5조 (서비스 이용)</h2>
                <ul className="privacy-list">
                  <li>방탈출 예약은 회원 및 비회원 모두 가능합니다.</li>
                  <li>비회원 예약의 경우 포인트 적립 및 예약 관리 기능이 제한됩니다.</li>
                  <li>예약 완료 후 리뷰 작성 시 100포인트가 적립됩니다.</li>
                  <li>포인트는 예약 결제 시 사용할 수 있으며, 현금으로 환불되지 않습니다.</li>
                  <li>신규 회원가입 시 500포인트가 자동 지급됩니다.</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>제6조 (예약 취소 및 환불)</h2>
                <div className="privacy-table">
                  <div className="privacy-table-header">
                    <span>취소 시점</span>
                    <span>환불 금액</span>
                    <span>포인트 처리</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>예약일 2일 전까지</span>
                    <span>100% 환불</span>
                    <span>사용 포인트 전액 환불</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>예약일 1일 전</span>
                    <span>50% 환불</span>
                    <span>사용 포인트 50% 환불</span>
                  </div>
                  <div className="privacy-table-row">
                    <span>당일 취소</span>
                    <span>환불 불가</span>
                    <span>환불 불가</span>
                  </div>
                </div>
                <p style={{ marginTop: '12px', fontSize: '0.9em', color: 'var(--text-muted)' }}>
                  * 천재지변, 서비스 장애 등 불가피한 사유의 경우 별도 협의합니다.
                </p>
              </section>

              <section className="privacy-section">
                <h2>제7조 (이용자의 의무)</h2>
                <p>이용자는 다음 행위를 하여서는 안 됩니다.</p>
                <ul className="privacy-list">
                  <li>타인의 정보 도용 또는 허위 정보 입력</li>
                  <li>서비스 운영을 방해하는 행위</li>
                  <li>다른 이용자에게 불쾌감을 주는 리뷰 작성</li>
                  <li>상업적 목적의 광고 또는 스팸 행위</li>
                  <li>관련 법령을 위반하는 행위</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>제8조 (서비스 제공의 중단)</h2>
                <p>
                  서비스는 다음의 경우 서비스 제공을 중단할 수 있습니다.
                </p>
                <ul className="privacy-list">
                  <li>시스템 정기 점검, 증설 및 교체</li>
                  <li>천재지변, 국가비상사태 등 불가항력적인 경우</li>
                  <li>기간통신사업자의 서비스 장애</li>
                </ul>
                <p>
                  서비스 중단 시 사전 공지를 원칙으로 하며, 불가피한 경우 사후 공지할 수 있습니다.
                </p>
              </section>

              <section className="privacy-section">
                <h2>제9조 (책임의 한계)</h2>
                <ul className="privacy-list">
                  <li>서비스는 이용자와 매장 간의 예약을 중개하는 플랫폼으로, 실제 방탈출 서비스의 품질에 대한 직접적인 책임을 지지 않습니다.</li>
                  <li>이용자의 귀책사유로 인한 서비스 이용 장애에 대해서는 책임을 지지 않습니다.</li>
                  <li>무료로 제공되는 서비스 이용과 관련하여 발생한 손해에 대해서는 책임을 지지 않습니다.</li>
                </ul>
              </section>

              <section className="privacy-section">
                <h2>제10조 (분쟁 해결)</h2>
                <p>
                  서비스 이용과 관련하여 발생한 분쟁은 대한민국 법률을 적용하며,
                  분쟁 발생 시 서울중앙지방법원을 관할 법원으로 합니다.
                </p>
              </section>

              <section className="privacy-section">
                <h2>제11조 (문의)</h2>
                <div className="privacy-contact-box">
                  <div className="privacy-contact-row">
                    <span>서비스명</span>
                    <strong>RoomEscape</strong>
                  </div>
                  <div className="privacy-contact-row">
                    <span>이메일</span>
                    <strong>
                      <a href="mailto:shwogus1011@gmail.com" style={{ color: 'var(--accent-gold)' }}>
                        shwogus1011@gmail.com
                      </a>
                    </strong>
                  </div>
                  <div className="privacy-contact-row">
                    <span>처리 기간</span>
                    <strong>영업일 기준 3일 이내</strong>
                  </div>
                </div>
              </section>

              <p style={{ marginTop: '24px' }}>
                <strong>시행일자: 2026년 5월 18일</strong>
              </p>
            </div>
          )}
        </div>
      </BoxMain>
    </div>
  );
}

export default PrivacyPage;