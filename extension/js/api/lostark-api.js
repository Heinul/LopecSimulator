/**
 * 로스트아크 API 연동 모듈
 * 로스트아크 개발자 센터 API를 활용하여 데이터를 요청하고 처리합니다.
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.API = window.LopecScanner.API || {};

// 로스트아크 API 모듈
LopecScanner.API.LostArkAPI = (function() {
  // API 설정
  const config = {
    apiKey: '', // 사용자가 입력한 API 키를 저장할 변수
    baseUrl: 'https://developer-lostark.game.onstove.com',
    endpoints: {
      items: '/markets/items',
      options: '/markets/options',
      search: '/markets/items/{itemId}',
      categories: '/markets/categories'
    },
    cacheExpiration: 3600000 // 캐시 만료 시간 (1시간)
  };

  // 캐시 저장소
  const cache = {
    items: {},
    prices: {},
    timestamp: {}
  };

  /**
   * API 키 설정 함수
   * @param {string} key - 사용자의 로스트아크 API 키
   */
  function setApiKey(key) {
    if (!key || typeof key !== 'string') {
      console.error('유효한 API 키를 입력해주세요.');
      return false;
    }

    config.apiKey = key;
    
    // API 키를 로컬 스토리지에 저장 (선택 사항)
    chrome.storage.local.set({ lostarkApiKey: key }, function() {
      console.log('API 키가 저장되었습니다.');
    });

    return true;
  }

  /**
   * 저장된 API 키 로드 함수
   * @param {Function} callback - 로드 완료 후 실행할 콜백 함수
   */
  function loadApiKey(callback) {
    chrome.storage.local.get(['lostarkApiKey'], function(result) {
      if (result.lostarkApiKey) {
        config.apiKey = result.lostarkApiKey;
        console.log('저장된 API 키를 불러왔습니다.');
        callback && callback(true);
      } else {
        console.log('저장된 API 키가 없습니다.');
        callback && callback(false);
      }
    });
  }

  /**
   * API 요청 함수
   * @param {string} endpoint - API 엔드포인트
   * @param {Object} params - 요청 파라미터
   * @returns {Promise} - API 응답 데이터
   */
  async function apiRequest(endpoint, params = {}) {
    if (!config.apiKey) {
      throw new Error('API 키가 설정되지 않았습니다.');
    }

    // URL 파라미터 변환
    const urlParams = params.pathParams || {};
    let url = config.baseUrl + endpoint;
    
    // 경로 파라미터 치환
    Object.keys(urlParams).forEach(key => {
      url = url.replace(`{${key}}`, urlParams[key]);
    });

    // 쿼리 파라미터 추가
    if (params.queryParams) {
      const queryString = new URLSearchParams(params.queryParams).toString();
      url = `${url}?${queryString}`;
    }

    // 요청 옵션 설정
    const options = {
      method: params.method || 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    // 요청 바디 추가 (POST/PUT 등)
    if (params.body) {
      options.body = JSON.stringify(params.body);
    }

    try {
      // API 요청 실행
      const response = await fetch(url, options);
      
      // 응답 코드 확인
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 요청 실패: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      // JSON 응답 파싱
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API 요청 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 아이템 검색 함수
   * @param {string} itemName - 검색할 아이템 이름
   * @returns {Promise} - 검색 결과
   */
  async function searchItem(itemName) {
    if (!itemName) return null;

    // 캐시 확인
    const cacheKey = `search_${itemName}`;
    if (cache.items[cacheKey] && (Date.now() - cache.timestamp[cacheKey] < config.cacheExpiration)) {
      console.log(`캐시에서 아이템 검색 결과 로드: ${itemName}`);
      return cache.items[cacheKey];
    }

    try {
      // 아이템 카테고리 정보 요청
      const categories = await apiRequest(config.endpoints.categories);
      
      // 검색할 카테고리 선택 (전설급 이상 악세서리의 경우)
      const accessoryCategories = categories.filter(cat => 
        cat.name.includes('악세서리') && cat.minItemGrade >= 4
      );
      
      // 결과를 저장할 배열
      let searchResults = [];
      
      // 각 카테고리에서 아이템 검색
      for (const category of accessoryCategories) {
        const searchParams = {
          queryParams: {
            CategoryCode: category.code,
            ItemName: itemName,
            SortCondition: 'ASC'
          }
        };
        
        const result = await apiRequest(config.endpoints.items, searchParams);
        if (result && result.items) {
          searchResults = searchResults.concat(result.items);
        }
      }
      
      // 검색 결과가 있으면 캐시에 저장
      if (searchResults.length > 0) {
        cache.items[cacheKey] = searchResults;
        cache.timestamp[cacheKey] = Date.now();
      }
      
      return searchResults;
    } catch (error) {
      console.error(`아이템 검색 중 오류 발생: ${itemName}`, error);
      return null;
    }
  }

  /**
   * 아이템 가격 조회 함수
   * @param {number} itemId - 아이템 ID
   * @returns {Promise} - 아이템 가격 정보
   */
  async function getItemPrice(itemId) {
    if (!itemId) return null;

    // 캐시 확인
    const cacheKey = `price_${itemId}`;
    if (cache.prices[cacheKey] && (Date.now() - cache.timestamp[cacheKey] < config.cacheExpiration)) {
      console.log(`캐시에서 아이템 가격 로드: ${itemId}`);
      return cache.prices[cacheKey];
    }

    try {
      const params = {
        pathParams: {
          itemId: itemId
        }
      };
      
      const result = await apiRequest(config.endpoints.search.replace('{itemId}', itemId), params);
      
      // 결과가 있으면 캐시에 저장
      if (result) {
        // 가장 저렴한 가격 선택
        const lowestPrice = result.sort((a, b) => a.currentMinPrice - b.currentMinPrice)[0];
        cache.prices[cacheKey] = lowestPrice;
        cache.timestamp[cacheKey] = Date.now();
        return lowestPrice;
      }
      
      return null;
    } catch (error) {
      console.error(`아이템 가격 조회 중 오류 발생: ${itemId}`, error);
      return null;
    }
  }

  /**
   * 아이템 업그레이드 비용 계산 함수
   * @param {string} itemType - 아이템 유형 (accessory, gem, armor 등)
   * @param {number} currentLevel - 현재 레벨
   * @param {number} targetLevel - 목표 레벨
   * @returns {Promise} - 업그레이드 예상 비용
   */
  async function calculateUpgradeCost(itemType, currentLevel, targetLevel) {
    if (currentLevel >= targetLevel) return { gold: 0, materials: {} };

    // 아이템 유형별 업그레이드 비용 계산 로직
    switch (itemType) {
      case 'gem':
        return calculateGemUpgradeCost(currentLevel, targetLevel);
      case 'accessory':
        return calculateAccessoryUpgradeCost(currentLevel, targetLevel);
      case 'armor':
        return calculateArmorUpgradeCost(currentLevel, targetLevel);
      default:
        return { gold: 0, materials: {}, error: '지원하지 않는 아이템 유형입니다.' };
    }
  }

  /**
   * 보석 업그레이드 비용 계산 함수
   * @param {number} currentLevel - 현재 레벨
   * @param {number} targetLevel - 목표 레벨
   * @returns {Promise} - 업그레이드 예상 비용
   */
  async function calculateGemUpgradeCost(currentLevel, targetLevel) {
    // 보석 합성 비용 계산 (3개의 같은 레벨 보석 = 1개의 상위 레벨 보석)
    let totalGold = 0;
    let requiredGems = {};

    // 각 레벨별 필요 보석 수 계산
    for (let level = currentLevel; level < targetLevel; level++) {
      // 한 단계 업그레이드 시 필요한 보석 수
      const gemsNeeded = Math.pow(3, targetLevel - level - 1);
      
      if (!requiredGems[level]) {
        requiredGems[level] = 0;
      }
      
      requiredGems[level] += gemsNeeded;
      
      // 합성 비용 (레벨별로 다름)
      const fusionCost = 500 * (level + 1);
      totalGold += fusionCost * gemsNeeded;
    }

    try {
      // 보석 시세 검색
      let materialCost = 0;
      for (const [level, count] of Object.entries(requiredGems)) {
        // 보석 이름 생성 (예: "7레벨 멸화의 보석", "레벨 7 홍염의 보석" 등)
        const gemNames = [
          `${level}레벨 멸화의 보석`,
          `${level}레벨 홍염의 보석`,
          `레벨 ${level} 멸화의 보석`,
          `레벨 ${level} 홍염의 보석`
        ];
        
        // 각 이름으로 검색 시도
        let gemPrice = null;
        for (const gemName of gemNames) {
          const searchResults = await searchItem(gemName);
          if (searchResults && searchResults.length > 0) {
            // 가장 저렴한 보석 선택
            const cheapestGem = searchResults.sort((a, b) => a.currentMinPrice - b.currentMinPrice)[0];
            gemPrice = cheapestGem.currentMinPrice;
            break;
          }
        }
        
        // 보석 가격을 찾았으면 비용 계산
        if (gemPrice !== null) {
          materialCost += gemPrice * count;
        } else {
          // API에서 가격을 찾지 못한 경우 기본 추정값 사용
          const estimatedPrice = 500 * Math.pow(3, parseInt(level));
          materialCost += estimatedPrice * count;
        }
      }
      
      return {
        gold: totalGold,
        materialCost: materialCost,
        totalCost: totalGold + materialCost,
        materials: requiredGems
      };
    } catch (error) {
      console.error('보석 업그레이드 비용 계산 중 오류 발생:', error);
      // 오류 발생 시 추정치 반환
      return {
        gold: totalGold,
        materialCost: '가격 조회 실패',
        totalCost: totalGold,
        materials: requiredGems,
        error: '재료 가격 조회 중 오류가 발생했습니다.'
      };
    }
  }

  /**
   * 장신구 업그레이드 비용 계산 함수
   * @param {number} currentQuality - 현재 품질
   * @param {number} targetQuality - 목표 품질
   * @returns {Promise} - 업그레이드 예상 비용
   */
  async function calculateAccessoryUpgradeCost(currentQuality, targetQuality) {
    // 장신구 품질 개선 시스템 추정 (평균적인 시도 횟수로 계산)
    if (currentQuality >= targetQuality) return { gold: 0, materials: {} };
    
    // 품질 구간별 성공 확률 및 비용
    const qualityUpgradeInfo = {
      basic: {
        costPerAttempt: 1000,
        avgAttemptsPerTier: {
          low: 5,    // 0-30 → 30-70
          medium: 8,  // 30-70 → 70-90
          high: 15,   // 70-90 → 90-100
          perfect: 30 // 90-99 → 100
        }
      }
    };
    
    // 현재 및 목표 품질의 티어 결정
    function getQualityTier(quality) {
      if (quality < 30) return 'low';
      if (quality < 70) return 'medium';
      if (quality < 90) return 'high';
      if (quality < 100) return 'perfect';
      return 'perfect';
    }
    
    const currentTier = getQualityTier(currentQuality);
    const targetTier = getQualityTier(targetQuality);
    
    // 티어별 필요 시도 횟수 및 비용 계산
    let totalAttempts = 0;
    const tiers = ['low', 'medium', 'high', 'perfect'];
    const currentTierIndex = tiers.indexOf(currentTier);
    const targetTierIndex = tiers.indexOf(targetTier);
    
    // 각 티어 단계별로 필요한 시도 횟수 합산
    for (let i = currentTierIndex; i < targetTierIndex; i++) {
      totalAttempts += qualityUpgradeInfo.basic.avgAttemptsPerTier[tiers[i]];
    }
    
    // 같은 티어 내에서의 품질 상승은 부분적인 시도만 필요
    if (currentTier === targetTier && currentQuality < targetQuality) {
      const tierRange = {
        low: 30,
        medium: 40,
        high: 20,
        perfect: 10
      };
      
      const rangeStart = currentTier === 'low' ? 0 : 
                         currentTier === 'medium' ? 30 :
                         currentTier === 'high' ? 70 : 90;
      
      const rangeSize = tierRange[currentTier];
      const progressWithinTier = (targetQuality - currentQuality) / rangeSize;
      
      totalAttempts += Math.ceil(qualityUpgradeInfo.basic.avgAttemptsPerTier[currentTier] * progressWithinTier);
    }
    
    // 최종 비용 계산
    const totalGold = totalAttempts * qualityUpgradeInfo.basic.costPerAttempt;
    
    return {
      gold: totalGold,
      attempts: totalAttempts,
      materials: { '품질 개선 재료': totalAttempts }
    };
  }

  /**
   * 장비 업그레이드 비용 계산 함수
   * @param {number} currentLevel - 현재 레벨
   * @param {number} targetLevel - 목표 레벨
   * @returns {Promise} - 업그레이드 예상 비용
   */
  async function calculateArmorUpgradeCost(currentLevel, targetLevel) {
    // 장비 강화 비용 계산 (간소화된 추정)
    if (currentLevel >= targetLevel) return { gold: 0, materials: {} };
    
    // 티어 및 단계별 추정 비용 (실제 게임의 복잡한 확률 및 재료 요구사항 대신 간소화)
    const upgradeCostPerLevel = {
      // 1단계부터 25단계까지의 추정 비용
      1: 100, 2: 200, 3: 300, 4: 400, 5: 500,
      6: 800, 7: 1000, 8: 1200, 9: 1500, 10: 2000,
      11: 3000, 12: 4000, 13: 5000, 14: 6000, 15: 8000,
      16: 10000, 17: 12000, 18: 15000, 19: 18000, 20: 22000,
      21: 28000, 22: 35000, 23: 45000, 24: 60000, 25: 80000
    };
    
    let totalGold = 0;
    let materials = {};
    
    // 각 레벨별 비용 합산
    for (let level = currentLevel; level < targetLevel; level++) {
      if (upgradeCostPerLevel[level + 1]) {
        totalGold += upgradeCostPerLevel[level + 1];
        
        // 재료 추정 (실제 게임의 다양한 재료 대신 간소화)
        const materialPerLevel = {
          '파괴석': Math.floor(upgradeCostPerLevel[level + 1] / 100),
          '수호석': Math.floor(upgradeCostPerLevel[level + 1] / 80),
          '명예의 파편': upgradeCostPerLevel[level + 1] * 10,
          '위대한 명예의 돌파석': level >= 14 ? Math.ceil((level - 13) / 2) : 0
        };
        
        // 재료 누적
        for (const [mat, count] of Object.entries(materialPerLevel)) {
          if (!materials[mat]) materials[mat] = 0;
          materials[mat] += count;
        }
      }
    }
    
    return {
      gold: totalGold,
      materials: materials
    };
  }

  /**
   * API 연결 테스트 함수
   * @returns {Promise<boolean>} - 연결 성공 여부
   */
  async function testConnection() {
    if (!config.apiKey) {
      console.error('API 키가 설정되지 않았습니다.');
      return false;
    }

    try {
      // 카테고리 API를 호출하여 연결 테스트
      const categories = await apiRequest(config.endpoints.categories);
      
      if (categories && Array.isArray(categories)) {
        console.log('API 연결 테스트 성공:', categories.length, '개의 카테고리 확인됨');
        return true;
      } else {
        console.error('API 연결 테스트 실패: 유효한 응답을 받지 못했습니다.');
        return false;
      }
    } catch (error) {
      console.error('API 연결 테스트 실패:', error);
      return false;
    }
  }

  // 모듈 초기화 함수
  function initialize() {
    loadApiKey(() => {
      console.log('로스트아크 API 모듈이 초기화되었습니다.');
    });
  }

  // 공개 API
  return {
    initialize,
    setApiKey,
    testConnection,
    searchItem,
    getItemPrice,
    calculateUpgradeCost,
    calculateGemUpgradeCost,
    calculateAccessoryUpgradeCost,
    calculateArmorUpgradeCost
  };
})();

// 모듈 자동 초기화
LopecScanner.API.LostArkAPI.initialize();
