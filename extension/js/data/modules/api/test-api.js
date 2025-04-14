/**
 * API 모듈 테스트용 파일
 */

import { MarketApi, AccessorySearch } from './index.js';

// API 키 (실제로는 안전하게 보관해야 함)
const TEST_API_KEY = 'YOUR_API_KEY';

/**
 * 딜러 장신구 테스트 함수
 */
async function testDealerAccessories() {
    try {
        // 딜러 옵션 정보 출력
        console.log('딜러 목걸이 옵션:', MarketApi.ACCESSORY_OPTIONS.DEALER.NECKLACE);
        console.log('딜러 귀걸이 옵션:', MarketApi.ACCESSORY_OPTIONS.DEALER.EARRING);
        console.log('딜러 반지 옵션:', MarketApi.ACCESSORY_OPTIONS.DEALER.RING);

        // 목걸이 상상 조합 최저가 조회 (딜러)
        // 옵션값 배열: [추가피해 값, 적에게 주는 피해 값]
        const necklaceResult = await AccessorySearch.searchDealer(
            'NECKLACE',
            MarketApi.OPTION_COMBINATION_TYPES.SANG_SANG,
            [260, 200] // 추가피해 260, 적에게 주는 피해 200
        );

        console.log('딜러 목걸이 상상 최저가:', necklaceResult);

        // 귀걸이 상중 조합 최저가 조회 (딜러)
        // 옵션값 배열: [공격력% 값, 무기공격력% 값]
        const earringResult = await AccessorySearch.searchDealer(
            'EARRING',
            MarketApi.OPTION_COMBINATION_TYPES.SANG_JUNG,
            [95, 82] // 공격력% 95, 무기공격력% 82
        );

        console.log('딜러 귀걸이 상중 최저가:', earringResult);

        // 반지 상하 조합 최저가 조회 (딜러)
        // 옵션값 배열: [치명타피해 값, 치명타적중률 값]
        const ringResult = await AccessorySearch.searchDealer(
            'RING',
            MarketApi.OPTION_COMBINATION_TYPES.SANG_HA,
            [240, 70] // 치명타피해 240, 치명타적중률 70
        );

        console.log('딜러 반지 상하 최저가:', ringResult);
    } catch (error) {
        console.error('딜러 API 테스트 중 오류 발생:', error);
    }
}

/**
 * 서포터 장신구 테스트 함수
 */
async function testSupporterAccessories() {
    try {
        // 서포터 옵션 정보 출력
        console.log('서포터 목걸이 옵션:', MarketApi.ACCESSORY_OPTIONS.SUPPORTER.NECKLACE);
        console.log('서포터 귀걸이 옵션:', MarketApi.ACCESSORY_OPTIONS.SUPPORTER.EARRING);
        console.log('서포터 반지 옵션:', MarketApi.ACCESSORY_OPTIONS.SUPPORTER.RING);

        // 목걸이 상상 조합 최저가 조회 (서포터)
        // 옵션값 배열: [낙인력 값, 세레나데/신성/조화 게이지 획득량 값]
        const necklaceResult = await AccessorySearch.searchSupporter(
            'NECKLACE',
            MarketApi.OPTION_COMBINATION_TYPES.SANG_SANG,
            [480, 360] // 낙인력 480, 세레나데/신성/조화 게이지 획득량 360
        );

        console.log('서포터 목걸이 상상 최저가:', necklaceResult);

        // 귀걸이 상중 조합 최저가 조회 (서포터)
        // 옵션값 배열: [무기공격력% 값, 무기공격력+ 값]
        const earringResult = await AccessorySearch.searchSupporter(
            'EARRING',
            MarketApi.OPTION_COMBINATION_TYPES.SANG_JUNG,
            [180, 105] // 무기공격력% 180, 무기공격력+ 105
        );

        console.log('서포터 귀걸이 상중 최저가:', earringResult);

        // 반지 상하 조합 최저가 조회 (서포터)
        // 옵션값 배열: [아군 공격력 강화 효과 값, 아군 피해량 강화 효과 값]
        const ringResult = await AccessorySearch.searchSupporter(
            'RING',
            MarketApi.OPTION_COMBINATION_TYPES.SANG_HA,
            [300, 200] // 아군 공격력 강화 효과 300, 아군 피해량 강화 효과 200
        );

        console.log('서포터 반지 상하 최저가:', ringResult);
    } catch (error) {
        console.error('서포터 API 테스트 중 오류 발생:', error);
    }
}

/**
 * API 테스트 함수
 */
async function testMarketApi() {
    // 딜러 장신구 테스트
    await testDealerAccessories();
    
    // 서포터 장신구 테스트
    await testSupporterAccessories();
}

// 테스트 실행 (필요할 때 주석 해제)
// testMarketApi();

export {
    testMarketApi,
    testDealerAccessories,
    testSupporterAccessories
};

export default {
    testMarketApi,
    testDealerAccessories,
    testSupporterAccessories
};
