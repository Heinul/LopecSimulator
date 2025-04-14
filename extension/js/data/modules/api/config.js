/**
 * API 설정 파일
 */

// API 설정 상수
export const API_CONFIG = {
    baseUrl: 'https://developer-lostark.game.onstove.com',
    endpoints: {
        auction: '/auctions/items',
        market: '/markets/items'
    },
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

export default API_CONFIG;
