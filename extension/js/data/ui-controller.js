/**
 * 로펙 시뮬레이터 점수 분석기 - UI 컨트롤러 모듈
 * 데이터 페이지 UI 업데이트 및 이벤트 처리
 */

// UI 컨트롤러 모듈
const UIController = {
  /**
   * 요약 정보 업데이트
   * @param {Object} summaryData - 요약 데이터
   */
  updateSummary(summaryData) {
    if (!summaryData) return;
    
    // 요약 컨테이너 가져오기
    const summaryContainer = document.getElementById('summary-container');
    if (!summaryContainer) return;
    
    // 요약 HTML 생성
    let summaryHTML = `
      <div class="summary-heading">스캔 결과 요약</div>
      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-value">${summaryData.totalItems}</div>
          <div class="stat-label">총 항목 수</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${summaryData.positiveChanges}</div>
          <div class="stat-label">점수 상승 항목</div>
        </div>
      </div>
      <div class="summary-categories">
    `;
    
    // 카테고리별 정보 추가
    for (const [category, data] of Object.entries(summaryData.categories)) {
      if (data.count > 0) {
        // 카테고리 이름 가공
        let categoryName = '';
        switch(category) {
          case 'armor': categoryName = '장비'; break;
          case 'gem': categoryName = '보석'; break;
          case 'accessory': categoryName = '장신구'; break;
          case 'engraving': categoryName = '각인'; break;
          case 'karma': categoryName = '카르마'; break;
          case 'avatar': categoryName = '아바타'; break;
          default: categoryName = category;
        }
        
        summaryHTML += `
          <div class="category-item">
            <div class="category-header">
              <div class="category-name">${categoryName}</div>
              <div class="category-count">${data.count}개 항목 (상승: ${data.positive}개)</div>
            </div>
        `;
        
        // 최대 상승 항목이 있는 경우
        if (data.maxItem && data.maxChange > 0) {
          summaryHTML += `
            <div class="category-max">
              <div class="max-label">최대 상승:</div>
              <div class="max-item">${data.maxItem.item}: ${data.maxItem.from} → ${data.maxItem.to} (${data.maxChange.toFixed(2)}점)</div>
            </div>
          `;
        }
        
        summaryHTML += `</div>`;
      }
    }
    
    summaryHTML += `</div>`;
    
    // API 연동 정보 추가 (항상 표시)
    summaryHTML += `
      <div class="api-info">
        <div class="api-info-header">API 연동 정보</div>
        <div class="api-info-content" id="api-status-summary">
          <span class="loading-indicator">상태 확인 중...</span>
        </div>
      </div>
    `;
    
    // HTML 업데이트
    summaryContainer.innerHTML = summaryHTML;
    
    // API 상태 업데이트
    this.updateApiStatusSummary();
  },
  
  /**
   * API 키 설정 모달 생성
   */
  createApiSettingsModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('api-settings-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 모달 컨테이너 생성
    const modalContainer = document.createElement('div');
    modalContainer.id = 'api-settings-modal';
    modalContainer.className = 'modal';
    modalContainer.style.display = 'none';
    
    // 모달 내용 생성
    modalContainer.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>로스트아크 API 설정</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <p>로스트아크 개발자 센터에서 발급받은 API 키를 입력하세요.</p>
          <div class="api-input-container">
            <input type="password" id="api-key-input" placeholder="API 키 입력">
            <button id="save-api-key" class="modal-button primary">저장</button>
            <button id="test-api-key" class="modal-button secondary">연결 테스트</button>
          </div>
          <div id="api-status-display" class="api-status-display">
            <div class="api-status-indicator">
              <span id="api-status-icon" class="status-icon"></span>
              <span id="api-status-text" class="status-text">API 상태 확인 중...</span>
            </div>
          </div>
          <div class="api-info">
            <p>API 키를 설정하면 스펙업 요소별 소요 골드를 자동으로 계산합니다.</p>
            <p>API 키는 <a href="https://developer-lostark.game.onstove.com/" target="_blank">로스트아크 개발자 센터</a>에서 발급받을 수 있습니다.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button id="fetch-gold-data" class="modal-button primary">골드 정보 가져오기</button>
          <button id="close-modal" class="modal-button">닫기</button>
        </div>
      </div>
    `;
    
    // 모달을 body에 추가
    document.body.appendChild(modalContainer);
    
    // 이벤트 리스너 설정
    document.querySelector('.close-modal').addEventListener('click', () => {
      modalContainer.style.display = 'none';
    });
    
    document.getElementById('close-modal').addEventListener('click', () => {
      modalContainer.style.display = 'none';
    });
    
    document.getElementById('save-api-key').addEventListener('click', () => {
      const apiKey = document.getElementById('api-key-input').value.trim();
      if (apiKey) {
        // API 키 저장 및 상태 업데이트
        this.saveApiKey(apiKey);
      }
    });
    
    document.getElementById('test-api-key').addEventListener('click', () => {
      this.updateApiStatus(true);
    });
    
    document.getElementById('fetch-gold-data').addEventListener('click', () => {
      this.fetchGoldData();
    });
    
    return modalContainer;
  },
  
  /**
   * API 키 저장
   * @param {string} apiKey - API 키
   */
  saveApiKey(apiKey) {
    // API 모듈이 있으면 해당 함수 사용
    if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.LostArkAPI) {
      window.LopecScanner.API.LostArkAPI.setApiKey(apiKey);
      this.updateApiStatus();
    } else {
      // API 모듈이 없으면 로컬 스토리지에 직접 저장
      chrome.storage.local.set({ lostarkApiKey: apiKey }, () => {
        console.log('API 키가 저장되었습니다.');
        this.updateApiStatus();
      });
    }
  },
  
  /**
   * API 상태 업데이트
   * @param {boolean} forceCheck - 강제 확인 여부
   */
  async updateApiStatus(forceCheck = false) {
    const statusIcon = document.getElementById('api-status-icon');
    const statusText = document.getElementById('api-status-text');
    
    if (!statusIcon || !statusText) return;
    
    // 상태 확인 중 표시
    statusIcon.style.backgroundColor = '#ffc107';
    statusText.innerText = 'API 상태 확인 중...';
    
    try {
      // API 키 로드
      let apiKey = null;
      await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          if (result.lostarkApiKey) {
            apiKey = result.lostarkApiKey;
            
            // API 키 입력 필드 업데이트
            const apiKeyInput = document.getElementById('api-key-input');
            if (apiKeyInput) {
              apiKeyInput.value = '********'; // 보안을 위해 실제 키 대신 표시
            }
          }
          resolve();
        });
      });
      
      // API 키가 없는 경우
      if (!apiKey) {
        statusIcon.style.backgroundColor = '#ccc';
        statusText.innerText = 'API 키가 설정되지 않았습니다.';
        return;
      }
      
      // API 연결 테스트
      let isConnected = false;
      
      if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.LostArkAPI) {
        isConnected = await window.LopecScanner.API.LostArkAPI.testConnection();
      } else {
        // API 모듈이 없는 경우 (현재는 실패로 처리)
        isConnected = false;
      }
      
      if (isConnected) {
        statusIcon.style.backgroundColor = '#4CAF50';
        statusText.innerText = 'API 연결 성공';
      } else {
        statusIcon.style.backgroundColor = '#f44336';
        statusText.innerText = 'API 연결 실패. 키를 확인해주세요.';
      }
    } catch (error) {
      console.error('API 상태 확인 중 오류 발생:', error);
      statusIcon.style.backgroundColor = '#f44336';
      statusText.innerText = '오류 발생: ' + error.message;
    }
  },
  
  /**
   * API 상태 요약 업데이트
   */
  async updateApiStatusSummary() {
    const apiStatusElement = document.getElementById('api-status-summary');
    if (!apiStatusElement) return;
    
    try {
      // API 키 설정 여부 확인
      let apiKey = null;
      let apiAvailable = false;
      
      await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          apiKey = result.lostarkApiKey;
          resolve();
        });
      });
      
      if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.GoldCalculator && apiKey) {
        apiAvailable = await window.LopecScanner.API.GoldCalculator.isApiAvailable();
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
          const modal = this.createApiSettingsModal();
          modal.style.display = 'block';
          this.updateApiStatus();
        });
      }
      
      // 골드 정보 가져오기 버튼 이벤트 리스너 (있는 경우에만)
      const fetchButton = document.getElementById('fetch-gold-data-summary');
      if (fetchButton) {
        fetchButton.addEventListener('click', () => {
          this.fetchGoldData();
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
          const modal = this.createApiSettingsModal();
          modal.style.display = 'block';
          this.updateApiStatus();
        });
      }
    }
  },
  
  /**
   * 골드 데이터 가져오기
   */
  async fetchGoldData() {
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
      // 데이터 가져오기
      if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.APIManager) {
        // 현재 표시된 데이터 가져오기
        const filteredData = DataManager.processedData;
        
        if (filteredData.length === 0) {
          alert('표시할 데이터가 없습니다.');
          loadingOverlay.remove();
          return;
        }
        
        // API 모듈을 통해 골드 정보 업데이트
        await window.LopecScanner.API.APIManager.updateDataTableWithGoldInfo(filteredData);
      } else {
        // API 모듈이 없는 경우 - 에러 메시지 표시
        alert('API 모듈을 찾을 수 없습니다. 확장 프로그램을 다시 로드해주세요.');
      }
    } catch (error) {
      console.error('골드 데이터 가져오기 오류:', error);
      alert('골드 데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 로딩 오버레이 제거
      loadingOverlay.remove();
    }
  },
  
  /**
   * 데이터 테이블 업데이트
   * @param {Array} processedData - 처리된 데이터 배열
   */
  updateDataTable(processedData) {
    if (!processedData) return;
    
    // 테이블 컨테이너 가져오기
    const tableContainer = document.getElementById('data-table-container');
    if (!tableContainer) return;
    
    // 데이터가 없는 경우
    if (processedData.length === 0) {
      tableContainer.innerHTML = `
        <div class="no-data-message">
          표시할 데이터가 없습니다. 스캔 후 다시 시도하세요.
        </div>
      `;
      return;
    }
    
    // 테이블 HTML 생성
    let tableHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>카테고리</th>
            <th>항목</th>
            <th>현재값</th>
            <th>변경값</th>
            <th>점수변동</th>
          </tr>
        </thead>
        <tbody>
    `;
    
    // 각 항목에 대한 행 추가
    processedData.forEach(item => {
      // 카테고리 이름 가공
      let categoryName = '';
      switch(item.type) {
        case 'armor': categoryName = '장비'; break;
        case 'gem': categoryName = '보석'; break;
        case 'accessory': categoryName = '장신구'; break;
        case 'engraving': categoryName = '각인'; break;
        case 'karma': categoryName = '카르마'; break;
        case 'avatar': categoryName = '아바타'; break;
        default: categoryName = item.type;
      }
      
      // 점수 변동 스타일 결정
      const scoreClass = item.difference > 0 ? 'positive-change' : 
                          item.difference < 0 ? 'negative-change' : 'no-change';
      
      // 행 HTML 추가
      tableHTML += `
        <tr data-item-key="${item.key}" data-item-type="${item.type}">
          <td class="item-category">${categoryName}</td>
          <td class="item-name">${item.item}</td>
          <td class="item-from">${item.from}</td>
          <td class="item-to">${item.to}</td>
          <td class="item-difference ${scoreClass}">${item.difference.toFixed(2)}</td>
        </tr>
      `;
    });
    
    tableHTML += `
        </tbody>
      </table>
    `;
    
    // HTML 업데이트
    tableContainer.innerHTML = tableHTML;
    
    // API 모듈이 있으면 골드 정보 추가
    if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.APIManager) {
      // 메시지로 데이터 전달 (비동기 처리를 위해)
      chrome.runtime.sendMessage({
        action: 'dataProcessed',
        processedData: processedData
      });
    }
  },
  
  /**
   * 필터 및 정렬 이벤트 처리
   */
  setupFilterEvents() {
    // 필터 요소 가져오기
    const filterForm = document.getElementById('filter-form');
    if (!filterForm) return;
    
    // 필터 변경 이벤트 처리
    filterForm.addEventListener('change', () => {
      // 필터 옵션 가져오기
      const filterIncrease = document.getElementById('filter-increase').checked;
      const categoryFilter = document.getElementById('category-filter').value;
      const sortBy = document.getElementById('sort-by').value;
      
      // 데이터 필터링 및 정렬
      const processedData = DataManager.processData(filterIncrease, categoryFilter, sortBy);
      
      // UI 업데이트
      this.updateDataTable(processedData);
    });
  },
  
  /**
   * 내보내기 버튼 이벤트 처리
   */
  setupExportButtons() {
    // CSV 내보내기 버튼
    const csvExportButton = document.getElementById('export-csv');
    if (csvExportButton) {
      csvExportButton.addEventListener('click', () => {
        // CSV 데이터 생성
        const csvContent = DataManager.exportDataToCSV();
        
        if (!csvContent) {
          alert('내보낼 데이터가 없습니다.');
          return;
        }
        
        // 다운로드 링크 생성
        const encodedUri = encodeURI('data:text/csv;charset=utf-8,\uFEFF' + csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'lopec_scan_result.csv');
        document.body.appendChild(link);
        
        // 다운로드 시작
        link.click();
        
        // 링크 제거
        document.body.removeChild(link);
      });
    }
  },
  
  /**
   * 필터 설정 가져오기
   */
  getCurrentFilterSettings() {
    const filterIncrease = document.getElementById('filter-increase').checked;
    const categoryFilter = document.getElementById('category-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    
    return { filterIncrease, categoryFilter, sortBy };
  },
  
  /**
   * 모든 UI 컴포넌트 초기화
   */
  initializeAll() {
    // 모달 스타일 추가
    this.addModalStyles();
    
    // 데이터 로드
    DataManager.loadData(() => {
      // 요약 정보 업데이트
      const summaryData = DataManager.getSummary();
      this.updateSummary(summaryData);
      
      // 데이터 테이블 업데이트
      const processedData = DataManager.processData(false, 'all', 'differenceDesc');
      this.updateDataTable(processedData);
      
      // 이벤트 리스너 설정
      this.setupFilterEvents();
      this.setupExportButtons();
    });
  },
  
  /**
   * 모달 스타일 추가
   */
  addModalStyles() {
    // 스타일이 이미 있는지 확인
    if (document.getElementById('modal-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'modal-styles';
    styleElement.textContent = `
      /* 모달 기본 스타일 */
      .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
      }
      
      .modal-content {
        background-color: #fff;
        margin: 10% auto;
        padding: 0;
        width: 500px;
        max-width: 90%;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        background-color: #f8f8f8;
        border-radius: 8px 8px 0 0;
      }
      
      .modal-header h2 {
        margin: 0;
        font-size: 20px;
        color: #333;
      }
      
      .close-modal {
        font-size: 24px;
        color: #999;
        cursor: pointer;
      }
      
      .close-modal:hover {
        color: #333;
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .modal-footer {
        padding: 15px 20px;
        text-align: right;
        border-top: 1px solid #eee;
        background-color: #f8f8f8;
        border-radius: 0 0 8px 8px;
      }
      
      /* API 설정 관련 스타일 */
      .api-input-container {
        display: flex;
        align-items: center;
        margin: 15px 0;
      }
      
      #api-key-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .modal-button {
        padding: 8px 15px;
        margin-left: 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .modal-button.primary {
        background-color: #2196F3;
        color: white;
      }
      
      .modal-button.secondary {
        background-color: #4CAF50;
        color: white;
      }
      
      .modal-button:hover {
        opacity: 0.9;
      }
      
      .api-status-display {
        margin: 15px 0;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }
      
      .api-status-indicator {
        display: flex;
        align-items: center;
      }
      
      .status-icon {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 8px;
        background-color: #ccc;
      }
      
      .api-info {
        margin-top: 15px;
        color: #666;
        font-size: 13px;
      }
      
      .api-info p {
        margin: 5px 0;
      }
      
      .api-info a {
        color: #2196F3;
        text-decoration: none;
      }
      
      /* 로딩 오버레이 */
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10;
      }
      
      .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #2196F3;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        color: #333;
        font-size: 16px;
      }
      
      /* API 설정 버튼 */
      .api-settings-button {
        margin-left: 10px;
        padding: 4px 8px;
        background-color: #2196F3;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .api-settings-button:hover {
        background-color: #1976D2;
      }
      
      /* API 액션 버튼 */
      .api-action-button {
        margin-top: 8px;
        padding: 6px 12px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 13px;
      }
      
      .api-action-button:hover {
        background-color: #3E8E41;
      }
      
      /* API 상태 스타일 추가 */
      .api-status-neutral {
        display: flex;
        align-items: center;
        color: #607D8B;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .api-status-neutral .status-icon {
        background-color: #607D8B;
      }
    `;
    
    document.head.appendChild(styleElement);
  }
};

// 페이지 로드 시 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
  UIController.initializeAll();
});
