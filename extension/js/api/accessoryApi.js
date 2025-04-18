/**
 * 장신구 검색 API 모듈
 */

import { ApiClient } from './apiClient.js';
import { 
    CATEGORY_CODES,
    ACCESSORY_OPTIONS,
    OPTION_COMBINATION_TYPES,
    CLASS_TYPE_MAPPING,
    ACCESSORY_TYPE_MAPPING
} from './constants.js';
import {
    buildMarketRequestData,
    createAccessoryEtcOptions,
    getOptionsForClass,
    getAccessoryCodeByString,
    buildRequestByStringType
} from './requestBuilder.js';

/**
 * 장신구 최저가 검색 API
 */
export const AccessoryApi = {
    /**
     * 장신구 최저가 검색
     * @param {number} categoryCode - 장신구 카테고리 코드
     * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중")
     * @param {Array} options - 옵션 배열 [{FirstOption, SecondOption}, ...]
     * @returns {Promise<Object|null>} 최저가 정보 또는 null
     */
    async searchLowestPrice(categoryCode, combinationType, options) {
        try {
            // 장신구 타입 판별
            let accessoryType;
            switch(categoryCode) {
                case CATEGORY_CODES.accessory.necklace:
                    accessoryType = "NECKLACE";
                    break;
                case CATEGORY_CODES.accessory.earring:
                    accessoryType = "EARRING";
                    break;
                case CATEGORY_CODES.accessory.ring:
                    accessoryType = "RING";
                    break;
                default:
                    throw new Error(`알 수 없는 장신구 코드: ${categoryCode}`);
            }
            
            // EtcOptions 생성
            const etcOptions = createAccessoryEtcOptions(options, combinationType, accessoryType);
            
            // 요청 데이터 생성
            const requestData = buildMarketRequestData(categoryCode, etcOptions);
            
            // API 요청 전송
            const response = await ApiClient.sendMarketRequest(requestData);
            
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
            console.error('장신구 최저가 검색 중 오류 발생:', error);
            throw error;
        }
    },
    
    /**
     * 클래스 타입과 장신구 타입에 맞는 최저가 검색
     * @param {string} classType - 클래스 타입 ("DEALER" 또는 "SUPPORTER")
     * @param {string} accessoryType - 장신구 타입 ("NECKLACE", "EARRING", "RING")
     * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중")
     * @returns {Promise<Object|null>} 최저가 정보 또는 null
     */
    async searchByClass(classType, accessoryType, combinationType) {
        try {
            // 해당 클래스/장신구의 옵션 가져오기
            const options = getOptionsForClass(classType, accessoryType);
            if (!options || options.length === 0) {
                throw new Error(`옵션을 찾을 수 없음: ${classType} ${accessoryType}`);
            }
            
            // 장신구 코드 가져오기
            let categoryCode;
            switch(accessoryType) {
                case "NECKLACE":
                    categoryCode = CATEGORY_CODES.accessory.necklace;
                    break;
                case "EARRING":
                    categoryCode = CATEGORY_CODES.accessory.earring;
                    break;
                case "RING":
                    categoryCode = CATEGORY_CODES.accessory.ring;
                    break;
                default:
                    throw new Error(`알 수 없는 장신구 타입: ${accessoryType}`);
            }
            
            // 최저가 검색
            return await this.searchLowestPrice(categoryCode, combinationType, options);
        } catch (error) {
            console.error(`${classType} ${accessoryType} 검색 중 오류 발생:`, error);
            throw error;
        }
    },
    
    /**
     * 한글 문자열 타입으로 최저가 검색
     * @param {string} classTypeString - 클래스 타입 문자열 ("딜러" 또는 "서포터")
     * @param {string} accessoryTypeString - 장신구 타입 문자열 ("목걸이", "귀걸이", "반지")
     * @param {string} combinationTypeString - 옵션 조합 타입 문자열 (예: "상상", "상중")
     * @returns {Promise<Object|null>} 최저가 정보 또는 null
     */
    async searchByStringType(classTypeString, accessoryTypeString, combinationTypeString) {
        try {
            // 문자열을 키로 변환
            const classType = CLASS_TYPE_MAPPING[classTypeString];
            const accessoryType = ACCESSORY_TYPE_MAPPING[accessoryTypeString];
            
            if (!classType || !accessoryType) {
                throw new Error(`유효하지 않은 파라미터: ${classTypeString}, ${accessoryTypeString}`);
            }
            
            // 클래스 타입과 장신구 타입으로 검색
            return await this.searchByClass(classType, accessoryType, combinationTypeString);
        } catch (error) {
            console.error(`${classTypeString} ${accessoryTypeString} ${combinationTypeString} 검색 중 오류 발생:`, error);
            throw error;
        }
    },
    
    /**
     * 직접 요청 데이터로 최저가 검색
     * @param {Object} requestData - API 요청 데이터
     * @returns {Promise<Object|null>} 최저가 정보 또는 null
     */
    async searchWithRequestData(requestData) {
        try {
            // API 요청 전송
            const response = await ApiClient.sendMarketRequest(requestData);
            
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
            console.error('장신구 최저가 검색 중 오류 발생:', error);
            throw error;
        }
    },
    
    /**
     * 목걸이 최저가 검색 (편의 함수)
     * @param {string} classType - 클래스 타입 ("DEALER" 또는 "SUPPORTER")
     * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중")
     * @returns {Promise<Object|null>} 최저가 정보 또는 null
     */
    async searchNecklace(classType, combinationType) {
        return this.searchByClass(classType, "NECKLACE", combinationType);
    },
    
    /**
     * 귀걸이 최저가 검색 (편의 함수)
     * @param {string} classType - 클래스 타입 ("DEALER" 또는 "SUPPORTER")
     * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중")
     * @returns {Promise<Object|null>} 최저가 정보 또는 null
     */
    async searchEarring(classType, combinationType) {
        return this.searchByClass(classType, "EARRING", combinationType);
    },
    
    /**
     * 반지 최저가 검색 (편의 함수)
     * @param {string} classType - 클래스 타입 ("DEALER" 또는 "SUPPORTER")
     * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중")
     * @returns {Promise<Object|null>} 최저가 정보 또는 null
     */
    async searchRing(classType, combinationType) {
        return this.searchByClass(classType, "RING", combinationType);
    },
    
    /**
     * 딜러 장신구 최저가 검색 (편의 함수)
     * @param {string} accessoryType - 장신구 타입 ("NECKLACE", "EARRING", "RING")
     * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중")
     * @returns {Promise<Object|null>} 최저가 정보 또는 null
     */
    async searchDealer(accessoryType, combinationType) {
        return this.searchByClass("DEALER", accessoryType, combinationType);
    },
    
    /**
     * 서포터 장신구 최저가 검색 (편의 함수)
     * @param {string} accessoryType - 장신구 타입 ("NECKLACE", "EARRING", "RING")
     * @param {string} combinationType - 옵션 조합 타입 (예: "상상", "상중")
     * @returns {Promise<Object|null>} 최저가 정보 또는 null
     */
    async searchSupporter(accessoryType, combinationType) {
        return this.searchByClass("SUPPORTER", accessoryType, combinationType);
    },
    
    // 상수 객체
    ACCESSORY_CODES: CATEGORY_CODES.accessory,
    ACCESSORY_OPTIONS,
    OPTION_COMBINATION_TYPES
};

export default AccessoryApi;
