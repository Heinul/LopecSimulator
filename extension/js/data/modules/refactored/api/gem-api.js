/**
 * 보석 API 관련 함수 모음
 */
import API_CONFIG from '../APIConfig.js';
import CacheManager from '../APICache.js';

/**
 * 보석 타입 확인
 * @param {Object} item - 아이템 데이터
 * @returns {boolean} 보석 여부
 */
function isGemItem(item) {
  return item.type === 'gem';
}

/**
 * 보석 이름 정리 (예: "보석 (작열 슈웅 곰)" -> "9레벨 겁화")
 * @param {Object} item - 보석 아이템
 * @returns {string|null} 검색용 보석 이름
 */
function formatGemName(item) {
  let gemLevel = '';
  let gemType = '';
  
  // 정규식으로 보석 정보 추출
  const gemMatch = item.item.match(/보석 \(([가-힣]+) (.+)\)/);
  if (gemMatch && gemMatch.length >= 3) {
    gemType = gemMatch[1]; // 예: 작열
    
    // 보석 레벨 추출 (숫자+레벨 형식으로)
    if (item.to && item.to.match(/\d+레벨/)) {
      gemLevel = item.to; // 이미 "5레벨" 형식이면 그대로 사용
    } else if (item.to && item.to.match(/\d+/)) {
      // 숫자만 있으면 "레벨" 추가
      gemLevel = `${item.to}레벨`;
    } else {
      // 기본값 설정
      gemLevel = '7레벨';
      console.warn(`보석 레벨을 찾을 수 없어 기본값 ${gemLevel}로 설정합니다.`);
    }
    
    // 검색할 보석 이름 생성 (예: "7레벨 작열")
    return `${gemLevel} ${gemType}`;
  }
  
  console.warn(`보석 정보를 파싱할 수 없습니다: ${item.item}`);
  return null;
}

/**
 * 보석 API 요청 객체 구성
 * @param {string} gemName - 보석 이름
 * @returns {Object} API 요청 객체
 */
function buildGemRequestBody(gemName) {
  return {
    CategoryCode: API_CONFIG.categoryCodes.auction.gem,
    ItemName: gemName,
    PageNo: 1,
    Sort: "BUY_PRICE",
    SortCondition: "ASC"
  };
}

/**
 * 보석 아이템 처리
 * @param {Array} items - 보석 아이템 배열
 * @param {string} apiKey - API 키
 */
async function processGemItems(items, apiKey) {
  // 경매장 API로 보석 가격 조회
  const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.auctionItems;
  
  // 완료된 요청 추적 하기
  let completedRequests = 0;
  
  for (const item of items) {
    try {
      // 보석 이름 정리
      const searchGemName = formatGemName(item);
      if (!searchGemName) continue;
      
      console.log(`보석 검색: ${searchGemName}`);
      
      // 캐시에서 가격 확인
      const cachedPrice = CacheManager.get('gems', searchGemName);
      
      // 캐시된 값 사용
      if (cachedPrice) {
        console.log(`캐시에서 가격 가져옴: ${searchGemName} = ${cachedPrice}`);
        item.goldCost = cachedPrice;
        completedRequests++;
        continue; // 다음 아이템으로 진행
      }
      
      // API 요청 객체 생성
      const requestBody = buildGemRequestBody(searchGemName);
      
      console.log('보석 API 요청 본문:', JSON.stringify(requestBody, null, 2));
      
      // API 요청 수행
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'authorization': `bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.Items && data.Items.length > 0) {
          // 최저가 기준으로 가격 정보 가져오기
          const lowestPrice = data.Items[0].AuctionInfo.BuyPrice;
          
          // 캐시에 저장
          CacheManager.set('gems', searchGemName, lowestPrice);
          
          // 아이템에 가격 설정
          item.goldCost = lowestPrice;
          console.log(`보석 '${searchGemName}' 가격 조회 성공:`, lowestPrice);
        } else {
          console.warn(`보석 '${searchGemName}' 검색 결과가 없습니다.`);
        }
      } else {
        console.error(`보석 이름 '${searchGemName}' 조회 실패:`, response.status);
        if (response.status === 429) {
          console.error('API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.');
          break; // 한도 초과 시 더 이상의 요청 중단
        }
      }
    } catch (error) {
      console.error(`보석 '${item.item}' 처리 중 오류:`, error);
    }
    
    completedRequests++;
    // API 요청 전체 진행률 로그 (무시해도 될 빈도로 출력)
    if (completedRequests % 3 === 0 || completedRequests === items.length) {
      console.log(`보석 가격 처리 진행률: ${completedRequests}/${items.length} (${Math.round(completedRequests/items.length*100)}%)`);
    }
    
    // API 요청 간 지연
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

export default {
  isGemItem,
  formatGemName,
  buildGemRequestBody,
  processGemItems
};