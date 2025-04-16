/**
 * 각인서 API 관련 함수 모음
 */
import API_CONFIG from '../APIConfig.js';
import CacheManager from '../APICache.js';
import { extractEngravingName, calculateDetailedEngravingBooks } from '../EngravingHelper.js';

/**
 * 각인서 타입 확인
 * @param {Object} item - 아이템 데이터
 * @returns {boolean} 각인서 여부
 */
function isEngravingItem(item) {
  // 각인서 타입 직접 체크 및 로깅 (한글 '각인' 타입과 영문 'engraving' 타입 모두 지원)
  const isEngraving = item.type === 'engraving' || item.type === '각인';
  console.log('각인서 타입 확인:', item.type, isEngraving ? '일치' : '불일치');
  if (isEngraving) {
    console.log('각인서 아이템 감지:', item);
  }
  return isEngraving;
}

/**
 * 각인서 API 요청 객체 구성
 * @param {string} engravingName - 각인서 이름
 * @param {string} grade - 등급 (전설, 유물 등)
 * @returns {Object} API 요청 객체
 */
function buildEngravingRequestBody(engravingName, grade) {
  return {
    Sort: "GRADE",
    CategoryCode: API_CONFIG.categoryCodes.market.engraving,
    CharacterClass: "",
    ItemTier: null,
    ItemGrade: grade || "",
    ItemName: engravingName,
    PageNo: 1,
    SortCondition: "ASC"
  };
}

/**
 * 각인서 가격 조회
 * @param {string} engravingName - 각인서 이름
 * @param {string} grade - 각인서 등급 (지정하지 않으면 모든 등급 조회)
 * @param {string} apiKey - API 키
 * @returns {Object} 등급별 가격 정보
 */
async function getEngravingPrice(engravingName, grade, apiKey) {
  // 캐시 키 생성
  const cacheKey = `${engravingName}_${grade || 'all'}`;
  
  // 캐시에서 조회
  const cachedPrice = CacheManager.get('engravings', cacheKey);
  if (cachedPrice) {
    console.log(`캐시에서 각인서 가격 가져옴: ${cacheKey}`, cachedPrice);
    return cachedPrice;
  }
  
  // API 엔드포인트
  const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.marketItems;
  
  // 요청 바디 생성
  const requestBody = buildEngravingRequestBody(engravingName, grade);
  
  try {
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
      console.error(`각인서 API 오류 (${response.status}): ${engravingName}`);
      return null;
    }
    
    const data = await response.json();
    if (!data || !data.Items || data.Items.length === 0) {
      console.warn(`각인서 검색 결과 없음: ${engravingName}`);
      return null;
    }
    
    // 등급별 가격 정보 수집
    const priceInfo = {};
    
    data.Items.forEach(item => {
      const itemGrade = item.Grade; // 전설, 유물 등
      const itemPrice = item.CurrentMinPrice;
      
      // 등급별 가격 정보 저장
      if (!priceInfo[itemGrade]) {
        priceInfo[itemGrade] = {
          price: itemPrice,
          name: `${itemGrade} ${engravingName}`
        };
      } else if (itemPrice < priceInfo[itemGrade].price) {
        // 더 저렴한 가격이 있으면 업데이트
        priceInfo[itemGrade].price = itemPrice;
      }
    });
    
    // 캐시에 저장
    CacheManager.set('engravings', cacheKey, priceInfo);
    
    return priceInfo;
  } catch (error) {
    console.error(`각인서 가격 조회 중 오류: ${engravingName}`, error);
    return null;
  }
}

/**
 * 각인서 아이템 처리
 * @param {Array} items - 각인서 아이템 배열
 * @param {string} apiKey - API 키
 */
