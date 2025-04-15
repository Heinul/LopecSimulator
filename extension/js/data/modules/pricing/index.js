// 가격 모듈 통합 인터페이스
const PricingSystem = (function() {
  // 가격 모듈 API 캐시
  let apiReady = false;
  
  /**
   * 모든 모듈이 로드되었는지 확인
   * @returns {boolean} 모듈 로드 상태
   */
  function checkModulesLoaded() {
    return (
      typeof PriceManager !== 'undefined' &&
      typeof PriceStorage !== 'undefined'
    );
  }
  
  /**
   * 보석 가격 검색
   * @param {string} gemType - 보석 종류 (겁화, 작열, 멸화, 홍염)
   * @param {number} level - 보석 레벨
   * @returns {Promise<number>} 보석 가격
   */
  async function getGemPrice(gemType, level) {
    if (!checkModulesLoaded()) {
      console.error('필요한 모듈이 로드되지 않았습니다.');
      return 0;
    }
    
    // 로컬 저장소에서 먼저 가격 확인
    const cachedData = PriceStorage.getGemPrice(gemType, level);
    
    if (cachedData && cachedData.price) {
      console.log(`[캐시] 보석 가격 로드: ${gemType} ${level}레벨 - ${cachedData.price}G`);
      return cachedData.price;
    }
    
    // 캐시에 없으면 API로 검색
    const price = await PriceManager.getGemPrice(gemType, level);
    
    // 가격이 있으면 저장
    if (price > 0) {
      PriceStorage.saveGemPrice(gemType, level, price);
    }
    
    return price;
  }
  
  /**
   * 각인서 가격 검색
   * @param {string} engravingName - 각인서 이름
   * @param {string} grade - 각인서 등급 (전설, 영웅, 희귀, 고급)
   * @returns {Promise<number>} 각인서 가격
   */
  async function getEngravingPrice(engravingName, grade) {
    if (!checkModulesLoaded()) {
      console.error('필요한 모듈이 로드되지 않았습니다.');
      return 0;
    }
    
    // 로컬 저장소에서 먼저 가격 확인
    const cachedData = PriceStorage.getEngravingPrice(engravingName, grade);
    
    if (cachedData && cachedData.price) {
      console.log(`[캐시] 각인서 가격 로드: ${engravingName} ${grade} - ${cachedData.price}G`);
      return cachedData.price;
    }
    
    // 캐시에 없으면 API로 검색
    const price = await PriceManager.getEngravingPrice(engravingName, grade);
    
    // 가격이 있으면 저장
    if (price > 0) {
      PriceStorage.saveEngravingPrice(engravingName, grade, price);
    }
    
    return price;
  }
  
  /**
   * 악세서리 가격 검색
   * @param {Object} options - 악세서리 옵션
   * @returns {Promise<number>} 악세서리 가격
   */
  async function getAccessoryPrice(options) {
    if (!checkModulesLoaded()) {
      console.error('필요한 모듈이 로드되지 않았습니다.');
      return 0;
    }
    
    // 로컬 저장소에서 먼저 가격 확인
    const cachedData = PriceStorage.getAccessoryPrice(options);
    
    if (cachedData && cachedData.price) {
      console.log(`[캐시] 악세서리 가격 로드: ${options.type} ${options.quality} - ${cachedData.price}G`);
      return cachedData.price;
    }
    
    // 캐시에 없으면 API로 검색
    const price = await PriceManager.getAccessoryPrice(options);
    
    // 가격이 있으면 저장
    if (price > 0) {
      PriceStorage.saveAccessoryPrice(options, price);
    }
    
    return price;
  }
  
  /**
   * 각인서 업그레이드 비용 계산
   * @param {string} engravingName - 각인서 이름
   * @param {string} fromGrade - 시작 등급 (전설, 영웅, 희귀, 고급)
   * @param {number} fromLevel - 시작 레벨 (0~3)
   * @param {string} toGrade - 목표 등급 (전설, 영웅, 희귀, 고급)
   * @param {number} toLevel - 목표 레벨 (0~3)
   * @returns {Promise<{gold: number, count: number}>} 필요 골드와 각인서 수량
   */
  async function calculateEngravingUpgradeCost(engravingName, fromGrade, fromLevel, toGrade, toLevel) {
    if (!checkModulesLoaded()) {
      console.error('필요한 모듈이 로드되지 않았습니다.');
      return { gold: 0, count: 0 };
    }
    
    return await PriceManager.calculateEngravingUpgradeCost(
      engravingName, fromGrade, fromLevel, toGrade, toLevel
    );
  }
  
  /**
   * 다른 결제 기능
   */
  function startPriceScanner() {
    console.log('가격 스캐니 이 삭제되었습니다.');
  }
  
  /**
   * 모든 가격 데이터 내보내기
   * @returns {Object} 저장된 모든 가격 데이터
   */
  function exportAllPriceData() {
    if (!checkModulesLoaded()) {
      console.error('필요한 모듈이 로드되지 않았습니다.');
      return {};
    }
    
    return PriceStorage.exportAllPriceData();
  }
  
  /**
   * 가격 데이터 가져오기
   * @param {Object} importData - 가져올 가격 데이터
   * @param {boolean} overwrite - 기존 데이터 덮어쓰기 여부
   * @returns {Object} 가져오기 결과 (성공 및 실패 개수)
   */
  function importPriceData(importData, overwrite = false) {
    if (!checkModulesLoaded()) {
      console.error('필요한 모듈이 로드되지 않았습니다.');
      return { total: 0, success: 0, failed: 0 };
    }
    
    return PriceStorage.importPriceData(importData, overwrite);
  }
  
  /**
   * 저장된 가격 데이터 통계
   * @returns {Object} 저장된 데이터 통계
   */
  function getPriceDataStats() {
    if (!checkModulesLoaded()) {
      console.error('필요한 모듈이 로드되지 않았습니다.');
      return {
        totalItems: 0,
        gems: 0,
        engravings: 0,
        accessories: 0
      };
    }
    
    return PriceStorage.getPriceDataStats();
  }
  
  /**
   * 모든 가격 데이터 삭제
   * @returns {number} 삭제된 항목 수
   */
  function clearAllPriceData() {
    if (!checkModulesLoaded()) {
      console.error('필요한 모듈이 로드되지 않았습니다.');
      return 0;
    }
    
    // 저장소 데이터 삭제
    const deletedCount = PriceStorage.clearAllPriceData();
    
    // PriceManager 캐시도 초기화
    PriceManager.clearCache();
    
    return deletedCount;
  }
  
  /**
   * API 상태 UI 요소 생성
   * @returns {HTMLElement} API 상태 UI 엘리먼트
   */
  function createApiStatusUI() {
    // API 상태 컨테이너
    const container = document.createElement('div');
    container.className = 'price-api-status';
    container.innerHTML = `
      <div class="status-header">
        <h3>가격 API 상태</h3>
        <div class="status-indicator">
          <span class="status-dot"></span>
          <span class="status-text">확인 중...</span>
        </div>
      </div>
      <div class="status-body">
        <div class="cache-stats">
          <p>캐시된 데이터: <span id="cache-count">0</span>개</p>
          <button id="clear-price-cache" class="mini-button">캐시 초기화</button>
        </div>
        <div class="action-buttons">
          <button id="start-price-scan" class="action-button">가격 스캔 시작</button>
          <button id="export-price-data" class="action-button">가격 데이터 내보내기</button>
        </div>
      </div>
    `;
    
    // 스타일 적용 (필요 시 CSS 파일로 분리)
    const style = document.createElement('style');
    style.textContent = `
      .price-api-status {
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 10px;
        margin: 10px 0;
        background-color: #f9f9f9;
      }
      .status-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      .status-header h3 {
        margin: 0;
        font-size: 16px;
      }
      .status-indicator {
        display: flex;
        align-items: center;
      }
      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: #ccc;
        margin-right: 5px;
      }
      .status-body {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .cache-stats {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .action-buttons {
        display: flex;
        gap: 10px;
      }
      .action-button {
        padding: 5px 10px;
        border: none;
        border-radius: 3px;
        background-color: #4CAF50;
        color: white;
        cursor: pointer;
      }
      .mini-button {
        padding: 3px 8px;
        font-size: 12px;
        border: none;
        border-radius: 3px;
        background-color: #f44336;
        color: white;
        cursor: pointer;
      }
    `;
    
    document.head.appendChild(style);
    
    // 이벤트 리스너 설정 (DOM 추가 후)
    setTimeout(() => {
      // 캐시 초기화 버튼
      const clearCacheBtn = document.getElementById('clear-price-cache');
      if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', () => {
          const count = clearAllPriceData();
          alert(`${count}개의 가격 데이터가 초기화되었습니다.`);
          updateCacheStats();
        });
      }
      
      // 가격 스캔 시작 버튼
      const startScanBtn = document.getElementById('start-price-scan');
      if (startScanBtn) {
        startScanBtn.addEventListener('click', () => {
          startPriceScanner();
          alert('가격 스캔이 시작되었습니다.');
        });
      }
      
      // 가격 데이터 내보내기 버튼
      const exportDataBtn = document.getElementById('export-price-data');
      if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
          const exportData = exportAllPriceData();
          downloadJsonFile(exportData, 'lopec_price_data.json');
        });
      }
      
      // 초기 캐시 통계 업데이트
      updateCacheStats();
      
      // API 상태 업데이트
      updateApiStatus();
    }, 0);
    
    return container;
  }
  
  /**
   * API 상태 업데이트
   */
  async function updateApiStatus() {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (!statusDot || !statusText) return;
    
    try {
      // API 키 존재 여부 확인
      let apiKey = null;
      
      await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          apiKey = result && result.lostarkApiKey;
          resolve();
        });
      });
      
      if (!apiKey) {
        // API 키 없음
        statusDot.style.backgroundColor = '#ccc';
        statusText.innerText = '설정되지 않음';
        apiReady = false;
      } else {
        // API 연결 테스트
        try {
          // 간단한 API 테스트 (보석 가격 조회)
          const testPrice = await PriceManager.getGemPrice('겁화', 7);
          
          if (testPrice > 0) {
            // 성공
            statusDot.style.backgroundColor = '#4CAF50';
            statusText.innerText = '연결됨';
            apiReady = true;
          } else {
            // 가격은 0이지만 오류는 아님
            statusDot.style.backgroundColor = '#FFC107';
            statusText.innerText = '부분 연결됨';
            apiReady = true;
          }
        } catch (e) {
          // API 연결 오류
          statusDot.style.backgroundColor = '#F44336';
          statusText.innerText = '연결 오류';
          apiReady = false;
        }
      }
    } catch (error) {
      console.error('API 상태 업데이트 오류:', error);
      if (statusDot && statusText) {
        statusDot.style.backgroundColor = '#F44336';
        statusText.innerText = '내부 오류';
        apiReady = false;
      }
    }
  }
  
  /**
   * 캐시 통계 업데이트
   */
  function updateCacheStats() {
    const cacheCountElement = document.getElementById('cache-count');
    if (!cacheCountElement) return;
    
    const stats = getPriceDataStats();
    cacheCountElement.innerText = stats.totalItems;
  }
  
  /**
   * JSON 파일 다운로드
   * @param {Object} data - 다운로드할 데이터
   * @param {string} filename - 파일 이름
   */
  function downloadJsonFile(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  // 공개 API
  return {
    // 가격 조회 API
    getGemPrice,
    getEngravingPrice,
    getAccessoryPrice,
    calculateEngravingUpgradeCost,
    
    // 가격 스캐너 API
    startPriceScanner,
    
    // 데이터 관리 API
    exportAllPriceData,
    importPriceData,
    getPriceDataStats,
    clearAllPriceData,
    
    // UI API
    createApiStatusUI,
    updateApiStatus,
    
    // 초기화
    initialize: function() {
      console.log('PricingSystem 모듈 초기화');
      
      // 모듈 로드 확인
      if (checkModulesLoaded()) {
        console.log('모든 가격 모듈이 로드되었습니다.');
        
        // API 상태 확인 및 캐시 통계 업데이트
        setTimeout(() => {
          updateApiStatus();
          updateCacheStats();
        }, 1000);
      } else {
        console.error('일부 가격 모듈이 로드되지 않았습니다:', {
          PriceManager: typeof PriceManager !== 'undefined',
          PriceStorage: typeof PriceStorage !== 'undefined'
        });
      }
    },
    
    // 모든 하위 모듈 참조 제공
    modules: {
      manager: PriceManager,
      storage: PriceStorage
    }
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', PricingSystem.initialize);

// 전역 네임스페이스에 PricingSystem 등록
if (window.LopecScanner) {
  window.LopecScanner.PricingSystem = PricingSystem;
} else {
  window.LopecScanner = {
    PricingSystem: PricingSystem
  };
}
