/**
 * API 요청 데이터 생성 모듈
 * markets와 auctions 요청을 위한 데이터 생성 함수를 제공합니다.
 */



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
            return CATEGORY_CODES.accessory.necklace;
        case "귀걸이":
            return CATEGORY_CODES.accessory.earring;
        case "반지":
            return CATEGORY_CODES.accessory.ring;
        default:
            return null;
    }
}

/**
 * 문자열로 등급 타입 찾기
 * @param {string} gradeString - 등급 문자열 ("상", "중", "하", "무")
 * @returns {string} 등급 타입 ("HIGH", "MEDIUM", "LOW", "NONE")
 */
window.getGradeTypeByString = function(gradeString) {
    return GRADE_TYPE_MAPPING[gradeString] || "NONE";
}

/**
 * 옵션 값 조정 (등급에 따라)
 * @param {number} baseValue - 기준 값
 * @param {string} grade - 등급 ("상", "중", "하", "무")
 * @returns {number} 조정된 값
 */
window.adjustValueByGrade = function(baseValue, grade) {
    switch (grade) {
        case "상": return baseValue;
        case "중": return Math.floor(baseValue * 0.6);
        case "하": return Math.floor(baseValue * 0.27);
        case "무": return 0;
        default: return baseValue;
    }
}

/**
 * 옵션 SecondOption과 등급으로 실제 값 가져오기
 * @param {string} accessoryType - 장신구 타입 키 ("NECKLACE", "EARRING", "RING")
 * @param {number} secondOption - 옵션 SecondOption 코드
 * @param {string} grade - 등급 ("HIGH", "MEDIUM", "LOW")
 * @returns {Object|null} MinValue, MaxValue를 포함한 객체 또는 null
 */
window.getOptionValueByGrade = function(accessoryType, secondOption, grade) {
    if (
        OPTION_VALUES[accessoryType] && 
        OPTION_VALUES[accessoryType][secondOption] && 
        OPTION_VALUES[accessoryType][secondOption][grade]
    ) {
        return OPTION_VALUES[accessoryType][secondOption][grade];
    }
    return null;
}

/**
 * 옵션 배열을 EtcOptions 형식으로 변환
 * @param {Array} options - 옵션 배열 [{FirstOption, SecondOption, accessoryType, grade}, ...]
 * @returns {Array} EtcOptions 형식의 배열
 */
window.convertToEtcOptions = function(options) {
    // 옵션이 없는 경우 빈 슬롯 3개 반환
    if (!options || options.length === 0) {
        return [
            { FirstOption: 7, SecondOption: null, MinValue: "", MaxValue: "" },
            { FirstOption: 7, SecondOption: null, MinValue: "", MaxValue: "" },
            { FirstOption: 7, SecondOption: null, MinValue: "", MaxValue: "" }
        ];
    }
    
    // 옵션을 EtcOptions 형식으로 변환
    const etcOptions = options.map(option => {
        // 옵션 값 가져오기
        const valueObj = option.values || 
                         getOptionValueByGrade(option.accessoryType, option.SecondOption, option.grade);
        
        // 값이 없으면 빈 슬롯
        if (!valueObj) {
            return { FirstOption: 7, SecondOption: null, MinValue: "", MaxValue: "" };
        }
        
        return {
            FirstOption: option.FirstOption || 7,
            SecondOption: option.SecondOption,
            MinValue: valueObj.MinValue,
            MaxValue: valueObj.MaxValue
        };
    });
    
    // 3개 슬롯에 맞게 빈 슬롯 추가
    while (etcOptions.length < 3) {
        etcOptions.push({ FirstOption: 7, SecondOption: null, MinValue: "", MaxValue: "" });
    }
    
    return etcOptions;
}

/**
 * 장신구 옵션 조합에 따른 EtcOptions 생성
 * @param {Array} options - 옵션 배열 [{FirstOption, SecondOption}, ...]
 * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중")
 * @param {string} accessoryType - 장신구 타입 ("NECKLACE", "EARRING", "RING")
 * @param {string} itemGrade - 아이템 등급 ("고대", "유물" 등)
 * @returns {Array} EtcOptions 형식의 배열
 */
