/**
 * 로펙 시뮬레이터 점수 분석기 - 데이터 페이지 메인 스크립트
 */

// 이벤트 리스너 설정
function setupEventListeners() {
  // 필터 및 정렬 변경 이벤트
  UIController.elements.filterIncrease.addEventListener('change', updateData);
  UIController.elements.categoryFilter.addEventListener('change', updateData);
  UIController.elements.sortOption.addEventListener('change', updateData);
  
  // 데이터 내보내기 버튼 이벤트
  UIController.elements.exportDataBtn.addEventListener('click', () => {
    const csvContent = DataManager.exportDataToCSV();
    UIController.downloadCSV(csvContent, '로펙_시뮬레이터_데이터.csv');
  });
}

// 데이터 업데이트 및 화면 갱신
function updateData() {
  console.log('Updating data display...');
  
  // 데이터 요약 업데이트
  const summary = DataManager.getSummary();
  if (summary) {
    UIController.renderSummary(summary);
  }
  
  // 필터링된 데이터 표시
  const { filterIncrease, categoryFilter, sortBy } = UIController.getCurrentFilterSettings();
  const processedData = DataManager.processData(filterIncrease, categoryFilter, sortBy);
  UIController.renderTable(processedData);
}

// 초기화 함수
function initialize() {
  console.log('Initializing data page...');
  UIController.initElements();
  
  // 데이터 로드 후 화면 갱신
  DataManager.loadData(() => {
    updateData();
  });
  
  setupEventListeners();
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize);
