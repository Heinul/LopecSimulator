/**
 * 가격 통합 모듈
 * 로펙 시뮬레이터에 가격 검색 기능을 통합합니다.
 */

// 가격 통합 모듈
const PriceIntegration = (function() {
  // 초기화 상태
  let initialized = false;
  
  /**
   * 필수 모듈 로드 확인
   * @returns {boolean} 모듈 로드 상태
   */
  function checkDependencies() {
    return (
      typeof window.LopecScanner !== 'undefined' &&
      typeof window.LopecScanner.PricingSystem !== 'undefined'
    );
  }
  
  /**
   * UI에 가격 표시 영역 추가
   */
  function addPriceDisplayToUI() {
    // 가격 표시할 컨테이너 찾기 (예: 점수 표시 영역 옆)
    const scoreContainer = document.querySelector('.score-display') || 
                          document.querySelector('.total-score') ||
                          document.querySelector('.main-content');
    
    if (!scoreContainer) {
      console.warn('[가격 통합] 가격 정보를 표시할 컨테이너를 찾을 수 없습니다.');
      return;
    }
    
    // 가격 정보 컨테이너 생성
    const priceContainer = document.createElement('div');
    priceContainer.id = 'price-info-container';
    priceContainer.className = 'price-display-container';
    
    // 기본 컨텐츠 추가
    priceContainer.innerHTML = `
      <div class="price-display-header">
        <h3>골드 소요 정보</h3>
        <button id="refresh-price-info" class="refresh-button" title="가격 정보 새로고침">↻</button>
      </div>
      <div id="price-display-content" class="price-display-content">
        <p class="loading-text">가격 정보 로드 중...</p>
      </div>
    `;
    
    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .price-display-container {
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #f9f9f9;
      }
      .price-display-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      .price-display-header h3 {
        margin: 0;
        font-size: 16px;
      }
      .refresh-button {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #555;
      }
      .price-display-content {
        font-size: 14px;
      }
      .price-item {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
      }
      .price-category {
        font-weight: bold;
        margin-top: 10px;
        border-bottom: 1px dashed #eee;
        padding-bottom: 3px;
      }
      .price-label {
        color: #555;
      }
      .price-value {
        font-weight: bold;
        color: #F9A825;
      }
      .price-sum {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        padding-top: 5px;
        border-top: 1px solid #ddd;
        font-weight: bold;
      }
      .loading-text {
        color: #777;
        text-align: center;
        font-style: italic;
      }
      .price-error {
        color: #F44336;
        text-align: center;
      }
    `;
    
    // 스타일과 컨테이너를 DOM에 추가
    document.head.appendChild(style);
    
    // 적절한 위치에 삽입
    if (scoreContainer.nextSibling) {
      scoreContainer.parentNode.insertBefore(priceContainer, scoreContainer.nextSibling);
    } else {
      scoreContainer.parentNode.appendChild(priceContainer);
    }
    
    // 이벤트 리스너 추가
    const refreshButton = document.getElementById('refresh-price-info');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        updatePriceDisplay();
      });
    }
  }
  
  /**
   * 현재 설정된 옵션에서 가격 정보 수집
   * @returns {Promise<Object>} 가격 정보
   */
  async function collectPriceInfo() {
    // 가격 정보 객체
    const priceInfo = {
      gems: [],       // 보석 정보
      engravings: [], // 각인 정보
      accessories: [], // 악세서리 정보
      totalGold: 0    // 총 골드 비용
    };
    
    try {
      // 시뮬레이터에서 현재 옵션 데이터 가져오기
      // 실제 구현은 페이지 구조에 따라 달라질 수 있음
      const currentData = window.LopecScanner.DataManager ? 
                        window.LopecScanner.DataManager.processedData : [];
      
      if (!currentData || currentData.length === 0) {
        return priceInfo; // 데이터 없음
      }
      
      // 데이터 순회하며 가격 정보 수집
      for (const item of currentData) {
        if (!item.difference || item.difference <= 0) continue; // 변화 없는 항목 무시
        
        let itemPrice = 0;
        
        // 아이템 유형에 따라 가격 검색
        if (item.type === 'gem') {
          // 보석 가격 검색
          const gemType = item.category; // 예: '겁화', '작열' 등
          const gemLevel = parseInt(item.level);
          
          if (gemType && !isNaN(gemLevel)) {
            itemPrice = await window.LopecScanner.PricingSystem.getGemPrice(gemType, gemLevel);
            
            if (itemPrice > 0) {
              priceInfo.gems.push({
                name: `${gemType} ${gemLevel}레벨`,
                price: itemPrice,
                score: item.difference
              });
            }
          }
        } 
        else if (item.type === 'engraving') {
          // 각인서 가격 검색
          const engravingName = item.name;
          const engravingGrade = item.grade || '전설';
          
          if (engravingName) {
            itemPrice = await window.LopecScanner.PricingSystem.getEngravingPrice(engravingName, engravingGrade);
            
            // 필요 개수 계산 (예: 레벨당 5개)
            const count = item.count || 5;
            const totalPrice = itemPrice * count;
            
            if (itemPrice > 0) {
              priceInfo.engravings.push({
                name: engravingName,
                grade: engravingGrade,
                price: itemPrice,
                count: count,
                totalPrice: totalPrice,
                score: item.difference
              });
            }
          }
        }
        else if (item.type === 'accessory') {
          // 악세서리 가격 검색
          const accessoryOptions = {
            type: item.category, // 예: '목걸이', '귀걸이', '반지'
            grade: item.grade || '유물',
            quality: item.quality || '중중'
            // 추가 옵션은 필요 시 여기에 추가
          };
          
          itemPrice = await window.LopecScanner.PricingSystem.getAccessoryPrice(accessoryOptions);
          
          if (itemPrice > 0) {
            priceInfo.accessories.push({
              name: `${accessoryOptions.type} (${accessoryOptions.quality})`,
              price: itemPrice,
              score: item.difference
            });
          }
        }
        
        // 총 가격에 추가
        priceInfo.totalGold += itemPrice;
      }
      
      return priceInfo;
      
    } catch (error) {
      console.error('[가격 통합] 가격 정보 수집 오류:', error);
      return priceInfo;
    }
  }
  
  /**
   * 가격 표시 업데이트
   */
  async function updatePriceDisplay() {
    const priceContent = document.getElementById('price-display-content');
    if (!priceContent) return;
    
    // 로딩 메시지 표시
    priceContent.innerHTML = '<p class="loading-text">가격 정보 로드 중...</p>';
    
    try {
      // 필수 모듈 확인
      if (!checkDependencies()) {
        priceContent.innerHTML = '<p class="price-error">가격 모듈이 로드되지 않았습니다.</p>';
        return;
      }
      
      // 가격 정보 수집
      const priceInfo = await collectPriceInfo();
      
      // 표시할 HTML 준비
      let html = '';
      
      // 보석 정보
      if (priceInfo.gems.length > 0) {
        html += '<div class="price-category">보석</div>';
        
        priceInfo.gems.forEach(gem => {
          html += `
            <div class="price-item">
              <span class="price-label">${gem.name}</span>
              <span class="price-value">${gem.price.toLocaleString()}G</span>
            </div>
          `;
        });
      }
      
      // 각인 정보
      if (priceInfo.engravings.length > 0) {
        html += '<div class="price-category">각인서</div>';
        
        priceInfo.engravings.forEach(engraving => {
          html += `
            <div class="price-item">
              <span class="price-label">${engraving.name} ${engraving.grade} (${engraving.count}개)</span>
              <span class="price-value">${engraving.totalPrice.toLocaleString()}G</span>
            </div>
          `;
        });
      }
      
      // 악세서리 정보
      if (priceInfo.accessories.length > 0) {
        html += '<div class="price-category">악세서리</div>';
        
        priceInfo.accessories.forEach(accessory => {
          html += `
            <div class="price-item">
              <span class="price-label">${accessory.name}</span>
              <span class="price-value">${accessory.price.toLocaleString()}G</span>
            </div>
          `;
        });
      }
      
      // 총 비용
      html += `
        <div class="price-sum">
          <span class="price-label">총 골드 소요량</span>
          <span class="price-value">${priceInfo.totalGold.toLocaleString()}G</span>
        </div>
      `;
      
      // 정보가 없는 경우
      if (priceInfo.totalGold === 0) {
        html = '<p class="loading-text">현재 가격 정보가 없습니다.<br>옵션을 변경해 보세요.</p>';
      }
      
      // HTML 업데이트
      priceContent.innerHTML = html;
      
    } catch (error) {
      console.error('[가격 통합] 가격 표시 업데이트 오류:', error);
      priceContent.innerHTML = `<p class="price-error">가격 정보를 가져오는 중 오류가 발생했습니다.<br>${error.message}</p>`;
    }
  }
  
  /**
   * 옵션 변경 이벤트에 가격 업데이트 연결
   */
  function setupPriceUpdateEvents() {
    // 점수 표시 요소 (실제 페이지 구조에 맞게 수정 필요)
    const scoreElement = document.querySelector('.score-value') || 
                         document.querySelector('.total-score');
    
    if (!scoreElement) {
      console.warn('[가격 통합] 점수 표시 요소를 찾을 수 없습니다.');
      return;
    }
    
    // MutationObserver로 점수 변화 감지
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // 점수 변화 감지 시 가격 표시 업데이트
          updatePriceDisplay();
        }
      });
    });
    
    // DOM 변화 감시 시작
    observer.observe(scoreElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
    
    // 추가로 모든 입력 요소 이벤트에도 연결
    const inputElements = [
      ...document.querySelectorAll('select'),
      ...document.querySelectorAll('input[type="range"]'),
      ...document.querySelectorAll('input[type="checkbox"]')
    ];
    
    inputElements.forEach(input => {
      input.addEventListener('change', () => {
        // 입력 변경 시 가격 표시 업데이트 (약간 지연)
        setTimeout(updatePriceDisplay, 300);
      });
    });
    
    // 버튼 클릭 이벤트도 감시 (특정 버튼 ID에 따라 수정 필요)
    const actionButtons = document.querySelectorAll('button');
    actionButtons.forEach(button => {
      button.addEventListener('click', () => {
        // 액션 버튼 클릭 후 가격 표시 업데이트 (약간 지연)
        setTimeout(updatePriceDisplay, 500);
      });
    });
  }

  // 공개 API
  return {
    updatePriceDisplay,
    
    // 초기화
    initialize: function() {
      console.log('[가격 통합] 모듈 초기화');
      
      // 중복 초기화 방지
      if (initialized) return;
      
      // UI에 가격 표시 영역 추가
      addPriceDisplayToUI();
      
      // 옵션 변경 이벤트 설정
      setupPriceUpdateEvents();
      
      // 초기 가격 정보 로드
      setTimeout(updatePriceDisplay, 1000);
      
      initialized = true;
    }
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', function() {
  // 가격 모듈이 로드된 후에 초기화 시도
  setTimeout(PriceIntegration.initialize, 1500);
});

// 전역 네임스페이스에 등록
if (window.LopecScanner) {
  window.LopecScanner.PriceIntegration = PriceIntegration;
} else {
  window.LopecScanner = {
    PriceIntegration: PriceIntegration
  };
}
