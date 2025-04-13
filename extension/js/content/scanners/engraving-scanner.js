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
    // 최대 스캔할 각인 레벨 (기본값: 4)
    maxLevel: 4,
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
  
  // 모든 각인 등급 요소 찾기
  const allEngravingGradeElements = document.querySelectorAll('select.relic-ico.engraving-ico.orange');
  
  // 현재 값들 저장
  elements.engravingLevelElements.forEach((element, index) => {
    if (element.classList.contains('orange')) {
      BaseScanner.state.originalValues[`engraving-level-${index}`] = element.value;
    }
  });
  
  // 등급 콤보박스 값 저장
  allEngravingGradeElements.forEach((element, index) => {
    BaseScanner.state.originalValues[`engraving-grade-${index}`] = element.value;
  });
  
  // 스캔 항목 계산
  // 각 등급별 최대 레벨 정의
  const gradeMaxLevels = {
  '영웅': 3,
  '전설': 3,
  '유물': 4
  };
  
  // 등급 순서 정의
  const gradeOrder = ['영웅', '전설', '유물'];
  
  elements.engravingLevelElements.forEach((levelElement, index) => {
    if (levelElement.classList.contains('orange')) {
      const currentLevel = parseInt(levelElement.value);
      
      // 현재 등급 가져오기 (등급 요소가 있다면)
      let currentGrade = '유물'; // 기본값
      
      // 각 레벨 요소에 대응하는 등급 요소 찾기
      // 요소의 부모 .engraving-box를 기준으로 매칭
      const parentBox = levelElement.closest('.engraving-box');
      if (parentBox) {
        const gradeElement = parentBox.querySelector('select.relic-ico.engraving-ico.orange');
        if (gradeElement) {
          currentGrade = gradeElement.value;
        }
      }
      
      // 현재 등급의 인덱스 찾기
      const currentGradeIndex = gradeOrder.indexOf(currentGrade);
      
      // 현재 등급에서 현재 레벨 이후의 모든 레벨 스캔
      const currentMaxLevel = gradeMaxLevels[currentGrade];
      for (let level = currentLevel + 1; level <= currentMaxLevel; level++) {
        scanCount++;
      }
      
      // 다음 등급부터 모든 등급 스캔
      for (let gradeIndex = currentGradeIndex + 1; gradeIndex < gradeOrder.length; gradeIndex++) {
        const grade = gradeOrder[gradeIndex];
        const maxLevel = gradeMaxLevels[grade];
        for (let level = 0; level <= maxLevel; level++) {
          scanCount++;
        }
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
    
    // 모든 각인 등급 요소 찾기
    const allEngravingGradeElements = document.querySelectorAll('select.relic-ico.engraving-ico.orange');
    
    // 각 등급별 최대 레벨 정의
    const gradeMaxLevels = {
      '영웅': 3,
      '전설': 3,
      '유물': 4
    };
    
    // 등급 순서 정의
    const gradeOrder = ['영웅', '전설', '유물'];
    
    // orange 클래스를 가진 요소만 스캔
    for (let i = 0; i < elements.engravingLevelElements.length; i++) {
      const levelElement = elements.engravingLevelElements[i];
      
      // orange 클래스가 있는 각인 레벨 요소만 스캔
      if (levelElement.classList.contains('orange')) {
        const currentLevel = parseInt(levelElement.value);
        
        // 각인 이름 요소 참조
        const nameElement = elements.engravingNameElements[i];
        const currentName = nameElement ? nameElement.value : '알 수 없음';
        
        // 현재 등급 가져오기
        let currentGrade = '유물'; // 기본값
        let gradeElement = null;
        
        // 각 레벨 요소에 대응하는 등급 요소 찾기
        // 요소의 부모 .engraving-box를 기준으로 매칭
        const parentBox = levelElement.closest('.engraving-box');
        if (parentBox) {
          gradeElement = parentBox.querySelector('select.relic-ico.engraving-ico.orange');
          if (gradeElement) {
            currentGrade = gradeElement.value;
          }
        }
        
        // 현재 등급의 인덱스 찾기
        const currentGradeIndex = gradeOrder.indexOf(currentGrade);
        
        // 현재 등급에서 현재 레벨 이후의 모든 레벨 스캔
        const currentMaxLevel = gradeMaxLevels[currentGrade];
        for (let level = currentLevel + 1; level <= currentMaxLevel; level++) {
          if (!BaseScanner.state.isScanning) return;
          
          // 레벨 변경 및 변동 확인
          const result = await BaseScanner.changeValueAndCheckDifference(levelElement, level.toString());
          
          // 결과 저장
          BaseScanner.state.scanResults[`engraving-${currentGrade}-${i}-${level}`] = {
            type: '각인',
            grade: currentGrade,
            index: i,
            item: `${currentGrade} ${currentName} Lv.${level}`,
            from: `${currentGrade} ${currentName} Lv.${currentLevel}`,
            to: `${currentGrade} ${currentName} Lv.${level}`,
            score: result.score,
            difference: result.difference
          };
          
          BaseScanner.updateScanProgress();
        }
        
        // 다음 등급부터 모든 등급과 레벨 스캔
        for (let gradeIndex = currentGradeIndex + 1; gradeIndex < gradeOrder.length; gradeIndex++) {
          const nextGrade = gradeOrder[gradeIndex];
          const maxLevel = gradeMaxLevels[nextGrade];
          
          if (!BaseScanner.state.isScanning) return;
          
          // 등급 변경
          if (gradeElement) {
            await BaseScanner.changeValueAndCheckDifference(gradeElement, nextGrade);
          }
          
          // 해당 등급의 모든 레벨 스캔
          for (let level = 0; level <= maxLevel; level++) {
            if (!BaseScanner.state.isScanning) return;
            
            // 레벨 변경 및 변동 확인
            const result = await BaseScanner.changeValueAndCheckDifference(levelElement, level.toString());
            
            // 결과 저장
            BaseScanner.state.scanResults[`engraving-${nextGrade}-${i}-${level}`] = {
              type: '각인',
              grade: nextGrade,
              index: i,
              item: `${nextGrade} ${currentName} Lv.${level}`,
              from: `${currentGrade} ${currentName} Lv.${currentLevel}`,
              to: `${nextGrade} ${currentName} Lv.${level}`,
              score: result.score,
              difference: result.difference
            };
            
            BaseScanner.updateScanProgress();
          }
        }
        
        // 원래 값으로 복원
        if (gradeElement) {
          await BaseScanner.changeValueAndCheckDifference(gradeElement, currentGrade);
        }
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
