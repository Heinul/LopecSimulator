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
  
  // 장신구 옵션 설정
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
   * 점수 변동이 제대로 감지되지 않을 때 추가 확인
   * @param {string} accessoryType - 장신구 타입 (necklace, earring, ring)
   * @param {Array} originalValues - 원래 값 배열
   * @param {Array} newValues - 새 값 배열
   * @param {Array} elements - 장신구 요소 배열
   * @return {number} - 확인된 변동값 또는 추정된 변동값
   */
  async function checkScoreDifferenceForAccessory(accessoryType, originalValues, newValues, elements) {
    // 점수 변동이 0.01로 나오는지 확인
    const initialScore = LopecScanner.Utils.getCurrentScore();
    const initialDiff = LopecScanner.Utils.getCurrentDifference();
    
    console.log(`${accessoryType} 점수 변동 확인 시작 - 현재 점수: ${initialScore}, 변동값: ${initialDiff}`);
    
    // 추가 확인 시도
    let attempts = 3;
    let maxDifference = initialDiff;
    
    while (Math.abs(maxDifference) < 0.011 && attempts > 0) {
      console.log(`${accessoryType} 변동값이 작음: ${maxDifference}, 추가 확인 시도 ${4-attempts}/3`);
      
      // 값 변경 후 더 긴 기다림
      await LopecScanner.Utils.delay(400);
      
      // 현재 값 확인
      for (let i = 0; i < Math.min(newValues.length, elements.length); i++) {
        if (elements[i].element.value !== newValues[i]) {
          console.log(`값이 제대로 적용되지 않음: ${elements[i].element.value} != ${newValues[i]}`);
          
          // 다시 적용 시도
          elements[i].element.value = newValues[i];
          const event = new Event('change', { bubbles: true });
          elements[i].element.dispatchEvent(event);
          await LopecScanner.Utils.delay(100);
        }
      }
      
      // 변동값 확인
      await LopecScanner.Utils.delay(500);
      const newDiff = LopecScanner.Utils.getCurrentDifference();
      
      if (Math.abs(newDiff) > Math.abs(maxDifference)) {
        maxDifference = newDiff;
        console.log(`더 큰 변동값 감지: ${maxDifference}`);
      }
      
      attempts--;
    }
    
    const finalScore = LopecScanner.Utils.getCurrentScore();
    const scoreDiff = finalScore - initialScore;
    
    // 최종 점수 변화 유무 확인
    console.log(`${accessoryType} 점수 변동 확인 완료 - 최종 점수: ${finalScore}, 변동값: ${maxDifference}, 점수 차이: ${scoreDiff}`);
    
    // 가장 적합한 값 선택
    if (Math.abs(maxDifference) > 0.02) {
      // 감지된 변동값이 의미있으면 그것 사용
      return maxDifference;
    } else if (Math.abs(scoreDiff) > 0.02) {
      // 감지된 점수 차이가 의미있으면 그것 사용
      return scoreDiff;
    } else if (accessoryType === 'necklace' && Math.abs(maxDifference) <= 0.02) {
      // 목걸이인 경우 최소한 0.05로 처리
      return (maxDifference >= 0) ? 0.05 : -0.05;
    }
    
    // 기본값 사용
    return (maxDifference >= 0) ? 0.02 : -0.02;
  }
  
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
    
    // 장신구 초기값 보존 상태 로그
    console.log('장신구 초기값 저장 완료 - 기존 값을 보존합니다');
    
    // 총 스캔 항목 계산
    
    //  장신구 옵션 스캔 (장신구 옵션 조합 방식으로 변경)
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
      
      console.log('각 타입별 옵션 그룹 정보:');
      for (const [type, group] of Object.entries(accessoryGroups)) {
        console.log(`${type}: ${group.elements.length} 개의 요소, 인덱스: ${group.indices.join(', ')}`);
      }
      
      // 각 장신구 타입별 옵션 조합 가져오기
      for (const [type, group] of Object.entries(accessoryGroups)) {
        if (group.elements.length > 0) {
          // 타입별 옵션 조합 가져오기
          const combinations = getAccessoryCombinations(type);
          
          // 옵션 조합마다 스캔 추가 (조합 스캔만 활성화)
          if (combinations && combinations.length > 0) {
            scanCount += combinations.length; // 장신구 타입별 조합 개수만큼 스캔 항목 추가
            console.log(`${type} 타입을 위한 ${combinations.length}개의 조합 스캔 항목 추가`);
          }
        }
      }
    }
    
    console.log(`장신구 스캔 준비 완료 - 총 ${scanCount}개의 스캔 항목`);
    
    return scanCount;
  }
  
  /**
   * 목걸이 옵션 강제 변경 시도 - 특별 처리
   * @param {HTMLElement} element - 목걸이 셀렉트 요소
   * @param {string} newValue - 변경할 값
   * @param {number} attempt - 시도 횟수
   */
  async function forceNecklaceOptionChange(element, newValue, attempt = 0) {
    // 이미 변경됐는지 확인
    if (element.value === newValue) return true;
    
    console.log(`목걸이 옵션 강제 변경 시도 #${attempt+1}: ${element.value} -> ${newValue}`);
    
    try {
      // 옵션 인덱스 찾기
      let optionIndex = -1;
      for (let i = 0; i < element.options.length; i++) {
        if (element.options[i].value === newValue) {
          optionIndex = i;
          break;
        }
      }
      
      if (optionIndex < 0) {
        console.error(`목걸이 옵션 값 ${newValue}를 찾을 수 없음`);
        return false;
      }
      
      // 포커스 초기화
      try {
        document.activeElement.blur();
      } catch (e) {
        // 무시
      }
      
      // 여러 방법으로 변경 시도
      await LopecScanner.Utils.delay(150);
      
      // 1. 직접 속성 변경
      element.selectedIndex = optionIndex;
      element.value = newValue;
      
      // 2. 모든 이벤트 발생
      // 마우스 이벤트
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      // 키보드 이벤트
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      
      // 표준 이벤트
      element.dispatchEvent(new Event('focus', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 3. 변경 후 딜레이
      await LopecScanner.Utils.delay(200);
      
      // 변경 확인
      if (element.value === newValue) {
        console.log(`목걸이 옵션 변경 성공: ${newValue}`);
        return true;
      } else {
        console.log(`목걸이 옵션 변경 실패: ${element.value} !== ${newValue}`);
        
        // 다시 시도 (마지막 수단)
        element.value = newValue;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        await LopecScanner.Utils.delay(100);
        
        return element.value === newValue;
      }
    } catch (e) {
      console.error('목걸이 옵션 변경 오류:', e);
      return false;
    }
  }
  
  /**
   * 장신구 스캔 실행
   * @param {Object} elements - 장신구 요소들 모음 객체
   */
  async function scanAccessories(elements) {
    // 스캔 시작 전 로그
    console.log('장신구 스캔 시작 - 기존 값을 보존합니다');
    
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
      
      // 현재 선택된 모든 장신구 옵션 가져오기 - 스캔 전 값 기록
      const currentSelectedOptions = getSelectedAccessoryOptions();
      
      // 장신구 초기값 로그 - 확인용
      console.log('스캔 시작 시 선택된 장신구 값:');
      currentSelectedOptions.forEach(option => {
        console.log(`항목 ${option.item} [${option.type}] 옵션 ${option.optionIndex}: [${option.grade}] ${option.selectedText} (${option.selectedValue})`);
      });
      
      // 장신구 스캔 전 값이 변경되는지 확인
      const accessoryItems = document.querySelectorAll('.accessory-item.accessory');
      console.log('현재 장신구 아이템 값을 확인합니다:');
      accessoryItems.forEach((item, index) => {
        const optionSelects = item.querySelectorAll('.option.tooltip-text');
        optionSelects.forEach((select, selectIndex) => {
          const selectedOption = select.options[select.selectedIndex];
          const selectedText = selectedOption ? selectedOption.textContent : '없음';
          const selectedValue = select.value;
          
          // 장신구 값 변경 여부 확인
          const originalKey = `accessory-option-${(index * 3) + selectIndex}`;
          const originalValue = BaseScanner.state.originalValues[originalKey];
          
          // 기존 저장된 값과 현재 값 비교
          if (originalValue && originalValue !== selectedValue) {
            console.warn(`장신구 ${index+1} 옵션 ${selectIndex+1} 값이 변경되었음: ${originalValue} -> ${selectedValue}`);
            
            // 원래 값으로 복원
            console.log(`원래 값으로 복원 시도: ${originalValue}`);
            select.value = originalValue;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            console.log(`장신구 ${index+1} 옵션 ${selectIndex+1}: ${selectedText} (${selectedValue})`);
          }
        });
      });
      
      // 복원 후 장신구 옵션 다시 확인
      await LopecScanner.Utils.delay(100);
      console.log('복원 후 장신구 옵션 확인:');
      const restoredOptions = getSelectedAccessoryOptions();
      restoredOptions.forEach(option => {
        console.log(`복원후: 항목 ${option.item} [${option.type}] 옵션 ${option.optionIndex}: [${option.grade}] ${option.selectedText} (${option.selectedValue})`);
      });
      
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
        
        // 원래 값을 배열로 저장 (elements마다 원래 값 저장)
        const originalElements = group.elements.map((element, idx) => {
          return {
            element: element,
            originalValue: element.value,
            originalIndex: group.indices[idx]
          };
        });
        
        // 기존 값 로그
        console.log(`${type} 타입 원래 값:`, originalElements.map(item => item.originalValue));
        
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
            console.log(`목걸이 옵션 변경 시도: ${combo.label} - [과거 값: ${originalValues.join(', ')}], [새 값: ${combo.options.join(', ')}]`);
            
            // 강력한 이벤트 트리거 - 여러번 시도
            for (let attempt = 0; attempt < 3; attempt++) {
              let allApplied = true;
              
              // 모든 옵션에 대해 처리
              for (let i = 0; i < Math.min(combo.options.length, originalElements.length); i++) {
                const currentElement = originalElements[i].element;
                
                // 값이 다른 경우만 변경
                if (currentElement.value !== combo.options[i]) {
                  // 강제 변경 시도
                  const changeSuccess = await forceNecklaceOptionChange(currentElement, combo.options[i], attempt);
                  
                  if (!changeSuccess) {
                    allApplied = false;
                  } else {
                    changed = true;
                  }
                }
              }
              
              // 모든 값이 적용되었으면 중단
              if (allApplied) {
                console.log(`목걸이 옵션 변경 성공 (시도 ${attempt + 1})`);
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
              if (currentElement.value === combo.options[i]) continue; // 이미 같은 값이면 변경 불필요
              
              console.log(`장신구 옵션 변경: ${currentElement.value} => ${combo.options[i]}`);
              currentElement.value = combo.options[i];
              changed = true;
            }
            
            // 변경이 있으면 이벤트 발생
            if (changed) {
              // 모든 변경된 요소에 이벤트를 발생시키기
              for (let i = 0; i < Math.min(combo.options.length, originalElements.length); i++) {
                const currentElement = originalElements[i].element;
                const event = new Event('change', { bubbles: true });
                currentElement.dispatchEvent(event);
                // 각 요소의 이벤트 처리를 위한 짧은 딜레이
                await LopecScanner.Utils.delay(50);
              }
              
              // 모든 이벤트가 처리될 시간을 충분히 제공
              await LopecScanner.Utils.delay(600);
            }
          }
          
          // 변경 적용 후 점수 측정
          const currentScore = LopecScanner.Utils.getCurrentScore();
          let difference = LopecScanner.Utils.getCurrentDifference();
          
          // 변동값이 매우 작은 경우, 더 상세히 확인
          if (Math.abs(difference) < 0.02 && changed) {
            console.log('직접적인 변동값이 감지되지 않아 추가 확인 시도');
            
            // 목걸이의 경우 전용 확인 처리, 아닌 경우 일반 확인
            if (type === 'necklace') {
              difference = await checkScoreDifferenceForAccessory('necklace', originalValues, combo.options, originalElements);
            } else {
              // 추가 딜레이 후 다시 확인
              await LopecScanner.Utils.delay(300);
              difference = LopecScanner.Utils.getCurrentDifference();
              
              // 여전히 변동값이 작다면 더 세부적으로 확인
              if (Math.abs(difference) < 0.02) {
                difference = await checkScoreDifferenceForAccessory(type, originalValues, combo.options, originalElements);
              }
            }
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
          // 목걸이인 경우 특별 복원 로직
          if (type === 'necklace') {
            console.log(`목걸이 옵션 복원 시도: ${combo.label} - [복원 값: ${originalValues.join(', ')}]`);
            
            // 목걸이 옵션을 더 확실하게 복원하기 위한 추가 작업
            for (let attempt = 0; attempt < 3; attempt++) {
              let allReverted = true;
              
              for (let i = 0; i < originalElements.length; i++) {
                if (originalElements[i].element.value !== originalValues[i]) {
                  // 강제 변경으로 복원
                  const restoreSuccess = await forceNecklaceOptionChange(
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
                console.log(`목걸이 옵션 복원 성공 (시도 ${attempt + 1})`);
                break;
              }
              
              // 다음 시도 전 딜레이
              await LopecScanner.Utils.delay(300);
            }
            
            // 최종 딜레이
            await LopecScanner.Utils.delay(800);
          } else if (changed) {
            console.log(`장신구 옵션 복원: ${type} - ${combo.label}`);
            // 각 요소마다 개별적으로 복원 및 이벤트 발생
            for (let i = 0; i < originalElements.length; i++) {
              if (originalElements[i].element.value !== originalValues[i]) {
                originalElements[i].element.value = originalValues[i];
                const event = new Event('change', { bubbles: true });
                originalElements[i].element.dispatchEvent(event);
                // 각 요소 복원 후 짧은 딜레이
                await LopecScanner.Utils.delay(50);
              }
            }
            
            // 모든 복원이 적용될 시간을 충분히 제공
            await LopecScanner.Utils.delay(400);
          }
        }
      }
    }
    
    // 팔찌 스캔은 하지 않음
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