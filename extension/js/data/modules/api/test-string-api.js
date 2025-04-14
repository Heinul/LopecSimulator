/**
 * 문자열 API 모듈 테스트용 파일
 */

import { MarketApi, AccessorySearch } from './index.js';

// API 키 (실제로는 안전하게 보관해야 함)
const TEST_API_KEY = 'YOUR_API_KEY';

/**
 * 문자열 타입 검색 테스트 함수
 */
async function testStringTypeSearch() {
    try {
        // 딜러 목걸이 상중 조합 (한글 문자열 사용)
        console.log('딜러 목걸이 옵션 정보:');
        const options = AccessorySearch.getOptionsByStringType('딜러', '목걸이');
        console.log(options);
        
        // 딜러 목걸이 상중 검색
        const result = await AccessorySearch.searchByStringType(
            '딜러',       // 클래스 타입 (딜러)
            '목걸이',     // 장신구 타입 (목걸이)
            '상중',       // 조합 타입 (상중)
            [260, 120]    // 옵션 값 (추가피해 260, 적에게 주는 피해 120)
        );
        
        console.log('딜러 목걸이 상중 최저가:', result);
        
        // 서포터 귀걸이 상상 검색
        const result2 = await AccessorySearch.searchByStringType(
            '서포터',     // 클래스 타입 (서포터)
            '귀걸이',     // 장신구 타입 (귀걸이)
            '상상',       // 조합 타입 (상상)
            [180, 155]    // 옵션 값 (무기공격력% 180, 무기공격력+ 155)
        );
        
        console.log('서포터 귀걸이 상상 최저가:', result2);
        
        // 딜러 반지 중하 검색
        const result3 = await AccessorySearch.searchByStringType(
            '딜러',       // 클래스 타입 (딜러)
            '반지',       // 장신구 타입 (반지)
            '중하',       // 조합 타입 (중하)
            [230, 70]     // 옵션 값 (치명타피해 230, 치명타적중률 70)
        );
        
        console.log('딜러 반지 중하 최저가:', result3);
    } catch (error) {
        console.error('문자열 API 테스트 중 오류 발생:', error);
    }
}

/**
 * 모든 조합 테스트 (1개 클래스, 1개 장신구 타입)
 */
async function testAllCombinations() {
    const combinations = [
        '상상', '상중', '중상', '상하', '하상', '상무', '무상',
        '중중', '중하', '하중', '중무', '무중', '하하', '하무', '무하', '무무'
    ];
    
    try {
        console.log('===== 모든 딜러 목걸이 조합 테스트 =====');
        
        for (const combo of combinations) {
            console.log(`\n----- 딜러 목걸이 ${combo} 테스트 -----`);
            const result = await AccessorySearch.searchByStringType(
                '딜러', '목걸이', combo, [260, 130]
            );
            console.log(`결과:`, result);
        }
    } catch (error) {
        console.error('조합 테스트 중 오류 발생:', error);
    }
}

// 테스트 실행 (필요할 때 주석 해제)
// testStringTypeSearch();
// testAllCombinations();

export {
    testStringTypeSearch,
    testAllCombinations
};

export default {
    testStringTypeSearch,
    testAllCombinations
};
