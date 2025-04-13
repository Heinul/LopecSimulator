/**
 * 로스트아크 API 래퍼 모듈
 * 다양한 API 모듈을 통합적으로 관리합니다.
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.API = window.LopecScanner.API || {};

// API 래퍼 모듈
window.LopecScanner.API.ApiWrapper = (function() {
  // 캐시
  const cache = {
    data: {},
    timestamp: {},
    expiration: 3600000 // 1시간 캐시
  };

  /**
   * API 키 설정
   * @param {string} key - API 키
   * @returns {boolean} - 설정 성공 여부
   */
  function setApiKey(key) {
    if (!key) {
      console.error('[API Wrapper] API 키가 없습니다.');
      return false;
    }

    // 모든 API 모듈에 키 설정
    let success = false;

    if (window.LopecScanner.API.LostArkHandler) {
      success = window.LopecScanner.API.LostArkHandler.setApiKey(key);
    }

    if (window.LopecScanner.API.LostArkAPI) {
      success = window.LopecScanner.API.LostArkAPI.setApiKey(key) || success;
    }

    return success;
  }

  /**
   * API 키 가져오기
   * @returns {Promise<string>} - API 키
   */
  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['lostarkApiKey'], (result) => {
        resolve(result.lostarkApiKey || null);
      });
    });
  }

  /**
   * API 연결 테스트
   * @returns {Promise<boolean>} - 연결 성공 여부
   */
  async function testConnection() {
    try {
      // 먼저 API 키 확인
      const apiKey = await getApiKey();
      
      if (!apiKey) {
        console.log('[API Wrapper] API 키가 설정되지 않았습니다.');
        return false;
      }

      // 새 API 핸들러로 테스트
      if (window.LopecScanner.API.LostArkHandler) {
        const result = await window.LopecScanner.API.LostArkHandler.testConnection();
        if (result) {
          console.log('[API Wrapper] 새 API 핸들러 연결 성공');
          return true;
        }
      }

      // 기존 API로 테스트
      if (window.LopecScanner.API.LostArkAPI) {
        const result = await window.LopecScanner.API.LostArkAPI.testConnection();
        if (result) {
          console.log('[API Wrapper] 기존 API 연결 성공');
          return true;
        }
      }
      
      console.log('[API Wrapper] API 연결 실패');
      return false;
    } catch (error) {
      console.error('[API Wrapper] 연결 테스트 중 오류 발생:', error);
      return false;
    }
  }

  /**
   * 캐시 초기화
   */
  function clearCache() {
    cache.data = {};
    cache.timestamp = {};
    
    // 각 API 모듈의 캐시 초기화
    if (window.LopecScanner.API.LostArkHandler && window.LopecScanner.API.LostArkHandler.clearCache) {
      window.LopecScanner.API.LostArkHandler.clearCache();
    }
    
    console.log('[API Wrapper] 캐시가 초기화되었습니다.');
  }

  /**
   * 아이템 가격 조회 (캐시 활용)
   * @param {string} itemName - 아이템 이름
   * @returns {Promise<Object>} - 아이템 가격 정보
   */
  async function getItemPrice(itemName) {
    // 캐시 키 생성
    const cacheKey = `price_${itemName}`;
    
    // 캐시 확인
    if (cache.data[cacheKey] && Date.now() - cache.timestamp[cacheKey] < cache.expiration) {
      console.log(`[API Wrapper] 캐시에서 가격 로드: ${itemName}`);
      return cache.data[cacheKey];
    }
    
    try {
      // 먼저 새 API 핸들러로 시도
      if (window.LopecScanner.API.LostArkHandler) {
        const result = await window.LopecScanner.API.LostArkHandler.findItemByName(itemName);
        if (result) {
          // 캐시에 저장
          cache.data[cacheKey] = result;
          cache.timestamp[cacheKey] = Date.now();
          return result;
        }
      }
      
      // 기존 API 시도
      if (window.LopecScanner.API.LostArkAPI) {
        const searchResults = await window.LopecScanner.API.LostArkAPI.searchItem(itemName);
        if (searchResults && searchResults.length > 0) {
          const itemId = searchResults[0].id;
          const priceInfo = await window.LopecScanner.API.LostArkAPI.getItemPrice(itemId);
          
          const result = {
            item: searchResults[0],
            prices: priceInfo
          };
          
          // 캐시에 저장
          cache.data[cacheKey] = result;
          cache.timestamp[cacheKey] = Date.now();
          
          return result;
        }
      }
      
      console.log(`[API Wrapper] 아이템을 찾을 수 없습니다: ${itemName}`);
      return null;
    } catch (error) {
      console.error(`[API Wrapper] 가격 조회 중 오류 발생 (${itemName}):`, error);
      return null;
    }
  }

  /**
   * 보석 가격 조회
   * @param {number} level - 보석 레벨
   * @param {string} type - 보석 타입 (멸화 or 홍염)
   * @returns {Promise<Object>} - 보석 가격 정보
   */
  async function getGemPrice(level, type = '') {
    try {
      // 먼저 새 API 핸들러로 시도
      if (window.LopecScanner.API.LostArkHandler) {
        return await window.LopecScanner.API.LostArkHandler.getGemPrice(level, type);
      }
      
      // 기존 방식으로 시도
      const gemNames = [];
      
      if (type === '멸화' || type === '') {
        gemNames.push(`${level}레벨 멸화의 보석`);
        gemNames.push(`레벨 ${level} 멸화의 보석`);
      }
      
      if (type === '홍염' || type === '') {
        gemNames.push(`${level}레벨 홍염의 보석`);
        gemNames.push(`레벨 ${level} 홍염의 보석`);
      }
      
      // 각 이름으로 시도
      for (const gemName of gemNames) {
        const priceInfo = await getItemPrice(gemName);
        if (priceInfo) {
          return priceInfo;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`[API Wrapper] 보석 가격 조회 중 오류 발생 (${level}):`, error);
      return null;
    }
  }

  /**
   * 각인서 가격 조회
   * @param {string} engravingName - 각인 이름
   * @param {string} rarity - 등급 (전설, 영웅 등)
   * @returns {Promise<Object>} - 각인서 가격 정보
   */
  async function getEngravingBookPrice(engravingName, rarity = '전설') {
    try {
      // 먼저 새 API 핸들러로 시도
      if (window.LopecScanner.API.LostArkHandler) {
        return await window.LopecScanner.API.LostArkHandler.getEngravingBookPrice(engravingName, rarity);
      }
      
      // 기존 방식으로 시도
      const bookNames = [
        `${rarity} ${engravingName} 각인서`,
        `${engravingName} ${rarity} 각인서`,
        `${engravingName} 각인서`
      ];
      
      // 각 이름으로 시도
      for (const bookName of bookNames) {
        const priceInfo = await getItemPrice(bookName);
        if (priceInfo) {
          return priceInfo;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`[API Wrapper] 각인서 가격 조회 중 오류 발생 (${engravingName}):`, error);
      return null;
    }
  }

  /**
   * 제일 저렴한 가격 반환
   * @param {Array} priceInfoList - 가격 정보 목록
   * @returns {number} - 최저 가격
   */
  function getLowestPrice(priceInfoList) {
    if (!priceInfoList || priceInfoList.length === 0) {
      return 0;
    }
    
    // 각 아이템의 최저 가격 추출
    const prices = priceInfoList.map(info => {
      if (info.CurrentMinPrice) return info.CurrentMinPrice;
      if (info.currentMinPrice) return info.currentMinPrice;
      return Number.MAX_VALUE;
    });
    
    // 최저 가격 반환
    return Math.min(...prices);
  }

  /**
   * 초기화 함수
   */
  function initialize() {
    getApiKey().then(apiKey => {
      if (apiKey) {
        console.log('[API Wrapper] 초기화 완료: API 키 로드됨');
      } else {
        console.log('[API Wrapper] 초기화 완료: API 키 없음');
      }
    });
  }

  // 공개 API
  return {
    initialize,
    setApiKey,
    getApiKey,
    testConnection,
    getItemPrice,
    getGemPrice,
    getEngravingBookPrice,
    getLowestPrice,
    clearCache
  };
})();

// 모듈 자동 초기화
window.LopecScanner.API.ApiWrapper.initialize();
