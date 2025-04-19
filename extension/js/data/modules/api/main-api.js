/**
 * 로펙 시뮬레이터 API 메인 모듈
 * 모든 API 관련 기능을 통합하여 내보냅니다.
 */

import MarketApi from './market-api.js';
import GemApi from './gem-api.js';
import EngravingApi from './engraving-api.js';
import CONFIG from './config.js';

/**
 * API 키 관리
 */
const ApiKeyManager = {
    /**
     * API 키 가져오기
     * @returns {Promise<string>} API 키
     */
    async getApiKey() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['lostarkApiKey'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('API 키 로드 중 오류:', chrome.runtime.lastError);
                    resolve(null);
                    return;
                }
                resolve(result.lostarkApiKey || null);
            });
        });
    },
    
    /**
     * API 키 저장하기
     * @param {string} apiKey - 저장할 API 키
     * @returns {Promise<boolean>} 저장 성공 여부
     */
    async saveApiKey(apiKey) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ lostarkApiKey: apiKey }, () => {
                if (chrome.runtime.lastError) {
                    console.error('API 키 저장 중 오류:', chrome.runtime.lastError);
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    },
    
    /**
     * API 키 테스트
     * @param {string} apiKey - 테스트할 API 키
     * @returns {Promise<{success: boolean, message: string}>} 테스트 결과
     */
    async testApiKey(apiKey) {
        if (!apiKey) {
            apiKey = await this.getApiKey();
            if (!apiKey) {
                return { 
                    success: false, 
                    message: 'API 키가 설정되지 않았습니다.' 
                };
            }
        }
        
        try {
            const response = await fetch(`${CONFIG.baseUrl}${CONFIG.endpoints.auctionOptions}`, {
                method: 'GET',
                headers: {
                    ...CONFIG.headers,
                    'authorization': `bearer ${apiKey}`
                }
            });
            
            if (response.status === 200) {
                return { 
                    success: true, 
                    message: 'API 연결 성공' 
                };
            } else {
                let errorMsg = `API 연결 실패 (${response.status})`;
                if (response.status === 401) {
                    errorMsg = '유효하지 않은 API 키입니다.';
                } else if (response.status === 429) {
                    errorMsg = '요청 한도를 초과했습니다.';
                }
                
                return { 
                    success: false, 
                    message: errorMsg 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: `오류 발생: ${error.message}` 
            };
        }
    }
};

/**
 * 장신구 가격 검색 API
 */
const AccessorySearch = {
    /**
     * 장신구 검색 기능
     * @param {number} categoryCode - 장신구 코드 (200010: 목걸이, 200020: 귀걸이, 200030: 반지)
     * @param {string} combinationType - 옵션 조합 유형 (상상, 상중, 중상 등)
     * @param {Array} options - 옵션 배열 [{FirstOption, SecondOption, Value}, ...]
     * @returns {Promise<{price: number, quality: number, itemName: string} | null>} 검색 결과
     */
    async searchAccessory(categoryCode, combinationType, options) {
        const apiKey = await ApiKeyManager.getApiKey();
        if (!apiKey) {
            console.error('API 키가 설정되지 않았습니다.');
            return null;
        }
        
        try {
            return await MarketApi.getLowestPrice(categoryCode, combinationType, options, apiKey);
        } catch (error) {
            console.error('장신구 검색 중 오류 발생:', error);
            return null;
        }
    },
    
    /**
     * 목걸이 검색
     * @param {string} combinationType - 옵션 조합 유형
     * @param {Array} options - 옵션 배열
     * @returns {Promise<Object|null>} 검색 결과
     */
    async searchNecklace(combinationType, options) {
        return this.searchAccessory(MarketApi.ACCESSORY_CODES.NECKLACE, combinationType, options);
    },
    
    /**
     * 귀걸이 검색
     * @param {string} combinationType - 옵션 조합 유형 
     * @param {Array} options - 옵션 배열
     * @returns {Promise<Object|null>} 검색 결과
     */
    async searchEarring(combinationType, options) {
        return this.searchAccessory(MarketApi.ACCESSORY_CODES.EARRING, combinationType, options);
    },
    
    /**
     * 반지 검색
     * @param {string} combinationType - 옵션 조합 유형
     * @param {Array} options - 옵션 배열
     * @returns {Promise<Object|null>} 검색 결과
     */
    async searchRing(combinationType, options) {
        return this.searchAccessory(MarketApi.ACCESSORY_CODES.RING, combinationType, options);
    },
    
    
    /**
     * 옵션 정보 가져오기
     * @param {string} classType - 클래스 타입 ("DEALER" 또는 "SUPPORTER")
     * @param {string} accessoryType - 장신구 타입 ("NECKLACE", "EARRING", "RING")
     * @returns {Array} 옵션 배열
     */
    getOptions(classType, accessoryType) {
        return MarketApi.getOptionsForClass(classType, accessoryType);
    },
    
    
    /**
     * 문자열 타입으로 옵션 정보 가져오기
     * @param {string} classType - 클래스 타입 문자열 ("딜러" 또는 "서포터")
     * @param {string} accessoryType - 장신구 타입 문자열 ("목걸이", "귀걸이", "반지")
     * @returns {Array} 옵션 배열
     */
    getOptionsByStringType(classType, accessoryType) {
        const classTypeKey = MarketApi.getClassTypeKey(classType);
        const accessoryTypeKey = MarketApi.getAccessoryTypeKey(accessoryType);
        
        if (!classTypeKey || !accessoryTypeKey) {
            console.error(`알 수 없는 클래스 타입(${classType}) 또는 장신구 타입(${accessoryType})`);
            return [];
        }
        
        return MarketApi.getOptionsForClass(classTypeKey, accessoryTypeKey);
    }
};

/**
 * 보석 검색 API
 */
const GemSearch = {
  /**
   * 보석 가격 검색
   * @param {number} level - 보석 레벨 (1~10)
   * @param {string} type - 보석 타입 ("멸화", "겁화", "홍염", "작열")
   * @returns {Promise<Object|null>} 보석 가격 정보
   */
  async searchGem(level, type) {
    const apiKey = await ApiKeyManager.getApiKey();
    if (!apiKey) {
      console.error('API 키가 설정되지 않았습니다.');
      return null;
    }
    
    try {
      return await GemApi.getGemPriceByLevelAndType(level, type, apiKey);
    } catch (error) {
      console.error(`보석 검색 중 오류 발생 (${level}레벨 ${type}):`, error);
      return null;
    }
  }
};

/**
 * 각인서 검색 API
 */
const EngravingSearch = {
    /**
     * 각인서 가격 검색
     * @param {string} engravingName - 각인 이름 (예: "돌격대장")
     * @param {string|null} grade - 각인서 등급 (파라미터 사용하지 않음)
     * @returns {Promise<Object|null>} 각인서 가격 정보
     */
    async searchEngraving(engravingName, grade = null) {
        const apiKey = await ApiKeyManager.getApiKey();
        if (!apiKey) {
            console.error('API 키가 설정되지 않았습니다.');
            return null;
        }
        
        try {
            // 각인 이름만 사용하여 검색 (등급 무시)
            return await EngravingApi.getEngravingPrice(engravingName, null, apiKey);
        } catch (error) {
            console.error(`각인서 검색 중 오류 발생 (${engravingName}):`, error);
            return null;
        }
    },
    
    /**
     * 여러 등급의 각인서 가격 검색
     * @param {string} engravingName - 각인 이름 (예: "돌격대장")
     * @param {Array} grades - 등급 배열 (파라미터 사용하지 않음)
     * @returns {Promise<Object|null>} 등급별 각인서 가격 정보
     */
    async searchEngravingByGrades(engravingName, grades = null) {
        const apiKey = await ApiKeyManager.getApiKey();
        if (!apiKey) {
            console.error('API 키가 설정되지 않았습니다.');
            return null;
        }
        
        try {
            // 각인 이름만 사용하여 모든 등급 정보 한번에 가져오기
            return await EngravingApi.getEngravingPricesByGrades(engravingName, null, apiKey);
        } catch (error) {
            console.error(`각인서 검색 중 오류 발생 (${engravingName}):`, error);
            return null;
        }
    }
};

// 모듈 초기화 함수
function initialize() {
    console.log('API 모듈 초기화 완료');
}

// LopecScanner 전역 네임스페이스에 API 추가
if (window.LopecScanner === undefined) {
    window.LopecScanner = {};
}

if (window.LopecScanner.API === undefined) {
    window.LopecScanner.API = {};
}

// API 기능 연결
window.LopecScanner.API.MarketApi = MarketApi;
window.LopecScanner.API.GemApi = GemApi;
window.LopecScanner.API.EngravingApi = EngravingApi;
window.LopecScanner.API.ApiKeyManager = ApiKeyManager;
window.LopecScanner.API.AccessorySearch = AccessorySearch;
window.LopecScanner.API.GemSearch = GemSearch;
window.LopecScanner.API.EngravingSearch = EngravingSearch;
window.LopecScanner.API.CONFIG = CONFIG;

// 이전 코드와의 호환성을 위한 함수
window.LopecScanner.API.getAccessoryPrice = async function(categoryCode, combinationType, options) {
    return AccessorySearch.searchAccessory(categoryCode, combinationType, options);
};

// 문자열 타입 지원 함수 - AccessoryApi.js 함수를 사용하도록 구현
window.LopecScanner.API.searchByString = async function(classType, accessoryType, combinationType, values) {
    // tierValue가 values에 있다면 사용하고, 없으면 기본값을 사용
    const tierValue = values && values.tier ? values.tier : "고대";
    return window.AccessoryApi.searchByStringType(classType, accessoryType, combinationType, tierValue);
};

// 보석 검색 함수
window.LopecScanner.API.searchGem = async function(level, type) {
    return GemSearch.searchGem(level, type);
};

// 각인서 검색 함수
window.LopecScanner.API.searchEngraving = async function(engravingName, grade = null) {
    // 등급 파라미터는 무시하고 각인 이름만 사용
    return EngravingSearch.searchEngraving(engravingName, null);
};

// 트리거 함수 - 리스너 등록용
window.LopecScanner.API.onSearchComplete = null;

// 조합 상수
window.LopecScanner.API.COMBO_TYPES = Object.values(MarketApi.OPTION_COMBINATION_TYPES);

// 장신구 타입 상수
window.LopecScanner.API.ACCESSORY_TYPES = {
    "목걸이": "NECKLACE",
    "귀걸이": "EARRING",
    "반지": "RING"
};

// 클래스 타입 상수
window.LopecScanner.API.CLASS_TYPES = {
    "딜러": "DEALER",
    "서포터": "SUPPORTER"
};

// 보석 타입 상수
window.LopecScanner.API.GEM_TYPES = GemApi.GEM_TYPES;

// 각인서 등급 상수
window.LopecScanner.API.ENGRAVING_GRADES = EngravingApi.ENGRAVING_GRADES;

// 내보내기
export {
    MarketApi,
    GemApi,
    EngravingApi,
    ApiKeyManager,
    AccessorySearch,
    GemSearch,
    EngravingSearch,
    CONFIG,
    initialize
};

export default {
    MarketApi,
    GemApi,
    EngravingApi,
    ApiKeyManager,
    AccessorySearch,
    GemSearch,
    EngravingSearch,
    CONFIG,
    initialize
};

// 모듈 자동 초기화
initialize();