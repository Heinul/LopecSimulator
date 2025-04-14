/**
 * 가격 저장 모듈
 * 가격 정보를 로컬에 저장하고 관리합니다.
 */

// 가격 저장 모듈
const PriceStorage = (function() {
  // 저장 키 접두사
  const STORAGE_KEY_PREFIX = 'lopec_price_';
  
  // 저장 카테고리
  const CATEGORIES = {
    GEM: 'gem',        // 보석
    ENGRAVING: 'engraving', // 각인서
    ACCESSORY: 'accessory'  // 악세서리
  };
  
  /**
   * 보석 가격 저장
   * @param {string} gemType - 보석 유형 (겁화, 작열, 멸화, 홍염)
   * @param {number} level - 보석 레벨
   * @param {number} price - 가격
   */
  function saveGemPrice(gemType, level, price) {
    const key = `${STORAGE_KEY_PREFIX}${CATEGORIES.GEM}_${gemType}_${level}`;
    const data = {
      type: gemType,
      level: level,
      price: price,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[저장] 보석 가격 저장: ${gemType} ${level}레벨 - ${price}G`);
  }
  
  /**
   * 보석 가격 가져오기
   * @param {string} gemType - 보석 유형 (겁화, 작열, 멸화, 홍염)
   * @param {number} level - 보석 레벨
   * @returns {Object|null} 보석 가격 정보
   */
  function getGemPrice(gemType, level) {
    const key = `${STORAGE_KEY_PREFIX}${CATEGORIES.GEM}_${gemType}_${level}`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('보석 가격 정보 파싱 오류:', e);
      return null;
    }
  }
  
  /**
   * 각인서 가격 저장
   * @param {string} engravingName - 각인서 이름
   * @param {string} grade - 등급 (전설, 영웅, 희귀, 고급)
   * @param {number} price - 가격
   */
  function saveEngravingPrice(engravingName, grade, price) {
    const key = `${STORAGE_KEY_PREFIX}${CATEGORIES.ENGRAVING}_${engravingName}_${grade}`;
    const data = {
      name: engravingName,
      grade: grade,
      price: price,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[저장] 각인서 가격 저장: ${engravingName} ${grade} - ${price}G`);
  }
  
  /**
   * 각인서 가격 가져오기
   * @param {string} engravingName - 각인서 이름
   * @param {string} grade - 등급 (전설, 영웅, 희귀, 고급)
   * @returns {Object|null} 각인서 가격 정보
   */
  function getEngravingPrice(engravingName, grade) {
    const key = `${STORAGE_KEY_PREFIX}${CATEGORIES.ENGRAVING}_${engravingName}_${grade}`;
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('각인서 가격 정보 파싱 오류:', e);
      return null;
    }
  }
  
  /**
   * 악세서리 가격 저장
   * @param {Object} options - 악세서리 옵션
   * @param {number} price - 가격
   */
  function saveAccessoryPrice(options, price) {
    // 옵션에서 해시 키 생성
    const optionHash = createAccessoryHash(options);
    const key = `${STORAGE_KEY_PREFIX}${CATEGORIES.ACCESSORY}_${optionHash}`;
    
    const data = {
      options: options,
      price: price,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[저장] 악세서리 가격 저장: ${options.type} ${options.quality} - ${price}G (해시: ${optionHash})`);
  }
  
  /**
   * 악세서리 가격 가져오기
   * @param {Object} options - 악세서리 옵션
   * @returns {Object|null} 악세서리 가격 정보
   */
  function getAccessoryPrice(options) {
    // 옵션에서 해시 키 생성
    const optionHash = createAccessoryHash(options);
    const key = `${STORAGE_KEY_PREFIX}${CATEGORIES.ACCESSORY}_${optionHash}`;
    
    const data = localStorage.getItem(key);
    
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('악세서리 가격 정보 파싱 오류:', e);
      return null;
    }
  }
  
  /**
   * 악세서리 옵션에서 해시 값 생성
   * @param {Object} options - 악세서리 옵션
   * @returns {string} 해시 값
   */
  function createAccessoryHash(options) {
    // 객체 정렬 후 문자열화
    const sortedOptions = {};
    
    // 객체 키를 알파벳 순으로 정렬
    Object.keys(options).sort().forEach(key => {
      sortedOptions[key] = options[key];
    });
    
    // 각인 배열이 있을 경우 정렬
    if (sortedOptions.engravings) {
      sortedOptions.engravings.sort((a, b) => {
        // 이름으로 1차 정렬
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        
        // 값으로 2차 정렬
        return a.value - b.value;
      });
    }
    
    // 해시 생성 (간단한 구현 - 실제로는 더 강력한 해시 함수 사용 권장)
    return btoa(JSON.stringify(sortedOptions)).replace(/[=]/g, '');
  }
  
  /**
   * 전체 가격 데이터 내보내기
   * @returns {Object} 저장된 모든 가격 데이터
   */
  function exportAllPriceData() {
    const exportData = {
      gems: {},
      engravings: {},
      accessories: {},
      exportedAt: Date.now()
    };
    
    // localStorage 순회
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // 가격 데이터만 처리
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        const category = key.split('_')[1]; // 첫 부분은 lopec_price_ 접두사
        const data = localStorage.getItem(key);
        
        try {
          const parsedData = JSON.parse(data);
          
          // 카테고리에 따라 적절한 객체에 추가
          if (category === CATEGORIES.GEM) {
            exportData.gems[key.replace(STORAGE_KEY_PREFIX, '')] = parsedData;
          } else if (category === CATEGORIES.ENGRAVING) {
            exportData.engravings[key.replace(STORAGE_KEY_PREFIX, '')] = parsedData;
          } else if (category === CATEGORIES.ACCESSORY) {
            exportData.accessories[key.replace(STORAGE_KEY_PREFIX, '')] = parsedData;
          }
        } catch (e) {
          console.error(`데이터 내보내기 오류 (키: ${key}):`, e);
        }
      }
    }
    
    return exportData;
  }
  
  /**
   * 가격 데이터 가져오기
   * @param {Object} importData - 가져올 가격 데이터
   * @param {boolean} overwrite - 기존 데이터 덮어쓰기 여부
   * @returns {Object} 가져오기 결과 (성공 및 실패 개수)
   */
  function importPriceData(importData, overwrite = false) {
    const result = {
      total: 0,
      success: 0,
      failed: 0
    };
    
    // 데이터 유효성 검사
    if (!importData || typeof importData !== 'object') {
      console.error('가져올 데이터가 유효하지 않습니다.');
      return result;
    }
    
    // 보석 데이터 가져오기
    if (importData.gems) {
      Object.keys(importData.gems).forEach(key => {
        result.total++;
        try {
          const data = importData.gems[key];
          const fullKey = `${STORAGE_KEY_PREFIX}${key}`;
          
          // 덮어쓰기 여부 확인
          const exists = localStorage.getItem(fullKey) !== null;
          if (!exists || overwrite) {
            localStorage.setItem(fullKey, JSON.stringify(data));
            result.success++;
          }
        } catch (e) {
          console.error(`보석 데이터 가져오기 오류 (키: ${key}):`, e);
          result.failed++;
        }
      });
    }
    
    // 각인서 데이터 가져오기
    if (importData.engravings) {
      Object.keys(importData.engravings).forEach(key => {
        result.total++;
        try {
          const data = importData.engravings[key];
          const fullKey = `${STORAGE_KEY_PREFIX}${key}`;
          
          // 덮어쓰기 여부 확인
          const exists = localStorage.getItem(fullKey) !== null;
          if (!exists || overwrite) {
            localStorage.setItem(fullKey, JSON.stringify(data));
            result.success++;
          }
        } catch (e) {
          console.error(`각인서 데이터 가져오기 오류 (키: ${key}):`, e);
          result.failed++;
        }
      });
    }
    
    // 악세서리 데이터 가져오기
    if (importData.accessories) {
      Object.keys(importData.accessories).forEach(key => {
        result.total++;
        try {
          const data = importData.accessories[key];
          const fullKey = `${STORAGE_KEY_PREFIX}${key}`;
          
          // 덮어쓰기 여부 확인
          const exists = localStorage.getItem(fullKey) !== null;
          if (!exists || overwrite) {
            localStorage.setItem(fullKey, JSON.stringify(data));
            result.success++;
          }
        } catch (e) {
          console.error(`악세서리 데이터 가져오기 오류 (키: ${key}):`, e);
          result.failed++;
        }
      });
    }
    
    console.log(`[가격 데이터 가져오기] 총 ${result.total}개 중 ${result.success}개 성공, ${result.failed}개 실패`);
    return result;
  }
  
  /**
   * 저장된 가격 데이터 통계
   * @returns {Object} 저장된 데이터 통계
   */
  function getPriceDataStats() {
    const stats = {
      totalItems: 0,
      gems: 0,
      engravings: 0,
      accessories: 0,
      oldestTimestamp: Date.now(),
      newestTimestamp: 0
    };
    
    // localStorage 순회
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // 가격 데이터만 처리
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        stats.totalItems++;
        
        const category = key.split('_')[1];
        const data = localStorage.getItem(key);
        
        try {
          const parsedData = JSON.parse(data);
          
          // 카테고리 개수 증가
          if (category === CATEGORIES.GEM) {
            stats.gems++;
          } else if (category === CATEGORIES.ENGRAVING) {
            stats.engravings++;
          } else if (category === CATEGORIES.ACCESSORY) {
            stats.accessories++;
          }
          
          // 타임스탬프 업데이트
          if (parsedData.timestamp) {
            if (parsedData.timestamp < stats.oldestTimestamp) {
              stats.oldestTimestamp = parsedData.timestamp;
            }
            if (parsedData.timestamp > stats.newestTimestamp) {
              stats.newestTimestamp = parsedData.timestamp;
            }
          }
        } catch (e) {
          console.error(`통계 계산 오류 (키: ${key}):`, e);
        }
      }
    }
    
    return stats;
  }
  
  /**
   * 만료된 가격 데이터 정리
   * @param {number} maxAgeMs - 최대 데이터 보존 기간 (밀리초)
   * @returns {number} 삭제된 항목 수
   */
  function cleanupExpiredData(maxAgeMs = 24 * 60 * 60 * 1000) { // 기본 1일
    const now = Date.now();
    let deletedCount = 0;
    
    // localStorage 순회
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // 가격 데이터만 처리
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        
        try {
          const parsedData = JSON.parse(data);
          
          // 타임스탬프 확인
          if (parsedData.timestamp && (now - parsedData.timestamp > maxAgeMs)) {
            localStorage.removeItem(key);
            deletedCount++;
            i--; // 항목이 삭제되면 인덱스 조정
          }
        } catch (e) {
          console.error(`데이터 정리 오류 (키: ${key}):`, e);
        }
      }
    }
    
    console.log(`[데이터 정리] ${deletedCount}개의 만료된 가격 데이터 삭제됨`);
    return deletedCount;
  }
  
  /**
   * 모든 가격 데이터 삭제
   * @returns {number} 삭제된 항목 수
   */
  function clearAllPriceData() {
    let deletedCount = 0;
    
    // localStorage 순회
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      // 가격 데이터만 처리
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
        deletedCount++;
        i--; // 항목이 삭제되면 인덱스 조정
      }
    }
    
    console.log(`[데이터 초기화] ${deletedCount}개의 가격 데이터 삭제됨`);
    return deletedCount;
  }

  // 공개 API
  return {
    // 보석 관련
    saveGemPrice,
    getGemPrice,
    
    // 각인서 관련
    saveEngravingPrice,
    getEngravingPrice,
    
    // 악세서리 관련
    saveAccessoryPrice,
    getAccessoryPrice,
    
    // 데이터 관리
    exportAllPriceData,
    importPriceData,
    getPriceDataStats,
    cleanupExpiredData,
    clearAllPriceData,
    
    // 초기화
    initialize: function() {
      console.log('PriceStorage 모듈 초기화됨');
      
      // 최초 로드 시 만료된 데이터 정리 (3일 기준)
      cleanupExpiredData(3 * 24 * 60 * 60 * 1000);
    }
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', PriceStorage.initialize);
