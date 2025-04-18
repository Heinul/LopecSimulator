/**
 * API 관리자 모듈
 * API 키 설정, 저장, 테스트 및 API 관련 UI 처리를 담당합니다.
 */

// API_CONFIG 가져오기
import API_CONFIG from './APIConfig.js';

// API 관리자 모듈
const APIManager = (function() {
  /**
   * API 키 설정 모달 생성
   * @returns {HTMLElement} 모달 컨테이너 엘리먼트
   */
  function createApiSettingsModal() {
    // 기존 모달이 있으면 제거
    const existingModal = document.getElementById('api-settings-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // 모달 컨테이너 생성
    const modalContainer = document.createElement('div');
    modalContainer.id = 'api-settings-modal';
    modalContainer.className = 'modal';
    modalContainer.style.display = 'none';
    
    // 임시 모달 내용 생성 (로딩 상태)
    modalContainer.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>로스트아크 API 설정</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body" style="text-align: center;">
          <p>API 키 정보를 불러오는 중...</p>
          <div class="loading-spinner"></div>
        </div>
      </div>
    `;
    
    // 모달을 DOM에 추가
    document.body.appendChild(modalContainer);
    
    // 처음에는 모달을 표시
    modalContainer.style.display = 'block';
    
    // API 키 가져오기 (chrome.storage.local 우선, 이후 localStorage 백업)
    chrome.storage.local.get(['lostarkApiKey'], (result) => {
      let savedApiKey = '';
      const chromeError = chrome.runtime.lastError;
      
      if (chromeError) {
        console.error('chrome.storage.local 접근 오류:', chromeError);
      }
      
      if (result && result.lostarkApiKey) {
        // chrome.storage.local에서 API 키 찾음
        savedApiKey = result.lostarkApiKey;
        console.log('모달: chrome.storage.local에서 API 키 불러옴:', savedApiKey);
      } else {
        console.log('chrome.storage.local에 API 키 없음');
        // chrome.storage.local에 없는 경우 localStorage에서 시도
        try {
          const localApiKey = localStorage.getItem('lopecScanner_apiKey');
          if (localApiKey) {
            savedApiKey = localApiKey;
            console.log('모달: localStorage에서 API 키 불러옴:', savedApiKey);
          }
        } catch (e) {
          console.error('localStorage 접근 오류:', e);
        }
      }
      
      // 이제 모달 내용 상세 생성
      modalContainer.innerHTML = _createModalContent(savedApiKey);
      
      // 이벤트 리스너 설정
      _setupModalEventListeners(modalContainer);
      
      // API 상태 업데이트
      APIManager.updateApiStatus();
    });
    
    return modalContainer;
  }
  
  /**
   * 모달 내용 HTML 생성 (내부용)
   * @param {string} apiKey - 현재 API 키
   * @returns {string} 모달 내용 HTML
   * @private
   */
  function _createModalContent(apiKey) {
    return `
      <div class="modal-content">
        <div class="modal-header">
          <h2>로스트아크 API 설정</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <p>로스트아크 개발자 센터에서 발급받은 API 키를 입력하세요.</p>
          <div class="api-input-container">
            <input type="text" id="api-key-input" placeholder="API 키 입력" autocomplete="off" style="font-family: monospace;" value="${apiKey}">
            <button id="save-api-key" class="modal-button primary">저장</button>
            <button id="test-api-key" class="modal-button secondary">연결 테스트</button>
          </div>
          <div id="api-status-display" class="api-status-display">
            <div class="api-status-indicator">
              <span id="api-status-icon" class="status-icon"></span>
              <span id="api-status-text" class="status-text">API 상태 확인 중...</span>
            </div>
          </div>
          <div class="api-info">
            <p>API 키를 설정하면 스펙업 요소별 소요 골드를 자동으로 계산합니다.</p>
            <p>API 키는 <a href="https://developer-lostark.game.onstove.com/" target="_blank">로스트아크 개발자 센터</a>에서 발급받을 수 있습니다.</p>
          </div>
          <div class="api-troubleshoot">
            <h4>연결 문제가 있나요?</h4>
            <button id="troubleshoot-api" class="modal-button">문제 해결 도우미</button>
            <div id="troubleshoot-result" class="troubleshoot-result" style="display: none;">
              <h4>진단 중...</h4>
              <div class="loading-spinner"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="fetch-gold-data" class="modal-button primary">골드 정보 가져오기</button>
          <button id="close-modal" class="modal-button">닫기</button>
        </div>
      </div>
    `;
  }
  
  /**
   * 모달 이벤트 리스너 설정 (내부용)
   * @param {HTMLElement} modalContainer - 모달 컨테이너 엘리먼트
   * @private
   */
  function _setupModalEventListeners(modalContainer) {
    document.querySelector('.close-modal').addEventListener('click', () => {
      modalContainer.style.display = 'none';
    });
    
    document.getElementById('close-modal').addEventListener('click', () => {
      modalContainer.style.display = 'none';
    });
    
    document.getElementById('save-api-key').addEventListener('click', () => {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (apiKey) {
    // API 키 저장 및 상태 업데이트
    APIManager.saveApiKey(apiKey);
    }
    });
    
    document.getElementById('test-api-key').addEventListener('click', () => {
    APIManager.updateApiStatus(true);
    });
    
    document.getElementById('fetch-gold-data').addEventListener('click', () => {
    APIStatus.fetchGoldData();
    });
    
    // 문제 해결 도우미 버튼 이벤트 리스너
    document.getElementById('troubleshoot-api').addEventListener('click', () => {
      // 문제 해결 결과 컨테이너 표시
      const troubleshootResult = document.getElementById('troubleshoot-result');
      troubleshootResult.style.display = 'block';
      troubleshootResult.innerHTML = '<h4>진단 중...</h4><div class="loading-spinner"></div>';
      
      // API 문제 해결 도구가 있는지 확인
      if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.Troubleshooter) {
        window.LopecScanner.API.Troubleshooter.generateErrorReport().then(reportHtml => {
          troubleshootResult.innerHTML = reportHtml;
        }).catch(error => {
          troubleshootResult.innerHTML = `<div class="error-message">진단 중 오류 발생: ${error.message}</div>`;
        });
      } else {
        troubleshootResult.innerHTML = `
          <div class="error-message">
            <h4>진단 도구를 찾을 수 없습니다.</h4>
            <p>확장 프로그램을 다시 로드하거나 업데이트해주세요.</p>
          </div>
        `;
      }
    });
  }

  /**
   * API 키 저장
   * @param {string} apiKey - API 키
   */
  function saveApiKey(apiKey) {
    // API 키 기본 검증
    if (!apiKey || apiKey.length < 10) {
      alert('API 키가 너무 짧습니다. 유효한 API 키를 입력해주세요.');
      return;
    }

    console.log('API 키 저장 시작:', apiKey);
    
    // localStorage에도 저장 (팝업에서 사용)
    try {
      localStorage.setItem('lopecScanner_apiKey', apiKey);
      console.log('API 키가 localStorage에 저장됨:', apiKey);
    } catch (e) {
      console.error('localStorage 저장 실패:', e);
    }

    // chrome.storage.local에 저장 (모든 컴포넌트 간 공유)
    chrome.storage.local.set({ lostarkApiKey: apiKey }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.error('chrome.storage.local 저장 실패:', error);
      } else {
        console.log('API 키가 chrome.storage.local에 저장됨:', apiKey);
      }
      
      // 다른 팝업에도 동기화 신호 전송
      try {
        chrome.runtime.sendMessage({
          action: 'apiKeyChanged',
          apiKey: apiKey
        }, (response) => {
          const msgError = chrome.runtime.lastError;
          if (msgError) {
            console.log('팝업 동기화 메시지 전송 오류 (무시 가능):', msgError);
          } else {
            console.log('팝업 동기화 메시지 전송 성공');
          }
        });
      } catch (err) {
        console.log('메시지 전송 예외 발생:', err);
      }
      
      // API 모듈 순서대로 시도
      if (window.LopecScanner && window.LopecScanner.API) {
        // 문제해결 도구가 있는 경우
        if (window.LopecScanner.API.Troubleshooter) {
          window.LopecScanner.API.Troubleshooter.testApiConnection();
        }

        // 여러 API 설정
        if (window.LopecScanner.API.LostArkHandler) {
          window.LopecScanner.API.LostArkHandler.setApiKey(apiKey);
          console.log('API 키 설정: 새 API 핸들러 사용');
        }
        if (window.LopecScanner.API.LostArkAPI) {
          window.LopecScanner.API.LostArkAPI.setApiKey(apiKey);
          console.log('API 키 설정: 기존 API 모듈 사용');
        }
        if (window.LopecScanner.API.ApiWrapper) {
          window.LopecScanner.API.ApiWrapper.setApiKey(apiKey);
          console.log('API 키 설정: API 래퍼 사용');
        }
      }
      
      // 상태 업데이트
      APIManager.updateApiStatus();
      if (APIStatus && typeof APIStatus.updateApiStatusSummary === 'function') {
        APIStatus.updateApiStatusSummary();
      }
      
      // 성공 메시지
      alert('API 키가 저장되었습니다.');
    });
  }

  /**
   * API 상태 업데이트
   * @param {boolean} forceCheck - 강제 확인 여부
   */
  async function updateApiStatus(forceCheck = false) {
    const statusIcon = document.getElementById('api-status-icon');
    const statusText = document.getElementById('api-status-text');
    
    if (!statusIcon || !statusText) return;
    
    // 상태 확인 중 표시
    statusIcon.style.backgroundColor = '#ffc107';
    statusText.innerText = 'API 상태 확인 중...';
    
    try {
      // API 키 로드
      let apiKey = null;
      await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          if (result && result.lostarkApiKey) {
            apiKey = result.lostarkApiKey;
          }
          resolve();
        });
      });
      
      // API 키가 없는 경우
      if (!apiKey) {
        statusIcon.style.backgroundColor = '#ccc';
        statusText.innerText = 'API 키가 설정되지 않았습니다.';
        return;
      }
      
      // API 연결 테스트 - 직접 fetch 호출
      console.log('API 연결 테스트 시작:', apiKey.substring(0, 5) + '...');
      
      // API_CONFIG 상수 사용
      const testUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.auctionOptions;
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          ...API_CONFIG.headers,
          'authorization': `bearer ${apiKey}`
        }
      });
      
      console.log('응답 상태 코드:', response.status);
      
      // 응답 확인
      if (response.status === 200) {
        statusIcon.style.backgroundColor = '#4CAF50';
        statusText.innerText = 'API 연결 성공';
        
        // 메인 화면의 API 상태도 업데이트
        if (forceCheck && APIStatus && typeof APIStatus.updateApiStatusSummary === 'function') {
          setTimeout(() => APIStatus.updateApiStatusSummary(), 100);
        }
        
        return true;
      } else {
        let errorMsg = `API 연결 실패 (${response.status})`;
        
        // 특정 오류 코드에 대한 문구 추가
        if (response.status === 401) {
          errorMsg += ': 유효하지 않은 API 키';
        } else if (response.status === 429) {
          errorMsg += ': 요청 한도 초과';
        }
        
        statusIcon.style.backgroundColor = '#f44336';
        statusText.innerText = errorMsg;
        return false;
      }
    } catch (error) {
      console.error('API 상태 확인 중 오류 발생:', error);
      statusIcon.style.backgroundColor = '#f44336';
      statusText.innerText = '오류 발생: ' + error.message;
      return false;
    }
  }

  // 공개 API 제공
  return {
    createApiSettingsModal,
    saveApiKey,
    updateApiStatus,
    // 다른 메서드들...
    // 필요 시 계속 추가
    initialize: function() {
      console.log('APIManager 모듈 초기화됨');
    }
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', APIManager.initialize);

// 모듈을 전역 객체에 노출 (기존 코드와의 호환성을 위해)
window.APIManager = APIManager;

// 모듈 내보내기
export default APIManager;
