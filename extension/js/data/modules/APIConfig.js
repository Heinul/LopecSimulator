/**
 * API 관련 상수 정의
 * API 엔드포인트, 헤더, 카테고리 코드 등
 */
const API_CONFIG = {
  baseUrl: "https://developer-lostark.game.onstove.com",
  headers: {
    "content-type": "application/json;charset=UTF-8",
    "accept": "application/json",
  },
  endpoints: {
    auctionOptions: "/auctions/options",
    auctionItems: "/auctions/items", // 경매장 아이템 검색 (장신구, 보석 등)
    marketItems: "/markets/items",   // 거래소 아이템 검색 (각인서 등)
  },
  // 아이템 유형별 카테고리 코드
  categoryCodes: {
    // 경매장 카테고리
    auction: {
      accessory: 200000,  // 장신구 (Code: 200000, CodeName: 장신구)
      gem: 210000,       // 보석 (Code: 210000, CodeName: 보석)
    },
    // 거래소 카테고리
    market: {
      engraving: 40000,   // 각인서 (Code: 40000, CodeName: 각인서)
    }
  },
  // 아이템 등급
  itemGrades: {
    legendary: "전설", // 전설
    relic: "유물",     // 유물
    ancient: "고대",   // 고대
    epic: "영웅"       // 영웅
  }
};

export default API_CONFIG;