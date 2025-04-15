/**
 * 각인서 API 관련 처리 모듈
 * 각인서 검색 및 최저가 조회 기능 제공
 */

import CONFIG from './config.js';

/**
 * 각인서 등급 상수
 */
const ENGRAVING_GRADES = {
    EPIC: '영웅',
    LEGENDARY: '전설',
    RELIC: '유물'
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
        if (!apiKey) {
            throw new Error('API 키가 제공되지 않았습니다.');
        }
        
        console.log(`API 요청 주소: ${CONFIG.baseUrl}${CONFIG.endpoints.market}`);
        
        const response = await fetch(`${CONFIG.baseUrl}${CONFIG.endpoints.market}`, {
            method: 'POST',
            headers: {
                ...CONFIG.headers,
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        console.log('API 응답 상태코드:', response.status);
        
        if (response.ok) {
            console.log(`API 성공 응답(${requestBody.ItemName})`);
            const data = await response.json();
            return data;
        } else {
            const errorMessage = `API 요청 실패(${requestBody.ItemName}): ${response.status} ${response.statusText}`;
            console.error(errorMessage);
            
            // 응답 본문 정보 출력
            try {
                const errorText = await response.text();
                console.error('오류 응답 본문:', errorText.substring(0, 300));
            } catch (e) {}
            
            throw new Error(errorMessage);
        }
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
        console.log('각인서 API 요청 본문:', JSON.stringify(requestBody));
        
        // API 요청 전송
        const response = await sendApiRequest(requestBody, apiKey);
        console.log('각인서 API 응답 구조:', typeof response, Array.isArray(response));
        
        // 결과가 없는 경우
        if (!response) {
            console.warn(`각인서 '${engravingName} (${grade})'에 대한 결과가 없습니다.`);
            return null;
        }
        
        // 응답 구조 확인
        if (response.Items && response.Items.length > 0) {
            // 응답에 Items 배열이 있는 경우 (API 공식 일반 형식)
            console.log('각인서 가격 정보 추출:', response.Items[0].Name, response.Items[0].CurrentMinPrice);
            return {
                price: response.Items[0].CurrentMinPrice,
                name: response.Items[0].Name,
                icon: response.Items[0].Icon || '',
                grade: grade
            };
        } else if (Array.isArray(response) && response.length > 0) {
            // 응답 자체가 배열인 경우 (만약 이런 형식이라면)
            console.log('기본 배열 형태의 각인서 가격 정보 추출:', response[0]);
            return {
                price: response[0].CurrentMinPrice || response[0].AuctionInfo?.BuyPrice || 0,
                name: response[0].Name || engravingName,
                icon: response[0].Icon || '',
                grade: grade
            };
        } else if (response.CurrentMinPrice) {
            // 단일 항목으로 오는 경우
            console.log('단일 항목 형태의 각인서 가격 정보 추출:', response.CurrentMinPrice);
            return {
                price: response.CurrentMinPrice,
                name: response.Name || engravingName,
                icon: response.Icon || '',
                grade: grade
            };
        } else {
            // 응답 본문 간단히 출력
            console.warn(`각인서 '${engravingName} (${grade})'에 대한 결과가 없거나 형식이 다릅니다.`);
            console.warn('응답 구조:', JSON.stringify(response).substring(0, 200));
            return null;
        }
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