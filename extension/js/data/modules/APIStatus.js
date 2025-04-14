/**
 * API 상태 관리 모듈
 * API 상태 업데이트 및 표시를 담당합니다.
 */

// API 상태 관리 모듈
const APIStatus = (function() {
  /**
   * API 상태 요약 업데이트
   */
  async function updateApiStatusSummary() {
    const apiStatusElement = document.getElementById('api-status-summary');
    if (!apiStatusElement) return;
    
    try {
      // API 키 설정 여부 확인
      let apiKey = null;
      let apiAvailable = false;
      
      await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          apiKey = result && result.lostarkApiKey;
          resolve();
        });
      });
      
      // API 키가 있는 경우 직접 연결 테스트 수행
      if (apiKey) {
        try {
          // 직접 API 연결 테스트
          const testUrl = 'https://developer-lostark.game.onstove.com/auctions/options';
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'authorization': `bearer ${apiKey}`
            }
          });
          
          apiAvailable = (response.status === 200);
          console.log('API 연결 테스트 결과:', apiAvailable, '(상태코드:', response.status, ')');
        } catch (e) {
          console.error('API 연결 테스트 오류:', e);
          apiAvailable = false;
        }
      }
      
      // API 키 설정 버튼 추가 (항상 표시)
      const apiSettingsButton = `
        <button id="open-api-settings" class="api-settings-button">API 설정</button>
      `;
      
      // HTML 컨텐츠 준비
      let htmlContent = '';
      
      if (apiAvailable) {
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
      
      // HTML 업데이트
      apiStatusElement.innerHTML = htmlContent;
      
      // DOM 업데이트 후 이벤트 리스너 추가
      const openApiSettingsBtn = document.getElementById('open-api-settings');
      if (openApiSettingsBtn) {
        openApiSettingsBtn.addEventListener('click', () => {
          const modal = APIManager.createApiSettingsModal();
          modal.style.display = 'block';
          APIManager.updateApiStatus();
        });
      }
      
      // 골드 정보 가져오기 버튼 이벤트 리스너 (있는 경우에만)
      const fetchButton = document.getElementById('fetch-gold-data-summary');
      if (fetchButton) {
        fetchButton.addEventListener('click', () => {
          APIStatus.fetchGoldData();
        });
      }
    } catch (error) {
      console.error('API 상태 요약 업데이트 중 오류 발생:', error);
      
      // 오류 발생 시 HTML 업데이트
      const htmlContent = `
        <div class="api-status-error">
          <span class="status-icon">✗</span>
          <span class="status-text">API 오류 발생</span>
          <button id="open-api-settings" class="api-settings-button">API 설정</button>
        </div>
        <div class="api-description">오류: ${error.message}</div>
      `;
      
      apiStatusElement.innerHTML = htmlContent;
      
      // DOM 업데이트 후 이벤트 리스너 추가
      const openApiSettingsBtn = document.getElementById('open-api-settings');
      if (openApiSettingsBtn) {
        openApiSettingsBtn.addEventListener('click', () => {
          const modal = APIManager.createApiSettingsModal();
          modal.style.display = 'block';
          APIManager.updateApiStatus();
        });
      }
    }
  }

  /**
   * 골드 데이터 가져오기
   */
  async function fetchGoldData() {
    // 로딩 표시 추가
    const dataTableContainer = document.getElementById('data-table-container');
    if (!dataTableContainer) return;
    
    // 오버레이 생성
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">골드 데이터 가져오는 중...</div>
    `;
    
    // 기존 데이터 테이블 위에 오버레이 추가
    dataTableContainer.style.position = 'relative';
    dataTableContainer.appendChild(loadingOverlay);
    
    try {
      // 현재 표시된 데이터 가져오기
      const filteredData = DataManager.processedData;
      
      if (!filteredData || filteredData.length === 0) {
        alert('표시할 데이터가 없습니다.');
        loadingOverlay.remove();
        return;
      }
      
      // 여기에 API 요청 구현
      console.log('골드 데이터 요청 시작...');
      console.log('처리할 데이터 항목 수:', filteredData.length);
      
      // 실제 API 호출 로직을 사용할지 가짜 데이터를 사용할지 결정
      let useRealApi = false; // 추후 실제 API를 사용할 때 true로 변경
      
      if (useRealApi) {
        // 실제 API 호출
        await fetchRealGoldData(filteredData);
      } else {
        // 가짜 데이터 생성 (테스트용)
        await mockGoldDataFetch(filteredData);
      }
      
      // 데이터 테이블 업데이트
      updateDataTableWithGoldInfo(filteredData);
      
      alert('골드 데이터를 성공적으로 가져왔습니다!');
    } catch (error) {
      console.error('골드 데이터 가져오기 오류:', error);
      alert('골드 데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 로딩 오버레이 제거
      loadingOverlay.remove();
    }
  }
  
  /**
   * 가짜 골드 데이터 생성 (개발용)
   * @param {Array} items - 아이템 데이터 배열
   */
  async function mockGoldDataFetch(items) {
    return new Promise(resolve => {
      // 1초 대기하여 로딩 상태 테스트
      setTimeout(() => {
        // 각 아이템에 가짜 골드 정보 추가
        items.forEach(item => {
          // difference가 양수인 경우에만 골드 정보 추가
          if (item.difference > 0) {
            // 랜덤 골드 값 생성 (100 ~ 10000)
            const goldCost = Math.floor(Math.random() * 9900) + 100;
            item.goldCost = goldCost;
          }
        });
        
        resolve();
      }, 1000);
    });
  }
  
  /**
   * 실제 로스트아크 API를 통해 골드 데이터 가져오기
   * @param {Array} items - 아이템 데이터 배열
   */
  async function fetchRealGoldData(items) {
    // API 키 불러오기
    let apiKey = null;
    await new Promise((resolve) => {
      chrome.storage.local.get(['lostarkApiKey'], function(result) {
        apiKey = result && result.lostarkApiKey;
        resolve();
      });
    });
    
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다.');
    }
    
    // 여기에 실제 API 호출 구현 코드가 들어갑니다.
    // 예시: 로스트아크 API 엔드포인트 정보
    const apiEndpoint = 'API_ENDPOINT_URL'; // 나중에 실제 URL로 대체
    
    // 데이터 처리를 위한 배치 사이즈
    const batchSize = 10;
    const batches = [];
    
    // 배치로 나누기
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    // 각 배치 처리
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`배치 ${i+1}/${batches.length} 처리 중... (${batch.length} 항목)`);
      
      // 각 배치에 대한 요청 데이터 준비
      const requestItems = batch.map(item => ({
        // 요청에 필요한 필드 생성
        // 예시:
        itemType: item.type,
        itemName: item.item,
        fromValue: item.from,
        toValue: item.to
      }));
      
      try {
        // API 요청 수행 예시
        /*
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'authorization': `bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            items: requestItems
          })
        });
        
        if (!response.ok) {
          throw new Error(`API 오류: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 응답 데이터를 각 아이템에 적용
        data.forEach((result, index) => {
          if (result && result.goldCost) {
            batch[index].goldCost = result.goldCost;
          }
        });
        */
        
        // 임시 코드: 실제 API 구현 전까지 채우기
        batch.forEach(item => {
          if (item.difference > 0) {
            item.goldCost = Math.floor(Math.random() * 9900) + 100;
          }
        });
        
        // 요청 간 지연 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`배치 ${i+1} 처리 중 오류:`, error);
        // 오류가 발생해도 다음 배치 처리 계속
      }
    }
    
    console.log('모든 배치 처리 완료');
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
        goldCell.innerHTML = `<span class="gold-value">${item.goldCost.toLocaleString()}G</span>`;
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
    `;
    
    document.head.appendChild(styleElement);
  }

  /**
   * API 키 업데이트 메시지 리스너 설정
   */
  function setupApiKeyUpdateListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'apiKeyUpdated' && request.apiKey) {
        console.log('API 키 업데이트 메시지 수신:', request.apiKey.substring(0, 3) + '...');
        
        // API 상태 업데이트
        setTimeout(() => updateApiStatusSummary(), 1000);
        
        // 데이터 테이블 업데이트 (필요 시)
        if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.APIManager) {
          const processedData = DataManager.processedData;
          if (processedData && processedData.length > 0) {
            window.LopecScanner.API.APIManager.updateDataTableWithGoldInfo(processedData);
          }
        }
      }
    });
  }

  /**
   * 초기화 함수
   */
  function initialize() {
    // API 키 업데이트 메시지 리스너 설정
    setupApiKeyUpdateListener();
    
    console.log('APIStatus 모듈 초기화됨');
  }

  // 공개 API
  return {
    initialize,
    updateApiStatusSummary,
    fetchGoldData,
    updateDataTableWithGoldInfo
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', APIStatus.initialize);
