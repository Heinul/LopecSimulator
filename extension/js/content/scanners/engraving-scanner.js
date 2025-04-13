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
  
  // 등급별 클래스 및 최대 레벨
  const gradeInfo = {
    // 영웅 등급 (rare, hero-ico)
    hero: {
      classes: ['hero-ico', 'orange'],
      maxLevel: 3
    },
    // 전설 등급 (legendary, legend-ico)
    legendary: {
      classes: ['legend-ico', 'orange'],
      maxLevel: 3
    },
    // 유물 등급 (relic, relic-ico, engraving-ico orange)
    relic: {
      classes: ['relic-ico', 'engraving-ico'],
      maxLevel: 4
    }
  };
  
  // 등급 순서 (낮은 순에서 높은 순)
  const gradeOrder = ['hero', 'legendary', 'relic'];
  
  /**
   * 요소의 등급 판별
   * @param {HTMLElement} element - 판별할 요소
   * @return {string|null} - 등급 (hero, legendary, relic) 또는 null
   */
  function determineGrade(element) {
    const classList = [...element.classList];
    
    // 각 등급별 클래스 확인
    for (const grade of gradeOrder) {
      // 해당 등급의 클래스 중 하나라도 있으면 해당 등급으로 판별
      if (gradeInfo[grade].classes.some(cls => classList.includes(cls))) {
        return grade;
      }
    }
    
    // 등급을 판별할 수 없는 경우
    console.warn('등급을 판별할 수 없는 요소:', element);
    return null;
  }
  
  /**
   * 다음 스캔 단계 계산
   * @param {string} currentGrade - 현재 등급 (hero, legendary, relic)
   * @param {number} currentLevel - 현재 레벨
   * @return {Array} - 스캔할 단계 배열 [{grade, level}, ...]
   */
  function calculateNextSteps(currentGrade, currentLevel) {
    const steps = [];
    const currentGradeIndex = gradeOrder.indexOf(currentGrade);
    
    // 현재 등급의 다음 레벨들
    for (let level = currentLevel + 1; level <= gradeInfo[currentGrade].maxLevel; level++) {
      steps.push({ grade: currentGrade, level });
    }
    
    // 다음 등급들의 모든 레벨
    for (let gradeIndex = currentGradeIndex + 1; gradeIndex < gradeOrder.length; gradeIndex++) {
      const grade = gradeOrder[gradeIndex];
      for (let level = 0; level <= gradeInfo[grade].maxLevel; level++) {
        steps.push({ grade, level });
      }
    }
    
    return steps;
  }
  
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
    
    console.log('[각인 스캐너] 스캔 준비 시작...');
    
    // 현재 값들 저장 - 모든 등급의 클래스 포함
    elements.engravingLevelElements.forEach((element, index) => {
      // 등급 판별
      const grade = determineGrade(element);
      if (grade) {
        BaseScanner.state.originalValues[`engraving-level-${index}`] = element.value;
        console.log(`[각인 스캐너] 요소 #${index} 저장: 등급=${grade}, 레벨=${element.value}`);
      }
    });
    
    // 스캔 항목 계산
    elements.engravingLevelElements.forEach((element, index) => {
      // 등급 판별
      const grade = determineGrade(element);
      if (grade) {
        const currentLevel = parseInt(element.value);
        
        // 다음 스캔 단계 계산
        const nextSteps = calculateNextSteps(grade, currentLevel);
        scanCount += nextSteps.length;
        
        console.log(`[각인 스캐너] 요소 #${index}: ${grade} Lv.${currentLevel} → ${nextSteps.length}개 단계 스캔 예정`);
      }
    });
    
    console.log(`[각인 스캐너] 준비 완료: 총 ${scanCount}개 항목 스캔 예정`);
    return scanCount;
  }
  
  /**
   * 각인 스캔 실행
   * @param {Object} elements - 각인 요소들 모음 객체
   */
  async function scanEngravings(elements) {
    if (!elements || !elements.engravingLevelElements) return;
    
    console.log('[각인 스캐너] 스캔 시작...');
    
    // 모든 등급의 요소 스캔
    for (let i = 0; i < elements.engravingLevelElements.length; i++) {
      const levelElement = elements.engravingLevelElements[i];
      
      // 등급 판별
      const grade = determineGrade(levelElement);
      if (!grade) continue;
      
      const currentLevel = parseInt(levelElement.value);
      
      // 각인 이름 요소 참조
      const nameElement = elements.engravingNameElements[i];
      const currentName = nameElement ? nameElement.value : '알 수 없음';
      
      console.log(`[각인 스캐너] 스캔 중: ${currentName}, 현재 ${grade} Lv.${currentLevel}`);
      
      // 다음 스캔 단계 계산
      const nextSteps = calculateNextSteps(grade, currentLevel);
      
      for (const step of nextSteps) {
        if (!BaseScanner.state.isScanning) return;
        
        // 현재 등급의 더 높은 레벨
        if (step.grade === grade) {
          console.log(`[각인 스캐너] 테스트: ${currentName} ${grade} Lv.${currentLevel} → ${grade} Lv.${step.level}`);
          
          // 레벨 변경 및 변동 확인
          const result = await BaseScanner.changeValueAndCheckDifference(levelElement, step.level.toString());
          
          // 결과 저장
          BaseScanner.state.scanResults[`engraving-${i}-${grade}-${step.level}`] = {
            type: '각인',
            index: i,
            item: `${currentName} (${grade}) Lv.${step.level}`,
            from: `${currentName} (${grade}) Lv.${currentLevel}`,
            to: `${currentName} (${grade}) Lv.${step.level}`,
            score: result.score,
            difference: result.difference
          };
          
          console.log(`[각인 스캐너] 결과: ${currentName} ${grade} Lv.${step.level}, 점수 변화: ${result.difference}`);
          
          BaseScanner.updateScanProgress();
        }
        // 다음 등급 (등급 변경 필요)
        else {
          // 현재는 다음 등급으로의 변환 방법을 모르므로 로그만 출력
          console.log(`[각인 스캐너] 등급 변경 필요: ${currentName} ${grade} Lv.${currentLevel} → ${step.grade} Lv.${step.level} (미구현)`);
          
          // 임시로 더미 결과 저장
          BaseScanner.state.scanResults[`engraving-${i}-${step.grade}-${step.level}`] = {
            type: '각인',
            index: i,
            item: `${currentName} (${step.grade}) Lv.${step.level}`,
            from: `${currentName} (${grade}) Lv.${currentLevel}`,
            to: `${currentName} (${step.grade}) Lv.${step.level}`,
            score: 0,
            difference: 0,
            note: '등급 변경 스캔은 현재 지원되지 않습니다.'
          };
          
          BaseScanner.updateScanProgress();
        }
      }
      
      // 원래 레벨로 복원
      await BaseScanner.changeValueAndCheckDifference(levelElement, currentLevel.toString());
    }
    
    console.log('[각인 스캐너] 스캔 완료');
  }
  
  // 공개 API
  return {
    setEngravingOptions,
    prepareEngravingScan,
    scanEngravings
  };
})();