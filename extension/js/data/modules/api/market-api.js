/**
 * 경매장 API 관련 처리 모듈
 * 장신구 검색 및 최저가 조회 기능 제공
 */

window.ACCESSORY_CODES = {
    NECKLACE: 200010,
    EARRING: 200020,
    RING: 200030
};

/**
 * 장신구 옵션 상수 (FirstOption, SecondOption)
 * 딜러와 서포터에 대한 기본 옵션 세트 정의
 */
window.ACCESSORY_OPTIONS = {
    // 딜러 옵션
    DEALER: {
        // 목걸이: 추가피해, 적에게 주는 피해
        NECKLACE: [
            { FirstOption: 7, SecondOption: 41, Description: '추가 피해' }, // 추가 피해
            { FirstOption: 7, SecondOption: 42, Description: '적에게 주는 피해 증가' } // 적에게 주는 피해 증가
        ],
        // 귀걸이: 공격력 %, 무기 공격력 %
        EARRING: [
            { FirstOption: 7, SecondOption: 45, Description: '공격력 %' }, // 공격력 %
            { FirstOption: 7, SecondOption: 46, Description: '무기 공격력 %' } // 무기 공격력 %
        ],
        // 반지: 치명타 피해, 치명타 적중률
        RING: [
            { FirstOption: 7, SecondOption: 50, Description: '치명타 피해' }, // 치명타 피해
            { FirstOption: 7, SecondOption: 49, Description: '치명타 적중률' } // 치명타 적중률
        ]
    },
    
    // 서포터 옵션
    SUPPORTER: {
        // 목걸이: 낙인력, 세레나데/신성/조화 게이지 획득량 증가
        NECKLACE: [
            { FirstOption: 7, SecondOption: 44, Description: '낙인력' }, // 낙인력
            { FirstOption: 7, SecondOption: 43, Description: '세레나데/신성/조화 게이지 획득량 증가' } // 세레나데/신성/조화 게이지 획득량 증가
        ],
        // 귀걸이: 무기공격력%, 무기공격력+
        EARRING: [
            { FirstOption: 7, SecondOption: 46, Description: '무기 공격력 %' }, // 무기 공격력 %
            { FirstOption: 7, SecondOption: 54, Description: '무기 공격력 +' } // 무기 공격력 +
        ],
        // 반지: 아군 공격력 강화 효과, 아군 피해량 강화 효과
        RING: [
            { FirstOption: 7, SecondOption: 51, Description: '아군 공격력 강화 효과' }, // 아군 공격력 강화 효과
            { FirstOption: 7, SecondOption: 52, Description: '아군 피해량 강화 효과' } // 아군 피해량 강화 효과
        ]
    }
};

window.OPTION_COMBINATION_TYPES = {
    // 상상, 상중, 중상, 상하, 하상, 상무, 무상, 중중, 중하, 하중, 중무, 무중, 하하, 하무, 무하, 무무
    SANG_SANG: "상상",
    SANG_JUNG: "상중",
    JUNG_SANG: "중상",
    SANG_HA: "상하",
    HA_SANG: "하상",
    SANG_MU: "상무",
    MU_SANG: "무상",
    JUNG_JUNG: "중중",
    JUNG_HA: "중하",
    HA_JUNG: "하중",
    JUNG_MU: "중무",
    MU_JUNG: "무중",
    HA_HA: "하하",
    HA_MU: "하무",
    MU_HA: "무하",
    MU_MU: "무무"
};

/**
 * 문자열 타입으로 조합 타입 찾기
 * @param {string} typeString - 조합 타입 문자열 (예: "상상", "상중" 등)
 * @returns {string|null} 조합 타입 키 또는 null
 */
window.findCombinationTypeKey = function(typeString) {
    for (const [key, value] of Object.entries(OPTION_COMBINATION_TYPES)) {
        if (value === typeString) {
            return key;
        }
    }
    return null;
}

/**
 * 문자열 타입으로 장신구 코드 찾기
 * @param {string} accessoryTypeString - 장신구 타입 문자열 ("목걸이", "귀걸이", "반지")
 * @returns {number|null} 장신구 코드 또는 null
 */
