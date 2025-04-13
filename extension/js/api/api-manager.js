/**
 * API 관리 모듈
 * 로스트아크 API 키 관리 및 UI 통합을 담당합니다.
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.API = window.LopecScanner.API || {};

// API 관리 모듈
LopecScanner.API.APIManager = (function() {
  /**
   * API 키 설정 UI 생성
   * @returns {HTMLElement} - API 키 설정 UI 엘리먼트
   */
  function createAPISettingsUI() {
    // 기존 UI가 있으면 제거
    const existingUI = document.getElementById('lostark-api-settings');
    if (existingUI) {
      existingUI.remove();
    }
    
    // API 키 설정 UI 생성
    const settingsContainer = document.createElement('div');
    settingsContainer.id = 'lostark-api-settings';
    settingsContainer.className = 'api-settings-container';
    
    // 스타일 추가
    settingsContainer.style.padding = '15px';
    settingsContainer.style.backgroundColor = '#f5f5f5';
    settingsContainer.style.border = '1px solid #ddd';
    settingsContainer.style.borderRadius = '5px';
    settingsContainer.style.marginBottom = '15px';
    
    // API 상태 표시
    const statusContainer = document.createElement('div');
    statusContainer.className = 'api-status-container';
    statusContainer.style.display = 'flex';
    statusContainer.style.alignItems = 'center';
    statusContainer.style.marginBottom = '10px';
    
    // 상태 아이콘
    const statusIcon = document.createElement('span');
    statusIcon.id = 'api-status-icon';
    statusIcon.className = 'status-icon';
    statusIcon.style.width = '12px';
    statusIcon.style.height = '12px';
    statusIcon.style.borderRadius = '50%';
    statusIcon.style.display = 'inline-block';
    statusIcon.style.marginRight = '8px';
    statusIcon.style.backgroundColor = '#ccc';
    
    // 상태 텍스트
    const statusText = document.createElement('span');
    statusText.id = 'api-status-text';
    statusText.innerText = 'API 상태 확인 중...';
    
    statusContainer.appendChild(statusIcon);
    statusContainer.appendChild(statusText);
    
    // API 키 입력 필드
    const inputGroup = document.createElement('div');
    inputGroup.className = 'api-input-group';
    inputGroup.style.display = 'flex';
    inputGroup.style.alignItems = 'center';
    inputGroup.style.marginBottom = '10px';
    
    const apiKeyInput = document.createElement('input');
    apiKeyInput.type = 'password';
    apiKeyInput.id = 'lostark-api-key';
    apiKeyInput.placeholder = '로스트아크 API 키를 입력하세요';
    apiKeyInput.style.flex = '1';
    apiKeyInput.style.padding = '6px 10px';
    apiKeyInput.style.borderRadius = '3px';
    apiKeyInput.style.border = '1px solid #ccc';
    apiKeyInput.style.marginRight = '8px';
    
    // 저장 버튼
    const saveButton = document.createElement('button');
    saveButton.innerText = '저장';
    saveButton.id = 'save-api-key';
    saveButton.style.padding = '6px 12px';
    saveButton.style.backgroundColor = '#4CAF50';
    saveButton.style.color = 'white';
    saveButton.style.border = 'none';
    saveButton.style.borderRadius = '3px';
    saveButton.style.cursor = 'pointer';
    
    // 테스트 버튼
    const testButton = document.createElement('button');
    testButton.innerText = '연결 테스트';
    testButton.id = 'test-api-connection';
    testButton.style.padding = '6px 12px';
    testButton.style.backgroundColor = '#2196F3';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.borderRadius = '3px';
    testButton.style.cursor = 'pointer';
    testButton.style.marginLeft = '8px';
    
    inputGroup.appendChild(apiKeyInput);
    inputGroup.appendChild(saveButton);
    inputGroup.appendChild(testButton);
    
    // 안내 텍스트
    const infoText = document.createElement('div');
    infoText.className = 'api-info-text';
    infoText.innerHTML = `
      <p style="margin: 5px 0; font-size: 13px; color: #666;">
        API 키는 <a href="https://developer-lostark.game.onstove.com/" target="_blank" style="color: #2196F3;">로스트아크 개발자 센터</a>에서 발급받을 수 있습니다.
      </p>
      <p style="margin: 5px 0; font-size: 13px; color: #666;">
        API 키를 설정하면 스펙업 요소별 소요 골드를 자동으로 계산합니다.
      </p>
    `;
    
    // 요소 조합
    settingsContainer.appendChild(statusContainer);
    settingsContainer.appendChild(inputGroup);
    settingsContainer.appendChild(infoText);
    
    // 이벤트 리스너 추가
    saveButton.addEventListener('click', function() {
      const apiKey = apiKeyInput.value.trim();
      if (apiKey) {
        // 새 API 핸들러가 있으면 사용
        if (window.LopecScanner.API.LostArkHandler) {
          window.LopecScanner.API.LostArkHandler.setApiKey(apiKey);
        } else if (LopecScanner.API.LostArkAPI) {
          // 기존 API 사용
          LopecScanner.API.LostArkAPI.setApiKey(apiKey);
        }
        updateAPIStatus();
      }
    });
    
    testButton.addEventListener('click', function() {
      updateAPIStatus(true);
    });
    
    return settingsContainer;
  }

  /**
   * API 상태 업데이트
   * @param {boolean} forceCheck - 강제 확인 여부
   */
  async function updateAPIStatus(forceCheck = false) {
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
          if (result.lostarkApiKey) {
            apiKey = result.lostarkApiKey;
            
            // API 키 입력 필드 업데이트
            const apiKeyInput = document.getElementById('lostark-api-key');
            if (apiKeyInput) {
              apiKeyInput.value = '********'; // 보안을 위해 실제 키 대신 표시
            }
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
      
      // API 연결 테스트
      let isConnected = false;
      
      // 새 API 핸들러가 있으면 사용
      if (window.LopecScanner.API.LostArkHandler) {
        isConnected = await window.LopecScanner.API.LostArkHandler.testConnection();
      } else if (LopecScanner.API.LostArkAPI) {
        // 기존 API 사용
        isConnected = await LopecScanner.API.LostArkAPI.testConnection();
      }
      
      if (isConnected) {
        statusIcon.style.backgroundColor = '#4CAF50';
        statusText.innerText = 'API 연결 성공';
      } else {
        statusIcon.style.backgroundColor = '#f44336';
        statusText.innerText = 'API 연결 실패. 키를 확인해주세요.';
      }
    } catch (error) {
      console.error('API 상태 확인 중 오류 발생:', error);
      statusIcon.style.backgroundColor = '#f44336';
      statusText.innerText = '오류 발생: ' + error.message;
    }
  }

  /**
   * 데이터 페이지에 API 설정 UI 추가
   */
  function addSettingsToDataPage() {
    // 데이터 페이지 확인
    const dataWrapper = document.querySelector('.data-wrapper');
    if (!dataWrapper) return;
    
    // 설정 컨테이너 생성
    const settingsUI = createAPISettingsUI();
    
    // 첫 번째 요소 앞에 삽입
    dataWrapper.insertBefore(settingsUI, dataWrapper.firstChild);
    
    // API 상태 업데이트
    setTimeout(updateAPIStatus, 500);
  }

  /**
   * 데이터 행에 골드 소요량 정보 추가
   * @param {HTMLElement} row - 데이터 행 엘리먼트
   * @param {Object} itemData - 아이템 데이터
   */
  async function addGoldInfoToRow(row, itemData) {
    // API 사용 가능 여부 확인
    const apiAvailable = await LopecScanner.API.GoldCalculator.isApiAvailable();
    
    // API가 연결되지 않은 경우 골드 정보를 표시하지 않음
    if (!apiAvailable) {
      return;
    }
    
    // 기존 골드 정보 확인
    let goldInfoCell = row.querySelector('.gold-cost-info');
    
    // 없으면 새로 생성
    if (!goldInfoCell) {
      goldInfoCell = document.createElement('td');
      goldInfoCell.className = 'gold-cost-info';
      goldInfoCell.style.textAlign = 'right';
      goldInfoCell.style.padding = '4px 8px';
      row.appendChild(goldInfoCell);
    }
    
    // 로딩 표시
    goldInfoCell.innerHTML = '<span style="color: #aaa;">계산 중...</span>';
    
    try {
      // 아이템 정보가 유효한지 확인
      if (!itemData || !itemData.item || (itemData.from === undefined) || (itemData.to === undefined)) {
        goldInfoCell.innerHTML = '<span style="color: #aaa;">정보 없음</span>';
        return;
      }
      
      // 골드 소요량 계산
      const costInfo = await LopecScanner.API.GoldCalculator.calculateSpecUpCost(itemData);
      
      if (!costInfo || costInfo.cost === 0) {
        goldInfoCell.innerHTML = '<span style="color: #aaa;">비용 없음</span>';
        return;
      }
      
      // 골드 정보 표시
      let goldText = `<span style="font-weight: bold; color: #F9A825;">${costInfo.cost.toLocaleString()}G</span>`;
      
      // 추가 정보가 있는 경우 툴팁으로 표시
      let tooltipContent = '';
      
      if (costInfo.materials) {
        tooltipContent += '<strong>필요 재료:</strong><br>';
        for (const [material, count] of Object.entries(costInfo.materials)) {
          tooltipContent += `${material}: ${count}<br>`;
        }
      }
      
      if (costInfo.attempts) {
        tooltipContent += `<strong>예상 시도 횟수:</strong> ${costInfo.attempts}회<br>`;
      }
      
      // 골드 정보 업데이트
      if (tooltipContent) {
        goldInfoCell.innerHTML = `<div class="tooltip">${goldText}<span class="tooltiptext">${tooltipContent}</span></div>`;
      } else {
        goldInfoCell.innerHTML = goldText;
      }
      
      // 툴팁 스타일 적용
      styleTooltips();
    } catch (error) {
      console.error('골드 정보 추가 중 오류 발생:', error);
      goldInfoCell.innerHTML = '<span style="color: #f44336;">오류 발생</span>';
    }
  }

  /**
   * 툴팁 스타일 적용
   */
  function styleTooltips() {
    // 기존 스타일이 있는지 확인
    if (document.getElementById('tooltip-styles')) return;
    
    // 툴팁 스타일 생성
    const styleElement = document.createElement('style');
    styleElement.id = 'tooltip-styles';
    styleElement.textContent = `
      .tooltip {
        position: relative;
        display: inline-block;
      }
      
      .tooltip .tooltiptext {
        visibility: hidden;
        width: 200px;
        background-color: #333;
        color: #fff;
        text-align: left;
        border-radius: 6px;
        padding: 10px;
        position: absolute;
        z-index: 1;
        bottom: 125%;
        left: 50%;
        margin-left: -100px;
        opacity: 0;
        transition: opacity 0.3s;
        font-size: 12px;
        line-height: 1.4;
      }
      
      .tooltip .tooltiptext::after {
        content: "";
        position: absolute;
        top: 100%;
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: #333 transparent transparent transparent;
      }
      
      .tooltip:hover .tooltiptext {
        visibility: visible;
        opacity: 1;
      }
    `;
    
    // 스타일 추가
    document.head.appendChild(styleElement);
  }

  /**
   * 데이터 테이블에 골드 소요량 열 추가
   * @param {HTMLElement} table - 데이터 테이블 엘리먼트
   */
  async function addGoldColumnToTable(table) {
    // API 사용 가능 여부 확인
    const apiAvailable = await LopecScanner.API.GoldCalculator.isApiAvailable();
    
    // API가 연결되지 않은 경우 골드 열을 추가하지 않음
    if (!apiAvailable) {
      return;
    }
    
    // 기존 헤더 확인
    const headerRow = table.querySelector('thead tr');
    
    if (!headerRow) return;
    
    // 기존 골드 헤더 확인
    let goldHeader = headerRow.querySelector('.gold-cost-header');
    
    // 없으면 새로 생성
    if (!goldHeader) {
      goldHeader = document.createElement('th');
      goldHeader.className = 'gold-cost-header';
      goldHeader.style.textAlign = 'right';
      goldHeader.innerText = '골드 소요량';
      headerRow.appendChild(goldHeader);
    }
  }

  /**
   * 데이터 테이블에 골드 소요량 정보 추가
   * @param {Array} processedData - 처리된 데이터 배열
   */
  async function updateDataTableWithGoldInfo(processedData) {
    // API 사용 가능 여부 확인
    const apiAvailable = await LopecScanner.API.GoldCalculator.isApiAvailable();
    
    // API가 연결되지 않은 경우 골드 정보를 표시하지 않음
    if (!apiAvailable) {
      return;
    }
    
    // 데이터 테이블 확인
    const table = document.querySelector('.data-table');
    
    if (!table) return;
    
    // 골드 열 추가
    addGoldColumnToTable(table);
    
    // 각 행에 골드 정보 추가
    const rows = table.querySelectorAll('tbody tr');
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const itemData = processedData[i];
      
      if (itemData) {
        await addGoldInfoToRow(row, itemData);
      }
    }
  }

  /**
   * 초기화 함수
   */
  function initialize() {
    // 데이터 페이지 로드 감지 및 UI 추가
    window.addEventListener('load', function() {
      // 데이터 페이지 확인
      if (window.location.href.includes('data.html')) {
        // API 설정 UI 추가
        setTimeout(addSettingsToDataPage, 500);
      }
    });
    
    // 메시지 리스너 설정 (데이터 테이블 업데이트 감지)
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === 'dataProcessed' && request.processedData) {
        updateDataTableWithGoldInfo(request.processedData);
      }
      return true;
    });
    
    console.log('API 관리 모듈이 초기화되었습니다.');
  }

  // 공개 API
  return {
    initialize,
    updateAPIStatus,
    addSettingsToDataPage,
    updateDataTableWithGoldInfo
  };
})();

// 모듈 자동 초기화
LopecScanner.API.APIManager.initialize();
