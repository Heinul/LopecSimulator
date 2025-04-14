/**
 * 내보내기 관리자 모듈
 * 데이터 내보내기 기능을 담당합니다.
 */

// 내보내기 관리자 모듈
const ExportManager = (function() {
  /**
   * CSV 형식으로 데이터 내보내기
   * @returns {string} CSV 형식의 문자열
   */
  function exportDataToCSV() {
    // 현재 필터링된 데이터 가져오기
    const data = DataManager.processedData;
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // CSV 헤더 생성
    let csvContent = "카테고리,항목,현재값,변경값,점수변동\n";
    
    // 데이터 행 추가
    data.forEach(item => {
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
      
      // CSV 행 생성 (쉼표와 개행 처리)
      const row = [
        csvEscape(categoryName),
        csvEscape(item.item),
        csvEscape(item.from.toString()),
        csvEscape(item.to.toString()),
        item.difference.toFixed(2)
      ].join(',');
      
      csvContent += row + '\n';
    });
    
    return csvContent;
  }
  
  /**
   * CSV 내보내기를 위한 문자열 이스케이프 처리
   * @param {string} str - 이스케이프할 문자열
   * @returns {string} 이스케이프된 문자열
   */
  function csvEscape(str) {
    if (str === null || str === undefined) {
      return '';
    }
    
    // 쉼표, 쌍따옴표, 개행 등이 포함된 경우 쌍따옴표로 감싸기
    if (str.toString().includes(',') || str.toString().includes('"') || 
        str.toString().includes('\n') || str.toString().includes('\r')) {
      
      // 쌍따옴표는 두 개로 이스케이프
      return '"' + str.toString().replace(/"/g, '""') + '"';
    }
    
    return str.toString();
  }

  /**
   * 초기화 함수
   */
  function initialize() {
    console.log('ExportManager 모듈 초기화됨');
  }

  // 공개 API
  return {
    initialize,
    exportDataToCSV
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', ExportManager.initialize);
