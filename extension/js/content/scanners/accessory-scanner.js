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
        // 기본 값 저장
        BaseScanner.state.originalValues[`accessory-option-${index}`] = element.value;
        
        // 옵션 텍스트도 저장
        const selectedOption = element.options[element.selectedIndex];
        const selectedText = selectedOption ? selectedOption.textContent : '';
        BaseScanner.state.originalValues[`accessory-option-text-${index}`] = selectedText;
        
        // 장신구 타입 식별
        let accessoryType = 'unknown';
        const parentLi = element.closest('li.accessory-item');
        if (parentLi) {
          const img = parentLi.querySelector('img');
          if (img) {
            const src = img.src.toLowerCase();
            if (src.includes('acc_215')) {
              accessoryType = '목걸이';
            } else if (src.includes('acc_11')) {
              accessoryType = '귀걸이';
            } else if (src.includes('acc_22')) {
              accessoryType = '반지';
            }
          }
        }
        
        // 등급 확인
        const grindingWrap = element.closest('.grinding-wrap');
        const qualitySpan = grindingWrap ? grindingWrap.querySelector('.quality') : null;
        const grade = qualitySpan ? qualitySpan.textContent : '';
        
        // 디버깅용 로그 출력
        console.log(`장신구 옵션 초기값 [${index}]: ${accessoryType} - ${grade} - ${selectedText} (${element.value})`);
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
      
      // 현재 선택된 모든 장신구 옵션 가져오기
      const currentSelectedOptions = getSelectedAccessoryOptions();
      
      // 각 장신구 타입별로 옵션 조합 스캔 실행
      for (const [type, group] of Object.entries(accessoryGroups)) {
        // 각 타입별로 1개 또는 2개의 요소가 있을 수 있음
        if (group.elements.length <= 0) continue;
        
        // 현재 타입의 장신구 옵션 참조 가져오기
        const currentTypeOptions = currentSelectedOptions.filter(option => option.type === type);
        
        // 원래 선택된 옵션 텍스트 가져오기
        const originalOptionTexts = currentTypeOptions.map(option => {
          return `[${option.grade}] ${option.selectedText}`;
        });
        
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
            
            // 상/중/하 등급 정보 추가
            const qualitySpan = group.elements[i].closest('.grinding-wrap')?.querySelector('.quality');
            const grade = qualitySpan ? qualitySpan.textContent : '';
            appliedOptions.push(`[${grade}] ${optionText}`);
          }
          
          // 결과 저장 (조합별로 하나의 결과)
          const parentItem = group.elements[0].closest('li.accessory-item');
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
          console.log(`장신구 옵션 복원: ${type} - ${combo.label}`);
          for (let i = 0; i < group.elements.length; i++) {
            if (originalValues[i] !== group.elements[i].value) {
              console.log(`레그 ${i} 복원: ${group.elements[i].value} => ${originalValues[i]}`);
              try {
                await BaseScanner.changeValueAndCheckDifference(group.elements[i], originalValues[i]);
              } catch (e) {
                console.error(`장신구 옵션 복원 실패: ${e.message}`);
              }
            }
          }
        }
      }
    }
    
    // 3. 팔찌 스캔은 스킵합니다.
    // 사용자 요구사항에 따라 팔찌 스캔은 제외
  }
  
  /**
   * 현재 선택된 장신구 옵션을 가져오는 함수
   * @return {Array} 선택된 옵션 정보 배열
   */
  function getSelectedAccessoryOptions() {
    // 장신구 종류 순서
    const accessoryTypes = ['necklace', 'earring', 'earring', 'ring', 'ring'];
    
    // 모든 장신구 아이템(li) 요소 찾기
    const accessoryItems = document.querySelectorAll('.accessory-item.accessory');
    console.log(`총 ${accessoryItems.length}개의 장신구 아이템 발견`);
    
    // 반환할 결과 배열
    const result = [];
    
    // 각 장신구 아이템에서 선택 요소와 옵션 찾기
    accessoryItems.forEach((item, index) => {
      // 장신구 타입 확인
      const typeIndex = index < accessoryTypes.length ? index : 0;
      const accessoryType = accessoryTypes[typeIndex];
      
      // 장신구 이미지 확인
      const img = item.querySelector('img');
      const imgSrc = img ? img.src : 'no-image';
      console.log(`장신구 ${index+1}: ${accessoryType} - 이미지 ${imgSrc}`);
      
      // 모든 option select 요소 찾기
      const optionSelects = item.querySelectorAll('.option.tooltip-text');
      console.log(`${index+1}번 장신구에서 ${optionSelects.length}개의 옵션 select 발견`);
      
      // 각 선택 요소에서 값 찾기
      optionSelects.forEach((select, selectIndex) => {
        // 현재 선택된 옵션
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption) {
          console.log(`${index+1}번 장신구 옵션 ${selectIndex+1}: 선택된 옵션 없음`);
          return;
        }
        
        // 장신구 등급 (상/중/하)
        const grindingWrap = select.closest('.grinding-wrap');
        const qualitySpan = grindingWrap ? grindingWrap.querySelector('.quality') : null;
        const grade = qualitySpan ? qualitySpan.textContent : '알 수 없음';
        
        // 결과에 추가
        result.push({
          item: index + 1,              // 장신구 번호
          optionIndex: selectIndex + 1, // 장신구 옵션 번호
          type: accessoryType,          // 장신구 타입
          grade,                        // 장신구 등급
          selectedValue: select.value,  // 선택된 값
          selectedText: selectedOption.textContent // 선택된 텍스트
        });
        
        // 상세 로그 출력
        console.log(`${index+1}번 장신구 [${accessoryType}] 옵션 ${selectIndex+1}: [${grade}] ${selectedOption.textContent} (${select.value})`);
      });
      
      // 티어 옵션 정보 추가
      const tierSelect = item.querySelector('select.tier.accessory');
      if (tierSelect) {
        const selectedTier = tierSelect.options[tierSelect.selectedIndex];
        console.log(`${index+1}번 장신구 티어: ${selectedTier ? selectedTier.textContent : '없음'} (${tierSelect.value})`);
      }
    });
    
    // 모든 옵션 select 요소 추가 확인
    const allOptionSelects = document.querySelectorAll('.accessory-item .option.tooltip-text');
    console.log(`전체 마크업에서 발견된 전체 장신구 옵션 select: ${allOptionSelects.length}개`);
    
    // 더 자세한 HTML 확인을 위한 코드
    console.log('장신구 영역 HTML 구조:');
    const accessoryArea = document.querySelector('.accessory-area');
    if (accessoryArea) {
      console.log(accessoryArea.innerHTML.substring(0, 500) + '... (중략)');
    } else {
      console.log('장신구 영역(.accessory-area)를 찾을 수 없습니다.');
    }
    
    return result;
  }
  
  // 공개 API
  return {
    setAccessoryOptions,
    prepareAccessoryScan,
    scanAccessories,
    getSelectedAccessoryOptions
  };
})();