window.getAccessoryCodeByString = function(accessoryTypeString) {
    switch (accessoryTypeString) {
        case "목걸이":
            return ACCESSORY_CODES.NECKLACE;
        case "귀걸이":
            return ACCESSORY_CODES.EARRING;
        case "반지":
            return ACCESSORY_CODES.RING;
        default:
            return null;
    }
}

/**
 * 문자열 타입으로 장신구 타입 키 찾기
 * @param {string} accessoryTypeString - 장신구 타입 문자열 ("목걸이", "귀걸이", "반지")
 * @returns {string|null} 장신구 타입 키 또는 null
 */
window.getAccessoryTypeKey = function(accessoryTypeString) {
    switch (accessoryTypeString) {
        case "목걸이":
            return "NECKLACE";
        case "귀걸이":
            return "EARRING";
        case "반지":
            return "RING";
        default:
            return null;
    }
}

/**
 * 문자열 타입으로 클래스 타입 키 찾기
 * @param {string} classTypeString - 클래스 타입 문자열 ("딜러", "서포터")
 * @returns {string|null} 클래스 타입 키 또는 null
 */
window.getClassTypeKey = function(classTypeString) {
    switch (classTypeString) {
        case "딜러":
            return "DEALER";
        case "서포터":
            return "SUPPORTER";
        default:
            return null;
    }
}

// API 요청 기본 URL
window.API_BASE_URL = 'https://developer-lostark.game.onstove.com/markets/items';

/**
 * 장신구 검색 API 요청을 구성하는 함수
 * @param {number} categoryCode - 장신구 카테고리 코드 (200010: 목걸이, 200020: 귀걸이, 200030: 반지)
 * @param {Array} options - 검색할 옵션 배열 [{FirstOption, SecondOption, MinValue, MaxValue}, ...]
 * @returns {Object} API 요청 body 객체
 */
window.buildRequestBody = function(categoryCode, options) {
    return {
        CategoryCode: categoryCode,
        SortCondition: "ASC",
        ItemGrade: "고대",
        Sort: "BUY_PRICE",
        ItemLevelMax: null,
        ItemName: "",
        PageNo: 1,
        ItemGradeQuality: 67, // 품질 67 이상으로 고정
        CharacterClass: "",
        ItemTier: 4,
        ItemLevelMin: 0,
        EtcOptions: options,
        SkillOptions: []
    };
}

/**
 * API 요청을 보내는 함수
 * @param {Object} requestBody - API 요청 body
 * @param {string} apiKey - API 키
 * @returns {Promise<Object>} API 응답 객체
 */
