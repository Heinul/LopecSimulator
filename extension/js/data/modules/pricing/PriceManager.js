/**
 * 가격 관리 모듈
 * 보석, 각인서, 악세서리 가격 정보를 검색하고 관리합니다.
 */

// 가격 관리자 모듈
const PriceManager = (function() {
  // 가격 데이터 캐시 (세션 기간 동안 유지)
  let priceCache = {
    gems: {},      // 보석 가격
    engravings: {}, // 각인서 가격
    accessories: {} // 악세서리 가격
  };

  /**
   * API 키 가져오기
   * @returns {Promise<string>} API 키 문자열 반환
   */
  async function getApiKey() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['lostarkApiKey'], function(result) {
        resolve(result && result.lostarkApiKey ? result.lostarkApiKey : null);
      });
    });
  }

  /**
   * 보석 가격 검색
   * @param {string} gemType - 보석 종류 (겁화, 작열, 멸화, 홍염)
   * @param {number} level - 보석 레벨
   * @returns {Promise<number>} 보석 가격
   */
  async function getGemPrice(gemType, level) {
    const cacheKey = `${gemType}_${level}`;
    
    // 캐시된 데이터가 있으면 반환
    if (priceCache.gems[cacheKey] !== undefined) {
      console.log(`[캐시] 보석 가격 반환: ${gemType} ${level}레벨 - ${priceCache.gems[cacheKey]}G`);
      return priceCache.gems[cacheKey];
    }
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다.');
      }
      
      // 보석 이름 조합
      let gemName = "";
      if (gemType === "겁화") {
        gemName = `레벨 ${level} 겁화의 보석`;
      } else if (gemType === "작열") {
        gemName = `레벨 ${level} 작열의 보석`;
      } else if (gemType === "멸화") {
        gemName = `레벨 ${level} 멸화의 보석`;
      } else if (gemType === "홍염") {
        gemName = `레벨 ${level} 홍염의 보석`;
      } else {
        throw new Error('알 수 없는 보석 종류입니다.');
      }
      
      // API 요청 작성
      const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.auctionItems;
      const requestBody = {
        ItemLevelMin: 0,
        ItemLevelMax: 0,
        ItemGradeQuality: null,
        ItemName: gemName,
        CategoryCode: API_CONFIG.categoryCodes.auction.gem,
        Sort: "BIDSTART_PRICE",
        SortCondition: "ASC",
        PageNo: 1
      };
      
      // API 요청 수행
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'authorization': `bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.Items || data.Items.length === 0) {
        throw new Error('검색 결과가 없습니다.');
      }
      
      // 최저가 저장
      const price = data.Items[0].AuctionInfo.BuyPrice;
      priceCache.gems[cacheKey] = price;
      
      console.log(`[API] 보석 가격 검색 성공: ${gemName} - ${price}G`);
      return price;
    } catch (error) {
      console.error(`보석 가격 검색 오류:`, error);
      return 0;
    }
  }
  
  /**
   * 각인서 가격 검색
   * @param {string} engravingName - 각인서 이름
   * @param {string} grade - 각인서 등급 (전설, 영웅, 희귀, 고급)
   * @returns {Promise<number>} 각인서 가격
   */
  async function getEngravingPrice(engravingName, grade) {
    const cacheKey = `${engravingName}_${grade}`;
    
    // 캐시된 데이터가 있으면 반환
    if (priceCache.engravings[cacheKey] !== undefined) {
      console.log(`[캐시] 각인서 가격 반환: ${engravingName} ${grade} - ${priceCache.engravings[cacheKey]}G`);
      return priceCache.engravings[cacheKey];
    }
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다.');
      }
      
      // 각인서 완전한 이름 조합
      const fullName = `[${engravingName}] 각인서`;
      
      // 등급에 따른 코드 매핑
      let itemGrade;
      switch (grade) {
        case '전설':
          itemGrade = API_CONFIG.itemGrades.legendary;
          break;
        case '영웅':
          itemGrade = API_CONFIG.itemGrades.epic;
          break;
        case '희귀':
          itemGrade = "희귀"; // 필요 시 API_CONFIG에 추가
          break;
        case '고급':
          itemGrade = "고급"; // 필요 시 API_CONFIG에 추가
          break;
        default:
          itemGrade = API_CONFIG.itemGrades.legendary;
      }
      
      // API 요청 작성
      const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.marketItems;
      const requestBody = {
        Sort: "GRADE",
        CategoryCode: API_CONFIG.categoryCodes.market.engraving,
        ItemName: fullName,
        ItemGrade: itemGrade,
        SortCondition: "ASC",
        PageNo: 1
      };
      
      // API 요청 수행
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'authorization': `bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.Items || data.Items.length === 0) {
        throw new Error('검색 결과가 없습니다.');
      }
      
      // 최저가 저장
      const price = data.Items[0].CurrentMinPrice;
      priceCache.engravings[cacheKey] = price;
      
      console.log(`[API] 각인서 가격 검색 성공: ${fullName} ${grade} - ${price}G`);
      return price;
    } catch (error) {
      console.error(`각인서 가격 검색 오류:`, error);
      return 0;
    }
  }
  
  /**
   * 악세서리 가격 검색
   * @param {Object} options - 악세서리 옵션
   * @param {string} options.type - 악세서리 종류 (목걸이, 귀걸이, 반지)
   * @param {string} options.grade - 악세서리 등급 (고대, 유물, 전설)
   * @param {string} options.stat1 - 첫 번째 특성 (치명, 특화, 신속, 제압, 인내, 숙련)
   * @param {string} options.stat2 - 두 번째 특성 (목걸이 전용)
   * @param {string} options.quality - 악세서리 품질 (상상, 상중, 상하, 중중, 중하, 하하)
   * @param {Array} options.engravings - 각인 배열 [{name: '원한', value: 3}, {name: '예리한 둔기', value: 5}]
   * @param {number} options.penaltyValue - 감소 각인 수치
   * @returns {Promise<number>} 악세서리 가격
   */
  async function getAccessoryPrice(options) {
    // 캐시 키 생성 (JSON 문자열로 변환)
    const cacheKey = JSON.stringify(options);
    
    // 캐시된 데이터가 있으면 반환
    if (priceCache.accessories[cacheKey] !== undefined) {
      console.log(`[캐시] 악세서리 가격 반환: ${options.type} ${options.quality} - ${priceCache.accessories[cacheKey]}G`);
      return priceCache.accessories[cacheKey];
    }
    
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('API 키가 설정되지 않았습니다.');
      }
      
      // 품질 범위 계산
      let qualityMin = 0;
      let qualityMax = 100;
      
      switch (options.quality) {
        case '상상': // 90-100
          qualityMin = 90;
          qualityMax = 100;
          break;
        case '상중': // 80-89
          qualityMin = 80;
          qualityMax = 89;
          break;
        case '상하': // 70-79
          qualityMin = 70;
          qualityMax = 79;
          break;
        case '중중': // 60-69
          qualityMin = 60;
          qualityMax = 69;
          break;
        case '중하': // 50-59
          qualityMin = 50;
          qualityMax = 59;
          break;
        case '하하': // 0-49
          qualityMin = 0;
          qualityMax = 49;
          break;
      }
      
      // 등급에 따른 코드 매핑
      let itemGrade;
      switch (options.grade) {
        case '고대':
          itemGrade = API_CONFIG.itemGrades.ancient;
          break;
        case '유물':
          itemGrade = API_CONFIG.itemGrades.relic;
          break;
        case '전설':
          itemGrade = API_CONFIG.itemGrades.legendary;
          break;
        default:
          itemGrade = API_CONFIG.itemGrades.relic;
      }
      
      // 각인 정보 구성
      const engravingOptions = [];
      
      // 옵션 배열이 있을 경우 처리
      if (options.engravings && options.engravings.length > 0) {
        options.engravings.forEach(engraving => {
          engravingOptions.push({
            "FirstOption": engraving.name,
            "SecondOption": engraving.value,
            "MinValue": engraving.value,
            "MaxValue": engraving.value
          });
        });
      }
      
      // 감소 효과가 있는 경우 (악세사리 검색에만 해당)
      if (options.penaltyName && options.penaltyValue) {
        engravingOptions.push({
          "FirstOption": options.penaltyName,
          "SecondOption": options.penaltyValue,
          "MinValue": options.penaltyValue,
          "MaxValue": options.penaltyValue
        });
      }
      
      // 특성 옵션 구성
      const statOptions = [];
      
      // 첫 번째 특성
      if (options.stat1) {
        statOptions.push({
          "FirstOption": options.stat1,
          "SecondOption": null,
          "MinValue": null,
          "MaxValue": null
        });
      }
      
      // 두 번째 특성 (목걸이인 경우)
      if (options.type === '목걸이' && options.stat2) {
        statOptions.push({
          "FirstOption": options.stat2,
          "SecondOption": null,
          "MinValue": null,
          "MaxValue": null
        });
      }
      
      // API 요청 작성
      const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.auctionItems;
      const requestBody = {
        ItemLevelMin: 0,
        ItemLevelMax: 9999,
        ItemGradeQuality: null,
        ItemGrade: itemGrade,
        ItemTier: 3,
        CategoryCode: API_CONFIG.categoryCodes.auction.accessory,
        EtcOptions: [
          {
            "FirstOption": "장비 분류",
            "SecondOption": options.type,
            "MinValue": null,
            "MaxValue": null
          }
        ],
        Sort: "BIDSTART_PRICE",
        SortCondition: "ASC",
        PageNo: 1,
        ItemGradeQualityMin: qualityMin,
        ItemGradeQualityMax: qualityMax
      };
      
      // 각인 및 특성 옵션 추가
      if (engravingOptions.length > 0) {
        requestBody.SkillOptions = engravingOptions;
      }
      
      if (statOptions.length > 0) {
        requestBody.Stats = statOptions;
      }
      
      // API 요청 수행
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'authorization': `bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      if (!data.Items || data.Items.length === 0) {
        // 검색 결과가 없는 경우 0원 반환
        priceCache.accessories[cacheKey] = 0;
        console.log(`[API] 악세서리 검색 결과 없음: ${options.type} ${options.quality}`);
        return 0;
      }
      
      // 최저가 저장
      const price = data.Items[0].AuctionInfo.BuyPrice;
      priceCache.accessories[cacheKey] = price;
      
      console.log(`[API] 악세서리 가격 검색 성공: ${options.type} ${options.quality} - ${price}G`);
      return price;
    } catch (error) {
      console.error(`악세서리 가격 검색 오류:`, error);
      return 0;
    }
  }
  
  /**
   * 각인서 총 골드 비용 계산
   * @param {string} engravingName - 각인서 이름
   * @param {string} fromGrade - 시작 등급 (전설, 영웅, 희귀, 고급)
   * @param {number} fromLevel - 시작 레벨 (0~3)
   * @param {string} toGrade - 목표 등급 (전설, 영웅, 희귀, 고급)
   * @param {number} toLevel - 목표 레벨 (0~3)
   * @returns {Promise<{gold: number, count: number}>} 필요 골드와 각인서 수량
   */
  async function calculateEngravingUpgradeCost(engravingName, fromGrade, fromLevel, toGrade, toLevel) {
    // 등급 순서
    const gradeOrder = ['고급', '희귀', '영웅', '전설'];
    
    // 등급 인덱스
    const fromGradeIndex = gradeOrder.indexOf(fromGrade);
    const toGradeIndex = gradeOrder.indexOf(toGrade);
    
    // 유효한 등급 확인
    if (fromGradeIndex === -1 || toGradeIndex === -1) {
      throw new Error('유효하지 않은 등급입니다.');
    }
    
    // 레벨 확인 (0~3 사이)
    if (fromLevel < 0 || fromLevel > 3 || toLevel < 0 || toLevel > 3) {
      throw new Error('유효하지 않은 레벨입니다.');
    }
    
    // 상향 조건 확인
    if (fromGradeIndex > toGradeIndex || (fromGradeIndex === toGradeIndex && fromLevel >= toLevel)) {
      throw new Error('상향 조건이 충족되지 않습니다.');
    }
    
    // 필요한 책 수량 계산
    let requiredBooks = 0;
    
    // 같은 등급 내 레벨 업그레이드
    if (fromGradeIndex === toGradeIndex) {
      requiredBooks = (toLevel - fromLevel) * 5;
    } else {
      // 시작 등급에서 다음 등급 0레벨까지 업그레이드
      requiredBooks = (3 - fromLevel) * 5;
      
      // 중간 등급들 건너뛰기
      for (let i = fromGradeIndex + 1; i < toGradeIndex; i++) {
        requiredBooks += 15; // 한 등급 전체 건너뛰기 (0->3)는 15장
      }
      
      // 마지막 등급에서 목표 레벨까지 업그레이드
      requiredBooks += toLevel * 5;
    }
    
    // 각인서 가격 조회
    const bookPrice = await getEngravingPrice(engravingName, fromGrade);
    
    // 총 비용 계산
    const totalCost = bookPrice * requiredBooks;
    
    return {
      gold: totalCost,
      count: requiredBooks
    };
  }
  
  /**
   * 캐시 데이터 초기화
   */
  function clearCache() {
    priceCache = {
      gems: {},
      engravings: {},
      accessories: {}
    };
    console.log('[캐시] 가격 데이터 캐시가 초기화되었습니다.');
  }

  // 공개 API
  return {
    getGemPrice,
    getEngravingPrice,
    getAccessoryPrice,
    calculateEngravingUpgradeCost,
    clearCache,
    initialize: function() {
      console.log('PriceManager 모듈 초기화됨');
      // 세션 시작 시 캐시 초기화
      clearCache();
    }
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', PriceManager.initialize);
