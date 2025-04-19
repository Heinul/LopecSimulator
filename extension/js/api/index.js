/**
 * 로펙 시뮬레이터 API 모듈
 * 모든 API 관련 기능을 통합합니다.
 */



/**
 * API 모듈 초기화 함수
 */
function initialize() {
    console.log('로펙 시뮬레이터 API 모듈 초기화 완료');
    
    // LopecScanner 전역 네임스페이스에 API 추가
    if (window.LopecScanner === undefined) {
        window.LopecScanner = {};
    }
    
    if (window.LopecScanner.API === undefined) {
        window.LopecScanner.API = {};
    }
    
    // API 기능들을 전역 네임스페이스에 연결
    window.LopecScanner.API.ApiClient = window.ApiClient;
    window.LopecScanner.API.ApiKeyManager = window.ApiKeyManager;
    window.LopecScanner.API.AccessoryApi = window.AccessoryApi;
    window.LopecScanner.API.Constants = window.API_CONSTANTS; // Constants를 API_CONSTANTS로 변경
    window.LopecScanner.API.RequestBuilder = window.RequestBuilder;
    
    // 편의 함수들
    window.LopecScanner.API.getAccessoryPrice = async function(categoryCode, combinationType, options) {
        return window.AccessoryApi.searchLowestPrice(categoryCode, combinationType, options);
    };
    
    window.LopecScanner.API.searchByString = async function(classType, accessoryType, combinationType) {
        return window.AccessoryApi.searchByStringType(classType, accessoryType, combinationType);
    };
    
    // 상수들 - 편의성을 위해 전역으로 노출
    window.LopecScanner.API.COMBO_TYPES = Object.values(window.OPTION_COMBINATION_TYPES);
    window.LopecScanner.API.ACCESSORY_TYPES = window.ACCESSORY_TYPE_MAPPING;
    window.LopecScanner.API.CLASS_TYPES = window.CLASS_TYPE_MAPPING;
}



// 모듈 자동 초기화
if (typeof window !== 'undefined') {
    initialize();
}
