/**
 * API 캐시 관리 모듈
 * API 응답 결과를 캐싱하여 API 호출 최소화
 */

// API 캐시 저장소
const API_CACHE = {
  gems: {},      // 보석 가격 캐싱 (예: '9레벨 겁화': 785000)
  engravings: {}, // 각인서 가격 캐싱
  lastUpdate: {}, // 마지막 업데이트 시간 (캐시 유효성 확인용)
};

/**
 * 캐시 유효 시간 (밀리초)
 * 기본값: 6시간
 */
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * API 캐시 관리자
 */
const CacheManager = {
  /**
   * 캐시에서 데이터 가져오기
   * @param {string} type - 캐시 타입 (gems, engravings 등)
   * @param {string} key - 캐시 키
   * @returns {any|null} 캐시된 데이터 또는 null
   */
  get(type, key) {
    if (!API_CACHE[type] || !API_CACHE.lastUpdate[key]) {
      return null;
    }

    const lastUpdate = API_CACHE.lastUpdate[key] || 0;
    const now = Date.now();

    // 캐시 만료 확인
    if ((now - lastUpdate) > CACHE_TTL) {
      return null;
    }

    return API_CACHE[type][key];
  },

  /**
   * 데이터를 캐시에 저장
   * @param {string} type - 캐시 타입 (gems, engravings 등)
   * @param {string} key - 캐시 키
   * @param {any} data - 저장할 데이터
   */
  set(type, key, data) {
    if (!API_CACHE[type]) {
      API_CACHE[type] = {};
    }

    API_CACHE[type][key] = data;
    API_CACHE.lastUpdate[key] = Date.now();

    console.log(`캐시 저장: ${type}/${key}`);
  },

  /**
   * 캐시 초기화
   * @param {string} [type] - 초기화할 캐시 타입 (지정하지 않으면 모든 캐시 초기화)
   */
  clear(type) {
    if (type) {
      if (API_CACHE[type]) {
        API_CACHE[type] = {};
        console.log(`${type} 캐시 초기화됨`);
      }
    } else {
      // 모든 캐시 초기화
      Object.keys(API_CACHE).forEach(key => {
        if (key !== 'lastUpdate') {
          API_CACHE[key] = {};
        }
      });
      API_CACHE.lastUpdate = {};
      console.log('모든 캐시 초기화됨');
    }
  }
};

export default CacheManager;