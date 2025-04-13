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
    if (!elements || !elements.engravingNameElements || !elements.engravingLevelElements ||
        elements.engravingNameElements.length === 0 || elements.engravingLevelElements.length === 0) {
      return scanCount;
    }
    
    // 현재 값들 저장
    if (elements.engravingNameElements) {
      elements.engravingNameElements.forEach((element, index) => {
        BaseScanner.state.originalValues[`engraving-name-${index}`] = element.value;
      });
    }
    
    if (elements.engravingLevelElements) {
      elements.engravingLevelElements.forEach((element, index) => {
        BaseScanner.state.originalValues[`engraving-level-${index}`] = element.value;
      });
    }
    
    // 스캔 항목 계산
    // 1. 각인 이름 스캔
    if (elements.engravingNameElements) {
      elements.engravingNameElements.forEach((element, index) => {
        let filteredNames = [];
        
        // 사용자 지정 각인만 스캔하거나 모든 각인 스캔
        if (engravingOptions.engravingNames && engravingOptions.engravingNames.length > 0) {
          // 이미 선택된 각인 이름들 (중복 방지)
          const selectedNames = Array.from(elements.engravingNameElements)
            .map(el => el.value)
            .filter(name => name !== '없음');
          
          // 지정된 각인 중 아직 선택되지 않은 것만 필터링
          filteredNames = engravingOptions.engravingNames.filter(name => 
            !selectedNames.includes(name) || name === element.value
          );
        } else {
          // 모든 유효한 각인 이름 (중복 방지 없이)
          filteredNames = Array.from(element.options)
            .filter(option => option.value !== '없음' && !option.value.includes('무효'))
            .map(option => option.value);
        }
        
        // 특정 조합만 스캔
        if (engravingOptions.specificCombinations && engravingOptions.specificCombinations.length > 0) {
          const uniqueNames = new Set(engravingOptions.specificCombinations.map(combo => combo.name));
          filteredNames = [...uniqueNames];
        }
        
        // 각인 이름 변경 + 레벨 스캔 포함
        filteredNames.forEach(name => {
          if (name === element.value) {
            // 이미 선택된 각인이면 레벨만 계산
            const levelElement = elements.engravingLevelElements[index];
            const currentLevel = parseInt(levelElement.value);
            const maxLevel = Math.min(
              parseInt(levelElement.getAttribute('data-max') || '4'),
              engravingOptions.maxLevel || 3
            );
            
            // 현재 레벨보다 높은 레벨만 스캔
            for (let level = currentLevel + 1; level <= maxLevel; level++) {
              // 특정 조합만 스캔 시 필터링
              if (engravingOptions.specificCombinations && engravingOptions.specificCombinations.length > 0) {
                const hasCombo = engravingOptions.specificCombinations.some(combo => 
                  combo.name === name && combo.level === level
                );
                if (hasCombo) scanCount++;
              } else {
                scanCount++;
              }
            }
          } else {
            // 새로운 각인이면 모든 유효 레벨 계산
            const levelElement = elements.engravingLevelElements[index];
            const maxLevel = Math.min(
              parseInt(levelElement.getAttribute('data-max') || '4'),
              engravingOptions.maxLevel || 3
            );
            
            // 레벨 1부터 최대 레벨까지 스캔
            for (let level = 1; level <= maxLevel; level++) {
              // 특정 조합만 스캔 시 필터링
              if (engravingOptions.specificCombinations && engravingOptions.specificCombinations.length > 0) {
                const hasCombo = engravingOptions.specificCombinations.some(combo => 
                  combo.name === name && combo.level === level
                );
                if (hasCombo) scanCount++;
              } else {
                scanCount++;
              }
            }
          }
        });
      });
    }
    
    return scanCount;
  }
  
  /**
   * 각인 스캔 실행
   * @param {Object} elements - 각인 요소들 모음 객체
   */
  async function scanEngravings(elements) {
    if (!elements.engravingNameElements || !elements.engravingLevelElements) return;
    
    // 각 각인 슬롯 스캔
    for (let i = 0; i < elements.engravingNameElements.length; i++) {
      const nameElement = elements.engravingNameElements[i];
      const levelElement = elements.engravingLevelElements[i];
      const currentName = nameElement.value;
      const currentLevel = parseInt(levelElement.value);
      
      // 필터링된 각인 이름 목록
      let filteredNames = [];
      
      // 사용자 지정 각인만 스캔하거나 모든 각인 스캔
      if (engravingOptions.engravingNames && engravingOptions.engravingNames.length > 0) {
        // 이미 선택된 각인 이름들 (중복 방지)
        const selectedNames = Array.from(elements.engravingNameElements)
          .map(el => el.value)
          .filter(name => name !== '없음');
        
        // 지정된 각인 중 아직 선택되지 않은 것만 필터링
        filteredNames = engravingOptions.engravingNames.filter(name => 
          !selectedNames.includes(name) || name === currentName
        );
      } else {
        // 모든 유효한 각인 이름 (중복 방지 없이)
        filteredNames = Array.from(nameElement.options)
          .filter(option => option.value !== '없음' && !option.value.includes('무효'))
          .map(option => option.value);
      }
      
      // 특정 조합만 스캔
      if (engravingOptions.specificCombinations && engravingOptions.specificCombinations.length > 0) {
        const uniqueNames = new Set(engravingOptions.specificCombinations.map(combo => combo.name));
        filteredNames = [...uniqueNames];
      }
      
      // 각 각인 이름에 대한 스캔
      for (const name of filteredNames) {
        if (!BaseScanner.state.isScanning) return;
        
        // 이름이 같으면 레벨만 변경, 다르면 이름도 변경
        if (name !== currentName) {
          // 각인 이름 변경
          await BaseScanner.changeValueAndCheckDifference(nameElement, name);
        }
        
        // 최대 레벨 결정
        const maxLevel = Math.min(
          parseInt(levelElement.getAttribute('data-max') || '4'),
          engravingOptions.maxLevel || 3
        );
        
        // 레벨 스캔 시작 포인트 (현재 이름이 동일하면 현재 레벨+1, 아니면 1부터)
        const startLevel = name === currentName ? currentLevel + 1 : 1;
        
        // 각 레벨 스캔
        for (let level = startLevel; level <= maxLevel; level++) {
          if (!BaseScanner.state.isScanning) return;
          
          // 특정 조합만 스캔 시 필터링
          if (engravingOptions.specificCombinations && engravingOptions.specificCombinations.length > 0) {
            const hasCombo = engravingOptions.specificCombinations.some(combo => 
              combo.name === name && combo.level === level
            );
            if (!hasCombo) continue;
          }
          
          // 레벨 변경 및 변동 확인
          const result = await BaseScanner.changeValueAndCheckDifference(levelElement, level.toString());
          
          // 결과 저장
          BaseScanner.state.scanResults[`engraving-${i}-${name}-${level}`] = {
            type: '각인',
            index: i,
            item: `${name} Lv.${level}`,
            from: currentName === name ? `${name} Lv.${currentLevel}` : `${currentName} Lv.${currentLevel}`,
            to: `${name} Lv.${level}`,
            score: result.score,
            difference: result.difference
          };
          
          BaseScanner.updateScanProgress();
        }
        
        // 원래 이름이 아닌 경우 원래 이름으로 복원
        if (name !== currentName) {
          await BaseScanner.changeValueAndCheckDifference(nameElement, currentName);
        }
      }
      
      // 원래 레벨로 복원
      await BaseScanner.changeValueAndCheckDifference(levelElement, currentLevel.toString());
    }
  }
  
  // 공개 API
  return {
    setEngravingOptions,
    prepareEngravingScan,
    scanEngravings
  };
})();
