/**
 * 로펙 시뮬레이터 점수 분석기 - 스캔 결과 데이터 처리 개선 모듈
 * 스캔 결과를 구조화하여 가공하는 기능을 제공합니다.
 */

// 스캔 결과 데이터 개선 모듈
const ScannerEnhancement = (function() {
  /**
   * 스캔 결과를 구조화하여 저장
   * @param {Object} rawData - 원래 스캔 데이터 
   * @return {Object} - 구조화된 스캔 데이터
   */
  function processRawScanData(rawData) {
    if (!rawData || Object.keys(rawData).length === 0) {
      console.warn('처리할 스캔 데이터가 없습니다.');
      return {};
    }

    // 구조화된 결과 객체
    const processedData = {};
    
    // 각 항목 처리
    for (const key in rawData) {
      const item = rawData[key];
      
      // 유효하지 않은 항목 스킵
      if (!item || !item.type) continue;
      
      // 항목 타입 추출 (영문 카테고리)
      const itemType = getItemCategory(item);
      
      // 해당 카테고리가 없으면 생성
      if (!processedData[itemType]) {
        processedData[itemType] = [];
      }
      
      // 항목 처리하여 저장
      let processedItem;
      
      // 항목 타입에 따라 처리
      switch (itemType) {
        case 'engraving':
          processedItem = processEngravingItem(item);
          break;
        case 'gem':
          processedItem = processGemItem(item);
          break;
        case 'accessory':
          processedItem = processAccessoryItem(item);
          break;
        default:
          // 그 외 항목은 기본 처리
          processedItem = {
            ...item,
            itemCategory: itemType
          };
      }
      
      // 처리된 항목 저장
      if (processedItem) {
        processedData[itemType].push(processedItem);
      }
    }
    
    return processedData;
  }
  
  /**
   * 아이템 카테고리 판별
   * @param {Object} item - 스캔 결과 항목
   * @return {string} - 아이템 카테고리
   */
  function getItemCategory(item) {
    // 타입 필드로 판별
    if (typeof item.type === 'string') {
      // 영문 카테고리 타입인 경우
      if (['engraving', 'gem', 'accessory', 'armor', 'avatar', 'karma'].includes(item.type)) {
        return item.type;
      }
      
      // 한글 타입 변환
      switch (item.type) {
        case '각인':
          return 'engraving';
        case '보석':
          return 'gem';
        case '장비':
          return 'armor';
        case '카르마':
          return 'karma';
        case '아바타':
          return 'avatar';
      }
      
      // 장신구 타입 확인
      if (item.type.includes('목걸이') || item.type.includes('귀걸이') || item.type.includes('반지') ||
          item.accessoryType === 'necklace' || item.accessoryType === 'earring' || item.accessoryType === 'ring') {
        return 'accessory';
      }
    }
    
    // 특성 필드로 추가 판별
    if (item.engravingName || item.engravingLevel) {
      return 'engraving';
    }
    if (item.gemType || item.skillName) {
      return 'gem';
    }
    if (item.accessoryType || item.combo) {
      return 'accessory';
    }
    
    // 기본값
    return 'unknown';
  }
  
  /**
   * 각인서 항목 처리
   * @param {Object} item - 각인서 항목
   * @return {Object} - 처리된 각인서 항목
   */
  function processEngravingItem(item) {
    // 각인 이름 추출
    let engravingName = item.engravingName || '';
    if (!engravingName && item.item) {
      // 아이템 문자열에서 추출 시도
      const nameMatch = item.item.match(/(?:영웅|전설|유물)\s+(.+?)\s+Lv\./);
      if (nameMatch && nameMatch[1]) {
        engravingName = nameMatch[1];
      }
    }
    
    // 원래 레벨과 변경 레벨 파싱
    let fromLevel = item.fromLevel || 0;
    let toLevel = item.toLevel || 0;
    
    if (!fromLevel && item.from) {
      const fromMatch = item.from.match(/Lv\.(\d+)/);
      if (fromMatch && fromMatch[1]) {
        fromLevel = parseInt(fromMatch[1]);
      }
    }
    
    if (!toLevel && item.to) {
      const toMatch = item.to.match(/Lv\.(\d+)/);
      if (toMatch && toMatch[1]) {
        toLevel = parseInt(toMatch[1]);
      }
    }
    
    // 등급 정보 추출
    let fromGrade = item.fromGrade || '';
    let toGrade = item.toGrade || '';
    
    if (!fromGrade && item.from) {
      if (item.from.includes('영웅')) fromGrade = '영웅';
      else if (item.from.includes('전설')) fromGrade = '전설';
      else if (item.from.includes('유물')) fromGrade = '유물';
    }
    
    if (!toGrade && item.to) {
      if (item.to.includes('영웅')) toGrade = '영웅';
      else if (item.to.includes('전설')) toGrade = '전설';
      else if (item.to.includes('유물')) toGrade = '유물';
    }
    
    // 필요 각인서 개수 (레벨당 5장)
    const fromCount = fromLevel * 5;
    const toCount = toLevel * 5;
    const diffCount = Math.max(0, toCount - fromCount);
    
    // 레벨 변화 여부
    const isLevelChanged = fromLevel !== toLevel;
    
    // 등급 변화 여부
    const isGradeChanged = fromGrade !== toGrade;
    
    // 결과 객체 구성
    return {
      ...item,
      itemCategory: 'engraving',
      engravingName,
      fromLevel,
      toLevel,
      fromGrade,
      toGrade,
      fromCount,
      toCount,
      diffCount,
      isLevelChanged,
      isGradeChanged
    };
  }
  
  /**
   * 보석 항목 처리
   * @param {Object} item - 보석 항목
   * @return {Object} - 처리된 보석 항목
   */
  function processGemItem(item) {
    // 보석 타입 (멸화, 홍염 등)
    let gemType = item.gemType || '';
    
    // 스킬 이름
    let skillName = item.skillName || '';
    
    // 원래 레벨과 변경 레벨 파싱
    let fromLevel = item.fromLevel || 0;
    let toLevel = item.toLevel || 0;
    
    if (!fromLevel && item.from) {
      const fromMatch = item.from.match(/(\d+)레벨/);
      if (fromMatch && fromMatch[1]) {
        fromLevel = parseInt(fromMatch[1]);
      }
    }
    
    if (!toLevel && item.to) {
      const toMatch = item.to.match(/(\d+)레벨/);
      if (toMatch && toMatch[1]) {
        toLevel = parseInt(toMatch[1]);
      }
    }
    
    // 만약 보석 타입이나 스킬 이름이 없으면 아이템 이름에서 추출
    if ((!gemType || !skillName) && item.item) {
      const itemMatch = item.item.match(/보석\s+\((.+)\s+(.+)\)/);
      if (itemMatch) {
        if (!gemType) gemType = itemMatch[1] || '';
        if (!skillName) skillName = itemMatch[2] || '';
      }
    }
    
    // 결과 객체 구성
    return {
      ...item,
      itemCategory: 'gem',
      gemType,
      skillName,
      fromLevel,
      toLevel,
      levelDiff: toLevel - fromLevel
    };
  }
  
  /**
   * 장신구 항목 처리
   * @param {Object} item - 장신구 항목
   * @return {Object} - 처리된 장신구 항목
   */
  function processAccessoryItem(item) {
    // 장신구 타입 (necklace, earring, ring)
    const accessoryType = item.accessoryType || item.itemType || '';
    
    // 표시용 타입 (목걸이, 귀걸이, 반지)
    let displayType = item.displayType || '';
    if (!displayType) {
      if (accessoryType === 'necklace') displayType = '목걸이';
      else if (accessoryType === 'earring') displayType = '귀걸이';
      else if (accessoryType === 'ring') displayType = '반지';
    }
    
    // 직업 타입 (DEALER, SUPPORTER)
    const jobType = item.jobType || '';
    
    // 조합 유형 (상상, 상중, 중상, ...)
    const combo = item.combo || '';
    
    // 옵션 정보
    const options = item.sortedOptions || item.options || [];
    
    // 원래 옵션과 적용된 옵션
    const originalOptions = item.originalOptions || [];
    const appliedOptions = item.appliedOptions || [];
    
    // 결과 객체 구성
    return {
      ...item,
      itemCategory: 'accessory',
      accessoryType,
      displayType,
      jobType,
      combo,
      options,
      originalOptions,
      appliedOptions
    };
  }
  
  // 공개 API
  return {
    processRawScanData,
    processEngravingItem,
    processGemItem,
    processAccessoryItem
  };
})();

// 전역 네임스페이스에 추가
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.ScannerEnhancement = ScannerEnhancement;
