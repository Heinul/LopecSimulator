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
    // 목걸이 옵션
    necklaceOptions: {
      special: [
        // 상 등급 옵션
        '상:addDamagePer:2.6', // 추가 피해 +2.60%
        '상:finalDamagePer:1.02', // 적에게 주는 피해 +2.00%
      ],
      common: [
        // 공용 옵션
        '상:weaponAtkPlus:960', // 무기 공격력 +960
        '상:atkPlus:390', // 공격력 +390
      ]
    },
    // 귀걸이 옵션
    earringOptions: {
      special: [
        // 상 등급 옵션
        '상:weaponAtkPer:3', // 무기 공격력 +3.00%
        '상:atkPer:1.55', // 공격력 +1.55%
      ],
      common: [
        // 공용 옵션
        '상:weaponAtkPlus:960', // 무기 공격력 +960
        '상:atkPlus:390', // 공격력 +390
      ]
    },
    // 반지 옵션
    ringOptions: {
      special: [
        // 상 등급 옵션
        '상:criticalChancePer:1.55', // 치명타 적중률 +1.55%
        '상:criticalDamagePer:4', // 치명타 피해 +4.00%
      ],
      common: [
        // 공용 옵션
        '상:weaponAtkPlus:960', // 무기 공격력 +960
        '상:atkPlus:390', // 공격력 +390
      ]
    },
    // 목걸이 옵션 조합
    necklaceCombinations: [
      // 상상 조합
      {
        label: '상상-적피추피', 
        options: ['상:finalDamagePer:1.02', '상:addDamagePer:2.6'] // 적에게 주는 피해 +2.00%, 추가피해 +2.60%
      },
      // 상중 조합
      {
        label: '상중-적피추피1',
        options: ['상:finalDamagePer:1.02', '중:addDamagePer:1.6'] // 적에게 주는 피해 +2.00%, 추가피해 +1.60%
      },
      {
        label: '상중-적피추피2',
        options: ['중:finalDamagePer:1.012', '상:addDamagePer:2.6'] // 적에게 주는 피해 +1.20%, 추가피해 +2.60%
      },
      // 상하 조합
      {
        label: '상하-적피추피1',
        options: ['상:finalDamagePer:1.02', '하:addDamagePer:0.7'] // 적에게 주는 피해 +2.00%, 추가피해 +0.70%
      },
      {
        label: '상하-적피추피2',
        options: ['하:finalDamagePer:1.0055', '상:addDamagePer:2.6'] // 적에게 주는 피해 +0.55%, 추가피해 +2.60%
      },
      // 중중 조합
      {
        label: '중중-추피적피',
        options: ['중:addDamagePer:1.6', '중:finalDamagePer:1.012'] // 추가피해 +1.60%, 적에게 주는 피해 +1.20%
      },
      // 중하 조합
      {
        label: '중하-추피적피1',
        options: ['하:addDamagePer:0.7', '중:finalDamagePer:1.012'] // 추가피해 +0.70%, 적에게 주는 피해 +1.20%
      },
      {
        label: '중하-추피적피2',
        options: ['중:addDamagePer:1.6', '하:finalDamagePer:1.0055'] // 추가피해 +1.60%, 적에게 주는 피해 +0.55%
      },
      // 하하 조합
      {
        label: '하하-추피적피',
        options: ['하:addDamagePer:0.7', '하:finalDamagePer:1.0055'] // 추가피해 +0.70%, 적에게 주는 피해 +0.55%
      }
    ],
    // 귀걸이 옵션 조합
    earringCombinations: [
      // 상상 조합
      {
        label: '상상-무공공가',
        options: ['상:weaponAtkPer:3', '상:atkPer:1.55'] // 무기공격력 +3.00%, 공격력 +1.55%
      },
      // 상중 조합
      {
        label: '상중-무공공가1',
        options: ['상:weaponAtkPer:3', '중:atkPer:0.95'] // 무기공격력 +3.00%, 공격력 +0.95%
      },
      {
        label: '상중-무공공가2',
        options: ['중:weaponAtkPer:1.8', '상:atkPer:1.55'] // 무기공격력 +1.80%, 공격력 +1.55%
      },
      // 상하 조합
      {
        label: '상하-무공공가1',
        options: ['상:weaponAtkPer:3', '하:atkPer:0.4'] // 무기공격력 +3.00%, 공격력 +0.40%
      },
      {
        label: '상하-무공공가2',
        options: ['하:weaponAtkPer:0.8', '상:atkPer:1.55'] // 무기공격력 +0.80%, 공격력 +1.55%
      },
      // 중중 조합
      {
        label: '중중-공가무공',
        options: ['중:atkPer:0.95', '중:weaponAtkPer:1.8'] // 공격력 +0.95%, 무기공격력 +1.80%
      },
      // 중하 조합
      {
        label: '중하-공가무공1',
        options: ['중:atkPer:0.95', '하:weaponAtkPer:0.8'] // 공격력 +0.95%, 무기공격력 +0.80%
      },
      {
        label: '중하-공가무공2',
        options: ['하:atkPer:0.4', '중:weaponAtkPer:1.8'] // 공격력 +0.40%, 무기공격력 +1.80%
      },
      // 하하 조합
      {
        label: '하하-무공공가',
        options: ['하:weaponAtkPer:0.8', '하:atkPer:0.4'] // 무기공격력 +0.80%, 공격력 +0.40%
      }
    ],
    // 반지 옵션 조합
    ringCombinations: [
      // 상상 조합
      {
        label: '상상-치피치적',
        options: ['상:criticalDamagePer:4', '상:criticalChancePer:1.55'] // 치명타 피해 +4.00%, 치명타 적중률 +1.55%
      },
      // 상중 조합
      {
        label: '상중-치피치적1',
        options: ['상:criticalDamagePer:4', '중:criticalChancePer:0.95'] // 치명타 피해 +4.00%, 치명타 적중률 +0.95%
      },
      {
        label: '상중-치피치적2',
        options: ['중:criticalDamagePer:2.4', '상:criticalChancePer:1.55'] // 치명타 피해 +2.40%, 치명타 적중률 +1.55%
      },
      // 상하 조합
      {
        label: '상하-치피치적1',
        options: ['상:criticalDamagePer:4', '하:criticalChancePer:0.4'] // 치명타 피해 +4.00%, 치명타 적중률 +0.40%
      },
      {
        label: '상하-치피치적2',
        options: ['하:criticalDamagePer:1.1', '상:criticalChancePer:1.55'] // 치명타 피해 +1.10%, 치명타 적중률 +1.55%
      },
      // 중중 조합
      {
        label: '중중-치적치피',
        options: ['중:criticalChancePer:0.95', '중:criticalDamagePer:2.4'] // 치명타 적중률 +0.95%, 치명타 피해 +2.40%
      },
      // 중하 조합
      {
        label: '중하-치적치피1',
        options: ['중:criticalChancePer:0.95', '하:criticalDamagePer:1.1'] // 치명타 적중률 +0.95%, 치명타 피해 +1.10%
      },
      {
        label: '중하-치적치피2',
        options: ['하:criticalChancePer:0.4', '중:criticalDamagePer:2.4'] // 치명타 적중률 +0.40%, 치명타 피해 +2.40%
      },
      // 하하 조합
      {
        label: '하하-치피치적',
        options: ['하:criticalDamagePer:1.1', '하:criticalChancePer:0.4'] // 치명타 피해 +1.10%, 치명타 적중률 +0.40%
      }
    ]
  };
  
  /**
   * 장신구 옵션 설정
   * @param {Object} options - 장신구 스캐닝 옵션
   */
  function setAccessoryOptions(options) {
    accessoryOptions = {...accessoryOptions, ...options};
  }
  
  /**
   * 특정 장신구 타입에 대한 옵션 값 목록 가져오기
   * @param {string} accessoryType - 장신구 타입 (necklace, earring, ring) 
   * @return {Array} - 해당 타입에 따른 옵션 값 목록
   */
  function getAccessoryOptions(accessoryType) {
    let options = [];
    
    switch (accessoryType) {
      case 'necklace':
        // 각 장신구 타입별 옵션 값만 반환
        if (accessoryOptions.necklaceOptions) {
          // 특수 옵션과 공통 옵션 모두 추가
          if (accessoryOptions.necklaceOptions.special) {
            options.push(...accessoryOptions.necklaceOptions.special);
          }
          if (accessoryOptions.necklaceOptions.common) {
            options.push(...accessoryOptions.necklaceOptions.common);
          }
        }
        break;
      case 'earring':
        if (accessoryOptions.earringOptions) {
          if (accessoryOptions.earringOptions.special) {
            options.push(...accessoryOptions.earringOptions.special);
          }
          if (accessoryOptions.earringOptions.common) {
            options.push(...accessoryOptions.earringOptions.common);
          }
        }
        break;
      case 'ring':
        if (accessoryOptions.ringOptions) {
          if (accessoryOptions.ringOptions.special) {
            options.push(...accessoryOptions.ringOptions.special);
          }
          if (accessoryOptions.ringOptions.common) {
            options.push(...accessoryOptions.ringOptions.common);
          }
        }
        break;
    }
    
    return options;
  }
  
  /**
   * 특정 장신구 타입에 대한 옵션 조합 목록 가져오기
   * @param {string} accessoryType - 장신구 타입 (necklace, earring, ring)
   * @return {Array} - 해당 타입에 따른 옵션 조합 목록
   */
  function getAccessoryCombinations(accessoryType) {
    switch (accessoryType) {
      case 'necklace':
        return accessoryOptions.necklaceCombinations || [];
      case 'earring':
        return accessoryOptions.earringCombinations || [];
      case 'ring':
        return accessoryOptions.ringCombinations || [];
      default:
        return [];
    }
  }
  
  /**
   * 특정 장신구 타입에 대한 옵션 필터링
   * @param {HTMLElement} selectElement - select 엘리먼트
   * @param {string} accessoryType - 장신구 타입 (necklace, earring, ring)
   * @return {Array} - 필터링된 옵션 값 배열
   */
  function filterAccessoryOptions(selectElement, accessoryType) {
    // 옵션 가져오기
    const allowedValues = getAccessoryOptions(accessoryType);
    
    if (!allowedValues || allowedValues.length === 0) {
      // 옵션이 지정되지 않았으면 모든 옵션을 반환 (첫 번째 disabled 제외)
      return Array.from(selectElement.options)
        .filter(option => !option.disabled && option.value !== '하:value:0')
        .map(option => option.value);
    }
    
    // 지정된 옵션값만 필터링
    return Array.from(selectElement.options)
      .filter(option => {
        if (option.disabled || option.value === '하:value:0') return false;
        
        // 지정된 옵션 값(정확히 일치)이 있는지 확인
        return allowedValues.includes(option.value);
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
    
    // 2. 장신구 옵션 스캔 (장신구 옵션 조합 방식으로 변경)
    if (elements.optionElements) {
      // 장신구 타입 별로 옵션 그룹화
      let accessoryGroups = {
        necklace: { elements: [], indices: [] },
        earring: { elements: [], indices: [] },
        ring: { elements: [], indices: [] }
      };
      
      // 타입별로 요소 분류
      elements.optionElements.forEach((element, index) => {
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
        
        if (accessoryType !== 'default') {
          accessoryGroups[accessoryType].elements.push(element);
          accessoryGroups[accessoryType].indices.push(index);
        }
      });
      
      // 각 장신구 타입별 옵션 조합 가져오기
      for (const [type, group] of Object.entries(accessoryGroups)) {
        if (group.elements.length > 0) {
          // 타입별 옵션 조합 가져오기
          const combinations = getAccessoryCombinations(type);
          
          // 옵션 조합마다 스캔 추가 (조합 스캔만 활성화)
          if (combinations && combinations.length > 0) {
            scanCount += combinations.length; // 장신구 타입별 조합 개수만큼 스캔 항목 추가
          }
          
          // 기본 옵션(개별 옵션) 스캔은 제외
          // 사용자의 요구사항에 따라 조합 방식으로만 스캔 진행
        }
      }
    }
    
    // 3. 팔찌 스캔은 스킵합니다.
    // 사용자 요구사항에 따라 팔찌 스캔은 제외
    
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
    
    // 2. 장신구 옵션 스캔 (조합 방식으로 수정)
    if (elements.optionElements) {
      // 장신구 타입별로 요소들 그룹화
      let accessoryGroups = {
        necklace: { elements: [], indices: [] },
        earring: { elements: [], indices: [] },
        ring: { elements: [], indices: [] }
      };
      
      // 장신구 요소들을 타입별로 분류
      for (let i = 0; i < elements.optionElements.length; i++) {
        const element = elements.optionElements[i];
        const parentLi = element.closest('li.accessory-item');
        
        if (!parentLi) continue;
        
        // 장신구 타입 식별
        let accessoryType = 'default';
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
        
        // 팔찌는 스캔하지 않음
        if (accessoryType !== 'default') {
          accessoryGroups[accessoryType].elements.push(element);
          accessoryGroups[accessoryType].indices.push(i);
        }
      }
      
      // 각 장신구 타입별로 옵션 조합 스캔 실행
      for (const [type, group] of Object.entries(accessoryGroups)) {
        // 각 타입별로 1개 또는 2개의 요소가 있을 수 있음
        if (group.elements.length <= 0) continue;
        
        // 타입별 옵션 조합 가져오기
        const combinations = getAccessoryCombinations(type);
        
        // 각 옵션 조합마다 스캔 수행
        for (const combo of combinations) {
          if (!BaseScanner.state.isScanning) return;
          
          const originalValues = group.elements.map(el => el.value);
          
          // 각 요소에 옵션 적용 (조합의 옵션 수만큼만)
          for (let i = 0; i < Math.min(combo.options.length, group.elements.length); i++) {
            if (originalValues[i] === combo.options[i]) continue; // 이미 같은 값이면 변경 불필요
            await BaseScanner.changeValueAndCheckDifference(group.elements[i], combo.options[i]);
          }
          
          // 변경 적용 후 점수 측정
          const currentScore = LopecScanner.Utils.getCurrentScore();
          const difference = LopecScanner.Utils.getCurrentDifference();
          
          // 현재 적용된 옵션들의 레이블 가져오기
          const appliedOptions = [];
          for (let i = 0; i < Math.min(combo.options.length, group.elements.length); i++) {
            // 옵션 텍스트 구하기
            let optionText = '';
            for (let j = 0; j < group.elements[i].options.length; j++) {
              if (group.elements[i].options[j].value === combo.options[i]) {
                optionText = group.elements[i].options[j].textContent;
                break;
              }
            }
            appliedOptions.push(optionText);
          }
          
          // 결과 저장 (조합별로 하나의 결과)
          const parentItem = group.elements[0].closest('li.accessory-item');
          const itemName = parentItem ? (parentItem.querySelector('img')?.alt || `${type}`) : type;
          
          BaseScanner.state.scanResults[`accessory-combo-${type}-${combo.label}`] = {
            type: `${type === 'necklace' ? '목걸이' : type === 'earring' ? '귀걸이' : '반지'} 옵션 조합`,
            combo: combo.label,
            item: `${itemName} - ${combo.label} (${appliedOptions.join(', ')})`,
            from: `원래 옵션`,
            to: `${combo.label} 조합`,
            score: currentScore,
            difference: difference
          };
          
          BaseScanner.updateScanProgress();
          
          // 원래 값으로 복원
          for (let i = 0; i < group.elements.length; i++) {
            if (originalValues[i] !== group.elements[i].value) {
              await BaseScanner.changeValueAndCheckDifference(group.elements[i], originalValues[i]);
            }
          }
        }
      }
    }
    
    // 3. 팔찌 스캔은 스킵합니다.
    // 사용자 요구사항에 따라 팔찌 스캔은 제외
  }
  
  // 공개 API
  return {
    setAccessoryOptions,
    prepareAccessoryScan,
    scanAccessories
  };
})();
