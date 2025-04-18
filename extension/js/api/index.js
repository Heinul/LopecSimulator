/**
 * 로펙 시뮬레이터 API 모듈
 * 모든 API 관련 기능을 통합합니다.
 */

// API 클라이언트 가져오기
import { ApiClient, ApiKeyManager } from './apiClient.js';

// 상수 가져오기
import * as Constants from './constants.js';

// 요청 빌더 가져오기
import * as RequestBuilder from './requestBuilder.js';

// 장신구 API 가져오기
import AccessoryApi from './accessoryApi.js';

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
    window.LopecScanner.API.ApiClient = ApiClient;
    window.LopecScanner.API.ApiKeyManager = ApiKeyManager;
    window.LopecScanner.API.AccessoryApi = AccessoryApi;
    window.LopecScanner.API.Constants = Constants;
    window.LopecScanner.API.RequestBuilder = RequestBuilder;
    
    // 편의 함수들
    window.LopecScanner.API.getAccessoryPrice = async function(categoryCode, combinationType, options) {
        return AccessoryApi.searchLowestPrice(categoryCode, combinationType, options);
    };
    
    window.LopecScanner.API.searchByString = async function(classType, accessoryType, combinationType) {
        return AccessoryApi.searchByStringType(classType, accessoryType, combinationType);
    };
    
    // 상수들 - 편의성을 위해 전역으로 노출
    window.LopecScanner.API.COMBO_TYPES = Object.values(Constants.OPTION_COMBINATION_TYPES);
    window.LopecScanner.API.ACCESSORY_TYPES = Constants.ACCESSORY_TYPE_MAPPING;
    window.LopecScanner.API.CLASS_TYPES = Constants.CLASS_TYPE_MAPPING;
}

// 모듈 내보내기
export {
    ApiClient,
    ApiKeyManager,
    Constants,
    RequestBuilder,
    AccessoryApi,
    initialize
};

export default {
    ApiClient,
    ApiKeyManager,
    Constants,
    RequestBuilder,
    AccessoryApi,
    initialize
};

// 모듈 자동 초기화
if (typeof window !== 'undefined') {
    initialize();
}