async function processEngravingItems(items, apiKey) {
  console.log('각인서 아이템 총 개수:', items.length);
  // 모든 아이템의 타입 검사 추가
  items.forEach((item, index) => {
    console.log(`각인서 아이템[${index}] 타입:`, item.type, '내용:', item.item);
  });
  
  // 완료된 요청 추적
  let completedRequests = 0;
  
  for (const item of items) {
    try {
      // 각인서 정보 획득
      let engravingName = item.engravingName;
      let fromGrade = item.fromGrade;
      let toGrade = item.toGrade;
      let fromLevel = item.fromLevel;
      let toLevel = item.toLevel;
      
      // 캐시키 생성
      const cacheKey = `${engravingName}_${fromGrade}_${fromLevel}_${toGrade}_${toLevel}`;
      
      // 캐시에서 가격 확인
      const cachedPrice = CacheManager.get('engravings', cacheKey);
      
      // 캐시된 값 사용
      if (cachedPrice) {
        console.log(`캐시에서 각인서 가격 가져옴: ${cacheKey}`, cachedPrice);
        item.goldCost = cachedPrice.totalCost;
        item.costDetails = cachedPrice.costDetails;
        item.engravingBooks = cachedPrice.totalBooks;
        completedRequests++;
        continue; // 다음 아이템으로 진행
      }
      
      // 유효한 각인서/등급/레벨 정보가 있는 경우 계산
      if (engravingName && fromGrade && toGrade && fromLevel >= 0 && toLevel >= 0) {
        // 각인서 가격 조회
        console.log(`각인서 가격 조회 시도: ${engravingName}`);
        const priceData = await getEngravingPrice(engravingName, null, apiKey);
        console.log(`각인서 가격 조회 결과:`, priceData);
        
        if (priceData) {
          // 등급별 필요 책 수량 계산
          const booksDetail = calculateDetailedEngravingBooks(fromGrade, fromLevel, toGrade, toLevel);
          
          if (booksDetail.totalBooks > 0) {
            // 등급별 가격 정보 초기화
            const costDetails = {
              byGrade: {},
              totalCost: 0
            };
            
            // 각 등급별 계산
            let totalCost = 0;
            
            // 각 등급별로 필요한 책 수와 가격 계산
            for (const grade in booksDetail.byGrade) {
              const booksNeeded = booksDetail.byGrade[grade];
              
              // 해당 등급의 가격 정보 확인
              if (priceData[grade] && priceData[grade].price) {
                const gradePrice = priceData[grade].price;
                const gradeCost = gradePrice * booksNeeded;
                
                // 세부 정보 저장
                costDetails.byGrade[grade] = {
                  price: gradePrice,
                  books: booksNeeded,
                  cost: gradeCost
                };
                
                // 총 가격에 추가
                totalCost += gradeCost;
              } else {
                console.warn(`각인서 ${engravingName}의 ${grade} 등급 가격 정보를 찾을 수 없습니다.`);
                costDetails.byGrade[grade] = {
                  price: 0,
                  books: booksNeeded,
                  cost: 0
                };
              }
            }
            
            // 총 가격 설정
            costDetails.totalCost = totalCost;
            
            // 캐시에 저장
            CacheManager.set('engravings', cacheKey, {
              totalCost: totalCost,
              costDetails: costDetails,
              totalBooks: booksDetail.totalBooks
            });
            
            // 아이템에 가격 설정
            item.goldCost = totalCost;
            item.costDetails = costDetails;
            item.engravingBooks = booksDetail.totalBooks;
            
            // 로그 메시지
            let logMessage = `각인서 ${engravingName} ${fromGrade}${fromLevel} → ${toGrade}${toLevel}: 총 ${booksDetail.totalBooks}개 = ${totalCost}G\n`;
            
            // 등급별 세부 정보 로그
            for (const grade in costDetails.byGrade) {
              const detail = costDetails.byGrade[grade];
              logMessage += `  - ${grade} 등급: ${detail.books}개 x ${detail.price}G = ${detail.cost}G\n`;
            }
            
            console.log(logMessage);
          } else {
            console.warn(`각인서 ${engravingName} 필요한 책 수량이 0입니다.`);
          }
        } else {
          console.warn(`각인서 ${engravingName} 가격 조회 실패 또는 가격 정보 없음`);
        }
      }
    } catch (error) {
      console.error(`각인서 '${item.item}' 처리 중 오류:`, error);
    }
    
    completedRequests++;
    // API 요청 전체 진행률 로그
    if (completedRequests % 3 === 0 || completedRequests === items.length) {
      console.log(`각인서 가격 처리 진행률: ${completedRequests}/${items.length} (${Math.round(completedRequests/items.length*100)}%)`);
    }
    
    // API 요청 간 지연
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

export default {
  isEngravingItem,
  buildEngravingRequestBody,
  getEngravingPrice,
  processEngravingItems
};