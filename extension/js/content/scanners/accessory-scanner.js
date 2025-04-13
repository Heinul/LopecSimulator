/**
 * 로펙 시뮬레이터 점수 분석기 - 장신구 스캐너 모듈
 * 장신구 관련 콤보박스를 스캔하는 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 장신구 스캐너 모듈
LopecScanner.Scanners.AccessoryScanner = (function() {
  // 기본 스캐너 참조
  const BaseScanner = LopecScanner.Scanners.BaseScanner;
  
  // 장신구 옵션 설정 - 사용자가 코드에서 지정할 수 있는 옵션들
  let accessoryOptions = {
    // 목걸이 옵션 (예시: 치명타 피해, 공격력 등 특정 옵션만 스캔)
    necklaceOptions: [], 
    // 귀걸이 옵션 (예시: 치명타 적중률, 공격력 등 특정 옵션만 스캔)
    earringOptions: [],
    // 반지 옵션 (예시: 적에게 주는 피해, 무기 공격력 등 특정 옵션만 스캔)
    ringOptions: [],
    // 팔찌 옵션 (예시: 적에게 주는 피해, 치명타 적중률 등 특정 옵션만 스캔)
    bangleOptions: []
  };
  
  /**
   * 장신구 옵션 설정
   * @param {Object} options - 장신구 스캐닝 옵션
   */
  function setAccessoryOptions(options) {
    accessoryOptions = {...accessoryOptions, ...options};
  }
  
  /**
   * 특정 장신구 타입에 대한 옵션 필터링
   * @param {Array} options - 사용자 지정 옵션 배열
   * @param {HTMLElement} selectElement - select 엘리먼트
   * @return {Array} - 필터링된 옵션 값 배열
   */
  function filterAccessoryOptions(options, selectElement) {
    if (!options || options.length === 0) {
      // 옵션이 지정되지 않았으면 모든 옵션을 반환 (첫 번째 disabled 제외)
      return Array.from(selectElement.options)
        .filter(option => !option.disabled && option.value !== '하:value:0')
        .map(option => option.value);
    }
    
    // 사용자 지정 옵션만 필터링
    return Array.from(selectElement.options)
      .filter(option => {
        if (option.disabled || option.value === '하:value:0') return false;
        
        // 옵션 텍스트에 지정된 키워드가 포함되어 있는지 확인
        return options.some(keyword => 
          option.textContent.includes(keyword) || 
          option.value.includes(keyword)
        );
      })
      .map(option => option.value);
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
        BaseScanner.state.originalValues[`accessory-option-${index}`] = element.value;
      });
    }
    
    if (elements.bangleStatElements) {
      elements.bangleStatElements.forEach((element, index) => {
        BaseScanner.state.originalValues[`bangle-stat-${index}`] = element.value;
        const inputElement = element.nextElementSibling;
        if (inputElement && inputElement.tagName === 'INPUT') {
          BaseScanner.state.originalValues[`bangle-stat-value-${index}`] = inputElement.value;
        }
      });
    }
    
    if (elements.bangleOptionElements) {
      elements.bangleOptionElements.forEach((element, index) => {
        BaseScanner.state.originalValues[`bangle-option-${index}`] = element.value;
      });
    }
    
    // 총 스캔 항목 계산
    // 1. 티어 옵션 스캔 (예: T3고대, T4유물 등)
    if (elements.tierElements) {
      elements.tierElements.forEach(element => {
        // 현재 티어보다 높은 옵션만 스캔
        const options = Array.from(element.options);
        const currentIndex = options.findIndex(opt => opt.value === element.value);
        scanCount += options.length - (currentIndex + 1);
      });
    }
    
    // 2. 장신구 옵션 스캔 (각 장신구별 특수 옵션)
    if (elements.optionElements) {
      elements.optionElements.forEach((element, index) => {
        // 장신구 타입 구분 (class나 data 속성으로 타입 구분 필요)
        let accessoryType = 'default';
        const parentLi = element.closest('li.accessory-item');
        if (parentLi) {
          const img = parentLi.querySelector('img');
          if (img) {
            const src = img.src.toLowerCase();
            if (src.includes('acc_215')) {
              accessoryType = 'necklace'; // 목걸이
            } else if (src.includes('acc_11')) {
              accessoryType = 'earring'; // 귀걸이
            } else if (src.includes('acc_22')) {
              accessoryType = 'ring'; // 반지
            }
          }
        }
        
        // 타입별 옵션 필터링
        let filteredOptions = [];
        switch (accessoryType) {
          case 'necklace':
            filteredOptions = filterAccessoryOptions(accessoryOptions.necklaceOptions, element);
            break;
          case 'earring':
            filteredOptions = filterAccessoryOptions(accessoryOptions.earringOptions, element);
            break;
          case 'ring':
            filteredOptions = filterAccessoryOptions(accessoryOptions.ringOptions, element);
            break;
          default:
            filteredOptions = filterAccessoryOptions([], element);
        }
        
        scanCount += filteredOptions.length;
      });
    }
    
    // 3. 팔찌 스캔
    if (elements.bangleStatElements) {
      // 스텟 옵션 (치명, 특화, 신속 등)
      elements.bangleStatElements.forEach(element => {
        const options = Array.from(element.options).filter(opt => 
          !opt.disabled && opt.value !== 'none' && opt.value !== element.value
        );
        scanCount += options.length;
      });
    }
    
    if (elements.bangleOptionElements) {
      // 팔찌 특수 옵션
      elements.bangleOptionElements.forEach(element => {
        const filteredOptions = filterAccessoryOptions(accessoryOptions.bangleOptions, element);
        scanCount += filteredOptions.length;
      });
    }
    
    return scanCount;
  }
  
  /**
   * 장신구 스캔 실행
   * @param {Object} elements - 장신구 요소들 모음 객체
   */
  async function scanAccessories(elements) {
    // 1. 티어 스캔 (T3 고대, T4 유물 등)
    if (elements.tierElements) {
      for (let i = 0; i < elements.tierElements.length; i++) {
        const element = elements.tierElements[i];
        const currentValue = element.value;
        const options = Array.from(element.options);
        const currentIndex = options.findIndex(opt => opt.value === currentValue);
        
        // 장신구 아이템 요소 참조
        const parentItem = element.closest('.accessory-item');
        
        // 현재 티어보다 높은 티어만 스캔
        for (let j = currentIndex + 1; j < options.length; j++) {
          if (!BaseScanner.state.isScanning) return;
          
          const newValue = options[j].value;
          const result = await BaseScanner.changeValueAndCheckDifference(element, newValue);
          
          // 결과 저장
          BaseScanner.state.scanResults[`accessory-tier-${i}-${newValue}`] = {
            type: '장신구 티어',
            index: i,
            item: parentItem ? (parentItem.querySelector('img')?.alt || `장신구 ${i+1}`) : `장신구 ${i+1}`,
            from: currentValue,
            to: newValue,
            score: result.score,
            difference: result.difference
          };
          
          BaseScanner.updateScanProgress();
        }
        
        // 원래 값으로 복원
        await BaseScanner.changeValueAndCheckDifference(element, BaseScanner.state.originalValues[`accessory-tier-${i}`]);
      }
    }
    
    // 2. 장신구 옵션 스캔
    if (elements.optionElements) {
      for (let i = 0; i < elements.optionElements.length; i++) {
        const element = elements.optionElements[i];
        const currentValue = element.value;
        
        // 장신구 타입 구분
        let accessoryType = 'default';
        const parentLi = element.closest('li.accessory-item');
        if (parentLi) {
          const img = parentLi.querySelector('img');
          if (img) {
            const src = img.src.toLowerCase();
            if (src.includes('acc_215')) {
              accessoryType = 'necklace'; // 목걸이
            } else if (src.includes('acc_11')) {
              accessoryType = 'earring'; // 귀걸이
            } else if (src.includes('acc_22')) {
              accessoryType = 'ring'; // 반지
            }
          }
        }
        
        // 타입별 옵션 필터링
        let filteredOptions = [];
        let optionType = '장신구 옵션';
        
        switch (accessoryType) {
          case 'necklace':
            filteredOptions = filterAccessoryOptions(accessoryOptions.necklaceOptions, element);
            optionType = '목걸이 옵션';
            break;
          case 'earring':
            filteredOptions = filterAccessoryOptions(accessoryOptions.earringOptions, element);
            optionType = '귀걸이 옵션';
            break;
          case 'ring':
            filteredOptions = filterAccessoryOptions(accessoryOptions.ringOptions, element);
            optionType = '반지 옵션';
            break;
          default:
            filteredOptions = filterAccessoryOptions([], element);
        }
        
        // 각 옵션 스캔
        for (const newValue of filteredOptions) {
          if (!BaseScanner.state.isScanning) return;
          if (newValue === currentValue) continue;
          
          const result = await BaseScanner.changeValueAndCheckDifference(element, newValue);
          
          // 옵션 텍스트 구하기 (실제 보여지는 텍스트)
          let optionText = '';
          for (let j = 0; j < element.options.length; j++) {
            if (element.options[j].value === newValue) {
              optionText = element.options[j].textContent;
              break;
            }
          }
          
          // 결과 저장
          BaseScanner.state.scanResults[`accessory-option-${i}-${newValue}`] = {
            type: optionType,
            index: i,
            item: parentLi ? `${parentLi.querySelector('img')?.alt || `장신구 ${i+1}`} - ${optionText}` : `장신구 ${i+1} - ${optionText}`,
            from: currentValue,
            to: newValue,
            score: result.score,
            difference: result.difference
          };
          
          BaseScanner.updateScanProgress();
        }
        
        // 원래 값으로 복원
        await BaseScanner.changeValueAndCheckDifference(element, BaseScanner.state.originalValues[`accessory-option-${i}`]);
      }
    }
    
    // 3. 팔찌 스캔
    // 3.1 팔찌 스텟 옵션 스캔 (치명, 특화, 신속 등)
    if (elements.bangleStatElements) {
      for (let i = 0; i < elements.bangleStatElements.length; i++) {
        const element = elements.bangleStatElements[i];
        const currentValue = element.value;
        
        // 스텟 옵션만 스캔
        const options = Array.from(element.options).filter(opt => 
          !opt.disabled && opt.value !== 'none' && opt.value !== currentValue
        );
        
        for (const option of options) {
          if (!BaseScanner.state.isScanning) return;
          
          const newValue = option.value;
          const result = await BaseScanner.changeValueAndCheckDifference(element, newValue);
          
          // 결과 저장
          BaseScanner.state.scanResults[`bangle-stat-${i}-${newValue}`] = {
            type: '팔찌 스텟',
            index: i,
            item: `팔찌 - ${option.textContent}`,
            from: currentValue,
            to: newValue,
            score: result.score,
            difference: result.difference
          };
          
          BaseScanner.updateScanProgress();
        }
        
        // 원래 값으로 복원
        await BaseScanner.changeValueAndCheckDifference(element, BaseScanner.state.originalValues[`bangle-stat-${i}`]);
      }
    }
    
    // 3.2 팔찌 특수 옵션 스캔
    if (elements.bangleOptionElements) {
      for (let i = 0; i < elements.bangleOptionElements.length; i++) {
        const element = elements.bangleOptionElements[i];
        const currentValue = element.value;
        
        // 팔찌 옵션 필터링
        const filteredOptions = filterAccessoryOptions(accessoryOptions.bangleOptions, element);
        
        for (const newValue of filteredOptions) {
          if (!BaseScanner.state.isScanning) return;
          if (newValue === currentValue) continue;
          
          const result = await BaseScanner.changeValueAndCheckDifference(element, newValue);
          
          // 옵션 텍스트 구하기
          let optionText = '';
          for (let j = 0; j < element.options.length; j++) {
            if (element.options[j].value === newValue) {
              optionText = element.options[j].textContent;
              break;
            }
          }
          
          // 결과 저장
          BaseScanner.state.scanResults[`bangle-option-${i}-${newValue}`] = {
            type: '팔찌 옵션',
            index: i,
            item: `팔찌 - ${optionText}`,
            from: currentValue,
            to: newValue,
            score: result.score,
            difference: result.difference
          };
          
          BaseScanner.updateScanProgress();
        }
        
        // 원래 값으로 복원
        await BaseScanner.changeValueAndCheckDifference(element, BaseScanner.state.originalValues[`bangle-option-${i}`]);
      }
    }
  }
  
  // 공개 API
  return {
    setAccessoryOptions,
    prepareAccessoryScan,
    scanAccessories
  };
})();
