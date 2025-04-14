# 로펙 시뮬레이터 API 모듈

이 모듈은 로스트아크 경매장 API를 활용하여 장신구의 가격을 조회하는 기능을 제공합니다.

## 주요 기능

- 목걸이, 귀걸이, 반지 등 장신구의 가격 검색
- 상상, 상중, 중상 등 다양한 옵션 조합 지원
- API 키 관리 및 테스트

## 사용 방법

### 모듈 불러오기

```javascript
// 전체 모듈 불러오기
import * as Api from './modules/api/main-api.js';

// 또는 필요한 부분만 불러오기
import { MarketApi, AccessorySearch } from './modules/api/main-api.js';
```

### 장신구 검색 예제

#### 일반 검색

```javascript
// 목걸이 검색 예제
async function searchNecklace() {
  // 옵션 정의 (예: 추가피해 + 적에게 주는 피해 증가)
  const options = [
    {
      FirstOption: 7,
      SecondOption: 41,
      Value: 260
    },
    {
      FirstOption: 7,
      SecondOption: 42,
      Value: 200
    }
  ];

  // 상상 조합 목걸이 검색
  const result = await AccessorySearch.searchNecklace(
    MarketApi.OPTION_COMBINATION_TYPES.SANG_SANG,
    options
  );

  if (result) {
    console.log(`검색 결과: ${result.price}골드, 품질: ${result.quality}`);
  } else {
    console.log('검색 결과가 없거나 오류가 발생했습니다.');
  }
}
```

#### 직업별 검색 (딜러/서포터)

```javascript
// 딜러 목걸이 검색 예제
async function searchDealerNecklace() {
  // 딜러 목걸이 상상 조합 검색
  // 첫번째 파라미터: 장신구 타입 (NECKLACE, EARRING, RING)
  // 두번째 파라미터: 옵션 조합 타입 (SANG_SANG, SANG_JUNG 등)
  // 세번째 파라미터: 옵션 값 배열 [추가피해 값, 적에게 주는 피해 증가 값]
  const necklaceResult = await AccessorySearch.searchDealer(
    'NECKLACE',
    MarketApi.OPTION_COMBINATION_TYPES.SANG_SANG,
    [260, 200] // 추가피해 260, 적에게 주는 피해 증가 200
  );

  if (necklaceResult) {
    console.log(`딜러 목걸이 가격: ${necklaceResult.price}골드, 품질: ${necklaceResult.quality}`);
  }
  
  // 서포터 목걸이 검색 예제
  const supporterNecklaceResult = await AccessorySearch.searchSupporter(
    'NECKLACE',
    MarketApi.OPTION_COMBINATION_TYPES.SANG_SANG,
    [480, 360] // 낙인력 480, 세레나데/신성/조화 게이지 획득량 360
  );

  if (supporterNecklaceResult) {
    console.log(`서포터 목걸이 가격: ${supporterNecklaceResult.price}골드, 품질: ${supporterNecklaceResult.quality}`);
  }
}
```

#### 옵션 정보 가져오기

```javascript
// 딜러 목걸이 옵션 가져오기
const dealerNecklaceOptions = AccessorySearch.getOptions('DEALER', 'NECKLACE');
console.log('Dealer Necklace Options:', dealerNecklaceOptions);
// => [{ FirstOption: 7, SecondOption: 41, Description: '추가 피해' }, { FirstOption: 7, SecondOption: 42, Description: '적에게 주는 피해 증가' }]

// 서포터 반지 옵션 가져오기
const supporterRingOptions = AccessorySearch.getOptions('SUPPORTER', 'RING');
console.log('Supporter Ring Options:', supporterRingOptions);
// => [{ FirstOption: 7, SecondOption: 51, Description: '아군 공격력 강화 효과' }, { FirstOption: 7, SecondOption: 52, Description: '아군 피해량 강화 효과' }]
```
```

### API 키 관리

```javascript
// API 키 가져오기
const apiKey = await ApiKeyManager.getApiKey();

// API 키 저장하기
await ApiKeyManager.saveApiKey('your-api-key-here');

// API 키 테스트
const testResult = await ApiKeyManager.testApiKey();
console.log(`API 테스트 결과: ${testResult.message}`);
```

## 장신구 코드

- 목걸이: `200010`
- 귀걸이: `200020`
- 반지: `200030`

상수로는 다음과 같이 접근할 수 있습니다:

```javascript
MarketApi.ACCESSORY_CODES.NECKLACE  // 200010
MarketApi.ACCESSORY_CODES.EARRING   // 200020
MarketApi.ACCESSORY_CODES.RING      // 200030
```

## 클래스 타입

- 딜러: `"DEALER"`
- 서포터: `"SUPPORTER"`

## 딜러/서포터 별 옵션 정보

### 딜러 옵션

```javascript
// 딜러 목걸이 옵션
MarketApi.ACCESSORY_OPTIONS.DEALER.NECKLACE
// => [{ FirstOption: 7, SecondOption: 41, Description: '추가 피해' }, 
//     { FirstOption: 7, SecondOption: 42, Description: '적에게 주는 피해 증가' }]

