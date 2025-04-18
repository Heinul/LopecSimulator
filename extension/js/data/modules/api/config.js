/**
 * API 설정 파일
 */

// API 설정 상수
window.DATA_API_CONFIG = {
    baseUrl: 'https://developer-lostark.game.onstove.com',
    endpoints: {
        auction: '/auctions/items',
        market: '/markets/items',
        auctionOptions: '/auctions/options'
    },
    categoryCodes: {
        // 장신구
        accessory: {
            necklace: 200010,
            earring: 200020,
            ring: 200030
        },
        // 보석
        gem: 210000,
        // 각인서
        engraving: 40000
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// 기본 내보내기 추가
export default DATA_API_CONFIG;
