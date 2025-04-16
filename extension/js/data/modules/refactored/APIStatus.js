/**
 * API 상태 관리 모듈
 * API 상태 업데이트 및 표시를 담당합니다.
 */
import API_CONFIG from './APIConfig.js';
import CacheManager from './APICache.js';
import AccessoryAPI from './api/accessory-api.js';
import GemAPI from './api/gem-api.js';
import EngravingAPI from './api/engraving-api.js';
import { updateApiStatusUI, showLoadingOverlay, updateDataTableWithGoldInfo } from './UIHelper.js';

// API 상태 관리 모듈
const APIStatus = (function() {
  /**
   * API 상태 요약 업데이트
   */
  async function updateApiStatusSummary() {
    const apiStatusElement = document.getElementById('api-status-summary');
    if (!apiStatusElement) return;
    
    try {
      // API 키 설정 여부 확인
      let apiKey = null;
      let apiAvailable = false;
      
      await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          apiKey = result && result.lostarkApiKey;
          resolve();
        });
      });
      
      // API 키가 있는 경우 직접 연결 테스트 수행
      if (apiKey) {
        try {
          // 직접 API 연결 테스트
          const testUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.auctionOptions;
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              ...API_CONFIG.headers,
              'authorization': `bearer ${apiKey}`
            }
          });
          
          apiAvailable = (response.status === 200);
          console.log('API 연결 테스트 결과:', apiAvailable, '(상태코드:', response.status, ')');
        } catch (e) {
          console.error('API 연결 테스트 오류:', e);
          apiAvailable = false;
        }
      }
      
      // UI 업데이트
      updateApiStatusUI(apiAvailable, apiKey);
      
      // DOM 업데이트 후 이벤트 리스너 추가
      const openApiSettingsBtn = document.getElementById('open-api-settings');
      if (openApiSettingsBtn) {
        openApiSettingsBtn.addEventListener('click', () => {
          const modal = APIManager.createApiSettingsModal();
          modal.style.display = 'block';
          APIManager.updateApiStatus();
        });
      }
      
      // 골드 정보 가져오기 버튼 이벤트 리스너 (있는 경우에만)
      const fetchButton = document.getElementById('fetch-gold-data-summary');
      if (fetchButton) {
        fetchButton.addEventListener('click', () => {
          APIStatus.fetchGoldData();
        });
      }
    } catch (error) {
      console.error('API 상태 요약 업데이트 중 오류 발생:', error);
      
      // 오류 발생 시 UI 업데이트
      updateApiStatusUI(false, null, `오류: ${error.message}`);
      
      // DOM 업데이트 후 이벤트 리스너 추가
      const openApiSettingsBtn = document.getElementById('open-api-settings');
      if (openApiSettingsBtn) {
        openApiSettingsBtn.addEventListener('click', () => {
          const modal = APIManager.createApiSettingsModal();
          modal.style.display = 'block';
          APIManager.updateApiStatus();
        });
      }
    }
  }

  /**
   * 골드 데이터 가져오기
   */
  async function fetchGoldData() {
    // 로딩 표시 추가
    const loadingOverlay = showLoadingOverlay('data-table-container', '골드 데이터 가져오는 중...');
    if (!loadingOverlay) {
      alert('데이터 테이블 컨테이너를 찾을 수 없습니다.');
      return;
    }
    
    try {
      // API 키 불러오기 (미리 확인)
      let apiKey = null;
      await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          apiKey = result && result.lostarkApiKey;
          resolve();
        });
      });
      
      if (!apiKey) {
        alert('API 키가 설정되지 않았습니다. API 설정에서 키를 등록해주세요.');
        loadingOverlay.remove();
        return;
      }

      // 현재 표시된 데이터 가져오기
      const filteredData = DataManager ? DataManager.processedData : null;
      
      if (!filteredData || filteredData.length === 0) {
        alert('표시할 데이터가 없습니다.');
        loadingOverlay.remove();
        return;
      }
      
      // API 요청 시작 로그
      console.log('골드 데이터 요청 시작...');
      console.log('처리할 데이터 항목 수:', filteredData.length);
      
      try {
        // 실제 API 호출
        await fetchRealGoldData(filteredData, apiKey);
        
        // 데이터 테이블 업데이트
        updateDataTableWithGoldInfo(filteredData);
        
        alert('골드 데이터를 성공적으로 가져왔습니다!');
      } catch (apiError) {
        console.error('API 호출 오류:', apiError);
        
        // API 오류에도 불구하고, 가진 데이터로 테이블 업데이트
        try {
          // 데이터 테이블 업데이트
          updateDataTableWithGoldInfo(filteredData);
          
          // 일부 데이터만 가져왔을 수 있으므로 다른 메시지 표시
          const goldItems = filteredData.filter(item => item.goldCost).length;
          if (goldItems > 0) {
            alert(`일부 골드 데이터(${goldItems}/${filteredData.length})를 가져오는데 성공했지만, 일부 오류가 발생했습니다: ${apiError.message}`);
          } else {
            alert(`골드 데이터를 가져오는 중 오류가 발생했습니다: ${apiError.message}`);
          }
        } catch (e) {
          console.error('테이블 업데이트 오류:', e);
          alert(`골드 데이터를 가져오는 중 오류가 발생했습니다: ${apiError.message}`);
        }
      }
    } catch (error) {
      console.error('골드 데이터 가져오기 오류:', error);
      alert('골드 데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 로딩 오버레이 제거
      loadingOverlay.remove();
    }
  }
  
  /**
   * 실제 로스트아크 API를 통해 골드 데이터 가져오기
   * @param {Array} items - 아이템 데이터 배열
   * @param {string} apiKey - API 키
   */
  async function fetchRealGoldData(items, apiKey) {
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다.');
    }
    
    // 데이터 처리를 위한 배치 사이즈
    const batchSize = 10;
    const batches = [];
    
    // 배치로 나누기
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    // 각 배치 처리
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`배치 ${i+1}/${batches.length} 처리 중... (${batch.length} 항목)`);
      
      // 각 배치의 아이템을 형식에 맞게 그룹화
      const accessoryItems = batch.filter(item => AccessoryAPI.isAccessoryItem(item));
      const gemItems = batch.filter(item => GemAPI.isGemItem(item));
      const engravingItems = batch.filter(item => EngravingAPI.isEngravingItem(item));
      
      // 각 아이템 그룹 처리
      try {
        if (accessoryItems.length > 0) {
          await AccessoryAPI.processAccessoryItems(accessoryItems, apiKey);
        }
        
        if (gemItems.length > 0) {
          await GemAPI.processGemItems(gemItems, apiKey);
        }
        
        if (engravingItems.length > 0) {
          await EngravingAPI.processEngravingItems(engravingItems, apiKey);
        }
        
        // 요청 간 지연 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`배치 ${i+1} 처리 중 오류:`, error);
        // 오류가 발생해도 다음 배치 처리 계속
      }
    }
    
    console.log('모든 배치 처리 완료');
  }

  /**
   * API 키 업데이트 메시지 리스너 설정
   */
  function setupApiKeyUpdateListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'apiKeyUpdated' && request.apiKey) {
        console.log('API 키 업데이트 메시지 수신:', request.apiKey.substring(0, 3) + '...');
        
        // API 상태 업데이트
        setTimeout(() => updateApiStatusSummary(), 1000);
        
        // 데이터 테이블 업데이트 (필요 시)
        if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.APIManager) {
          const processedData = DataManager.processedData;
          if (processedData && processedData.length > 0) {
            window.LopecScanner.API.APIManager.updateDataTableWithGoldInfo(processedData);
          }
        }
      }
    });
  }

  /**
   * 초기화 함수
   */
  function initialize() {
    // API 키 업데이트 메시지 리스너 설정
    setupApiKeyUpdateListener();
    
    console.log('APIStatus 모듈 초기화됨');
  }

  // 공개 API
  return {
    initialize,
    updateApiStatusSummary,
    fetchGoldData
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', APIStatus.initialize);

export default APIStatus;