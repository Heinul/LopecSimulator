/**
 * 골드 소요량 계산 모듈
 * 로스트아크 API와 연동하여 스펙업에 필요한 골드를 계산합니다.
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.API = window.LopecScanner.API || {};

// 골드 계산 모듈
LopecScanner.API.GoldCalculator = (function() {
  // 종류별 기본 가격 데이터 (API 오류 대비용)
  const defaultPrices = {
    // 보석 레벨별 기본 가격
    gems: {
      1: 50,
      2: 100,
      3: 300,
      4: 900,
      5: 2700,
      6: 8000,
      7: 24000,
      8: 70000,
      9: 210000,
      10: 630000
    },
    // 장비 강화 재료 기본 가격
    materials: {
      '파괴석 결정': 2,
      '수호석 결정': 2,
      '명예의 파편': 0.1,
      '위대한 명예의 돌파석': 80,
      '경이로운 명예의 돌파석': 150
    },
    // 장신구 품질 개선 비용
    accessoryQualityCost: 1000 // 1회 시도 비용
  };

  // API 가격 정보 캐시
  const priceCache = {
    items: {},
    lastUpdate: {}
  };

  // 캐시 만료 시간 (1시간)
  const CACHE_EXPIRATION = 3600000;

  /**
   * 스펙업 요소의 골드 소요량 계산 함수
   * @param {Object} specUpInfo - 스펙업 정보 (타입, 현재값, 목표값 등)
   * @returns {Promise<Object>} - 골드 소요량 정보
   */
  async function calculateSpecUpCost(specUpInfo) {
    // API 사용 가능 여부 확인
    const apiAvailable = await isApiAvailable();
    
    // 요소 종류에 따라 계산 함수 분기
    switch (specUpInfo.type) {
      case 'gem':
        return await calculateGemCost(specUpInfo, apiAvailable);
      
      case 'accessory':
        return await calculateAccessoryCost(specUpInfo, apiAvailable);
      
      case 'armor':
        return await calculateArmorCost(specUpInfo, apiAvailable);
      
      case 'engraving':
        return await calculateEngravingCost(specUpInfo, apiAvailable);
      
      default:
        return {
          cost: 0,
          hasApiData: false,
          message: '지원하지 않는 스펙업 유형입니다.'
        };
    }
  }

  /**
   * API 사용 가능 여부 확인
   * @returns {Promise<boolean>} - API 사용 가능 여부
   */
  async function isApiAvailable() {
    try {
      console.log('[GoldCalculator] API 가용성 확인 시작');
      
      // API 키 바로 가져오기
      const apiKey = await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          resolve(result.lostarkApiKey || null);
        });
      });
      
      if (!apiKey) {
        console.log('[GoldCalculator] API 키가 없습니다');
        return false;
      }
      
      console.log('[GoldCalculator] API 키 확인 성공:', apiKey.substring(0, 5) + '...');
      
      // 여러 API 모듈 순서대로 시도
      let isConnected = false;
      
      // 1. API 래퍼
      if (!isConnected && window.LopecScanner.API.ApiWrapper) {
        console.log('[GoldCalculator] API 래퍼로 연결 시도');
        isConnected = await window.LopecScanner.API.ApiWrapper.testConnection();
        if (isConnected) {
          console.log('[GoldCalculator] API 래퍼 연결 성공');
          return true;
        }
      }
      
      // 2. 새 API 핸들러
      if (!isConnected && window.LopecScanner.API.LostArkHandler) {
        console.log('[GoldCalculator] 새 API 핸들러로 연결 시도');
        isConnected = await window.LopecScanner.API.LostArkHandler.testConnection();
        if (isConnected) {
          console.log('[GoldCalculator] 새 API 핸들러 연결 성공');
          return true;
        }
      }
      
      // 3. 기존 API 모듈
      if (!isConnected && window.LopecScanner.API.LostArkAPI) {
        console.log('[GoldCalculator] 기존 API 모듈로 연결 시도');
        isConnected = await window.LopecScanner.API.LostArkAPI.testConnection();
        if (isConnected) {
          console.log('[GoldCalculator] 기존 API 모듈 연결 성공');
          return true;
        }
      }
      
      console.log('[GoldCalculator] 모든 API 연결 시도 실패');
      return false;
    } catch (error) {
      console.error('[GoldCalculator] API 가용성 확인 중 오류 발생:', error);
      return false;
    }
  }

  /**
   * 보석 스펙업 비용 계산
   * @param {Object} gemInfo - 보석 정보
   * @param {boolean} apiAvailable - API 사용 가능 여부
   * @returns {Promise<Object>} - 비용 정보
   */
  async function calculateGemCost(gemInfo, apiAvailable) {
    const currentLevel = parseInt(gemInfo.from) || 1;
    const targetLevel = parseInt(gemInfo.to) || currentLevel;
    
    // 변동이 없는 경우
    if (currentLevel >= targetLevel) {
      return { cost: 0, hasApiData: false, message: '레벨 변동이 없습니다.' };
    }
    
    // API를 사용할 수 있으면 정확한 가격 계산
    if (apiAvailable) {
      try {
        // 새 API 핸들러 사용 시도
        if (window.LopecScanner.API.LostArkHandler) {
          // 각 레벨별 소요 보석 계산
          let totalGoldCost = 0;
          const gemRequirements = {};
          let fusionCost = 0;
          
          // 보석 합성 계산 (3개의 보석 = 1개의 상위 레벨 보석)
          for (let level = currentLevel; level < targetLevel; level++) {
            // 한 단계 업그레이드에 필요한 보석 수
            const gemsNeeded = Math.pow(3, targetLevel - level - 1);
            
            if (!gemRequirements[level]) {
              gemRequirements[level] = 0;
            }
            
            gemRequirements[level] += gemsNeeded;
            
            // 합성 비용 (레벨별로 다름)
            const levelFusionCost = 500 * (level + 1) * gemsNeeded;
            fusionCost += levelFusionCost;
            
            // 보석 가격 조회 시도
            try {
              // 모든 종류의 보석 시세 조회 (API로)
              const gemPrice = await window.LopecScanner.API.LostArkHandler.getGemPrice(level);
              if (gemPrice && gemPrice.prices && gemPrice.prices.length > 0) {
                // 가격 계산
                const priceInfo = gemPrice.prices.sort((a, b) => a.CurrentMinPrice - b.CurrentMinPrice)[0];
                const gemCost = priceInfo.CurrentMinPrice * gemsNeeded;
                totalGoldCost += gemCost;
              } else {
                // 가격 정보가 없으면 기본값 사용
                const estimatedGemPrice = 500 * Math.pow(3, level);
                totalGoldCost += estimatedGemPrice * gemsNeeded;
              }
            } catch (e) {
              // 가격 조회 실패 시 기본값 사용
              const estimatedGemPrice = 500 * Math.pow(3, level);
              totalGoldCost += estimatedGemPrice * gemsNeeded;
            }
          }
          
          return {
            cost: totalGoldCost + fusionCost,
            fusionCost: fusionCost,
            materialCost: totalGoldCost,
            materials: gemRequirements,
            hasApiData: true,
            message: '시장 API 데이터 기준으로 계산되었습니다.'
          };
        }
        
        // 기존 API 처리
        if (LopecScanner.API.LostArkAPI) {
          const costInfo = await LopecScanner.API.LostArkAPI.calculateGemUpgradeCost(currentLevel, targetLevel);
          
          return {
            cost: costInfo.totalCost,
            fusionCost: costInfo.gold,
            materialCost: costInfo.materialCost,
            materials: costInfo.materials,
            hasApiData: true,
            message: '시장 API 데이터 기준으로 계산되었습니다.'
          };
        }
      } catch (error) {
        console.error('[GoldCalculator] 보석 비용 계산 중 API 오류:', error);
        // API 오류 시 기본 계산 사용
      }
    }
    
    // API 사용 불가 시 기본 추정값 계산
    let totalCost = 0;
    const requiredGems = {};
    
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
      totalCost += fusionCost * gemsNeeded;
      
      // 기본 보석 가격 비용 추가
      if (defaultPrices.gems[level]) {
        totalCost += defaultPrices.gems[level] * gemsNeeded;
      }
    }
    
    return {
      cost: totalCost,
      materials: requiredGems,
      hasApiData: false,
      message: '기본 추정값으로 계산되었습니다. 정확한 계산을 위해 API 키를 설정해주세요.'
    };
  }

  /**
   * 장신구 스펙업 비용 계산
   * @param {Object} accessoryInfo - 장신구 정보
   * @param {boolean} apiAvailable - API 사용 가능 여부
   * @returns {Promise<Object>} - 비용 정보
   */
  async function calculateAccessoryCost(accessoryInfo, apiAvailable) {
    // 옵션 변경인 경우 (새 장신구 구매)
    if (accessoryInfo.item.includes('옵션')) {
      return await calculateAccessoryOptionCost(accessoryInfo, apiAvailable);
    }
    
    // 품질 개선인 경우
    if (accessoryInfo.item.includes('품질')) {
      return await calculateAccessoryQualityCost(accessoryInfo, apiAvailable);
    }
    
    return {
      cost: 0,
      hasApiData: false,
      message: '지원하지 않는 장신구 스펙업 유형입니다.'
    };
  }

  /**
   * 장신구 옵션 변경 비용 계산
   * @param {Object} accessoryInfo - 장신구 정보
   * @param {boolean} apiAvailable - API 사용 가능 여부
   * @returns {Promise<Object>} - 비용 정보
   */
  async function calculateAccessoryOptionCost(accessoryInfo, apiAvailable) {
    // 장신구 종류 추출 (예: "목걸이 옵션1" -> "목걸이")
    const accessoryType = accessoryInfo.item.split(' ')[0];
    
    // 새로운 옵션 값
    const newOption = accessoryInfo.to;
    
    // API를 사용할 수 있으면 정확한 가격 조회
    if (apiAvailable) {
      try {
        // 장신구 검색어 생성 (예: "전설 목걸이 치명", "유물 귀걸이 신속" 등)
        const searchQueries = [
          `전설 ${accessoryType} ${newOption}`,
          `유물 ${accessoryType} ${newOption}`,
          `고대 ${accessoryType} ${newOption}`,
          `${newOption} ${accessoryType}`
        ];
        
        let bestResult = null;
        
        // 여러 검색어로 시도
        for (const query of searchQueries) {
          if (priceCache.items[query] && (Date.now() - priceCache.lastUpdate[query] < CACHE_EXPIRATION)) {
            bestResult = priceCache.items[query];
            console.log(`캐시에서 장신구 가격 로드: ${query}`);
            break;
          }
          
          const searchResults = await LopecScanner.API.LostArkAPI.searchItem(query);
          
          if (searchResults && searchResults.length > 0) {
            // 가격 기준 정렬
            const sortedResults = searchResults.sort((a, b) => a.currentMinPrice - b.currentMinPrice);
            
            // 상위 20%의 평균 가격 계산
            const topResults = sortedResults.slice(0, Math.max(1, Math.floor(sortedResults.length * 0.2)));
            const avgPrice = topResults.reduce((sum, item) => sum + item.currentMinPrice, 0) / topResults.length;
            
            bestResult = {
              minPrice: sortedResults[0].currentMinPrice,
              avgPrice: avgPrice,
              sampleSize: topResults.length
            };
            
            // 캐시에 결과 저장
            priceCache.items[query] = bestResult;
            priceCache.lastUpdate[query] = Date.now();
            break;
          }
        }
        
        if (bestResult) {
          return {
            cost: bestResult.avgPrice,
            minPrice: bestResult.minPrice,
            sampleSize: bestResult.sampleSize,
            hasApiData: true,
            message: '시장 평균 가격으로 계산되었습니다.'
          };
        }
      } catch (error) {
        console.error('장신구 옵션 비용 계산 중 API 오류:', error);
      }
    }
    
    // API 사용 불가 시 기본 추정값 계산 (장신구 유형 및 옵션에 따라 다름)
    let baseCost = 0;
    
    switch (accessoryType) {
      case '목걸이':
        baseCost = 15000;
        break;
      case '귀걸이':
        baseCost = 8000;
        break;
      case '반지':
        baseCost = 10000;
        break;
      default:
        baseCost = 10000;
    }
    
    // 인기 옵션에 따른 가격 조정
    const popularStats = ['치명', '특화', '신속'];
    if (popularStats.some(stat => newOption.includes(stat))) {
      baseCost *= 1.5;
    }
    
    return {
      cost: baseCost,
      hasApiData: false,
      message: '기본 추정값으로 계산되었습니다. 정확한 계산을 위해 API 키를 설정해주세요.'
    };
  }

  /**
   * 장신구 품질 개선 비용 계산
   * @param {Object} accessoryInfo - 장신구 정보
   * @param {boolean} apiAvailable - API 사용 가능 여부
   * @returns {Promise<Object>} - 비용 정보
   */
  async function calculateAccessoryQualityCost(accessoryInfo, apiAvailable) {
    const currentQuality = parseInt(accessoryInfo.from) || 0;
    const targetQuality = parseInt(accessoryInfo.to) || currentQuality;
    
    // 변동이 없는 경우
    if (currentQuality >= targetQuality) {
      return { cost: 0, hasApiData: false, message: '품질 변동이 없습니다.' };
    }
    
    // API를 사용할 수 있으면 정확한 계산
    if (apiAvailable) {
      try {
        const costInfo = await LopecScanner.API.LostArkAPI.calculateAccessoryUpgradeCost(currentQuality, targetQuality);
        
        return {
          cost: costInfo.gold,
          attempts: costInfo.attempts,
          hasApiData: true,
          message: '평균 시도 횟수 기준으로 계산되었습니다.'
        };
      } catch (error) {
        console.error('장신구 품질 비용 계산 중 API 오류:', error);
      }
    }
    
    // API 사용 불가 시 기본 추정값 계산
    // 품질 구간별 평균 시도 횟수
    const qualityAttempts = {
      // 시작 → 목표: 평균 시도 횟수
      '0-30': { '30-70': 5, '70-90': 13, '90-100': 28 },
      '30-70': { '70-90': 8, '90-100': 23 },
      '70-90': { '90-100': 15 },
      '90-99': { '100': 30 }
    };
    
    // 현재 및 목표 품질 구간 결정
    function getQualityRange(quality) {
      if (quality < 30) return '0-30';
      if (quality < 70) return '30-70';
      if (quality < 90) return '70-90';
      if (quality < 100) return '90-99';
      return '100';
    }
    
    const currentRange = getQualityRange(currentQuality);
    const targetRange = getQualityRange(targetQuality);
    
    // 목표 구간까지의 시도 횟수 계산
    let totalAttempts = 0;
    const rangeOrder = ['0-30', '30-70', '70-90', '90-99', '100'];
    
    const currentIndex = rangeOrder.indexOf(currentRange);
    const targetIndex = rangeOrder.indexOf(targetRange);
    
    // 각 구간별 시도 횟수 합산
    for (let i = currentIndex; i < targetIndex; i++) {
      const fromRange = rangeOrder[i];
      const toRange = rangeOrder[i + 1];
      
      if (qualityAttempts[fromRange] && qualityAttempts[fromRange][toRange]) {
        totalAttempts += qualityAttempts[fromRange][toRange];
      }
    }
    
    // 같은 구간 내 부분 상승인 경우 비율 계산
    if (currentIndex === targetIndex - 1) {
      const fromRange = rangeOrder[currentIndex];
      const toRange = rangeOrder[targetIndex];
      
      // 구간 범위 계산
      const rangeStart = fromRange.split('-')[0];
      const rangeEnd = fromRange.split('-')[1] || fromRange;
      
      const rangeSizeTotal = parseInt(rangeEnd) - parseInt(rangeStart);
      const progression = (targetQuality - currentQuality) / rangeSizeTotal;
      
      // 부분 진행에 따른 시도 횟수 조정
      if (qualityAttempts[fromRange] && qualityAttempts[fromRange][toRange]) {
        totalAttempts = qualityAttempts[fromRange][toRange] * progression;
      }
    }
    
    // 비용 계산 (기본 1회 시도 비용: 1000골드)
    const totalCost = Math.ceil(totalAttempts * defaultPrices.accessoryQualityCost);
    
    return {
      cost: totalCost,
      attempts: Math.ceil(totalAttempts),
      hasApiData: false,
      message: '기본 추정값으로 계산되었습니다. 정확한 계산을 위해 API 키를 설정해주세요.'
    };
  }

  /**
   * 장비 스펙업 비용 계산
   * @param {Object} armorInfo - 장비 정보
   * @param {boolean} apiAvailable - API 사용 가능 여부
   * @returns {Promise<Object>} - 비용 정보
   */
  async function calculateArmorCost(armorInfo, apiAvailable) {
    const currentLevel = parseInt(armorInfo.from) || 0;
    const targetLevel = parseInt(armorInfo.to) || currentLevel;
    
    // 변동이 없는 경우
    if (currentLevel >= targetLevel) {
      return { cost: 0, hasApiData: false, message: '강화 레벨 변동이 없습니다.' };
    }
    
    // API를 사용할 수 있으면 정확한 계산
    if (apiAvailable) {
      try {
        const costInfo = await LopecScanner.API.LostArkAPI.calculateArmorUpgradeCost(currentLevel, targetLevel);
        
        return {
          cost: costInfo.gold,
          materials: costInfo.materials,
          hasApiData: true,
          message: '재료 비용 및 수수료를 포함하여 계산되었습니다.'
        };
      } catch (error) {
        console.error('장비 비용 계산 중 API 오류:', error);
      }
    }
    
    // API 사용 불가 시 기본 추정값 계산
    // 강화 단계별 기본 비용 추정
    const upgradeCostPerLevel = {
      // 1단계부터 25단계까지의 추정 비용
      1: 100, 2: 200, 3: 300, 4: 400, 5: 500,
      6: 800, 7: 1000, 8: 1200, 9: 1500, 10: 2000,
      11: 3000, 12: 4000, 13: 5000, 14: 6000, 15: 8000,
      16: 10000, 17: 12000, 18: 15000, 19: 18000, 20: 22000,
      21: 28000, 22: 35000, 23: 45000, 24: 60000, 25: 80000
    };
    
    let totalCost = 0;
    
    // 각 레벨별 비용 합산
    for (let level = currentLevel; level < targetLevel; level++) {
      if (upgradeCostPerLevel[level + 1]) {
        totalCost += upgradeCostPerLevel[level + 1];
      }
    }
    
    return {
      cost: totalCost,
      hasApiData: false,
      message: '기본 추정값으로 계산되었습니다. 정확한 계산을 위해 API 키를 설정해주세요.'
    };
  }

  /**
   * 각인 비용 계산
   * @param {Object} engravingInfo - 각인 정보
   * @param {boolean} apiAvailable - API 사용 가능 여부
   * @returns {Promise<Object>} - 비용 정보
   */
  async function calculateEngravingCost(engravingInfo, apiAvailable) {
    const currentLevel = parseInt(engravingInfo.from) || 0;
    const targetLevel = parseInt(engravingInfo.to) || currentLevel;
    const engravingName = engravingInfo.item || '';
    
    // 변동이 없는 경우
    if (currentLevel >= targetLevel) {
      return { cost: 0, hasApiData: false, message: '각인 레벨 변동이 없습니다.' };
    }
    
    // 필요한 각인서 수량 계산
    const booksNeeded = (targetLevel - currentLevel) * 20; // 레벨 당 20개 필요
    
    // API를 사용할 수 있으면 정확한 가격 조회
    if (apiAvailable && engravingName) {
      try {
        // 각인서 검색어 생성
        const searchQueries = [
          `전설 각인서 ${engravingName}`,
          `${engravingName} 전설 각인서`,
          `${engravingName} 각인서`
        ];
        
        let bestResult = null;
        
        // 여러 검색어로 시도
        for (const query of searchQueries) {
          if (priceCache.items[query] && (Date.now() - priceCache.lastUpdate[query] < CACHE_EXPIRATION)) {
            bestResult = priceCache.items[query];
            console.log(`캐시에서 각인서 가격 로드: ${query}`);
            break;
          }
          
          const searchResults = await LopecScanner.API.LostArkAPI.searchItem(query);
          
          if (searchResults && searchResults.length > 0) {
            // 가격 기준 정렬
            const sortedResults = searchResults.sort((a, b) => a.currentMinPrice - b.currentMinPrice);
            
            bestResult = {
              minPrice: sortedResults[0].currentMinPrice,
              itemName: sortedResults[0].name
            };
            
            // 캐시에 결과 저장
            priceCache.items[query] = bestResult;
            priceCache.lastUpdate[query] = Date.now();
            break;
          }
        }
        
        if (bestResult) {
          const totalCost = bestResult.minPrice * booksNeeded;
          
          return {
            cost: totalCost,
            bookPrice: bestResult.minPrice,
            booksNeeded: booksNeeded,
            bookName: bestResult.itemName,
            hasApiData: true,
            message: '현재 시장 가격으로 계산되었습니다.'
          };
        }
      } catch (error) {
        console.error('각인 비용 계산 중 API 오류:', error);
      }
    }
    
    // API 사용 불가 시 기본 추정값 계산
    // 인기도에 따른 각인 기본 가격
    const popularEngravings = [
      '원한', '예리한 둔기', '저주받은 인형', '기습의 대가', '슈퍼 차지',
      '아드레날린', '정밀 단도', '타격의 대가', '돌격대장', '각성'
    ];
    
    const mediumEngravings = [
      '마나 효율 증가', '속전속결', '최대 마나 증가', '중갑 착용',
      '결투의 대가', '달인의 저력', '환류', '전문의'
    ];
    
    let bookBasePrice = 1000; // 기본 가격
    
    if (popularEngravings.some(eng => engravingName.includes(eng))) {
      bookBasePrice = 8000; // 인기 각인
    } else if (mediumEngravings.some(eng => engravingName.includes(eng))) {
      bookBasePrice = 3000; // 중간 인기 각인
    }
    
    const totalCost = bookBasePrice * booksNeeded;
    
    return {
      cost: totalCost,
      booksNeeded: booksNeeded,
      hasApiData: false,
      message: '기본 추정값으로 계산되었습니다. 정확한 계산을 위해 API 키를 설정해주세요.'
    };
  }

  /**
   * 캐시 데이터 내보내기
   * @returns {Object} - 캐시 데이터
   */
  function exportCacheData() {
    return {
      items: { ...priceCache.items },
      timestamp: { ...priceCache.lastUpdate }
    };
  }

  /**
   * 캐시 데이터 가져오기
   * @param {Object} data - 캐시 데이터
   */
  function importCacheData(data) {
    if (data && data.items) {
      priceCache.items = { ...data.items };
    }
    if (data && data.timestamp) {
      priceCache.lastUpdate = { ...data.timestamp };
    }
  }

  // 초기화 함수
  function initialize() {
    // 저장된 캐시 데이터 불러오기
    chrome.storage.local.get(['apiPriceCache'], function(result) {
      if (result.apiPriceCache) {
        importCacheData(result.apiPriceCache);
        console.log('저장된 API 가격 캐시를 불러왔습니다.');
      }
    });
    
    console.log('골드 계산 모듈이 초기화되었습니다.');
  }

  // 정기적인 캐시 저장
  function saveCache() {
    chrome.storage.local.set({ apiPriceCache: exportCacheData() }, function() {
      console.log('API 가격 캐시가 저장되었습니다.');
    });
  }

  // 15분마다 캐시 저장
  setInterval(saveCache, 900000);

  // 공개 API
  return {
    initialize,
    calculateSpecUpCost,
    isApiAvailable
  };
})();

// 모듈 자동 초기화
LopecScanner.API.GoldCalculator.initialize();
