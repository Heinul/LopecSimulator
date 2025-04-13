/**
 * 로스트아크 API 핸들러
 * 로스트아크 개발자 API를 활용하여 아이템 검색 및 가격 정보를 처리합니다.
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.API = window.LopecScanner.API || {};

// 로스트아크 API 핸들러
window.LopecScanner.API.LostArkHandler = (function() {
  // API 설정
  const config = {
    baseUrl: 'https://developer-lostark.game.onstove.com',
    apiKey: '',
    endpoints: {
      // 경매장
      market: {
        categories: '/markets/categories',
        items: '/markets/items',
        search: '/markets/items/{itemId}',
        options: '/markets/options',
      },
      // 거래소
      auction: {
        categories: '/auctions/categories',
        items: '/auctions/items',
        options: '/auctions/options',
      },
      // 캐릭터 관련
      character: {
        search: '/characters/{name}',
        siblings: '/characters/{name}/siblings',
        equip: '/armories/characters/{name}/equipment',
        profile: '/armories/characters/{name}/profiles',
        engravings: '/armories/characters/{name}/engravings',
        gems: '/armories/characters/{name}/gems',
        cards: '/armories/characters/{name}/cards',
      },
      // 기타
      news: {
        notices: '/news/notices',
        events: '/news/events',
      }
    }
  };

  // 캐시 설정
  const cache = {
    data: {},
    timestamp: {},
    expiration: 3600000 // 1시간 캐시
  };

  /**
   * API 요청 헤더 생성
   * @returns {Object} - 요청 헤더
   */
  function createHeaders() {
    return {
      'Authorization': `Bearer ${config.apiKey}`,
      'Accept': 'application/json'
    };
  }

  /**
   * API 키 설정
   * @param {string} key - 로스트아크 API 키
   */
  function setApiKey(key) {
    if (!key) {
      console.error('[LostArk API] API 키가 없습니다.');
      return false;
    }

    config.apiKey = key;
    
    // 로컬 스토리지에 저장
    chrome.storage.local.set({ lostarkApiKey: key }, () => {
      console.log('[LostArk API] API 키가 저장되었습니다.');
    });
    
    return true;
  }

  /**
   * API 키 가져오기
   * @returns {Promise} - API 키 
   */
  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['lostarkApiKey'], (result) => {
        if (result.lostarkApiKey) {
          config.apiKey = result.lostarkApiKey;
          resolve(result.lostarkApiKey);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * API 연결 테스트
   * @returns {Promise<boolean>} - 연결 성공 여부
   */
  async function testConnection() {
    try {
      const apiKey = await getApiKey();
      
      if (!apiKey) {
        console.error('[LostArk API] API 키가 설정되지 않았습니다.');
        return false;
      }
      
      console.log('[LostArk API] 테스트 시작, API 키:', apiKey.substring(0, 5) + '...');
      
      // 조금 더 사용하기 쉬운 엔드포인트로 변경: 이벤트 정보 (CORS 이슈가 적을 수 있음)
      const testUrl = `${config.baseUrl}/news/events`;
      console.log('[LostArk API] 요청 URL:', testUrl);
      
      const headers = createHeaders();
      console.log('[LostArk API] 요청 헤더:', JSON.stringify(headers));
      
      // API 호출 테스트
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: headers,
        mode: 'cors', // CORS 옵션 지정
        credentials: 'omit' // 자격 증명 정보 제외
      });
      
      console.log('[LostArk API] 응답 상태:', response.status, response.statusText);
      
      try {
        // 응답이 JSON인지 확인
        const contentType = response.headers.get('content-type');
        console.log('[LostArk API] 응답 유형:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const jsonData = await response.json();
          console.log('[LostArk API] JSON 응답:', JSON.stringify(jsonData).substring(0, 200) + '...');
        } else {
          // 텍스트로 처리
          const responseText = await response.text();
          console.log('[LostArk API] 응답 본문:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        }
      } catch (parseError) {
        console.error('[LostArk API] 응답 파싱 오류:', parseError);
        // 텍스트로 다시 시도
        const responseText = await response.text();
        console.log('[LostArk API] 원본 응답:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      }
      
      if (response.ok) {
        console.log('[LostArk API] 연결 테스트 성공');
        return true;
      } else {
        console.error('[LostArk API] 연결 테스트 실패:', response.status, response.statusText);
        // 401 오류인 경우 사용자에게 안내
        if (response.status === 401) {
          console.error('[LostArk API] 인증 실패: API 키가 유효하지 않거나 만료되었습니다.');
        } else if (response.status === 403) {
          console.error('[LostArk API] 권한 없음: API 키의 권한이 부족합니다.');
        } else if (response.status === 429) {
          console.error('[LostArk API] 요청 한도 초과: API 요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.');
        }
        return false;
      }
    } catch (error) {
      console.error('[LostArk API] 연결 테스트 중 오류 발생:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error('[LostArk API] 네트워크 오류: CORS 정책이나 접근 제한이 있을 수 있습니다.');
      }
      return false;
    }
  }

  /**
   * API 요청 실행
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} options - 요청 옵션
   * @returns {Promise} - API 응답 데이터
   */
  async function fetchAPI(endpoint, options = {}) {
    try {
      // API 키 확인
      if (!config.apiKey) {
        const apiKey = await getApiKey();
        if (!apiKey) {
          throw new Error('API 키가 설정되지 않았습니다.');
        }
      }
      
      // 캐시 키 생성
      const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
      
      // 캐시된 데이터가 있는지 확인
      if (cache.data[cacheKey] && 
          cache.timestamp[cacheKey] && 
          (Date.now() - cache.timestamp[cacheKey] < cache.expiration)) {
        console.log(`[LostArk API] 캐시된 데이터 사용: ${endpoint}`);
        return cache.data[cacheKey];
      }
      
      // URL 생성
      let url = `${config.baseUrl}${endpoint}`;
      
      // URL 파라미터 대체
      if (options.urlParams) {
        for (const [key, value] of Object.entries(options.urlParams)) {
          url = url.replace(`{${key}}`, encodeURIComponent(value));
        }
      }
      
      // 쿼리 파라미터 추가
      if (options.queryParams) {
        const queryString = new URLSearchParams();
        for (const [key, value] of Object.entries(options.queryParams)) {
          queryString.append(key, value);
        }
        url += `?${queryString.toString()}`;
      }
      
      // 요청 설정
      const requestOptions = {
        method: options.method || 'GET',
        headers: createHeaders(),
      };
      
      // POST 요청일 경우 body 추가
      if (options.body && (options.method === 'POST' || options.method === 'PUT')) {
        requestOptions.body = JSON.stringify(options.body);
        // Content-Type 헤더 추가
        requestOptions.headers['Content-Type'] = 'application/json';
      }
      
      // API 요청 실행
      const response = await fetch(url, requestOptions);
      
      // 응답 확인
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 요청 실패 (${response.status}): ${errorText}`);
      }
      
      // JSON 응답 파싱
      const data = await response.json();
      
      // 캐시에 저장
      cache.data[cacheKey] = data;
      cache.timestamp[cacheKey] = Date.now();
      
      return data;
    } catch (error) {
      console.error(`[LostArk API] 요청 실패 (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * 시장 카테고리 목록 조회
   * @returns {Promise} - 카테고리 목록
   */
  async function getMarketCategories() {
    return fetchAPI(config.endpoints.market.categories);
  }

  /**
   * 아이템 검색
   * @param {Object} params - 검색 파라미터
   * @returns {Promise} - 검색 결과
   */
  async function searchMarketItems(params) {
    return fetchAPI(config.endpoints.market.items, {
      method: 'POST',
      body: params
    });
  }

  /**
   * 특정 아이템 시세 조회
   * @param {number} itemId - 아이템 ID
   * @returns {Promise} - 아이템 시세 정보
   */
  async function getMarketItemPrice(itemId) {
    return fetchAPI(config.endpoints.market.search.replace('{itemId}', itemId));
  }

  /**
   * 아이템 이름으로 검색 및 가격 조회
   * @param {string} itemName - 아이템 이름
   * @param {number} categoryCode - 카테고리 코드 (선택)
   * @returns {Promise} - 아이템 가격 정보
   */
  async function findItemByName(itemName, categoryCode = null) {
    try {
      // 카테고리 코드가 없으면 모든 카테고리 가져오기
      if (!categoryCode) {
        const categories = await getMarketCategories();
        // 첫 번째 카테고리 사용 또는 기본값
        categoryCode = categories && categories.length > 0 ? categories[0].Code : 0;
      }
      
      // 검색 파라미터 설정
      const params = {
        Sort: 'GRADE',
        CategoryCode: categoryCode,
        ItemName: itemName,
        PageNo: 1,
        SortCondition: 'ASC'
      };
      
      // 아이템 검색
      const searchResults = await searchMarketItems(params);
      
      // 검색 결과가 없으면 null 반환
      if (!searchResults || !searchResults.Items || searchResults.Items.length === 0) {
        return null;
      }
      
      // 첫 번째 아이템의 가격 정보 조회
      const firstItem = searchResults.Items[0];
      const priceInfo = await getMarketItemPrice(firstItem.Id);
      
      return {
        item: firstItem,
        prices: priceInfo
      };
    } catch (error) {
      console.error('[LostArk API] 아이템 검색 실패:', error);
      return null;
    }
  }

  /**
   * 보석 가격 조회
   * @param {number} level - 보석 레벨
   * @param {string} type - 보석 타입 (멸화 or 홍염)
   * @returns {Promise} - 보석 가격 정보
   */
  async function getGemPrice(level, type = '') {
    try {
      // 보석 검색어 생성
      const gemNames = [];
      
      // 검색어 다양화 (게임 내 표기 방식 차이 고려)
      if (type === '멸화' || type === '') {
        gemNames.push(`${level}레벨 멸화의 보석`);
        gemNames.push(`레벨 ${level} 멸화의 보석`);
      }
      
      if (type === '홍염' || type === '') {
        gemNames.push(`${level}레벨 홍염의 보석`);
        gemNames.push(`레벨 ${level} 홍염의 보석`);
      }
      
      // 각 검색어로 시도
      for (const gemName of gemNames) {
        const gemInfo = await findItemByName(gemName);
        if (gemInfo) {
          return gemInfo;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[LostArk API] 보석 가격 조회 실패:', error);
      return null;
    }
  }

  /**
   * 각인서 가격 조회
   * @param {string} engravingName - 각인 이름
   * @param {string} rarity - 등급 (전설, 영웅 등)
   * @returns {Promise} - 각인서 가격 정보
   */
  async function getEngravingBookPrice(engravingName, rarity = '전설') {
    try {
      // 각인서 검색어 생성
      const bookNames = [
        `${rarity} ${engravingName} 각인서`,
        `${engravingName} ${rarity} 각인서`,
        `${engravingName} 각인서`
      ];
      
      // 각 검색어로 시도
      for (const bookName of bookNames) {
        const bookInfo = await findItemByName(bookName);
        if (bookInfo) {
          return bookInfo;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[LostArk API] 각인서 가격 조회 실패:', error);
      return null;
    }
  }

  /**
   * 장비 강화 재료 가격 조회
   * @param {string} materialName - 재료 이름
   * @returns {Promise} - 재료 가격 정보
   */
  async function getMaterialPrice(materialName) {
    try {
      return await findItemByName(materialName);
    } catch (error) {
      console.error(`[LostArk API] 재료 가격 조회 실패 (${materialName}):`, error);
      return null;
    }
  }

  /**
   * 캐시 초기화
   */
  function clearCache() {
    cache.data = {};
    cache.timestamp = {};
    console.log('[LostArk API] 캐시가 초기화되었습니다.');
  }

  // 초기화 함수
  function initialize() {
    getApiKey().then(apiKey => {
      if (apiKey) {
        console.log('[LostArk API] 초기화 완료: API 키가 로드되었습니다.');
      } else {
        console.log('[LostArk API] 초기화 완료: API 키가 설정되지 않았습니다.');
      }
    });
  }

  // 공개 API
  return {
    initialize,
    setApiKey,
    getApiKey,
    testConnection,
    getMarketCategories,
    searchMarketItems,
    getMarketItemPrice,
    findItemByName,
    getGemPrice,
    getEngravingBookPrice,
    getMaterialPrice,
    clearCache
  };
})();

// 모듈 자동 초기화
window.LopecScanner.API.LostArkHandler.initialize();
