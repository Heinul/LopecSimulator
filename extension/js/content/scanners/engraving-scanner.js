/**
 * 로펙 시뮬레이터 점수 분석기 - 각인 스캐너 모듈
 * 각인 관련 콤보박스를 스캔하는 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 각인 스캐너 모듈
LopecScanner.Scanners.EngravingScanner = (function() {
  // 기본 스캐너 참조
  const BaseScanner = LopecScanner.Scanners.BaseScanner;
  
  // 각인 옵션 설정 - 사용자가 코드에서 지정할 수 있는 옵션들
  let engravingOptions = {
    // 스캔하고자 하는 각인 이름 배열 (빈 배열이면 모든 각인 스캔)
    engravingNames: [],
    // 최대 스캔할 각인 레벨 (기본값: 3)
    maxLevel: 3,
    // 특정 이름-레벨 조합만 스캔 (예: [{ name: '원한', level: 3 }, { name: '슈퍼 차지', level: 2 }])
    specificCombinations: []
  };
  
  /**
   * 각인 옵션 설정
   * @param {Object} options - 각인 스캐닝 옵션
   */
  function setEngravingOptions(options) {
    engravingOptions = {...engravingOptions, ...options};
  }
  
  /**
   * 각인 스캔 준비
   * @param {Object} elements - 각인 요소들 모음 객체
   * @return {number} - 스캔 항목 개수
   */
  function prepareEngravingScan(elements) {
    let scanCount = 0;
    
    // 요소가 존재하는지 확인
    if (!elements || !elements.engravingLevelElements ||
        elements.engravingLevelElements.length === 0) {
      return scanCount;
    }
    
    // 현재 값들 저장
    elements.engravingLevelElements.forEach((element, index) => {
      if (element.classList.contains('orange')) {
        BaseScanner.state.originalValues[`engraving-level-${index}`] = element.value;
      }
    });
    
    // 스캔 항목 계산 - orange 클래스를 가진 각인 레벨 요소만 스캔
    elements.engravingLevelElements.forEach((element, index) => {
      if (element.classList.contains('orange')) {
        const currentLevel = parseInt(element.value);
        const maxLevel = Math.min(
          parseInt(element.getAttribute('data-max') || '4'),
          3 // 레벨 3까지만 스캔
        );
        
        // 현재 레벨보다 높은 레벨만 스캔
        for (let level = currentLevel + 1; level <= maxLevel; level++) {
          scanCount++;
        }
      }
    });
    
    return scanCount;
  }
  
  /**
   * 각인 스캔 실행
   * @param {Object} elements - 각인 요소들 모음 객체
   */
  async function scanEngravings(elements) {
    if (!elements || !elements.engravingLevelElements) return;
    
    // orange 클래스를 가진 요소만 스캔
    for (let i = 0; i < elements.engravingLevelElements.length; i++) {
      const levelElement = elements.engravingLevelElements[i];
      
      // orange 클래스가 있는 각인 레벨 요소만 스캔
      if (levelElement.classList.contains('orange')) {
        const currentLevel = parseInt(levelElement.value);
        const maxLevel = Math.min(
          parseInt(levelElement.getAttribute('data-max') || '4'),
          3 // 레벨 3까지만 스캔
        );
        
        // 각인 이름 요소 참조
        const nameElement = elements.engravingNameElements[i];
        const currentName = nameElement ? nameElement.value : '알 수 없음';
        
        // 현재 레벨보다 높은 레벨만 스캔
        for (let level = currentLevel + 1; level <= maxLevel; level++) {
          if (!BaseScanner.state.isScanning) return;
          
          // 레벨 변경 및 변동 확인
          const result = await BaseScanner.changeValueAndCheckDifference(levelElement, level.toString());
          
          // 결과 저장
          BaseScanner.state.scanResults[`engraving-${i}-${level}`] = {
            type: '각인',
            index: i,
            item: `${currentName} Lv.${level}`,
            from: `${currentName} Lv.${currentLevel}`,
            to: `${currentName} Lv.${level}`,
            score: result.score,
            difference: result.difference
          };
          
          BaseScanner.updateScanProgress();
        }
        
        // 원래 레벨로 복원
        await BaseScanner.changeValueAndCheckDifference(levelElement, currentLevel.toString());
      }
    }
  }
  
  // 공개 API
  return {
    setEngravingOptions,
    prepareEngravingScan,
    scanEngravings
  };
})();
