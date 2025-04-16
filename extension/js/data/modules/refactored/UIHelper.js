/**
 * UI 관련 헬퍼 함수 모음
 */

/**
 * 골드 정보 표시를 위한 CSS 스타일 추가
 */
function addGoldColumnStyle() {
  // 이미 스타일이 있는지 확인
  if (document.getElementById('gold-column-style')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'gold-column-style';
  styleElement.textContent = `
    .gold-cost-header, .gold-cost-cell {
      text-align: right;
      padding-right: 15px;
    }
    
    .gold-value {
      position: relative;
    }
    
    .gold-value::before {
      content: '';
      display: inline-block;
      width: 12px;
      height: 12px;
      background-color: #F9A825;
      border-radius: 50%;
      margin-right: 4px;
      vertical-align: middle;
    }
    
    .book-count {
      font-size: 0.9em;
      color: #4CAF50;
      margin-left: 4px;
      font-weight: normal;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 100;
    }
    
    .loading-spinner {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin-bottom: 15px;
    }
    
    .loading-text {
      color: white;
      font-size: 16px;
      font-weight: bold;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  
  document.head.appendChild(styleElement);
}

/**
 * 데이터 테이블에 골드 정보 추가
 * @param {Array} data - 골드 정보가 추가된 데이터
 */
function updateDataTableWithGoldInfo(data) {
  // 테이블 요소 선택
  const table = document.querySelector('.data-table');
  if (!table) {
    console.error('데이터 테이블을 찾을 수 없습니다.');
    return;
  }
  
  // 테이블 헤더에 골드 정보 컬럼 추가
  const headerRow = table.querySelector('thead tr');
  if (headerRow) {
    // 기존 골드 헤더 확인
    let goldHeader = headerRow.querySelector('.gold-cost-header');
    
    // 없으면 추가
    if (!goldHeader) {
      goldHeader = document.createElement('th');
      goldHeader.className = 'gold-cost-header';
      goldHeader.textContent = '골드 소요량';
      headerRow.appendChild(goldHeader);
    }
  }
  
  // 테이블 본문의 각 행에 골드 정보 추가
  const rows = table.querySelectorAll('tbody tr');
  
  rows.forEach((row, index) => {
    const item = data[index];
    if (!item) return;
    
    // 기존 골드 정보 확인
    let goldCell = row.querySelector('.gold-cost-cell');
    
    // 없으면 추가
    if (!goldCell) {
      goldCell = document.createElement('td');
      goldCell.className = 'gold-cost-cell';
      row.appendChild(goldCell);
    }
    
    // 골드 소요량 정보가 있는 경우
    if (item.goldCost) {
      // 각인서의 경우 책 수량도 표시
      if (item.type === 'engraving' && item.engravingBooks) {
        goldCell.innerHTML = `<span class="gold-value">${item.goldCost.toLocaleString()}G</span> <span class="book-count">(${item.engravingBooks}개)</span>`;
      } else {
        goldCell.innerHTML = `<span class="gold-value">${item.goldCost.toLocaleString()}G</span>`;
      }
      goldCell.style.color = '#F9A825'; // 골드 색상
      goldCell.style.fontWeight = 'bold';
    } else {
      goldCell.textContent = '-';
      goldCell.style.color = '#999';
    }
  });
  
  // 골드 표시 스타일 추가
  addGoldColumnStyle();
}

/**
 * API 상태 표시 UI 업데이트
 * @param {boolean} isConnected - API 연결 상태
 * @param {string} apiKey - API 키 (있는 경우)
 * @param {string} message - 표시할 메시지
 */
function updateApiStatusUI(isConnected, apiKey, message) {
  const apiStatusElement = document.getElementById('api-status-summary');
  if (!apiStatusElement) return;
  
  // API 키 설정 버튼 (항상 표시)
  const apiSettingsButton = `
    <button id="open-api-settings" class="api-settings-button">API 설정</button>
  `;
  
  // HTML 컨텐츠 준비
  let htmlContent = '';
  
  if (isConnected) {
    htmlContent = `
      <div class="api-status-ok">
        <span class="status-icon">✓</span>
        <span class="status-text">로스트아크 API 연결됨</span>
        ${apiSettingsButton}
      </div>
      <div class="api-description">
        <p>골드 소요량이 시장 가격 기준으로 계산됩니다.</p>
        <button id="fetch-gold-data-summary" class="api-action-button">골드 정보 가져오기</button>
      </div>
    `;
  } else if (apiKey) {
    htmlContent = `
      <div class="api-status-warning">
        <span class="status-icon">!</span>
        <span class="status-text">API 연결 실패</span>
        ${apiSettingsButton}
      </div>
      <div class="api-description">API 키를 확인하거나 다시 설정해주세요.</div>
    `;
  } else {
    htmlContent = `
      <div class="api-status-neutral">
        <span class="status-icon">?</span>
        <span class="status-text">API 연결되지 않음</span>
        ${apiSettingsButton}
      </div>
      <div class="api-description">API 키를 설정하면 스펙업 요소별 소요 골드를 확인할 수 있습니다.</div>
    `;
  }
  
  if (message) {
    htmlContent += `<div class="api-message">${message}</div>`;
  }
  
  // HTML 업데이트
  apiStatusElement.innerHTML = htmlContent;
}

/**
 * 로딩 오버레이 표시
 * @param {string} containerId - 오버레이를 표시할 컨테이너 ID
 * @param {string} message - 로딩 메시지
 * @returns {HTMLElement} 생성된 오버레이 요소
 */
function showLoadingOverlay(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  // 오버레이 생성
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="loading-spinner"></div>
    <div class="loading-text">${message || '로딩 중...'}</div>
  `;
  
  // 기존 데이터 테이블 위에 오버레이 추가
  container.style.position = 'relative';
  container.appendChild(loadingOverlay);
  
  return loadingOverlay;
}

export {
  addGoldColumnStyle,
  updateDataTableWithGoldInfo,
  updateApiStatusUI,
  showLoadingOverlay
};