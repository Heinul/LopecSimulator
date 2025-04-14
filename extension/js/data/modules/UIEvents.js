/**
 * UI 이벤트 처리 모듈
 * 필터, 버튼 및 각종 사용자 상호작용 이벤트를 처리합니다.
 */

// UI 이벤트 처리 모듈
const UIEvents = (function() {
  /**
   * 필터 및 정렬 이벤트 처리
   */
  function setupFilterEvents() {
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
      DataRenderer.updateDataTable(processedData);
    });
  }

  /**
   * 내보내기 버튼 이벤트 처리
   */
  function setupExportButtons() {
    // CSV 내보내기 버튼
    const csvExportButton = document.getElementById('export-csv');
    if (csvExportButton) {
      csvExportButton.addEventListener('click', () => {
        // CSV 데이터 생성
        const csvContent = ExportManager.exportDataToCSV();
        
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
  }

  /**
   * 현재 필터 설정 가져오기
   * @returns {Object} 필터 설정 객체
   */
  function getCurrentFilterSettings() {
    const filterIncrease = document.getElementById('filter-increase').checked;
    const categoryFilter = document.getElementById('category-filter').value;
    const sortBy = document.getElementById('sort-by').value;
    
    return { filterIncrease, categoryFilter, sortBy };
  }

  /**
   * 초기화 함수
   */
  function initialize() {
    // 이벤트 리스너 설정
    setupFilterEvents();
    setupExportButtons();
    
    console.log('UIEvents 모듈 초기화됨');
  }

  // 공개 API
  return {
    initialize,
    setupFilterEvents,
    setupExportButtons,
    getCurrentFilterSettings
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', UIEvents.initialize);
