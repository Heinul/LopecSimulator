/**
 * 데이터 렌더러 모듈
 * 요약 정보 및 데이터 테이블 렌더링을 담당합니다.
 */

// 데이터 렌더러 모듈
const DataRenderer = (function() {
  /**
   * 요약 정보 업데이트
   * @param {Object} summaryData - 요약 데이터
   */
  function updateSummary(summaryData) {
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
    if (APIStatus && typeof APIStatus.updateApiStatusSummary === 'function') {
      APIStatus.updateApiStatusSummary();
    }
  }

  /**
   * 데이터 테이블 업데이트
   * @param {Array} processedData - 처리된 데이터 배열
   */
  function updateDataTable(processedData) {
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
  }

  /**
   * 초기화 함수
   */
  function initialize() {
    console.log('DataRenderer 모듈 초기화됨');
  }

  // 공개 API
  return {
    initialize,
    updateSummary,
    updateDataTable
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', DataRenderer.initialize);