window.sendApiRequest = async function(requestBody, apiKey) {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
 * 장신구 최저가를 조회하는 함수
 * @param {number} categoryCode - 장신구 카테고리 코드
 * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중", 등)
 * @param {Array} options - 검색할 옵션 배열 (형식: [{FirstOption, SecondOption, Value}, ...])
 * @param {string} apiKey - API 키
 * @returns {Promise<number>} 최저가 (골드)
 */
window.getLowestPrice = async function(categoryCode, combinationType, options, apiKey) {
    // 옵션 조합 타입에 따른 EtcOptions 구성
    const etcOptions = convertOptionsToEtcOptions(options, combinationType);
    
    // API 요청 본문 구성
    const requestBody = buildRequestBody(categoryCode, etcOptions);
    
    try {
        // API 요청 전송
        const response = await sendApiRequest(requestBody, apiKey);
        
        // 결과가 없는 경우
        if (!response || response.length === 0) {
            return null;
        }
        
        // 최저가 아이템 반환
        return {
            price: response[0].AuctionInfo.BuyPrice,
            quality: response[0].Quality,
            itemName: response[0].Name
        };
    } catch (error) {
        console.error('최저가 조회 중 오류 발생:', error);
        throw error;
    }
}

/**
 * 옵션 배열을 EtcOptions 형식으로 변환하는 함수
 * @param {Array} options - 옵션 배열 [{FirstOption, SecondOption, Value}, ...]
 * @param {string} combinationType - 옵션 조합 타입
 * @returns {Array} EtcOptions 형식의 배열
 */
window.convertOptionsToEtcOptions = function(options, combinationType) {
    // 상, 중, 하 등급에 따른 값 조정을 위한 함수
    function adjustValueByGrade(value, grade) {
        switch (grade) {
            case '상': return value;     // 상급은 그대로
            case '중': return Math.floor(value * 0.75); // 중급은 75%
            case '하': return Math.floor(value * 0.5);  // 하급은 50%
            case '무': return 0;         // 무는 0
            default: return value;       // 기본값은 그대로
        }
    }
    
    // 조합 타입에 따른 등급 결정
    // 예: "상중" => ["상", "중"]
    const gradeMap = {
        "상상": ["상", "상"],
        "상중": ["상", "중"],
        "중상": ["중", "상"],
        "상하": ["상", "하"],
        "하상": ["하", "상"],
        "상무": ["상", "무"],
        "무상": ["무", "상"],
        "중중": ["중", "중"],
        "중하": ["중", "하"],
        "하중": ["하", "중"],
        "중무": ["중", "무"],
        "무중": ["무", "중"],
        "하하": ["하", "하"],
        "하무": ["하", "무"],
        "무하": ["무", "하"],
        "무무": ["무", "무"]
    };
    
    const grades = gradeMap[combinationType] || ["상", "상"];
    
    // 옵션이 2개 이상이면
    if (options.length >= 2) {
        return [
            {
                FirstOption: options[0].FirstOption,
                SecondOption: options[0].SecondOption,
                MinValue: adjustValueByGrade(options[0].Value, grades[0]),
                MaxValue: adjustValueByGrade(options[0].Value, grades[0])
            },
            {
                FirstOption: options[1].FirstOption,
                SecondOption: options[1].SecondOption,
                MinValue: adjustValueByGrade(options[1].Value, grades[1]),
                MaxValue: adjustValueByGrade(options[1].Value, grades[1])
            },
            // 나머지 빈 슬롯 추가
            {
                FirstOption: 7,
                SecondOption: null,
                MinValue: "",
                MaxValue: ""
            }
        ];
    } else if (options.length === 1) {
        // 옵션이 1개인 경우
        return [
            {
                FirstOption: options[0].FirstOption,
                SecondOption: options[0].SecondOption,
                MinValue: adjustValueByGrade(options[0].Value, grades[0]),
                MaxValue: adjustValueByGrade(options[0].Value, grades[0])
            },
            // 나머지 빈 슬롯 추가
            {
                FirstOption: 7,
                SecondOption: null,
                MinValue: "",
                MaxValue: ""
            },
            {
                FirstOption: 7,
                SecondOption: null,
                MinValue: "",
                MaxValue: ""
            }
        ];
    } else {
        // 옵션이 없는 경우
        return [
            {
                FirstOption: 7,
                SecondOption: null,
                MinValue: "",
                MaxValue: ""
            },
            {
                FirstOption: 7,
                SecondOption: null,
                MinValue: "",
                MaxValue: ""
            },
            {
                FirstOption: 7,
                SecondOption: null,
                MinValue: "",
                MaxValue: ""
            }
        ];
    }
}

/**
 * 장신구 API 모듈 내보내기
 */
/**
 * 클래스 타입에 따른 장신구 옵션 가져오기
 * @param {string} classType - 클래스 타입 ("DEALER" 또는 "SUPPORTER")
 * @param {string} accessoryType - 장신구 타입 ("NECKLACE", "EARRING", "RING")
 * @returns {Array} 해당 클래스와 장신구 타입에 대한 옵션 배열
 */
window.getOptionsForClass = function(classType, accessoryType) {
    if (!ACCESSORY_OPTIONS[classType] || !ACCESSORY_OPTIONS[classType][accessoryType]) {
        console.error(`알 수 없는 클래스 타입(${classType}) 또는 장신구 타입(${accessoryType})`);
        return [];
    }
    
    return ACCESSORY_OPTIONS[classType][accessoryType];
}

/**
 * 클래스 타입과 장신구 타입에 맞는 최저가를 조회하는 함수
 * @param {string} classType - 클래스 타입 ("DEALER" 또는 "SUPPORTER")
 * @param {string} accessoryType - 장신구 타입 ("NECKLACE", "EARRING", "RING")
 * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중", 등)
 * @param {Array} values - 옵션 값 배열 [첫번째 옵션 값, 두번째 옵션 값]
 * @param {string} apiKey - API 키
 * @returns {Promise<Object|null>} 최저가 정보
 */
window.getLowestPriceByClass = async function(classType, accessoryType, combinationType, values, apiKey) {
    const options = getOptionsForClass(classType, accessoryType);
    if (options.length === 0) return null;
    
    // 옵션 값 설정
    const optionsWithValues = options.map((option, index) => ({
        ...option,
        Value: values[index] || 0 // 값이 없으면 0으로 설정
    }));
    
    // 카테고리 코드 설정
    const categoryCode = ACCESSORY_CODES[accessoryType];
    if (!categoryCode) {
        console.error(`알 수 없는 장신구 타입: ${accessoryType}`);
        return null;
    }
    
    // 최저가 조회
    return await getLowestPrice(categoryCode, combinationType, optionsWithValues, apiKey);
}

/**
 * 문자열 타입을 받아 최저가를 조회하는 함수
 * @param {string} classTypeString - 클래스 타입 ("딜러" 또는 "서포터")
 * @param {string} accessoryTypeString - 장신구 타입 ("목걸이", "귀걸이", "반지")
 * @param {string} combinationTypeString - 옵션 조합 타입 (예: "상상", "상중", 등)
 * @param {Array} values - 옵션 값 배열 [첫번째 옵션 값, 두번째 옵션 값]
 * @param {string} apiKey - API 키
 * @returns {Promise<Object|null>} 최저가 정보
 */
window.getLowestPriceByStringTypes = async function(classTypeString, accessoryTypeString, combinationTypeString, values, apiKey) {
    // 이름을 키로 변환
    const classTypeKey = getClassTypeKey(classTypeString);
    const accessoryTypeKey = getAccessoryTypeKey(accessoryTypeString);
    const combinationTypeKey = findCombinationTypeKey(combinationTypeString);
    
    if (!classTypeKey) {
        console.error(`알 수 없는 클래스 타입: ${classTypeString}`);
        return null;
    }
    
    if (!accessoryTypeKey) {
        console.error(`알 수 없는 장신구 타입: ${accessoryTypeString}`);
        return null;
    }
    
    if (!combinationTypeKey) {
        console.error(`알 수 없는 조합 타입: ${combinationTypeString}`);
        return null;
    }
    
    // 최저가 조회 (이미 존재하는 함수 활용)
    return await getLowestPriceByClass(classTypeKey, accessoryTypeKey, OPTION_COMBINATION_TYPES[combinationTypeKey], values, apiKey);
}

// 전역 변수로 모듈 정의
window.MarketApi = {
    ACCESSORY_CODES: window.ACCESSORY_CODES,
    ACCESSORY_OPTIONS: window.ACCESSORY_OPTIONS,
    OPTION_COMBINATION_TYPES: window.OPTION_COMBINATION_TYPES,
    getLowestPrice: window.getLowestPrice,
    getLowestPriceByClass: window.getLowestPriceByClass,
    getLowestPriceByStringTypes: window.getLowestPriceByStringTypes,
    getOptionsForClass: window.getOptionsForClass,
    buildRequestBody: window.buildRequestBody,
    sendApiRequest: window.sendApiRequest,
    convertOptionsToEtcOptions: window.convertOptionsToEtcOptions,
    getAccessoryCodeByString: window.getAccessoryCodeByString,
    getAccessoryTypeKey: window.getAccessoryTypeKey,
    getClassTypeKey: window.getClassTypeKey,
    findCombinationTypeKey: window.findCombinationTypeKey
};

// export 구문 추가
export default window.MarketApi;
