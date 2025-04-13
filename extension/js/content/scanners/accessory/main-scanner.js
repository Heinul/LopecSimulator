/**
 * 로펙 시뮬레이터 점수 분석기 - 장신구 스캐너 모듈
 * 장신구 스캔 프로세스의 중앙 제어 역할
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};
window.LopecScanner.Scanners.Accessory = window.LopecScanner.Scanners.Accessory || {};

// 장신구 스캐너 모듈
LopecScanner.Scanners.Accessory.AccessoryScanner = (function() {
  // 모듈 참조
  const BaseScanner = LopecScanner.Scanners.BaseScanner;
  const Options = LopecScanner.Scanners.Accessory.Options;
  const Detector = LopecScanner.Scanners.Accessory.Detector;
  const Manipulator = LopecScanner.Scanners.Accessory.Manipulator;
  
  /**
   * 장신구 옵션 설정
   * @param {Object} options - 장신구 스캐닝 옵션
   */
  function setAccessoryOptions(options) {
    Options.setAccessoryOptions(options);
  }
  
  /**
   * 장신구 스캔 준비
   * @param {Object} elements - 장신구 요소들 모음 객체
   * @return {number} - 스캔 항목 개수
   */
  function prepareAccessoryScan(elements) {
    let scanCount = 0;
    
    // 현재 값들 저장
    if (elements.tierElements) {
      elements.tierElements.forEach((element, index) => {
        BaseScanner.state.originalValues[`accessory-tier-${index}`] = element.value;
      });
    }
    
    if (elements.qualityElements) {
      elements.qualityElements.forEach((element, index) => {
        const numberBox = element.closest('.number-box');
        if (numberBox) {
          const inputElement = numberBox.querySelector('.progress');
          if (inputElement) {
            BaseScanner.state.originalValues[`accessory-quality-${index}`] = inputElement.value;
          }
        }
      });
    }
    
    if (elements.optionElements) {
      elements.optionElements.forEach((element, index) => {
        // 기본 값 저장
        BaseScanner.state.originalValues[`accessory-option-${index}`] = element.value;
        
        // 옵션 텍스트도 저장
        const selectedOption = element.options[element.selectedIndex];
        const selectedText = selectedOption ? selectedOption.textContent : '';
        BaseScanner.state.originalValues[`accessory-option-text-${index}`] = selectedText;
      });
    }
    
    // 장신구 초기값 보존 상태 로그
    console.log('장신구 초기값 저장 완료');
    
    // 장신구 옵션 스캔 (장신구 옵션 조합 방식으로 변경)
    if (elements.optionElements) {
      // 장신구 타입 별로 옵션 그룹화
      let accessoryGroups = Detector.groupAccessoriesByType(elements.optionElements);
      
      // 각 장신구 타입별 옵션 조합 가져오기
      for (const [type, group] of Object.entries(accessoryGroups)) {
        if (group.elements.length > 0) {
          // 타입별 옵션 조합 가져오기
          const combinations = Options.getAccessoryCombinations(type);
          
          // 옵션 조합마다 스캔 추가 (조합 스캔만 활성화)
          if (combinations && combinations.length > 0) {
            scanCount += combinations.length; // 장신구 타입별 조합 개수만큼 스캔 항목 추가
          }
        }
      }
    }
    
    return scanCount;
  }
  
  /**
   * 장신구 스캔 실행
   * @param {Object} elements - 장신구 요소들 모음 객체
   */
  async function scanAccessories(elements) {
    // 장신구 옵션 스캔 (조합 방식으로 수정)
    if (elements.optionElements) {
      // 장신구 타입별로 요소들 그룹화
      let accessoryGroups = Detector.groupAccessoriesByType(elements.optionElements);
      
      // 현재 선택된 모든 장신구 옵션 가져오기 - 스캔 전 값 기록
      const currentSelectedOptions = Detector.getSelectedAccessoryOptions();
      
      // 각 장신구 타입별로 옵션 조합 스캔 실행
      await scanAccessoryByType('necklace', accessoryGroups.necklace, currentSelectedOptions);
      await scanAccessoryByType('earring', accessoryGroups.earring, currentSelectedOptions);
      await scanAccessoryByType('ring', accessoryGroups.ring, currentSelectedOptions);
    }
  }
  
  /**
   * 특정 타입의 장신구 스캔 실행
   * @param {string} type - 장신구 타입 (necklace, earring, ring)
   * @param {Object} group - 장신구 그룹 정보
   * @param {Array} currentSelectedOptions - 현재 선택된 옵션 정보
   */
  async function scanAccessoryByType(type, group, currentSelectedOptions) {
    if (group.elements.length <= 0 || !BaseScanner.state.isScanning) return;
    
    // 현재 타입의 장신구 옵션 참조 가져오기
    const currentTypeOptions = currentSelectedOptions.filter(option => option.type === type);
    
    // 원래 선택된 옵션 텍스트 가져오기
    const originalOptionTexts = currentTypeOptions.map(option => {
      return `[${option.grade}] ${option.selectedText}`;
    });
    
    // 타입별 옵션 조합 가져오기
    const combinations = Options.getAccessoryCombinations(type);
    
    // 원래 값을 배열로 저장 (elements마다 원래 값 저장)
    const originalElements = group.elements.map((element, idx) => {
      return {
        element: element,
        originalValue: element.value,
        originalIndex: group.indices[idx]
      };
    });
    
    // 각 옵션 조합마다 스캔 수행
    for (const combo of combinations) {
      if (!BaseScanner.state.isScanning) return;
      
      // 각 요소에 옵션 적용 (조합의 모든 옵션을 한번에 적용)
      const originalValues = [];
      
      // 원래 값 저장
      for (let i = 0; i < originalElements.length; i++) {
        originalValues.push(originalElements[i].element.value);
      }
      
      let changed = false;
      
      // 특별 옵션 변경 전략 - 목걸이에 특수 처리
      if (type === 'necklace') {
        // 강력한 이벤트 트리거 - 여러번 시도
        for (let attempt = 0; attempt < 3; attempt++) {
          let allApplied = true;
          
          // 모든 옵션에 대해 처리
          for (let i = 0; i < Math.min(combo.options.length, originalElements.length); i++) {
            const currentElement = originalElements[i].element;
            
            // 값이 다른 경우만 변경
            if (currentElement.value !== combo.options[i]) {
              // 강제 변경 시도
              const changeSuccess = await Manipulator.forceNecklaceOptionChange(
                currentElement, 
                combo.options[i], 
                attempt
              );
              
              if (!changeSuccess) {
                allApplied = false;
              } else {
                changed = true;
              }
            }
          }
          
          // 모든 값이 적용되었으면 중단
          if (allApplied) {
            break;
          }
          
          // 다음 시도 전 딜레이
          await LopecScanner.Utils.delay(300);
        }
        
        // 목걸이는 추가 딜레이 필요
        await LopecScanner.Utils.delay(1000);
      } else {
        // 목걸이가 아닌 경우 일반적인 변경
        for (let i = 0; i < Math.min(combo.options.length, originalElements.length); i++) {
          const currentElement = originalElements[i].element;
          
          // 값 변경 시도
          const changeResult = await Manipulator.changeAccessoryOption(
            currentElement, 
            combo.options[i], 
            type
          );
          
          if (changeResult) changed = true;
        }
        
        // 변경이 있으면 이벤트를 처리할 시간을 제공
        if (changed) {
          await LopecScanner.Utils.delay(400);
        }
      }
      
      // 변경 적용 후 점수 측정
      const currentScore = LopecScanner.Utils.getCurrentScore();
      let difference = LopecScanner.Utils.getCurrentDifference();
      
      // 변동값이 매우 작은 경우, 더 상세히 확인
      if (Math.abs(difference) < 0.02 && changed) {
        // 추가 확인 처리
        difference = await Manipulator.checkScoreDifferenceForAccessory(
          type, 
          originalValues, 
          combo.options, 
          originalElements
        );
      }
      
      // 현재 적용된 옵션들의 레이블 가져오기
      const appliedOptions = [];
      for (let i = 0; i < Math.min(combo.options.length, originalElements.length); i++) {
        const currentElement = originalElements[i].element;
        // 옵션 텍스트 구하기
        let optionText = '';
        for (let j = 0; j < currentElement.options.length; j++) {
          if (currentElement.options[j].value === combo.options[i]) {
            optionText = currentElement.options[j].textContent;
            break;
          }
        }
        
        // 상/중/하 등급 정보 추가
        const qualitySpan = currentElement.closest('.grinding-wrap')?.querySelector('.quality');
        const grade = qualitySpan ? qualitySpan.textContent : '';
        appliedOptions.push(`[${grade}] ${optionText}`);
      }
      
      // 결과 저장 (조합별로 하나의 결과)
      const parentItem = originalElements[0].element.closest('li.accessory-item');
      const itemName = parentItem ? (parentItem.querySelector('img')?.alt || `${type}`) : type;
      
      BaseScanner.state.scanResults[`accessory-combo-${type}-${combo.label}`] = {
        type: `${type === 'necklace' ? '목걸이' : type === 'earring' ? '귀걸이' : '반지'} 옵션 조합`,
        combo: combo.label,
        item: `${itemName} - ${combo.label} (${appliedOptions.join(', ')})`,
        from: `원래 옵션: ${originalOptionTexts.join(', ')}`,
        to: `${combo.label} 조합: ${appliedOptions.join(', ')}`,
        score: currentScore,
        difference: difference
      };
      
      BaseScanner.updateScanProgress();
      
      // 원래 값으로 복원
      await restoreOriginalValues(type, originalElements, originalValues);
    }
  }
  
  /**
   * 원래 값으로 복원
   * @param {string} type - 장신구 타입
   * @param {Array} originalElements - 원래 요소 정보
   * @param {Array} originalValues - 원래 값
   */
  async function restoreOriginalValues(type, originalElements, originalValues) {
    // 목걸이인 경우 특별 복원 로직
    if (type === 'necklace') {
      // 목걸이 옵션을 더 확실하게 복원하기 위한 추가 작업
      for (let attempt = 0; attempt < 3; attempt++) {
        let allReverted = true;
        
        for (let i = 0; i < originalElements.length; i++) {
          if (originalElements[i].element.value !== originalValues[i]) {
            // 강제 변경으로 복원
            const restoreSuccess = await Manipulator.forceNecklaceOptionChange(
              originalElements[i].element, 
              originalValues[i], 
              attempt
            );
            
            if (!restoreSuccess) {
              allReverted = false;
            }
          }
        }
        
        // 모든 값이 복원되었으면 중단
        if (allReverted) {
          break;
        }
        
        // 다음 시도 전 딜레이
        await LopecScanner.Utils.delay(300);
      }
      
      // 최종 딜레이
      await LopecScanner.Utils.delay(800);
    } else {
      // 각 요소마다 개별적으로 복원 및 이벤트 발생
      let changed = false;
      
      for (let i = 0; i < originalElements.length; i++) {
        if (originalElements[i].element.value !== originalValues[i]) {
          originalElements[i].element.value = originalValues[i];
          const event = new Event('change', { bubbles: true });
          originalElements[i].element.dispatchEvent(event);
          changed = true;
          
          // 각 요소 복원 후 짧은 딜레이
          await LopecScanner.Utils.delay(50);
        }
      }
      
      // 변경이 있었다면 모든 복원이 적용될 시간을 충분히 제공
      if (changed) {
        await LopecScanner.Utils.delay(300);
      }
    }
  }
  
  // 공개 API
  return {
    setAccessoryOptions,
    prepareAccessoryScan,
    scanAccessories,
    getSelectedAccessoryOptions: Detector.getSelectedAccessoryOptions
  };
})();