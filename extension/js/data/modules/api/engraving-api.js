/**
 * 각인서 API 관련 처리 모듈
 * 각인서 검색 및 최저가 조회 기능 제공
 */

// CONFIG는 전역 변수로 정의되어 있음 (DATA_API_CONFIG)

/**
 * 각인서 등급 상수
 */
window.ENGRAVING_GRADES = {
    EPIC: '영웅',
    LEGENDARY: '전설',
    RELIC: '유물'
};

/**
 * 각인서 API 요청 생성
 * @param {string} engravingName - 각인 이름 (예: "돌격대장")
 * @returns {Object} - API 요청 본문
 */
window.buildEngravingRequestBody = function(engravingName) {
    // 오직 카테고리 코드와 이름만 사용
    return {
        CategoryCode: DATA_API_CONFIG.categoryCodes.engraving,
        ItemName: engravingName
    };
}

/**
 * API 요청을 보내는 함수
 * @param {Object} requestBody - 요청 본문
 * @param {string} apiKey - API 키
 * @returns {Promise<Object>} - API 응답
 */
window.sendApiRequest = async function(requestBody, apiKey) {
    try {
        if (!apiKey) {
            throw new Error('API 키가 제공되지 않았습니다.');
        }
        
        console.log(`API 요청 주소: ${DATA_API_CONFIG.baseUrl}${DATA_API_CONFIG.endpoints.market}`);
        
        const response = await fetch(`${DATA_API_CONFIG.baseUrl}${DATA_API_CONFIG.endpoints.market}`, {
            method: 'POST',
            headers: {
                ...DATA_API_CONFIG.headers,
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
 * @param {string|null} grade - 각인서 등급 (null이면 모든 등급 검색)
 * @param {string} apiKey - API 키
 * @returns {Promise<Object|null>} - 각인서 최저가 정보
 */
window.getEngravingPrice = async function(engravingName, grade, apiKey) {
    try {
        // 요청 본문 생성 - 파라미터 2개만 사용(카테고리 코드 + 각인 이름)
        const requestBody = buildEngravingRequestBody(engravingName);
        console.log('각인서 API 요청 본문:', JSON.stringify(requestBody));
        
        // API 요청 전송
        const response = await sendApiRequest(requestBody, apiKey);
        console.log('각인서 API 응답 구조:', typeof response, Array.isArray(response));
        
        // 결과가 없는 경우
        if (!response) {
            console.warn(`각인서 '${engravingName}'에 대한 결과가 없습니다.`);
            return null;
        }
        
        // 응답이 Items 배열을 포함하는지 확인
        if (response.Items && Array.isArray(response.Items)) {
            // 특정 등급에 대한 결과만 필터링
            const items = response.Items;
            console.log(`검색된 각인서 항목 수: ${items.length}`);
            
            // 등급별 결과 분리
            const resultByGrade = {};
            
            // 각 아이템을 등급별로 분류
            items.forEach(item => {
                resultByGrade[item.Grade] = {
                    id: item.Id,
                    name: item.Name,
                    grade: item.Grade,
                    icon: item.Icon || '',
                    // 가격은 RecentPrice 기준으로 사용
                    price: item.RecentPrice || 0,
                    ydayAvgPrice: item.YDayAvgPrice || 0,
                    currentMinPrice: item.CurrentMinPrice || 0
                };
            });
            
            if (grade) {
                // 특정 등급에 대한 결과만 반환
                return resultByGrade[grade] || null;
            } else {
                // 모든 등급의 결과 반환
                return resultByGrade;
            }
        } else {
            // 응답 구조가 예상과 다른 경우
            console.warn(`각인서 '${engravingName}'에 대한 응답 형식이 예상과 다릅니다.`);
            console.warn('응답 구조:', JSON.stringify(response).substring(0, 200));
            return null;
        }
    } catch (error) {
        console.error('각인서 가격 조회 중 오류 발생:', error);
        return null;
    }
}

// 전역 변수로 정의됨
window.EngravingApi = {
    ENGRAVING_GRADES: window.ENGRAVING_GRADES,
    getEngravingPrice: window.getEngravingPrice,
    buildEngravingRequestBody: window.buildEngravingRequestBody
};

// export 구문 추가
export default window.EngravingApi;