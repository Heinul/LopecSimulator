/**
 * API 연결을 위한 상수들 모음
 */

// API 기본 설정
window.API_CONFIG = {
    baseUrl: 'https://developer-lostark.game.onstove.com',
    endpoints: {
        auction: '/auctions/items',
        market: '/markets/items',
        auctionOptions: '/auctions/options'
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// 카테고리 코드
window.CATEGORY_CODES = {
    // 장신구
    accessory: {
        necklace: 200010, // 목걸이
        earring: 200020,  // 귀걸이
        ring: 200030      // 반지
    },
    // 보석
    gem: 210000,
    // 각인서
    engraving: 40000
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

// 옵션 등급별 값 정의
window.OPTION_VALUES = {
    // 목걸이 옵션
    NECKLACE: {
        // 적에게 주는 피해 증가
        42: {
            HIGH: { MinValue: 200, MaxValue: 200 },     // 상
            MEDIUM: { MinValue: 120, MaxValue: 120 },   // 중
            LOW: { MinValue: 55, MaxValue: 55 }         // 하
        },
        // 추가 피해
        41: {
            HIGH: { MinValue: 260, MaxValue: 260 },     // 상
            MEDIUM: { MinValue: 160, MaxValue: 160 },   // 중
            LOW: { MinValue: 60, MaxValue: 60 }         // 하
        },
        // 낙인력
        44: {
            HIGH: { MinValue: 800, MaxValue: 800 },     // 상
            MEDIUM: { MinValue: 480, MaxValue: 480 },   // 중
            LOW: { MinValue: 215, MaxValue: 215 }       // 하
        },
        // 세레나데/신성/조화 게이지 획득량 증가
        43: {
            HIGH: { MinValue: 800, MaxValue: 800 },     // 상
            MEDIUM: { MinValue: 480, MaxValue: 480 },   // 중
            LOW: { MinValue: 215, MaxValue: 215 }       // 하
        }
    },
    
    // 귀걸이 옵션
    EARRING: {
        // 공격력 %
        45: {
            HIGH: { MinValue: 155, MaxValue: 155 },     // 상
            MEDIUM: { MinValue: 95, MaxValue: 95 },     // 중
            LOW: { MinValue: 40, MaxValue: 40 }         // 하
        },
        // 무기 공격력 %
        46: {
            HIGH: { MinValue: 300, MaxValue: 300 },     // 상
            MEDIUM: { MinValue: 180, MaxValue: 180 },   // 중
            LOW: { MinValue: 80, MaxValue: 80 }         // 하
        },
        // 무기 공격력 +
        54: {
            HIGH: { MinValue: 960, MaxValue: 960 },     // 상
            MEDIUM: { MinValue: 480, MaxValue: 480 },   // 중
            LOW: { MinValue: 195, MaxValue: 195 }       // 하
        }
    },
    
    // 반지 옵션
    RING: {
        // 치명타 피해
        50: {
            HIGH: { MinValue: 400, MaxValue: 400 },     // 상
            MEDIUM: { MinValue: 240, MaxValue: 240 },   // 중
            LOW: { MinValue: 110, MaxValue: 110 }       // 하
        },
        // 치명타 적중률 %
        49: {
            HIGH: { MinValue: 155, MaxValue: 155 },     // 상
            MEDIUM: { MinValue: 95, MaxValue: 95 },     // 중
            LOW: { MinValue: 40, MaxValue: 40 }         // 하
        },
        // 아군 공격력 강화 효과
        51: {
            HIGH: { MinValue: 500, MaxValue: 500 },     // 상
            MEDIUM: { MinValue: 300, MaxValue: 300 },   // 중
            LOW: { MinValue: 135, MaxValue: 135 }       // 하
        },
        // 아군 피해량 강화 효과
        52: {
            HIGH: { MinValue: 750, MaxValue: 750 },     // 상
            MEDIUM: { MinValue: 450, MaxValue: 450 },   // 중
            LOW: { MinValue: 200, MaxValue: 200 }       // 하
        }
    }
};

// 옵션 조합 타입
window.OPTION_COMBINATION_TYPES = {
    SANG_SANG: "상상", // 상상
    SANG_JUNG: "상중", // 상중
    JUNG_SANG: "중상", // 중상
    SANG_HA: "상하",   // 상하
    HA_SANG: "하상",   // 하상
    SANG_MU: "상무",   // 상무
    MU_SANG: "무상",   // 무상
    JUNG_JUNG: "중중", // 중중
    JUNG_HA: "중하",   // 중하
    HA_JUNG: "하중",   // 하중
    JUNG_MU: "중무",   // 중무
    MU_JUNG: "무중",   // 무중
    HA_HA: "하하",     // 하하
    HA_MU: "하무",     // 하무
    MU_HA: "무하",     // 무하
    MU_MU: "무무"      // 무무
};

// 등급 맵핑 (조합타입에 따른 등급 배열)
window.GRADE_MAPPING = {
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

// 등급 타입 매핑
window.GRADE_TYPE_MAPPING = {
    "상": "HIGH",
    "중": "MEDIUM",
    "하": "LOW",
    "무": "NONE"
};

// 클래스 타입 매핑
window.CLASS_TYPE_MAPPING = {
    "딜러": "DEALER",
    "서포터": "SUPPORTER"
};

// 장신구 타입 매핑
window.ACCESSORY_TYPE_MAPPING = {
    "목걸이": "NECKLACE",
    "귀걸이": "EARRING",
    "반지": "RING"
};

// 전체 상수 객체로 내보내기
window.API_CONSTANTS = {
    API_CONFIG,
    CATEGORY_CODES,
    ACCESSORY_OPTIONS,
    OPTION_VALUES,
    OPTION_COMBINATION_TYPES,
    GRADE_MAPPING,
    GRADE_TYPE_MAPPING,
    CLASS_TYPE_MAPPING,
    ACCESSORY_TYPE_MAPPING
};
