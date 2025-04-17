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
    // 딜러 옵션
    DEALER: {
      // 목걸이 옵션 (option value 값 기준)
      NECKLACE: [
        { value: "addDamagePer", description: "추가 피해" },
        { value: "finalDamagePer", description: "적에게 주는 피해 증가" },
        { value: "value", description: "없음" } 
      ],
      // 귀걸이 옵션
      EARRING: [
        { value: "atkPer", description: "공격력 %" },
        { value: "weaponAtkPer", description: "무기 공격력 %" },
        { value: "value", description: "없음" }
      ],
      // 반지 옵션
      RING: [
        { value: "criticalDamagePer", description: "치명타 피해" },
        { value: "criticalChancePer", description: "치명타 적중률" },
        { value: "value", description: "없음" }
      ]
    },
    
    // 서포터 옵션
    SUPPORTER: {
      // 목걸이 옵션
      NECKLACE: [
        { value: "stigmaPer", description: "낙인력" }, 
        { value: "value", description: "세레나데, 신앙, 조화 게이지 획득량" },
        { value: "value", description: "없음" } 
      ],
      // 귀걸이 옵션
      EARRING: [
        { value: "weaponAtkPer", description: "무기 공격력 %" }, 
        { value: "weaponAtkPlus", description: "무기 공격력 +" }, 
        { value: "value", description: "없음" }
      ],
      // 반지 옵션
      RING: [
        { value: "atkBuff", description: "아군 공격력 강화 효과" }, 
        { value: "damageBuff", description: "아군 피해량 강화 효과" }, 
        { value: "value", description: "없음" }
      ]
    }
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
   * 모든 가능한 장신구 조합 생성
   * @param {Object} jobOptions - 직업별 장신구 옵션 설정
   * @param {string} accessoryType - 장신구 타입 (NECKLACE, EARRING, RING)
   * @return {Array} - 생성된 조합
   */
  function generateAllCombinations(jobOptions, accessoryType) {
    // 실제 DOM에서 장신구 타입별 옵션들의 value를 직접 추출
    const optionValues = findOptionValuesInDOM(accessoryType);
    
    if (!optionValues) {
      console.error(`${accessoryType} 옵션을 찾을 수 없습니다.`);
      return [];
    }
    
    // 장신구 이름 설정
    const typeName = accessoryType.toLowerCase();
    const displayName = typeName === 'necklace' ? '목걸이' : 
                         typeName === 'earring' ? '귀걸이' : '반지';
    
    // 장신구 조합.txt의 정보를 바탕으로 조합 생성
    const combinations = [
      // 상상: 두 옵션 모두 상등급
      {
        label: `상상-${displayName}`,
        options: [optionValues.상1, optionValues.상2]
      },
      // 상중: 첫 번째 상등급, 두 번째 중등급
      {
        label: `상중-${displayName}`,
        options: [optionValues.상1, optionValues.중2]
      },
      // 중상: 첫 번째 중등급, 두 번째 상등급
      {
        label: `중상-${displayName}`,
        options: [optionValues.중1, optionValues.상2]
      },
      // 상하: 첫 번째 상등급, 두 번째 하등급
      {
        label: `상하-${displayName}`,
        options: [optionValues.상1, optionValues.하2]
      },
      // 하상: 첫 번째 하등급, 두 번째 상등급
      {
        label: `하상-${displayName}`,
        options: [optionValues.하1, optionValues.상2]
      },
      // 상무: 첫 번째 상등급, 두 번째 없음
      {
        label: `상무-${displayName}`,
        options: [optionValues.상1, optionValues.무]
      },
      // 무상: 첫 번째 없음, 두 번째 상등급
      {
        label: `무상-${displayName}`,
        options: [optionValues.무, optionValues.상2]
      },
      // 중중: 두 옵션 모두 중등급
      {
        label: `중중-${displayName}`,
        options: [optionValues.중1, optionValues.중2]
      },
      // 중하: 첫 번째 중등급, 두 번째 하등급
      {
        label: `중하-${displayName}`,
        options: [optionValues.중1, optionValues.하2]
      },
      // 하중: 첫 번째 하등급, 두 번째 중등급
      {
        label: `하중-${displayName}`,
        options: [optionValues.하1, optionValues.중2]
      },
      // 중무: 첫 번째 중등급, 두 번째 없음
      {
        label: `중무-${displayName}`,
        options: [optionValues.중1, optionValues.무]
      },
      // 무중: 첫 번째 없음, 두 번째 중등급
      {
        label: `무중-${displayName}`,
        options: [optionValues.무, optionValues.중2]
      },
      // 하하: 두 옵션 모두 하등급
      {
        label: `하하-${displayName}`,
        options: [optionValues.하1, optionValues.하2]
      },
      // 하무: 첫 번째 하등급, 두 번째 없음
      {
        label: `하무-${displayName}`,
        options: [optionValues.하1, optionValues.무]
      },
      // 무하: 첫 번째 없음, 두 번째 하등급
      {
        label: `무하-${displayName}`,
        options: [optionValues.무, optionValues.하2]
      },
      // 무무: 두 옵션 모두 없음
      {
        label: `무무-${displayName}`,
        options: [optionValues.무, optionValues.무]
      }
    ];
    
    return combinations;
  }
  
  /**
   * DOM에서 장신구 옵션 값 직접 추출
   * @param {string} accessoryType - 장신구 타입 (NECKLACE, EARRING, RING)
   * @return {Object} - 추출된 옵션 값
   */
  function findOptionValuesInDOM(accessoryType) {
    // 장신구 타입별 옵션 값 지정
    const optionKeywords = {
      NECKLACE: {
        DEALER: {
          opt1: ['addDamagePer'], // 추가 피해
          opt2: ['finalDamagePer'] // 적에게 주는 피해
        },
        SUPPORTER: {
          opt1: ['stigmaPer'], // 낙인력
          opt2: ['value'] // 세레나데, 신앙, 조화 게이지 획득량
        }
      },
      EARRING: {
        DEALER: {
          opt1: ['weaponAtkPer'], // 무기공격력 %
          opt2: ['atkPer'] // 공격력 %
        },
        SUPPORTER: {
          opt1: ['weaponAtkPer'], // 무기공격력 %
          opt2: ['weaponAtkPlus'] // 무기공격력 +
        }
      },
      RING: {
        DEALER: {
          opt1: ['criticalDamagePer'], // 치명타 피해
          opt2: ['criticalChancePer'] // 치명타 적중률
        },
        SUPPORTER: {
          opt1: ['atkBuff'], // 아군 공격력 강화 효과
          opt2: ['damageBuff'] // 아군 피해량 강화 효과
        }
      }
    };
    
    // 현재 직업 타입 (BaseScanner의 jobType 또는 기본값으로 DEALER 사용)
    const jobType = LopecScanner.Scanners.BaseScanner?.state?.jobType || 'DEALER';
    
    // 선택한 타입과 직업에 해당하는 옵션 키워드 가져오기
    const keywords = optionKeywords[accessoryType]?.[jobType] || optionKeywords[accessoryType]?.DEALER;
    
    if (!keywords) {
      console.error(`${accessoryType}/${jobType}에 해당하는 옵션 키워드를 찾을 수 없습니다.`);
      return null;
    }
    
    // DOM에서 실제 옵션 찾기
    const allOptions = Array.from(document.querySelectorAll('select.option.tooltip-text option'));
    
    // 각 등급별, 옵션별 값 추출
    const result = {
      // 상등급 옵션
      상1: null, 상2: null,
      // 중등급 옵션
      중1: null, 중2: null,
      // 하등급 옵션
      하1: null, 하2: null,
      // 없음 옵션
      무: '하:value:0'
    };
    
    // 첫 번째 옵션 (예: 추가 피해, 낙인력 등)
    for (const key of keywords.opt1) {
      // 상등급
      const 상1Option = allOptions.find(option => option.value.startsWith(`상:${key}:`));
      if (상1Option) result.상1 = 상1Option.value;
      
      // 중등급
      const 중1Option = allOptions.find(option => option.value.startsWith(`중:${key}:`));
      if (중1Option) result.중1 = 중1Option.value;
      
      // 하등급
      const 하1Option = allOptions.find(option => option.value.startsWith(`하:${key}:`));
      if (하1Option) result.하1 = 하1Option.value;
    }
    
    // 두 번째 옵션 (예: 적에게 주는 피해, 세레나데 등)
    for (const key of keywords.opt2) {
      // 상등급
      const 상2Option = allOptions.find(option => option.value.startsWith(`상:${key}:`));
      if (상2Option) result.상2 = 상2Option.value;
      
      // 중등급
      const 중2Option = allOptions.find(option => option.value.startsWith(`중:${key}:`));
      if (중2Option) result.중2 = 중2Option.value;
      
      // 하등급
      const 하2Option = allOptions.find(option => option.value.startsWith(`하:${key}:`));
      if (하2Option) result.하2 = 하2Option.value;
    }
    
    // 없음 옵션 찾기
    const 무Option = allOptions.find(option => option.textContent.includes('없음'));
    if (무Option) result.무 = 무Option.value;
    
    // 값이 없는 경우 기본값 설정
    if (!result.상1) result.상1 = `상:${keywords.opt1[0]}:1`;
    if (!result.중1) result.중1 = `중:${keywords.opt1[0]}:1`;
    if (!result.하1) result.하1 = `하:${keywords.opt1[0]}:1`;
    
    if (!result.상2) result.상2 = `상:${keywords.opt2[0]}:1`;
    if (!result.중2) result.중2 = `중:${keywords.opt2[0]}:1`;
    if (!result.하2) result.하2 = `하:${keywords.opt2[0]}:1`;
    
    // 디버깅용 로그
    console.log(`${accessoryType} 옵션 값 추출 결과:`, result);
    
    return result;
  }
  
  /**
   * 특정 장신구 타입에 대한 옵션 조합 목록 가져오기
   * @param {string} accessoryType - 장신구 타입 (necklace, earring, ring)
   * @param {string} jobType - 직업 타입 (DEALER, SUPPORTER)
   * @return {Array} - 해당 타입에 따른 옵션 조합 목록
   */
  function getAccessoryCombinations(accessoryType, jobType = 'DEALER') {
    // 카멜 케이스와 대문자 모두 지원
    const type = accessoryType.toUpperCase();
    const job = jobType.toUpperCase();
    
    // 직업 타입 확인 (기본값은 DEALER)
    const jobOptions = accessoryOptions[job] || accessoryOptions.DEALER;
    
    // 실제 DOM에서 조합 생성
    const allCombinations = generateAllCombinations(jobOptions, type);
    
    // 내장된 기존 조합 반환 (호환성 유지)
    if (allCombinations.length === 0) {
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
    
    return allCombinations;
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
    accessoryOptions, // 직업별 장신구 옵션 설정
    setAccessoryOptions,
    getAccessoryOptions,
    getAccessoryCombinations,
    filterAccessoryOptions,
    generateAllCombinations, // 내보낼 수 있도록 추가
    findOptionValuesInDOM // 디버깅용으로 추가
  };
})();