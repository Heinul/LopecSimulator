/**
 * 데이터 렌더러 모듈
 * 요약 정보 및 데이터 테이블 렌더링을 담당합니다.
 */

// APIStatus 모듈 가져오기
import APIStatus from './APIStatus.js';

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
            <th class="gold-cost-header">골드 소요량</th>
            <th class="gold-per-point-header">1점당 골드</th>
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
      // 보석이나 장신구인 경우 템플릿 구조 수정
      let fromDisplay = item.from;
      let toDisplay = item.to;
      
      // 보석의 경우 from과 to에 레벨이 있으면 보석 정보가 들어간 item을 표시
      if (item.type === 'gem' && item.from && item.to) {
        // 보석 정보 추출
        let gemInfo = '';
        if (item.gemType && item.skillName) {
          // gemType과 skillName 필드가 있는 경우
          gemInfo = `${item.gemType} ${item.skillName}`;
        } else if (item.item && item.item.includes('보석 (')) {
          // item에서 정보 추출
          gemInfo = item.item.replace('보석 (', '').replace(')', '');
        }
        
        // 보석 정보가 있으면 표시
        if (gemInfo) {
          fromDisplay = `${item.from} (${gemInfo})`;          
          toDisplay = `${item.to} (${gemInfo})`;          
        }
      }
      
      // 각인서의 경우 레벨 추출하여 필요 개수 표시
      if (item.type === 'engraving' && item.from && item.to) {
        // 상세 정보 표시 옵션 확인
        const showDetails = window.LopecScanner && 
                           typeof window.LopecScanner.showEngravingDetails !== 'undefined' ?
                           window.LopecScanner.showEngravingDetails : true; // 기본값은 true
        
        if (showDetails) {
          // 레벨 추출
          let fromLevel = 0;
          let toLevel = 0;
          
          const fromLvMatch = item.from.match(/Lv\.(\d+)/);
          if (fromLvMatch && fromLvMatch[1]) {
            fromLevel = parseInt(fromLvMatch[1]);
          }
          
          const toLvMatch = item.to.match(/Lv\.(\d+)/);
          if (toLvMatch && toLvMatch[1]) {
            toLevel = parseInt(toLvMatch[1]);
          }
          
          // 각인서 등급 추출
          let fromGrade = '';
          let toGrade = '';
          
          if (item.from.includes('영웅')) fromGrade = '영웅';
          else if (item.from.includes('전설')) fromGrade = '전설';
          else if (item.from.includes('유물')) fromGrade = '유물';
          
          if (item.to.includes('영웅')) toGrade = '영웅';
          else if (item.to.includes('전설')) toGrade = '전설';
          else if (item.to.includes('유물')) toGrade = '유물';
          
          // 필요 장수 표시 (5장/레벨)
          if (fromLevel > 0) {
            fromDisplay = `${item.from} (${fromLevel*5}장)`;
          }
          
          if (toLevel > 0) {
            toDisplay = `${item.to} (${toLevel*5}장)`;
          }
        }
      }
      
      // 장신구의 경우
      if (item.type && (item.type === 'accessory' || item.type.includes('장신구')) && item.item) {
        // 장신구 정보 세분화
        let accessoryType = '';
        
        if (item.accessoryType) {
          // 장신구 타입 필드가 있는 경우
          switch(item.accessoryType) {
            case 'necklace': accessoryType = '목걸이'; break;
            case 'earring': accessoryType = '귀걸이'; break;
            case 'ring': accessoryType = '반지'; break;
            default: accessoryType = item.accessoryType;
          }
          
          item.item = `${accessoryType} - ${item.item}`;
        }
        
        // 등급 정보 추출
        let fromGrade = '';
        let toGrade = '';
        
        // 1. 직접 fromGrade/toGrade 속성에서 가져오기
        if (item.fromGrade) {
          fromGrade = item.fromGrade;
        } 
        // 2. from 텍스트에서 추출
        else if (item.from && typeof item.from === 'string') {
          if (item.from.includes('고대')) fromGrade = '고대';
          else if (item.from.includes('유물')) fromGrade = '유물';
          else if (item.from.includes('전설')) fromGrade = '전설';
          else if (item.from.includes('T4')) fromGrade = 'T4';
          else if (item.from.includes('T3')) fromGrade = 'T3';
        }
        
        // 1. 직접 fromGrade/toGrade 속성에서 가져오기
        if (item.toGrade) {
          toGrade = item.toGrade;
        } 
        // 2. to 텍스트에서 추출
        else if (item.to && typeof item.to === 'string') {
          if (item.to.includes('고대')) toGrade = '고대';
          else if (item.to.includes('유물')) toGrade = '유물';
          else if (item.to.includes('전설')) toGrade = '전설';
          else if (item.to.includes('T4')) toGrade = 'T4';
          else if (item.to.includes('T3')) toGrade = 'T3';
        }
        
        // 등급 정보 추가
        if (fromGrade && !fromDisplay.includes(fromGrade)) {
          fromDisplay = `${fromGrade} ${fromDisplay}`;
        }
        
        if (toGrade && !toDisplay.includes(toGrade)) {
          toDisplay = `${toGrade} ${toDisplay}`;
        }
      }
      
      // 골드 정보 추가
      let goldCostHTML = '';
      let goldPerPointHTML = '';
      let goldCost = 0;
      let goldPerPoint = 0;
      
      // 골드 정보가 현재 데이터에 있는 경우
      if (item.goldCost) {
        goldCost = item.goldCost;
        // 1점당 골드 계산 (점수변동이 0이면 무한대로 표시)
        goldPerPoint = item.difference > 0 ? Math.round(goldCost / item.difference) : 0;
        
        // 각인서의 경우 책 수량도 표시
        if (item.type === 'engraving' && item.engravingBooks) {
          goldCostHTML = `<td class="gold-cost-cell" style="color: #F9A825; font-weight: bold;"><span class="gold-value">${goldCost.toLocaleString()}G</span> <span class="book-count">(${item.engravingBooks}개)</span></td>`;
        } else {
          goldCostHTML = `<td class="gold-cost-cell" style="color: #F9A825; font-weight: bold;"><span class="gold-value">${goldCost.toLocaleString()}G</span></td>`;
        }
        // 1점당 골드 표시
        goldPerPointHTML = `<td class="gold-per-point-cell">${goldPerPoint > 0 ? goldPerPoint.toLocaleString() + 'G' : '-'}</td>`;
      }
      // 원본 scanData에서 골드 정보 가져오기
      else if (item.key && DataManager.scanData[item.key] && DataManager.scanData[item.key].goldCost) {
        const scanItem = DataManager.scanData[item.key];
        goldCost = scanItem.goldCost;
        // 1점당 골드 계산
        goldPerPoint = item.difference > 0 ? Math.round(goldCost / item.difference) : 0;
        
        // 각인서의 경우 책 수량도 표시
        if (item.type === 'engraving' && scanItem.engravingBooks) {
          goldCostHTML = `<td class="gold-cost-cell" style="color: #F9A825; font-weight: bold;"><span class="gold-value">${goldCost.toLocaleString()}G</span> <span class="book-count">(${scanItem.engravingBooks}개)</span></td>`;
        } else {
          goldCostHTML = `<td class="gold-cost-cell" style="color: #F9A825; font-weight: bold;"><span class="gold-value">${goldCost.toLocaleString()}G</span></td>`;
        }
        // 1점당 골드 표시
        goldPerPointHTML = `<td class="gold-per-point-cell">${goldPerPoint > 0 ? goldPerPoint.toLocaleString() + 'G' : '-'}</td>`;
      } else {
        goldCostHTML = `<td class="gold-cost-cell" style="color: #999;">-</td>`;
        goldPerPointHTML = `<td class="gold-per-point-cell">-</td>`;
      }
      
      tableHTML += `
        <tr data-item-key="${item.key}" data-item-type="${item.type}">
          <td class="item-category">${categoryName}</td>
          <td class="item-name">${item.item}</td>
          <td class="item-from">${fromDisplay}</td>
          <td class="item-to">${toDisplay}</td>
          <td class="item-difference ${scoreClass}">${item.difference.toFixed(2)}</td>
          ${goldCostHTML}
          ${goldPerPointHTML}
        </tr>
      `;
    });
    
    tableHTML += `
        </tbody>
      </table>
    `;
    
    // HTML 업데이트
    tableContainer.innerHTML = tableHTML;
    
    // 골드 표시 스타일 추가
    addGoldColumnStyle();
  }
  
  /**
   * 골드 표시 스타일 추가
   */
  function addGoldColumnStyle() {
    // 이미 스타일이 있는지 확인
    if (document.getElementById('gold-column-style')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'gold-column-style';
    styleElement.textContent = `
      .gold-cost-header, .gold-cost-cell,
      .gold-per-point-header, .gold-per-point-cell {
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
      
      .gold-per-point-cell {
        color: #607D8B;
        font-weight: 500;
      }
    `;
    
    document.head.appendChild(styleElement);
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
    updateDataTable,
    addGoldColumnStyle
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', DataRenderer.initialize);

// 모듈을 전역 객체에 노출
window.DataRenderer = DataRenderer;

// 모듈 내보내기
export default DataRenderer;
