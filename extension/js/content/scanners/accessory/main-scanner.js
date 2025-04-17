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
    
    // 직업 타입 감지
    const jobType = Detector.detectJobType(); // 'SUPPORTER' 또는 'DEALER'
    console.log(`직업 타입 감지된 상태: ${jobType}`);
    
    // 직업 타입 저장 (추후 참조를 위해)
    BaseScanner.state.jobType = jobType;
    
    // 현재 값들 저장
    if (elements.tierElements) {
      try {
        elements.tierElements.forEach((element, index) => {
          if (element && element.value) {
            BaseScanner.state.originalValues[`accessory-tier-${index}`] = element.value;
          }
        });
      } catch (e) {
        console.error('장신구 tier 요소 저장 오류:', e);
      }
    }
    
    if (elements.qualityElements) {
      try {
        elements.qualityElements.forEach((element, index) => {
          if (element) {
            const numberBox = element.closest('.number-box');
            if (numberBox) {
              const inputElement = numberBox.querySelector('.progress');
              if (inputElement && inputElement.value) {
                BaseScanner.state.originalValues[`accessory-quality-${index}`] = inputElement.value;
              }
            }
          }
        });
      } catch (e) {
        console.error('장신구 quality 요소 저장 오류:', e);
      }
    }
    
    if (elements.optionElements) {
      try {
        elements.optionElements.forEach((element, index) => {
          if (element && element.value) {
            // 기본 값 저장
            BaseScanner.state.originalValues[`accessory-option-${index}`] = element.value;
            
            // 옵션 텍스트도 저장
            if (element.options && typeof element.selectedIndex !== 'undefined') {
              const selectedOption = element.options[element.selectedIndex];
              const selectedText = selectedOption ? selectedOption.textContent : '';
              BaseScanner.state.originalValues[`accessory-option-text-${index}`] = selectedText;
            }
          }
        });
      } catch (e) {
        console.error('장신구 옵션 요소 저장 오류:', e);
      }
    }
    
    // 장신구 초기값 보존 상태 로그
    console.log('장신구 초기값 저장 완료');
    
    // 장신구 조합 개수 계산
    // 장신구 조합.txt 파일에 따른 16개의 조합(상상, 상중, 중상, ..., 무무)
    const combinationsPerType = 16;
    
    // 목걸이, 귀걸이1, 귀걸이2, 반지1, 반지2 총 5가지 타입
    scanCount = 5 * combinationsPerType; // 총 80개
    
    return scanCount;
  }
  
  /**
   * 장신구 스캔 실행
   * @param {Object} elements - 장신구 요소들 모음 객체
   */
  async function scanAccessories(elements) {
    // 직업 타입 확인 (초기화 시 저장한 값 그대로 사용)
    const jobType = BaseScanner.state.jobType || Detector.detectJobType();
    console.log(`장신구 스캔 실행 - 직업 타입: ${jobType}`);
    
    // 장신구 옵션 스캔 (조합 방식으로 수정)
    if (elements.optionElements && elements.optionElements.length > 0) {
      try {
        // 장신구 타입별로 요소들 그룹화
        let accessoryGroups = Detector.groupAccessoriesByType(elements.optionElements);
        
        // 현재 선택된 모든 장신구 옵션 가져오기 - 스캔 전 값 기록
        let currentSelectedOptions = [];
        try {
          currentSelectedOptions = Detector.getSelectedAccessoryOptions() || [];
        } catch (e) {
          console.error('장신구 옵션 정보 가져오기 오류:', e);
          currentSelectedOptions = [];
        }
        
        // 직업 타입에 따른 옵션 리스트 사용
        // 상상, 상중, 상하, 중중, 중하, 하하, 상무, 무상, 중무, 무중, 하무, 무하, 무무 조합 방식으로 사용
        console.log(`${jobType} 리스트 사용하여 스캔 실행`);
        
        // 각 장신구 타입별로 옵션 조합 스캔 실행 (5개 전부 개별 스캔)
        if (accessoryGroups.necklace && accessoryGroups.necklace.elements && accessoryGroups.necklace.elements.length > 0) {
          await scanAccessoryByType('necklace', accessoryGroups.necklace, currentSelectedOptions, jobType);
        } else {
          console.log('목걸이 요소가 없어 건너뛰기');
          // 목걸이 스캔 건너뛰 시 진행률 반영
          for (let i = 0; i < 16; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
        // 귀걸이1 스캔
        if (accessoryGroups.earring1 && accessoryGroups.earring1.elements && accessoryGroups.earring1.elements.length > 0) {
          await scanAccessoryByType('earring1', accessoryGroups.earring1, currentSelectedOptions, jobType);
        } else {
          console.log('귀걸이1 요소가 없어 건너뛰기');
          // 귀걸이1 스캔 건너뛰 시 진행률 반영
          for (let i = 0; i < 16; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
        // 귀걸이2 스캔
        if (accessoryGroups.earring2 && accessoryGroups.earring2.elements && accessoryGroups.earring2.elements.length > 0) {
          await scanAccessoryByType('earring2', accessoryGroups.earring2, currentSelectedOptions, jobType);
        } else {
          console.log('귀걸이2 요소가 없어 건너뛰기');
          // 귀걸이2 스캔 건너뛰 시 진행률 반영
          for (let i = 0; i < 16; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
        // 반지1 스캔
        if (accessoryGroups.ring1 && accessoryGroups.ring1.elements && accessoryGroups.ring1.elements.length > 0) {
          await scanAccessoryByType('ring1', accessoryGroups.ring1, currentSelectedOptions, jobType);
        } else {
          console.log('반지1 요소가 없어 건너뛰기');
          // 반지1 스캔 건너뛰 시 진행률 반영
          for (let i = 0; i < 16; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
        // 반지2 스캔
        if (accessoryGroups.ring2 && accessoryGroups.ring2.elements && accessoryGroups.ring2.elements.length > 0) {
          await scanAccessoryByType('ring2', accessoryGroups.ring2, currentSelectedOptions, jobType);
        } else {
          console.log('반지2 요소가 없어 건너뛰기');
          // 반지2 스캔 건너뛰 시 진행률 반영
          for (let i = 0; i < 16; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
      } catch (e) {
        console.error('장신구 스캔 중 오류 발생:', e);
        // 오류 발생 시 남은 스캔 처리
        for (let i = 0; i < 80; i++) { // 5개 장신구 타입 * 16개 조합
          BaseScanner.updateScanProgress();
        }
      }
    } else {
      console.log('장신구 옵션 요소가 없어 건너뛰기');
      // 장신구 스캔 건너뛰 시 진행률 반영
      for (let i = 0; i < 80; i++) { // 5개 장신구 타입 * 16개 조합
        BaseScanner.updateScanProgress();
      }
    }
  }
  
  /**
   * 특정 타입의 장신구 스캔 실행
   * @param {string} type - 장신구 타입 (necklace, earring1, earring2, ring1, ring2)
   * @param {Object} group - 장신구 그룹 정보
   * @param {Array} currentSelectedOptions - 현재 선택된 옵션 정보
   * @param {string} jobType - 직업 타입 ('DEALER' 또는 'SUPPORTER')
   */
  async function scanAccessoryByType(type, group, currentSelectedOptions, jobType = 'DEALER') {
    // 그룹이 유효하고 스캔중이면 실행
    if (!group || !group.elements || group.elements.length <= 0 || !BaseScanner.state.isScanning) {
      console.log(`${type} 장신구 스캔 실행 실패: 그룹 요소가 없거나 스캔이 중지되었습니다.`);
      return;
    }
    
    try {
      // 현재 타입의 장신구 옵션 참조 가져오기
      const currentTypeOptions = Array.isArray(currentSelectedOptions) ? 
        currentSelectedOptions.filter(option => option && option.type === type) : [];
      
      // 원래 선택된 옵션 텍스트 가져오기
      const originalOptionTexts = currentTypeOptions.map(option => {
        if (option && option.grade && option.selectedText) {
          return `[${option.grade}] ${option.selectedText}`;
        }
        return '';
      }).filter(text => text !== '');
      
      // 장신구 타입 변환 (necklace -> NECKLACE)
      const accessoryTypeUppercase = type.toUpperCase();
    
    // 직업 타입과 장신구 타입에 맞는 옵션 가져오기
    // 상상, 상중, 상하, 중중, 중하, 하하, 상무, 무상, 중무, 무중, 하무, 무하, 무무 조합 생성
    let qualityCombinations = [];
    try {
      qualityCombinations = Options.getAccessoryCombinations(type, jobType) || [];
    } catch (e) {
      console.error(`${type} 옵션 조합 가져오기 오류:`, e);
      qualityCombinations = [];
    }
    
    // 화면에 표시할 때 사용하는 타입 이름
    let typeDisplayName;
    if (type === 'necklace') {
      typeDisplayName = '목걸이';
    } else if (type === 'earring1') {
      typeDisplayName = '귀걸이1';
    } else if (type === 'earring2') {
      typeDisplayName = '귀걸이2';
    } else if (type === 'ring1') {
      typeDisplayName = '반지1';
    } else if (type === 'ring2') {
      typeDisplayName = '반지2';
    } else {
      typeDisplayName = '장신구';
    }
    
    // 원래 장신구 옵션의 점수 계산 (상=3, 중=2, 하=1, 무=0)
    let currentOptionsScore = 0;
    originalOptionTexts.forEach(optText => {
      if (optText.includes('[상]')) {
        currentOptionsScore += 3;
      } else if (optText.includes('[중]')) {
        currentOptionsScore += 2;
      } else if (optText.includes('[하]')) {
        currentOptionsScore += 1;
      }
      // '무' 인 경우는 0점
    });
    
    console.log(`현재 ${type} 장신구 옵션 점수: ${currentOptionsScore}`);
    
    
    // 옵션 가져오기 에러 처리
    if (!qualityCombinations || qualityCombinations.length === 0) {
      console.error(`${jobType} 직업의 ${type} 옵션 조합을 생성할 수 없습니다.`);
      
      // 스캔 완료로 처리 (전체 16개 조합)
      for (let i = 0; i < 16; i++) {
        BaseScanner.updateScanProgress();
      }
      return;
    }
    
    // 각 개별 옵션 조합들의 점수 계산하고 정렬 (점수 높은 순)
    for (const combo of qualityCombinations) {
      // 조합 점수 계산
      let comboScore = 0;
      combo.options.forEach(option => {
        // 상/중/하/무 등급 확인
        if (option.startsWith('상:')) {
          comboScore += 3;
        } else if (option.startsWith('중:')) {
          comboScore += 2;
        } else if (option.startsWith('하:')) {
          comboScore += 1;
        }
        // 무 시 점수 추가 없음
      });
      
      // 점수 저장
      combo.score = comboScore;
    }
    
    // 점수순으로 정렬
    qualityCombinations.sort((a, b) => b.score - a.score);
    
    // 현재 점수보다 높거나 같은 조합만 스캔하도록 필터링
    const betterCombinations = qualityCombinations.filter(combo => combo.score >= currentOptionsScore);
    
    console.log(`현재 점수(${currentOptionsScore}) 이상의 조합만 스캔: ${betterCombinations.length}개 / 전체 ${qualityCombinations.length}개`);
    
    // 원래 값을 배열로 저장 (elements마다 원래 값 저장)
    const originalElements = [];
    try {
      for (let i = 0; i < group.elements.length; i++) {
        if (group.elements[i] && typeof group.indices[i] !== 'undefined') {
          originalElements.push({
            element: group.elements[i],
            originalValue: group.elements[i].value,
            originalIndex: group.indices[i]
          });
        }
      }
    } catch (e) {
      console.error('원래 요소 정보 저장 오류:', e);
    }
    
    // 추후 복원을 위해 원래 값 보관
    const originalValues = [];
    originalElements.forEach(item => {
      if (item && item.element) {
        originalValues.push(item.element.value);
      }
    });
    
    // 각 옵션 조합마다 스캔 수행 (현재 점수보다 높은 조합만 스캔)
    for (const combo of betterCombinations) {
      if (!BaseScanner.state.isScanning) {
        console.log('스캔이 중지되었습니다.');
        // 스캔 중지시 원래 값으로 복원
        await restoreOriginalValues(type, originalElements, originalValues);
        return;
      }
      
      try {
        console.log(`스캔 실행 - ${combo.label}, 옵션: ${JSON.stringify(combo.options)}`);
        
        let changed = false;
        
        // 모든 장신구에 대해 동일한 방식 적용
        for (let i = 0; i < Math.min(combo.options.length, originalElements.length); i++) {
          if (!originalElements[i] || !originalElements[i].element) continue;
          
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
          await LopecScanner.Utils.delay(500); // 모든 장신구에 동일한 딜레이 적용
        }
        
        // 변경 적용 후 점수 측정
        const currentScore = LopecScanner.Utils.getCurrentScore();
        let difference = LopecScanner.Utils.getCurrentDifference();
        
        // 변동값이 매우 작은 경우, 더 상세히 확인
        if (Math.abs(difference) < 0.02 && changed) {
          // 추가 확인 처리
          try {
            difference = await Manipulator.checkScoreDifferenceForAccessory(
              type, 
              originalValues, 
              combo.options, 
              originalElements
            );
          } catch (e) {
            console.error('점수 변동 확인 중 오류:', e);
            difference = 0;
          }
        }
        
        // 현재 적용된 옵션들의 레이블 가져오기
        const appliedOptions = [];
        for (let i = 0; i < Math.min(combo.options.length, originalElements.length); i++) {
          if (!originalElements[i] || !originalElements[i].element) continue;
          
          const currentElement = originalElements[i].element;
          // 옵션 텍스트 구하기
          let optionText = '';
          if (currentElement.options) {
            for (let j = 0; j < currentElement.options.length; j++) {
              if (currentElement.options[j].value === combo.options[i]) {
                optionText = currentElement.options[j].textContent;
                break;
              }
            }
          }
          
          // 상/중/하 등급 정보 추가
          let grade = '';
          try {
            const qualitySpan = currentElement.closest('.grinding-wrap')?.querySelector('.quality');
            grade = qualitySpan ? qualitySpan.textContent : '';
          } catch (e) {
            console.error('등급 정보 가져오기 오류:', e);
            grade = '';
          }
          
          if (grade && optionText) {
            appliedOptions.push(`[${grade}] ${optionText}`);
          } else if (optionText) {
            appliedOptions.push(optionText);
          }
          
          // 옵션 텍스트 확인
          console.log(`옵션 ${i+1} 적용: ${currentElement.value} -> ${optionText} (등급: ${grade})`);
        }
        
        // 결과 저장 (조합별로 하나의 결과)
        const resultKey = `accessory-combo-${jobType}-${type}-${combo.label}`;
        
        // 사용자가 보기 쉽게 조합 설명 추가
        let comboDescription = combo.label;
        // 옵션 값이 있는 경우에만 추가
        if (appliedOptions.length > 0 && appliedOptions.every(opt => opt.includes('[') && opt.includes(']'))) {
          comboDescription += ` (${appliedOptions.join(', ')})`;
        } else {
          // 옵션 값이 없는 경우 기본 설명 사용
          comboDescription += ` (옵션 정보 없음, 상/중/하/무 조합)`;
        }
        
        // 원래 옵션과 신규 옵션 분리 - 최대 3개만 저장
        const maxOptionsToShow = 3;
        const originalOptionsFormatted = originalOptionTexts.slice(0, maxOptionsToShow).join(', ') || '원본 옵션 없음';
        const appliedOptionsFormatted = appliedOptions.slice(0, maxOptionsToShow).join(', ') || '적용된 옵션 없음';
        
        // 결과 저장
        try {
          let parentItem;
          let itemName = type;
          
          if (originalElements[0] && originalElements[0].element) {
            parentItem = originalElements[0].element.closest('li.accessory-item');
            if (parentItem) {
              const imgElement = parentItem.querySelector('img');
              if (imgElement && imgElement.alt) {
                itemName = imgElement.alt;
              }
            }
          }
          
          BaseScanner.state.scanResults[resultKey] = {
            type: `${typeDisplayName} 옵션 조합 (${jobType === 'DEALER' ? '딜러' : '서포터'})`,
            combo: combo.label,
            item: `${itemName}`,
            from: `원래 옵션: ${originalOptionsFormatted}`,
            to: `${combo.label} 조합: ${appliedOptionsFormatted}`,
            accessoryType: type,           // 장신구 타입 추가
            originalOptions: originalOptionTexts.slice(0, maxOptionsToShow),  // 원래 옵션 배열
            appliedOptions: appliedOptions.slice(0, maxOptionsToShow),       // 적용된 옵션 배열
            score: currentScore,
            difference: difference
          };
        } catch (e) {
          console.error('결과 저장 중 오류:', e);
        }
        
        BaseScanner.updateScanProgress();
      } catch (e) {
        console.error(`${type} 장신구 조합 ${combo.label} 스캔 중 오류:`, e);
        BaseScanner.updateScanProgress(); // 오류 발생해도 진행률 업데이트
      }
    }
    
    // 스캔하지 않는 조합들에 대해서도 진행률 업데이트
    const skippedCombinations = qualityCombinations.filter(combo => combo.score < currentOptionsScore);
    console.log(`점수가 낮아서 건너뛰는 조합: ${skippedCombinations.length}개`);
    
    for (let i = 0; i < skippedCombinations.length; i++) {
      BaseScanner.updateScanProgress();
    }
    
    // 모든 조합 스캔 후 원래 값으로 만 복원
    await restoreOriginalValues(type, originalElements, originalValues);
    
  } catch (e) {
    console.error(`${type} 장신구 스캔 전체 처리 오류:`, e);
    
    // 남은 스캔 처리 - 모든 조합에 대해 진행률 업데이트
    for (let i = 0; i < 16; i++) {
      BaseScanner.updateScanProgress();
    }
  }
  }
  
  /**
   * 원래 값으로 복원
   * @param {string} type - 장신구 타입
   * @param {Array} originalElements - 원래 요소 정보
   * @param {Array} originalValues - 원래 값
   */
  async function restoreOriginalValues(type, originalElements, originalValues) {
    try {
      // 각 요소마다 개별적으로 복원 및 이벤트 발생
      let changed = false;
      
      for (let i = 0; i < originalElements.length; i++) {
        if (!originalElements[i] || !originalElements[i].element) continue;
        
        if (originalElements[i].element.value !== originalValues[i]) {
          try {
            originalElements[i].element.value = originalValues[i];
            const event = new Event('change', { bubbles: true });
            originalElements[i].element.dispatchEvent(event);
            changed = true;
            
            // 각 요소 복원 후 짧은 딜레이
            await LopecScanner.Utils.delay(50);
          } catch (e) {
            console.error(`복원 중 오류 (${type}, 요소 ${i}):`, e);
          }
        }
      }
      
      // 변경이 있었다면 모든 복원이 적용될 시간을 충분히 제공
      if (changed) {
        await LopecScanner.Utils.delay(300); // 모든 장신구에 동일한 딜레이 적용
      }
    } catch (e) {
      console.error(`원래 값으로 복원 중 오류 (${type}):`, e);
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