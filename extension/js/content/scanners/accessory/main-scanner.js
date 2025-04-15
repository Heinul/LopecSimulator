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
    
    // 장신구 조합 개수 계산
    // 장신구 조합.txt 파일에 따른 16개의 조합(상상, 상중, 중상, ..., 무무)
    const combinationsPerType = 16;
    
    // 목걸이, 귀걸이, 반지 총 3가지 타입
    scanCount = 3 * combinationsPerType; // 총 48개
    
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
    if (elements.optionElements) {
      // 장신구 타입별로 요소들 그룹화
      let accessoryGroups = Detector.groupAccessoriesByType(elements.optionElements);
      
      // 현재 선택된 모든 장신구 옵션 가져오기 - 스캔 전 값 기록
      const currentSelectedOptions = Detector.getSelectedAccessoryOptions();
      
      // 직업 타입에 따른 옵션 리스트 사용
      // 상상, 상중, 상하, 중중, 중하, 하하, 상무, 무상, 중무, 무중, 하무, 무하, 무무 조합 방식으로 사용
      console.log(`${jobType} 리스트 사용하여 스캔 실행`);
      
      // 각 장신구 타입별로 옵션 조합 스캔 실행
      await scanAccessoryByType('necklace', accessoryGroups.necklace, currentSelectedOptions, jobType);
      await scanAccessoryByType('earring', accessoryGroups.earring, currentSelectedOptions, jobType);
      await scanAccessoryByType('ring', accessoryGroups.ring, currentSelectedOptions, jobType);
    }
  }
  
  /**
   * 특정 타입의 장신구 스캔 실행
   * @param {string} type - 장신구 타입 (necklace, earring, ring)
   * @param {Object} group - 장신구 그룹 정보
   * @param {Array} currentSelectedOptions - 현재 선택된 옵션 정보
   * @param {string} jobType - 직업 타입 ('DEALER' 또는 'SUPPORTER')
   */
  async function scanAccessoryByType(type, group, currentSelectedOptions, jobType = 'DEALER') {
    if (group.elements.length <= 0 || !BaseScanner.state.isScanning) return;
    
    // 현재 타입의 장신구 옵션 참조 가져오기
    const currentTypeOptions = currentSelectedOptions.filter(option => option.type === type);
    
    // 원래 선택된 옵션 텍스트 가져오기
    const originalOptionTexts = currentTypeOptions.map(option => {
      return `[${option.grade}] ${option.selectedText}`;
    });
    
    // 장신구 타입 변환 (necklace -> NECKLACE)
    const accessoryTypeUppercase = type.toUpperCase();
    
    // 직업 타입과 장신구 타입에 맞는 옵션 가져오기
    // 상상, 상중, 상하, 중중, 중하, 하하, 상무, 무상, 중무, 무중, 하무, 무하, 무무 조합 생성
    const qualityCombinations = Options.getAccessoryCombinations(type, jobType);
    
    // 화면에 표시할 때 사용하는 타입 이름
    const typeDisplayName = type === 'necklace' ? '목걸이' : type === 'earring' ? '귀걸이' : '반지';
    
    // 옵션 가져오기 에러 처리
    if (!qualityCombinations || qualityCombinations.length === 0) {
      console.error(`${jobType} 직업의 ${type} 옵션 조합을 생성할 수 없습니다.`);
      
      // 스캔 완료로 처리 (전체 16개 조합)
      for (let i = 0; i < 16; i++) {
        BaseScanner.updateScanProgress();
      }
      return;
    }
    
    console.log(`${type} 옵션 조합 (${jobType}): ${qualityCombinations.length}개 생성됨`);
    
    // 원래 값을 배열로 저장 (elements마다 원래 값 저장)
    const originalElements = group.elements.map((element, idx) => {
      return {
        element: element,
        originalValue: element.value,
        originalIndex: group.indices[idx]
      };
    });
    
    // 각 옵션 조합마다 스캔 수행
    for (const combo of qualityCombinations) {
      if (!BaseScanner.state.isScanning) return;
      
      console.log(`스캔 실행 - ${combo.label}, 옵션: ${JSON.stringify(combo.options)}`);
      
      // 각 요소에 옵션 적용 (조합의 모든 옵션을 한번에 적용)
      const originalValues = [];
      
      // 원래 값 저장
      for (let i = 0; i < originalElements.length; i++) {
        originalValues.push(originalElements[i].element.value);
      }
      
      let changed = false;
      
      // 모든 장신구에 대해 동일한 방식 적용
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
        await LopecScanner.Utils.delay(500); // 모든 장신구에 동일한 딜레이 적용
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
        
        // 옵션 텍스트 확인
        console.log(`옵션 ${i+1} 적용: ${currentElement.value} -> ${optionText} (등급: ${grade})`);
      }
      
      // 결과 저장 (조합별로 하나의 결과)
      const parentItem = originalElements[0].element.closest('li.accessory-item');
      const itemName = parentItem ? (parentItem.querySelector('img')?.alt || `${type}`) : type;
      
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
      const originalOptionsFormatted = originalOptionTexts.slice(0, maxOptionsToShow).join(', ');
      const appliedOptionsFormatted = appliedOptions.slice(0, maxOptionsToShow).join(', ');
      
      BaseScanner.state.scanResults[`accessory-combo-${jobType}-${type}-${combo.label}`] = {
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
      await LopecScanner.Utils.delay(300); // 모든 장신구에 동일한 딜레이 적용
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