// 딜러 귀걸이 옵션
MarketApi.ACCESSORY_OPTIONS.DEALER.EARRING
// => [{ FirstOption: 7, SecondOption: 45, Description: '공격력 %' }, 
//     { FirstOption: 7, SecondOption: 46, Description: '무기 공격력 %' }]

// 딜러 반지 옵션
MarketApi.ACCESSORY_OPTIONS.DEALER.RING
// => [{ FirstOption: 7, SecondOption: 50, Description: '치명타 피해' }, 
//     { FirstOption: 7, SecondOption: 49, Description: '치명타 적중률' }]
```

### 서포터 옵션

```javascript
// 서포터 목걸이 옵션
MarketApi.ACCESSORY_OPTIONS.SUPPORTER.NECKLACE
// => [{ FirstOption: 7, SecondOption: 44, Description: '낙인력' }, 
//     { FirstOption: 7, SecondOption: 43, Description: '세레나데/신성/조화 게이지 획득량 증가' }]

// 서포터 귀걸이 옵션
MarketApi.ACCESSORY_OPTIONS.SUPPORTER.EARRING
// => [{ FirstOption: 7, SecondOption: 46, Description: '무기 공격력 %' }, 
//     { FirstOption: 7, SecondOption: 54, Description: '무기 공격력 +' }]

// 서포터 반지 옵션
MarketApi.ACCESSORY_OPTIONS.SUPPORTER.RING
// => [{ FirstOption: 7, SecondOption: 51, Description: '아군 공격력 강화 효과' }, 
//     { FirstOption: 7, SecondOption: 52, Description: '아군 피해량 강화 효과' }]
```

## 옵션 조합 타입

- 상상, 상중, 중상, 상하, 하상, 상무, 무상, 중중, 중하, 하중, 중무, 무중, 하하, 하무, 무하, 무무

상수로는 다음과 같이 접근할 수 있습니다:

```javascript
MarketApi.OPTION_COMBINATION_TYPES.SANG_SANG  // "상상"
MarketApi.OPTION_COMBINATION_TYPES.SANG_JUNG  // "상중"
// 등등...
```

## 한글 문자열 검색 지원

한글로 클래스 타입, 장신구 타입, 옵션 조합 타입을 지정하여 검색할 수 있습니다.

```javascript
// 한글 문자열을 사용한 검색 예제
async function searchWithKorean() {
  const result = await AccessorySearch.searchByStringType(
    '딜러',       // 클래스 타입 (딜러)
    '목걸이',     // 장신구 타입 (목걸이)
    '상중',       // 조합 타입 (상중)
    [260, 120]    // 옵션 값 (추가피해 260, 적에게 주는 피해 120)
  );
  
  console.log("검색 결과:", result);
}
```

가능한 지정 값:

- 클래스 타입: `"딜러"` 또는 `"서포터"`
- 장신구 타입: `"목걸이"`, `"귀걸이"`, `"반지"`
- 조합 타입: `"상상"`, `"상중"`, `"중상"` 등

한글 문자열에 의한 옵션 정보 엎기:

```javascript
// 딜러 장신구 옵션 정보 한글 문자열로 여기
const dealerNecklaceOptions = AccessorySearch.getOptionsByStringType('딜러', '목걸이');
console.log('딜러 목걸이 옵션:', dealerNecklaceOptions);
// => [{ FirstOption: 7, SecondOption: 41, Description: '추가 피해' }, { FirstOption: 7, SecondOption: 42, Description: '적에게 주는 피해 증가' }]
```

글로벌 객체로도 사용 가능:

```javascript
// 글로벌 네임스페이스를 통한 검색
const result = await window.LopecScanner.API.searchByString(
  '딜러',       // 클래스 타입 (딜러)
  '목걸이',     // 장신구 타입 (목걸이)
  '상중',       // 조합 타입 (상중)
  [260, 120]    // 옵션 값
);
```

## API 요청 본문 구조

```javascript
{
  CategoryCode: 200010,           // 장신구 코드
  SortCondition: "ASC",           // 정렬 방향
  ItemGrade: "고대",              // 아이템 등급
  Sort: "BUY_PRICE",              // 정렬 기준
  ItemGradeQuality: 67,           // 품질 (67 이상으로 고정)
  CharacterClass: "",             // 캐릭터 직업
  ItemTier: 4,                    // 아이템 티어
  EtcOptions: [                   // 옵션 배열
    {
      FirstOption: 7,             // 첫번째 옵션 ID
      SecondOption: 41,           // 두번째 옵션 ID
      MinValue: 260,              // 최소값
      MaxValue: 260               // 최대값
    },
    // 추가 옵션들...
  ],
  SkillOptions: []                // 스킬 옵션 (사용하지 않음)
}
```
