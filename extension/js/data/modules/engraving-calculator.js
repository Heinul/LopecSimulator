/**
 * 각인서 가격 계산기 모듈
 * 각인서 가격 검색 및 금액 계산 기능을 제공합니다.
 */

import EngravingApi from './api/engraving-api.js';

/**
 * 각인서 가격 계산 모듈
 */
const EngravingCalculator = (function() {
  // 변경 기록을 저장할 객체
  let changeLog = {};
  
  // 각인서 가격 캐시 (API 호출 최소화)
  const priceCache = {};
  
  /**
   * 각인서 가격 계산하기
   * @param {string} engravingName - 각인서 이름
   * @param {string} fromGrade - 원래 등급 ("영웅", "전설", "유물")
   * @param {number} fromLevel - 원래 레벨
   * @param {string} toGrade - 목표 등급 ("영웅", "전설", "유물")
   * @param {number} toLevel - 목표 레벨
   * @param {string} apiKey - API 키
   * @returns {Promise<Object>} - 가격 계산 결과
   */
  async function calculatePrice(engravingName, fromGrade, fromLevel, toGrade, toLevel, apiKey) {
    // 등급이 같고 레벨만 상승한 경우
    if (fromGrade === toGrade) {
      return await calculateSameGradePrice(engravingName, fromGrade, fromLevel, toLevel, apiKey);
    } 
    // 등급과 레벨이 모두 변경된 경우
    else {
      return await calculateDifferentGradePrice(engravingName, fromGrade, fromLevel, toGrade, toLevel, apiKey);
    }
  }
  
  /**
   * 동일 등급 내 레벨 변경 가격 계산
   * @param {string} engravingName - 각인서 이름
   * @param {string} grade - 각인서 등급
   * @param {number} fromLevel - 원래 레벨
   * @param {number} toLevel - 목표 레벨
   * @param {string} apiKey - API 키
   * @returns {Promise<Object>} - 가격 계산 결과
   */
  async function calculateSameGradePrice(engravingName, grade, fromLevel, toLevel, apiKey) {
    try {
      // 레벨 차이 계산
      const levelDiff = toLevel - fromLevel;
      
      // 동일하거나 하락한 경우 비용 없음
      if (levelDiff <= 0) {
        return {
          success: true,
          price: 0,
          count: 0,
          details: {
            engravingName: engravingName,
            fromGrade: grade,
            fromLevel: fromLevel,
            toGrade: grade,
            toLevel: toLevel,
            levelDiff: levelDiff,
            items: []
          }
        };
      }
      
      // 각인서 가격 정보 가져오기 - 단 2개 파라미터만 사용하여 검색
      // 전체 등급 정보를 한번에 가져옴
      const allPrices = await getAllEngravingPrices(engravingName, null, apiKey);
      
      // 해당 등급의 가격 정보 추출
      const priceInfo = allPrices[grade];
      
      if (!priceInfo || !priceInfo.price) {
        return {
          success: false,
          error: `${grade} ${engravingName} 각인서 가격 정보를 찾을 수 없습니다.`,
          details: { 
            engravingName, 
            fromGrade: grade, 
            fromLevel, 
            toGrade: grade, 
            toLevel 
          }
        };
      }
      
      // 필요한 각인서 수량 = 레벨 차이 * 5 (각 레벨당 5개 필요)
      const count = levelDiff * 5;
      // RecentPrice 값을 반드시 사용
      const totalPrice = Math.round(priceInfo.price * count);
      
      return {
        success: true,
        price: totalPrice,
        count: count,
        unitPrice: priceInfo.price,
        details: {
          engravingName: engravingName,
          fromGrade: grade,
          fromLevel: fromLevel,
          toGrade: grade,
          toLevel: toLevel,
          levelDiff: levelDiff,
          items: [{
            grade: grade,
            price: priceInfo.price,
            count: count,
            totalPrice: totalPrice
          }]
        }
      };
    } catch (error) {
      console.error('동일 등급 각인서 가격 계산 중 오류 발생:', error);
      return {
        success: false,
        error: `가격 계산 중 오류 발생: ${error.message}`,
        details: { 
          engravingName, 
          fromGrade: grade, 
          fromLevel, 
          toGrade: grade, 
          toLevel 
        }
      };
    }
  }
  
  /**
   * 다른 등급으로 변경 시 가격 계산
   * @param {string} engravingName - 각인서 이름
   * @param {string} fromGrade - 원래 등급
   * @param {number} fromLevel - 원래 레벨
   * @param {string} toGrade - 목표 등급
   * @param {number} toLevel - 목표 레벨
   * @param {string} apiKey - API 키
   * @returns {Promise<Object>} - 가격 계산 결과
   */
  async function calculateDifferentGradePrice(engravingName, fromGrade, fromLevel, toGrade, toLevel, apiKey) {
    try {
      // 등급 순위 (높은 숫자가 더 높은 등급)
      const gradeRanks = {
        '영웅': 1,
        '전설': 2,
        '유물': 3
      };
      
      // 등급이 하락한 경우 - 가격 없음
      if (gradeRanks[fromGrade] > gradeRanks[toGrade]) {
        return {
          success: true,
          price: 0,
          count: 0,
          details: {
            engravingName: engravingName,
            fromGrade: fromGrade,
            fromLevel: fromLevel,
            toGrade: toGrade,
            toLevel: toLevel,
            gradeChange: `${fromGrade} -> ${toGrade}`,
            items: []
          }
        };
      }
      
      // 등급 상승 시 레벨 0부터 시작
      // 하나의 API 호출로 모든 등급 가격 정보 가져오기 - CategoryCode + ItemName만 사용
      const priceInfos = await getAllEngravingPrices(engravingName, null, apiKey);
      
      // 가격 정보가 없는 경우
      if (!priceInfos || Object.keys(priceInfos).length === 0) {
        return {
          success: false,
          error: `${engravingName} 각인서 가격 정보를 찾을 수 없습니다.`,
          details: { 
            engravingName, 
            fromGrade, 
            fromLevel, 
            toGrade, 
            toLevel 
          }
        };
      }
      
      // 각 등급별로 필요한 수량과 가격 계산
      const items = [];
      let totalPrice = 0;
      let totalCount = 0;
      
      // 원래 등급에서 남은 레벨 처리 (현재 레벨에서 최대로 올릴 수 있는 레벨까지)
      const gradeMaxLevels = {
        '영웅': 3,
        '전설': 3,
        '유물': 4
      };
      
      // 순차적으로 각 등급별 요구사항 계산
      let currentGrade = fromGrade;
      let currentLevel = fromLevel;
      
      while (gradeRanks[currentGrade] <= gradeRanks[toGrade]) {
        // 현재 처리 중인 등급이 목표 등급인 경우
        if (currentGrade === toGrade) {
          const levelDiff = toLevel - currentLevel;
          
          // 레벨 상승이 있을 때만 처리
          if (levelDiff > 0) {
            const count = levelDiff * 5;
            const priceInfo = priceInfos[currentGrade];
            
            if (priceInfo && priceInfo.price) {
              const itemPrice = Math.round(priceInfo.price * count);
              
              items.push({
                grade: currentGrade,
                price: priceInfo.price,
                count: count,
                totalPrice: itemPrice
              });
              
              totalPrice += itemPrice;
              totalCount += count;
            }
          }
          
          // 목표 등급 처리 완료로 종료
          break;
        }
        
        // 현재 등급에서 최대 레벨까지 올리는 비용 계산
        const maxLevel = gradeMaxLevels[currentGrade];
        const levelDiff = maxLevel - currentLevel;
        
        if (levelDiff > 0) {
          const count = levelDiff * 5;
          const priceInfo = priceInfos[currentGrade];
          
          if (priceInfo && priceInfo.price) {
            const itemPrice = Math.round(priceInfo.price * count);
            
            items.push({
              grade: currentGrade,
              price: priceInfo.price,
              count: count,
              totalPrice: itemPrice
            });
            
            totalPrice += itemPrice;
            totalCount += count;
          }
        }
        
        // 다음 등급으로 이동
        const gradeOrder = ['영웅', '전설', '유물'];
        const nextGradeIndex = gradeOrder.indexOf(currentGrade) + 1;
        
        if (nextGradeIndex < gradeOrder.length) {
          currentGrade = gradeOrder[nextGradeIndex];
          currentLevel = 0; // 새 등급에서는 레벨 0부터 시작
        } else {
          break;
        }
      }
      
      return {
        success: true,
        price: totalPrice,
        count: totalCount,
        details: {
          engravingName: engravingName,
          fromGrade: fromGrade,
          fromLevel: fromLevel,
          toGrade: toGrade,
          toLevel: toLevel,
          gradeChange: `${fromGrade} -> ${toGrade}`,
          items: items
        }
      };
      
    } catch (error) {
      console.error('다른 등급 각인서 가격 계산 중 오류 발생:', error);
      return {
        success: false,
        error: `가격 계산 중 오류 발생: ${error.message}`,
        details: { 
          engravingName, 
          fromGrade, 
          fromLevel, 
          toGrade, 
          toLevel 
        }
      };
    }
  }
  
  /**
   * 각인 변경 기록 추가
   * @param {string} key - 변경 항목 키
   * @param {Object} data - 변경 데이터
   */
  function addChangeLog(key, data) {
    changeLog[key] = data;
  }
  
  /**
   * 변경 기록 가져오기
   * @returns {Object} - 변경 기록 객체
   */
  function getChangeLog() {
    return changeLog;
  }
  
  /**
   * 변경 기록 초기화
   */
  function clearChangeLog() {
    changeLog = {};
  }
  
  /**
   * 각인서 가격 정보 가져오기 (캐싱 지원)
   * @param {string} engravingName - 각인서 이름
   * @param {string} grade - 각인서 등급
   * @param {string} apiKey - API 키
   * @returns {Promise<Object|null>} - 가격 정보
   */
  async function getEngravingPrice(engravingName, grade, apiKey) {
    const cacheKey = `${engravingName}_${grade}`;
    
    // 캐시에 있으면 재사용
    if (priceCache[cacheKey]) {
      return priceCache[cacheKey];
    }
    
    try {
      // API로 가격 조회
      const priceInfo = await EngravingApi.getEngravingPrice(engravingName, grade, apiKey);
      
      // 캐시에 저장
      if (priceInfo) {
        priceCache[cacheKey] = priceInfo;
      }
      
      return priceInfo;
    } catch (error) {
      console.error(`각인서 가격 조회 오류 (${engravingName}, ${grade}):`, error);
      return null;
    }
  }
  
  /**
   * 여러 등급의 각인서 가격 정보 가져오기
   * @param {string} engravingName - 각인서 이름
   * @param {Array<string>} grades - 등급 배열(사용하지 않음)
   * @param {string} apiKey - API 키
   * @returns {Promise<Object>} - 등급별 가격 정보
   */
  async function getAllEngravingPrices(engravingName, grades, apiKey) {
    try {
      // 캐시에서 검색 (API 호출 최소화)
      const cacheKey = `${engravingName}_all`;
      if (priceCache[cacheKey]) {
        console.log(`각인서 '${engravingName}' 가격 정보 캐시 사용`);
        return priceCache[cacheKey];
      }

      // API로 가격 조회 - CategoryCode와 ItemName만 사용
      console.log(`각인서 '${engravingName}' 가격 정보 API 요청`);
      const allPrices = await EngravingApi.getEngravingPrice(engravingName, null, apiKey);
      
      if (!allPrices) {
        return {};
      }
      
      // 전체 결과 캐싱
      priceCache[cacheKey] = allPrices;
      
      // 각 등급별 결과도 개별적으로 캐싱
      for (const grade in allPrices) {
        const gradeKey = `${engravingName}_${grade}`;
        priceCache[gradeKey] = allPrices[grade];
      }
      
      // 모든 등급의 가격 정보 반환
      return allPrices;
    } catch (error) {
      console.error(`여러 등급 각인서 가격 조회 오류 (${engravingName}):`, error);
      return {};
    }
  }
  
  /**
   * 캐시 초기화
   */
  function clearCache() {
    Object.keys(priceCache).forEach(key => {
      delete priceCache[key];
    });
  }
  
  // 공개 API
  return {
    calculatePrice,
    calculateSameGradePrice,
    calculateDifferentGradePrice,
    getEngravingPrice,
    getAllEngravingPrices,
    addChangeLog,
    getChangeLog,
    clearChangeLog,
    clearCache
  };
})();

export default EngravingCalculator;
