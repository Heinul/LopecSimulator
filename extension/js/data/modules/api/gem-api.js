/**
 * 보석 API 관련 처리 모듈
 * 보석 검색 및 최저가 조회 기능 제공
 */

import CONFIG from './config.js';

/**
 * 보석 타입 상수
 */
const GEM_TYPES = {
    FLAME: '멸화',
    GEHPWA: '겁화',
    RED: '홍염',
    JAKEOL: '작열'
};

/**
 * 보석 레벨 상수
 */
const GEM_LEVELS = {
    LEVEL_1: '1레벨',
    LEVEL_2: '2레벨',
    LEVEL_3: '3레벨',
    LEVEL_4: '4레벨',
    LEVEL_5: '5레벨',
    LEVEL_6: '6레벨',
    LEVEL_7: '7레벨',
    LEVEL_8: '8레벨',
    LEVEL_9: '9레벨',
    LEVEL_10: '10레벨'
};

/**
 * 보석 요청 본문 생성
 * @param {string} itemName - 보석 이름 (예: "9레벨 겁화")
 * @returns {Object} - API 요청 본문
 */
function buildGemRequestBody(itemName) {
    return {
        CategoryCode: CONFIG.categoryCodes.gem,
        SortCondition: "ASC",
        Sort: "BUY_PRICE",
        ItemName: itemName
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
 * 보석 최저가 검색
 * @param {string} gemLevel - 보석 레벨 (예: "9레벨")
 * @param {string} gemType - 보석 타입 (예: "겁화")
 * @param {string} apiKey - API 키
 * @returns {Promise<Object|null>} - 보석 최저가 정보
 */
async function getGemPrice(gemLevel, gemType, apiKey) {
    try {
        // 보석 이름 생성 (예: "9레벨 겁화")
        const gemName = `${gemLevel} ${gemType}`;
        
        // 요청 본문 생성
        const requestBody = buildGemRequestBody(gemName);
        
        // API 요청 전송
        const response = await sendApiRequest(requestBody, apiKey);
        
        // 결과가 없는 경우
        if (!response || response.length === 0) {
            console.warn(`보석 '${gemName}'에 대한 결과가 없습니다.`);
            return null;
        }
        
        // 최저가 정보 반환
        return {
            price: response[0].CurrentMinPrice,
            name: response[0].Name,
            icon: response[0].Icon
        };
    } catch (error) {
        console.error('보석 가격 조회 중 오류 발생:', error);
        return null;
    }
}

/**
 * 레벨과 타입으로 보석 최저가 검색
 * @param {number} level - 보석 레벨 (1~10)
 * @param {string} type - 보석 타입 ("멸화", "겁화", "홍염", "작열")
 * @param {string} apiKey - API 키
 * @returns {Promise<Object|null>} - 보석 최저가 정보
 */
async function getGemPriceByLevelAndType(level, type, apiKey) {
    // 숫자 레벨을 문자열로 변환
    const gemLevel = `${level}레벨`;
    
    // 유효성 검사
    if (level < 1 || level > 10) {
        console.error('유효하지 않은 보석 레벨:', level);
        return null;
    }
    
    if (!Object.values(GEM_TYPES).includes(type)) {
        console.error('유효하지 않은 보석 타입:', type);
        return null;
    }
    
    return await getGemPrice(gemLevel, type, apiKey);
}

/**
 * 스킬명을 포함한 보석 최저가 검색
 * @param {number} level - 보석 레벨 (1~10)
 * @param {string} type - 보석 타입 ("멸화", "겁화", "홍염", "작열")
 * @param {string} skillName - 스킬 이름
 * @param {string} apiKey - API 키
 * @returns {Promise<Object|null>} - 보석 최저가 정보
 */
async function getGemPriceWithSkill(level, type, skillName, apiKey) {
    try {
        // 스킬명이 없으면 일반 보석 검색
        if (!skillName) {
            return await getGemPriceByLevelAndType(level, type, apiKey);
        }
        
        // 스킬명을 포함하는 경우 검색
        const gemLevel = `${level}레벨`;
        const gemName = `${gemLevel} ${type} ${skillName}`;
        
        // 요청 본문 생성
        const requestBody = buildGemRequestBody(gemName);
        
        // API 요청 전송
        const response = await sendApiRequest(requestBody, apiKey);
        
        // 결과가 없는 경우
        if (!response || response.length === 0) {
            console.warn(`보석 '${gemName}'에 대한 결과가 없습니다. 스킬명 없이 재시도합니다.`);
            return await getGemPriceByLevelAndType(level, type, apiKey);
        }
        
        // 최저가 정보 반환
        return {
            price: response[0].CurrentMinPrice,
            name: response[0].Name,
            icon: response[0].Icon,
            skillName: skillName
        };
    } catch (error) {
        console.error('보석 가격 조회 중 오류 발생:', error);
        return null;
    }
}

export default {
    GEM_TYPES,
    GEM_LEVELS,
    getGemPrice,
    getGemPriceByLevelAndType,
    getGemPriceWithSkill,
    buildGemRequestBody
};