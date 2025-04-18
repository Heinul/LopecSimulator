/**
 * 보석 API 관련 처리 모듈
 * 보석 검색 및 최저가 조회 기능 제공
 */

// CONFIG는 전역 변수로 정의되어 있음 (DATA_API_CONFIG)

/**
 * 보석 타입 상수
 */
window.GEM_TYPES = {
    FLAME: '멸화',
    GEHPWA: '겁화',
    RED: '홍염',
    JAKEOL: '작열'
};

/**
 * 보석 레벨 상수
 */
window.GEM_LEVELS = {
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
window.buildGemRequestBody = function(itemName) {
    return {
        CategoryCode: 210000,
        ItemName: itemName,
        PageNo: 1,
        Sort: "BIDSTART_PRICE",
        SortCondition: "ASC"
    };
}

/**
 * API 요청을 보내는 함수
 * @param {Object} requestBody - 요청 본문
 * @param {string} apiKey - API 키
 * @returns {Promise<Object>} - API 응답
 */
window.sendGemApiRequest = async function(requestBody, apiKey) {
    try {
        console.log('보석 API 요청 본문:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(`${DATA_API_CONFIG.baseUrl}${DATA_API_CONFIG.endpoints.market}`, {
            method: 'POST',
            headers: {
                ...DATA_API_CONFIG.headers,
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
window.getGemPrice = async function(gemLevel, gemType, apiKey) {
    try {
        // 보석 이름 생성 (예: "9레벨 겁화")
        const gemName = `${gemLevel} ${gemType}`;
        
        // 요청 본문 생성
        const requestBody = buildGemRequestBody(gemName);
        
        // API 요청 전송
        const response = await window.sendGemApiRequest(requestBody, apiKey);
        
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
 * 보석 최저가 검색
 * @param {number} level - 보석 레벨 (1~10)
 * @param {string} type - 보석 타입 ("멸화", "겁화", "홍염", "작열")
 * @param {string} apiKey - API 키
 * @returns {Promise<Object|null>} - 보석 최저가 정보
 */
window.getGemPriceByLevelAndType = async function(level, type, apiKey) {
    // 숫자 레벨을 문자열로 변환
    const gemLevel = `${level}레벨`;
    
    // 유효성 검사
    if (level < 1 || level > 10) {
        console.error('유효하지 않은 보석 레벨:', level);
        return null;
    }
    
    if (!Object.values(window.GEM_TYPES).includes(type)) {
        console.error('유효하지 않은 보석 타입:', type);
        return null;
    }
    
    // 고정 형식: "N레벨 타입" 형식
    const gemName = `${level}레벨 ${type}`;
    console.log(`보석 가격 검색: ${gemName}`);
    
    // 요청 본문 생성
    const requestBody = buildGemRequestBody(gemName);
    
    try {
        // API 요청 전송
        const response = await window.sendGemApiRequest(requestBody, apiKey);
        
        // 결과가 없는 경우
        if (!response || response.length === 0) {
            console.warn(`보석 '${gemName}'에 대한 결과가 없습니다.`);
            return null;
        }
        
        // 최저가 정보 반환
        return {
            price: response[0].CurrentMinPrice,
            name: response[0].Name,
            icon: response[0].Icon,
            level: level,
            type: type
        };
    } catch (error) {
        console.error('보석 가격 조회 중 오류 발생:', error);
        return null;
    }
}

// 전역 변수로 모듈 정의
window.GemApi = {
    GEM_TYPES: window.GEM_TYPES,
    GEM_LEVELS: window.GEM_LEVELS,
    getGemPrice: window.getGemPrice,
    getGemPriceByLevelAndType: window.getGemPriceByLevelAndType,
    buildGemRequestBody: window.buildGemRequestBody
};

// export 구문 추가
export default window.GemApi;