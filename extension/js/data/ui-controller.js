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
    
    // API 연동 정보 추가 (API 모듈이 있는 경우)
    if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.GoldCalculator) {
      summaryHTML += `
        <div class="api-info">
          <div class="api-info-header">API 연동 정보</div>
          <div class="api-info-content" id="api-status-summary">
            <span class="loading-indicator">상태 확인 중...</span>
          </div>
        </div>
      `;
    }
    
    // HTML 업데이트
    summaryContainer.innerHTML = summaryHTML;
    
    // API 상태 업데이트
    if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.GoldCalculator) {
      this.updateApiStatusSummary();
    }
  },
  
  /**
   * API 상태 요약 업데이트
   */
  async updateApiStatusSummary() {
    const apiStatusElement = document.getElementById('api-status-summary');
    if (!apiStatusElement) return;
    
    try {
      const apiAvailable = await LopecScanner.API.GoldCalculator.isApiAvailable();
      
      if (apiAvailable) {
        apiStatusElement.innerHTML = `
          <div class="api-status-ok">
            <span class="status-icon">✓</span>
            <span class="status-text">로스트아크 API 연결됨</span>
          </div>
          <div class="api-description">골드 소요량이 시장 가격 기준으로 계산됩니다.</div>
        `;
      } else {
        apiStatusElement.innerHTML = `
          <div class="api-status-warning">
            <span class="status-icon">!</span>
            <span class="status-text">API 연결되지 않음</span>
          </div>
          <div class="api-description">API가 연결되지 않아 골드 소요량이 표시되지 않습니다. 골드 소요량을 확인하려면 API 키를 설정해주세요.</div>
        `;
      }
    } catch (error) {
      console.error('API 상태 확인 중 오류 발생:', error);
      apiStatusElement.innerHTML = `
        <div class="api-status-error">
          <span class="status-icon">✗</span>
          <span class="status-text">API 오류 발생</span>
        </div>
        <div class="api-description">오류: ${error.message}</div>
      `;
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
   * 모든 UI 컴포넌트 초기화
   */
  initializeAll() {
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
  }
};

// 페이지 로드 시 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
  UIController.initializeAll();
});
