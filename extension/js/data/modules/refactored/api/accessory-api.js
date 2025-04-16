/**
 * 장신구 API 관련 함수 모음
 */
import API_CONFIG from '../APIConfig.js';

/**
 * 장신구 타입 확인
 * @param {Object} item - 아이템 데이터
 * @returns {boolean} 장신구 여부
 */
function isAccessoryItem(item) {
  return item.type === 'accessory';
}

/**
 * 장신구 아이템 처리
 * @param {Array} items - 장신구 아이템 배열
 * @param {string} apiKey - API 키
 */
async function processAccessoryItems(items, apiKey) {
  // 경매장 API로 장신구 가격 조회
  const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.auctionItems;
  
  for (const item of items) {
    try {
      // API 요청 작성
      const requestBody = {
        ItemLevelMin: 0,
        ItemLevelMax: 0,
        ItemGradeQuality: null,
        ItemName: item.item, // 아이템 이름
        CategoryCode: API_CONFIG.categoryCodes.auction.accessory, // 장신구 카테고리
        Sort: "BIDSTART_PRICE", // 가격 순 정렬
        SortCondition: "ASC", // 오름차순
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
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.Items && data.Items.length > 0) {
          // 최저가 기준으로 가격 정보 가져오기
          const lowestPrice = data.Items[0].AuctionInfo.BuyPrice;
          item.goldCost = lowestPrice;
          console.log(`장신구 '${item.item}' 가격 조회 성공:`, lowestPrice);
        }
      } else {
        console.error(`장신구 이름 '${item.item}' 조회 실패:`, response.status);
      }
    } catch (error) {
      console.error(`장신구 '${item.item}' 처리 중 오류:`, error);
    }
    
    // API 요청 간 지연
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

export default {
  isAccessoryItem,
  processAccessoryItems
};