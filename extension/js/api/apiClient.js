/**
 * API 요청을 보내는 기본 모듈
 */



// API 키 관리 객체
window.ApiKeyManager = {
    /**
     * 저장된 API 키를 가져옵니다.
     * @returns {Promise<string|null>} API 키 또는 null (저장된 키가 없는 경우)
     */
    async getApiKey() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['lostarkApiKey'], (result) => {
                if (chrome.runtime.lastError) {
                    console.error('API 키 로드 중 오류:', chrome.runtime.lastError);
                    resolve(null);
                    return;
                }
                resolve(result.lostarkApiKey || null);
            });
        });
    },
    
    /**
     * API 키를 저장합니다.
     * @param {string} apiKey - 저장할 API 키
     * @returns {Promise<boolean>} 저장 성공 여부
     */
    async saveApiKey(apiKey) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ lostarkApiKey: apiKey }, () => {
                if (chrome.runtime.lastError) {
                    console.error('API 키 저장 중 오류:', chrome.runtime.lastError);
                    resolve(false);
                    return;
                }
                resolve(true);
            });
        });
    },
    
    /**
     * API 키 유효성을 테스트합니다.
     * @param {string} apiKey - 테스트할 API 키 (없으면 저장된 키 사용)
     * @returns {Promise<{success: boolean, message: string}>} 테스트 결과
     */
    async testApiKey(apiKey) {
        if (!apiKey) {
            apiKey = await this.getApiKey();
            if (!apiKey) {
                return { 
                    success: false, 
                    message: 'API 키가 설정되지 않았습니다.' 
                };
            }
        }
        
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auctionOptions}`, {
                method: 'GET',
                headers: {
                    ...API_CONFIG.headers,
                    'authorization': `bearer ${apiKey}`
                }
            });
            
            if (response.status === 200) {
                return { 
                    success: true, 
                    message: 'API 연결 성공' 
                };
            } else {
                let errorMsg = `API 연결 실패 (${response.status})`;
                if (response.status === 401) {
                    errorMsg = '유효하지 않은 API 키입니다.';
                } else if (response.status === 429) {
                    errorMsg = '요청 한도를 초과했습니다.';
                }
                
                return { 
                    success: false, 
                    message: errorMsg 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: `오류 발생: ${error.message}` 
            };
        }
    }
};

/**
 * API 요청 클라이언트
 */
window.ApiClient = {
    /**
     * API 요청을 보냅니다.
     * @param {string} endpoint - API 엔드포인트 (예: '/markets/items')
     * @param {Object} data - 요청 데이터
     * @param {string} method - 요청 메소드 ('GET', 'POST' 등)
     * @returns {Promise<Object>} API 응답 데이터
     */
    async sendRequest(endpoint, data = null, method = 'GET') {
        const apiKey = await ApiKeyManager.getApiKey();
        if (!apiKey) {
            throw new Error('API 키가 설정되지 않았습니다.');
        }
        
        const url = `${API_CONFIG.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                ...API_CONFIG.headers,
                'authorization': `bearer ${apiKey}`
            }
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API 요청 실패 (${response.status}): ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API 요청 중 오류 발생:', error);
            throw error;
        }
    },
    
    /**
     * 마켓 API 요청을 보냅니다.
     * @param {Object} data - 마켓 요청 데이터
     * @returns {Promise<Object>} API 응답 데이터
     */
    async sendMarketRequest(data) {
        return this.sendRequest(API_CONFIG.endpoints.market, data, 'POST');
    },
    
    /**
     * 경매장 API 요청을 보냅니다.
     * @param {Object} data - 경매장 요청 데이터
     * @returns {Promise<Object>} API 응답 데이터
     */
    async sendAuctionRequest(data) {
        return this.sendRequest(API_CONFIG.endpoints.auction, data, 'POST');
    }
};