window.createAccessoryEtcOptions = function(options, combinationType, accessoryType, itemGrade = "고대") {
    // 조합 타입에 따른 등급 배열 가져오기
    const grades = GRADE_MAPPING[combinationType] || ["상", "상"];
    
    // 전투 특성 옵션 값 설정 (FirstOption: 8, SecondOption: 1)
    let specialStatValue = 0;
    if (accessoryType === "NECKLACE") {
        specialStatValue = itemGrade === "고대" ? 13 : 10;
    } else { // EARRING 또는 RING
        specialStatValue = itemGrade === "고대" ? 12 : 9;
    }
    
    // 전투 특성 옵션 생성
    const specialStatOption = {
        FirstOption: 8,
        SecondOption: 1,
        MinValue: specialStatValue,
        MaxValue: specialStatValue
    };
    
    // 옵션이 2개 이상인 경우
    if (options && options.length >= 2) {
        const etcOptions = [];
        
        // 전투 특성 옵션 추가
        etcOptions.push(specialStatOption);
        
        // 첫 번째 옵션
        const firstOption = options[0];
        const firstGrade = getGradeTypeByString(grades[0]);
        
        // 첫 번째 옵션이 '무' 등급이 아닌 경우에만 추가
        if (grades[0] !== "무") {
            const firstValues = getOptionValueByGrade(accessoryType, firstOption.SecondOption, firstGrade);
            
            if (firstValues) {
                etcOptions.push({
                    FirstOption: firstOption.FirstOption,
                    SecondOption: firstOption.SecondOption,
                    MinValue: firstValues.MinValue,
                    MaxValue: firstValues.MaxValue
                });
            } else {
                etcOptions.push({
                    FirstOption: firstOption.FirstOption,
                    SecondOption: firstOption.SecondOption,
                    MinValue: 0,
                    MaxValue: 0
                });
            }
        }
        
        // 두 번째 옵션
        const secondOption = options[1];
        const secondGrade = getGradeTypeByString(grades[1]);
        
        // 두 번째 옵션이 '무' 등급이 아닌 경우에만 추가
        if (grades[1] !== "무") {
            const secondValues = getOptionValueByGrade(accessoryType, secondOption.SecondOption, secondGrade);
            
            if (secondValues) {
                etcOptions.push({
                    FirstOption: secondOption.FirstOption,
                    SecondOption: secondOption.SecondOption,
                    MinValue: secondValues.MinValue,
                    MaxValue: secondValues.MaxValue
                });
            } else {
                etcOptions.push({
                    FirstOption: secondOption.FirstOption,
                    SecondOption: secondOption.SecondOption,
                    MinValue: 0,
                    MaxValue: 0
                });
            }
        }
        
        // 남은 슬롯 채우기 (옵션이 3개가 될 때까지)
        while (etcOptions.length < 3) {
            etcOptions.push({ FirstOption: 7, SecondOption: null, MinValue: "", MaxValue: "" });
        }
        
        return etcOptions;
    }
    
    // 기본적으로 전투 특성 옵션과 빈 슬롯 2개 반환
    return [
        specialStatOption,
        { FirstOption: 7, SecondOption: null, MinValue: "", MaxValue: "" },
        { FirstOption: 7, SecondOption: null, MinValue: "", MaxValue: "" }
    ];
}

/**
 * 클래스 타입과 장신구 타입에 맞는 옵션 목록 가져오기
 * @param {string} classType - 클래스 타입 ("DEALER" 또는 "SUPPORTER")
 * @param {string} accessoryType - 장신구 타입 ("NECKLACE", "EARRING", "RING")
 * @returns {Array} 해당 클래스/장신구에 적합한 옵션 배열
 */
window.getOptionsForClass = function(classType, accessoryType) {
    if (
        ACCESSORY_OPTIONS[classType] && 
        ACCESSORY_OPTIONS[classType][accessoryType]
    ) {
        return ACCESSORY_OPTIONS[classType][accessoryType];
    }
    return [];
}

/**
 * 마켓 API용 요청 데이터 생성
 * @param {number} categoryCode - 아이템 카테고리 코드
 * @param {Array} etcOptions - EtcOptions 형식의 배열
 * @param {Object} extraParams - 추가 파라미터
 * @returns {Object} 마켓 API 요청 데이터
 */
