/**
 * 로펙 시뮬레이터 점수 분석기 - 장신구 옵션 모듈
 * 장신구 옵션 데이터 및 관련 기능을 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};
window.LopecScanner.Scanners.Accessory = window.LopecScanner.Scanners.Accessory || {};

// 장신구 옵션 모듈
LopecScanner.Scanners.Accessory.Options = (function() {
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
  
  // 공개 API
  return {
    setAccessoryOptions,
    getAccessoryOptions,
    getAccessoryCombinations,
    filterAccessoryOptions
  };
})();