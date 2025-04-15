/**
 * 각인서 API 관련 처리 모듈
 * 각인서 검색 및 최저가 조회 기능 제공
 */

import CONFIG from './config.js';

/**
 * 각인서 등급 상수
 */
const ENGRAVING_GRADES = {
    RARE: '희귀',
    EPIC: '영웅',
    LEGENDARY: '전설',
    RELIC: '유물',
    ANCIENT: '고대'
};

/**
 * 각인서 API 요청 생성
 * @param {string} engravingName - 각인 이름 (예: "돌격대장")
 * @param {string} grade - 등급 (예: "유물")
 * @returns {Object} - API 요청 본문
 */
function buildEngravingRequestBody(engravingName, grade = '유물') {
    return {
        CategoryCode: CONFIG.categoryCodes.engraving,
        SortCondition: "ASC",
        Sort: "BUY_PRICE",
        Grade: grade,
        ItemName: engravingName
    };
}

/**
 * API 요청을 보내는 함수
 * @param {Object} requestBody - 요청 본문
 * @param {string} apiKey - API 키
 * @returns {Promise<Object>} - API 응답
 */
async function sendApiRequest(requestBody, apiKey) {
    try {
        const response = await fetch(`${CONFIG.baseUrl}${CONFIG.endpoints.market}`, {
            method: 'POST',
            headers: {
                ...CONFIG.headers,
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API 요청 중 오류 발생:', error);
        throw error;
    }
}

/**
 * 각인서 최저가 검색
 * @param {string} engravingName - 각인 이름 (예: "돌격대장")
 * @param {string} grade - 각인서 등급 (예: "유물")
 * @param {string} apiKey - API 키
 * @returns {Promise<Object|null>} - 각인서 최저가 정보
 */
async function getEngravingPrice(engravingName, grade, apiKey) {
    try {
        // 요청 본문 생성
        const requestBody = buildEngravingRequestBody(engravingName, grade);
        
        // API 요청 전송
        const response = await sendApiRequest(requestBody, apiKey);
        
        // 결과가 없는 경우
        if (!response || response.length === 0) {
            console.warn(`각인서 '${engravingName} (${grade})'에 대한 결과가 없습니다.`);
            return null;
        }
        
        // 최저가 정보 반환
        return {
            price: response[0].CurrentMinPrice,
            name: response[0].Name,
            icon: response[0].Icon,
            grade: grade
        };
    } catch (error) {
        console.error('각인서 가격 조회 중 오류 발생:', error);
        return null;
    }
}

/**
 * 다양한 등급의 각인서 가격 검색
 * @param {string} engravingName - 각인 이름 (예: "돌격대장")
 * @param {Array<string>} grades - 검색할 등급 배열 (예: ["유물", "전설"])
 * @param {string} apiKey - API 키
 * @returns {Promise<Object|null>} - 각인서 최저가 정보 (등급별)
 */
async function getEngravingPricesByGrades(engravingName, grades, apiKey) {
    try {
        // 각 등급별 검색 결과 Promise 배열
        const searchPromises = grades.map(grade => getEngravingPrice(engravingName, grade, apiKey));
        
        // 모든 검색 결과 대기
        const results = await Promise.all(searchPromises);
        
        // 결과를 등급별로 맵핑
        const pricesByGrade = {};
        grades.forEach((grade, index) => {
            pricesByGrade[grade] = results[index];
        });
        
        return pricesByGrade;
    } catch (error) {
        console.error('각인서 가격 조회 중 오류 발생:', error);
        return null;
    }
}

export default {
    ENGRAVING_GRADES,
    getEngravingPrice,
    getEngravingPricesByGrades,
    buildEngravingRequestBody
};