window.buildMarketRequestData = function(categoryCode, etcOptions, extraParams = {}) {
    return {
        CategoryCode: categoryCode,
        SortCondition: "ASC",
        ItemGrade: extraParams.ItemGrade || "고대",
        Sort: "BUY_PRICE",
        ItemLevelMax: null,
        ItemName: "",
        PageNo: 1,
        ItemGradeQuality: 67, // 품질 67 이상으로 고정
        CharacterClass: "",
        ItemTier: 4,
        ItemLevelMin: 0,
        EtcOptions: etcOptions,
        SkillOptions: [],
        ...extraParams
    };
}

/**
 * 경매장 API용 요청 데이터 생성
 * @param {number} categoryCode - 아이템 카테고리 코드
 * @param {Array} etcOptions - EtcOptions 형식의 배열
 * @param {Object} extraParams - 추가 파라미터
 * @returns {Object} 경매장 API 요청 데이터
 */
window.buildAuctionRequestData = function(categoryCode, etcOptions, extraParams = {}) {
    return {
        CategoryCode: categoryCode,
        SortCondition: "ASC",
        ItemGrade: extraParams.ItemGrade || "고대",
        Sort: "BUY_PRICE",
        ItemLevelMax: null,
        ItemName: "",
        PageNo: 1,
        ItemGradeQuality: 67, // 품질 67 이상으로 고정
        CharacterClass: "",
        ItemTier: 4,
        ItemLevelMin: 0,
        EtcOptions: etcOptions,
        SkillOptions: [],
        AuctionStatusType: 1, // 경매 진행중인 아이템만 검색 (1: 진행중, 2: 종료)
        ...extraParams
    };
}

/**
 * 한글 문자열로 옵션 생성
 * @param {string} classTypeString - 클래스 타입 문자열 ("딜러" 또는 "서포터")
 * @param {string} accessoryTypeString - 장신구 타입 문자열 ("목걸이", "귀걸이", "반지")
 * @param {string} combinationTypeString - 옵션 조합 타입 문자열 (예: "상상", "상중")
 * @param {string} itemGrade - 아이템 등급 ("고대", "유물" 등)
 * @returns {Object} 경매장 API 요청 데이터
 */
window.buildRequestByStringType = function(classTypeString, accessoryTypeString, combinationTypeString, itemGrade = "고대") {
    // 문자열을 키로 변환
    const classType = CLASS_TYPE_MAPPING[classTypeString];
    const accessoryType = ACCESSORY_TYPE_MAPPING[accessoryTypeString];
    const categoryCode = getAccessoryCodeByString(accessoryTypeString);
    
    if (!classType || !accessoryType || !categoryCode) {
        console.error("유효하지 않은 파라미터:", { classTypeString, accessoryTypeString, combinationTypeString });
        return null;
    }
    
    // 해당 클래스/장신구의 옵션 가져오기
    const options = getOptionsForClass(classType, accessoryType);
    if (!options || options.length === 0) {
        console.error("옵션을 찾을 수 없음:", { classType, accessoryType });
        return null;
    }
    
    // EtcOptions 생성
    const etcOptions = createAccessoryEtcOptions(options, combinationTypeString, accessoryType, itemGrade);
    
    // 경매장 요청 데이터 생성
    return buildAuctionRequestData(categoryCode, etcOptions, { ItemGrade: itemGrade });
}


window.RequestBuilder = {
    buildMarketRequestData: window.buildMarketRequestData,
    buildAuctionRequestData: window.buildAuctionRequestData,
    createAccessoryEtcOptions: window.createAccessoryEtcOptions,
    getOptionsForClass: window.getOptionsForClass,
    convertToEtcOptions: window.convertToEtcOptions,
    getOptionValueByGrade: window.getOptionValueByGrade,
    adjustValueByGrade: window.adjustValueByGrade,
    getGradeTypeByString: window.getGradeTypeByString,
    getAccessoryCodeByString: window.getAccessoryCodeByString,
    findCombinationTypeKey: window.findCombinationTypeKey,
    buildRequestByStringType: window.buildRequestByStringType
};
