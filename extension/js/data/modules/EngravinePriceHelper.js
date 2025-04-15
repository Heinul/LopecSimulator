/**
 * 각인서 가격 계산 헬퍼 모듈
 * 각인서 정보를 분석하고 필요한 장수와 가격을 계산합니다.
 */

// 각인서 가격 계산 헬퍼 모듈
const EngravingPriceHelper = (function() {
  // 각인서 등급
  const ENGRAVING_GRADES = {
    EPIC: '영웅',
    LEGENDARY: '전설',
    RELIC: '유물'
  };

  /**
   * 각인서 등급 추출
   * @param {string} text - 각인서 텍스트
   * @returns {string} 추출된 등급
   */
  function extractGrade(text) {
    if (!text) return null;
    
    if (text.includes('영웅')) return ENGRAVING_GRADES.EPIC;
    if (text.includes('전설')) return ENGRAVING_GRADES.LEGENDARY;
    if (text.includes('유물')) return ENGRAVING_GRADES.RELIC;
    
    return null;
  }

  /**
   * 각인서 레벨 추출
   * @param {string} text - 각인서 텍스트 
   * @returns {number} 추출된 레벨
   */
  function extractLevel(text) {
    if (!text) return 0;
    
    const match = text.match(/Lv\.(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    
    return 0;
  }

  /**
   * 각인서 이름 추출
   * @param {string} text - 각인서 텍스트
   * @returns {string} 추출된 이름
   */
  function extractName(text) {
    if (!text) return '';
    
    // 등급 제거
    let name = text.replace(/(영웅|전설|유물) /g, '');
    
    // Lv.X 제거
    name = name.replace(/Lv\.\d+/g, '').trim();
    
    return name;
  }

  /**
   * 각인서 필요 장수 계산
   * @param {number} level - 각인서 레벨
   * @returns {number} 필요 장수
   */
  function calculateBooksCount(level) {
    // 레벨당 5장
    return level * 5;
  }

  /**
   * 각인서 정보 분석
   * @param {Object} item - 분석할 아이템 객체
   * @returns {Object} 분석 결과
   */
  function analyzeEngravingItem(item) {
    if (!item || item.type !== 'engraving' || !item.from || !item.to) {
      return null;
    }
    
    const fromGrade = extractGrade(item.from);
    const toGrade = extractGrade(item.to);
    const fromLevel = extractLevel(item.from);
    const toLevel = extractLevel(item.to);
    const fromName = extractName(item.from);
    const toName = extractName(item.to);
    
    const fromBooksCount = calculateBooksCount(fromLevel);
    const toBooksCount = calculateBooksCount(toLevel);
    
    return {
      item: item.item,
      fromGrade,
      toGrade,
      fromLevel,
      toLevel,
      fromName,
      toName,
      fromBooksCount,
      toBooksCount,
      difference: item.difference
    };
  }

  /**
   * 각인서 분석 결과 문자열 생성
   * @param {Object} analysis - 분석 결과 객체
   * @returns {string} 포맷팅된 문자열
   */
  function formatAnalysisResult(analysis) {
    if (!analysis) return '';
    
    return `[${analysis.fromName}] ${analysis.fromLevel} → ${analysis.toLevel} (필요: ${analysis.toBooksCount}장)`;
  }

  /**
   * 여러 각인서 아이템에 대한 일괄 분석
   * @param {Array} items - 각인서 아이템 배열
   * @returns {Array} 분석 결과 배열
   */
  function analyzeEngravingItems(items) {
    if (!Array.isArray(items)) return [];
    
    // 각인서 아이템만 필터링
    const engravingItems = items.filter(item => 
      item && item.type === 'engraving' && item.difference > 0
    );
    
    // 각 아이템 분석
    return engravingItems.map(item => analyzeEngravingItem(item));
  }

  /**
   * 마우스 오버 시 표시할 팝업 내용 생성
   * @param {Object} item - 각인서 아이템
   * @returns {string} HTML 문자열
   */
  function createTooltipContent(item) {
    if (!item || item.type !== 'engraving') return '';
    
    const analysis = analyzeEngravingItem(item);
    if (!analysis) return '';
    
    let html = `
      <div class="engraving-tooltip">
        <div class="tooltip-header">${analysis.fromName || analysis.toName} 각인서 정보</div>
        <div class="tooltip-content">
          <div class="tooltip-row">
            <span class="tooltip-label">현재:</span>
            <span class="tooltip-value">${analysis.fromGrade || ''} Lv.${analysis.fromLevel} (${analysis.fromBooksCount}장)</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">변경:</span>
            <span class="tooltip-value">${analysis.toGrade || ''} Lv.${analysis.toLevel} (${analysis.toBooksCount}장)</span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">추가 필요:</span>
            <span class="tooltip-value">${Math.max(0, analysis.toBooksCount - analysis.fromBooksCount)}장</span>
          </div>
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * 각인서 가격 팝업 설정
   * @param {string} selector - 테이블 행 선택자
   */
  function setupTooltips(selector = '.data-table tr[data-item-type="engraving"]') {
    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .engraving-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.85);
        color: #fff;
        border-radius: 4px;
        padding: 8px;
        font-size: 12px;
        z-index: 1000;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        min-width: 200px;
        pointer-events: none;
      }
      .tooltip-header {
        font-weight: bold;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        padding-bottom: 4px;
        margin-bottom: 4px;
      }
      .tooltip-row {
        display: flex;
        justify-content: space-between;
        margin: 4px 0;
      }
      .tooltip-label {
        color: #aaa;
      }
      .tooltip-value {
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
    
    // 팝업 요소 생성
    const tooltip = document.createElement('div');
    tooltip.className = 'engraving-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    
    // 마우스 이벤트 설정
    document.addEventListener('mouseover', function(e) {
      // 각인서 행 체크
      const row = e.target.closest(selector);
      if (row) {
        const itemKey = row.getAttribute('data-item-key');
        if (itemKey && window.LopecScanner && window.LopecScanner.DataManager) {
          const item = window.LopecScanner.DataManager.scanData[itemKey];
          if (item) {
            // 팝업 내용 설정
            tooltip.innerHTML = createTooltipContent(item);
            
            // 위치 설정
            tooltip.style.left = (e.pageX + 10) + 'px';
            tooltip.style.top = (e.pageY + 10) + 'px';
            
            // 표시
            tooltip.style.display = 'block';
          }
        }
      }
    });
    
    // 마우스 아웃 시 팝업 숨김
    document.addEventListener('mouseout', function(e) {
      if (!e.target.closest(selector)) {
        tooltip.style.display = 'none';
      }
    });
    
    // 마우스 이동 시 팝업 위치 업데이트
    document.addEventListener('mousemove', function(e) {
      if (tooltip.style.display === 'block') {
        tooltip.style.left = (e.pageX + 10) + 'px';
        tooltip.style.top = (e.pageY + 10) + 'px';
      }
    });
  }
  
  /**
   * 모듈 초기화
   */
  function initialize() {
    console.log('각인서 가격 헬퍼 모듈 초기화');
    
    // DOM 로드 완료 후 팝업 설정
    document.addEventListener('DOMContentLoaded', function() {
      setupTooltips();
    });
  }
  
  // 전역 객체에 저장
  window.LopecScanner = window.LopecScanner || {};
  window.LopecScanner.EngravingPriceHelper = {
    analyzeEngravingItem,
    analyzeEngravingItems,
    formatAnalysisResult,
    setupTooltips
  };
  
  // 공개 API
  return {
    initialize,
    analyzeEngravingItem,
    analyzeEngravingItems,
    formatAnalysisResult,
    setupTooltips
  };
})();

// 자동 초기화
EngravingPriceHelper.initialize();
