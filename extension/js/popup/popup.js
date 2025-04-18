/**
 * 로펙 시뮬레이터 점수 분석기 - 팝업 스크립트
 */

// 팝업 UI 관리 모듈
const PopupUI = {
  // 요소 참조
  elements: {
    scanBtn: null,
    viewDataBtn: null,
    statusText: null,
    progressContainer: null,
    progressBar: null,
    toggleOptionsBtn: null,
    optionsContent: null,
    apiKeyInput: null,
    toggleArmor: null,
    toggleGem: null,
    toggleAccessory: null,
    toggleEngraving: null,
    toggleKarma: null,
    toggleAvatar: null
  },
  
  // 설정 저장 키
  storageKeys: {
    isCollapsed: 'lopecScanner_optionsCollapsed',
    apiKey: 'lopecScanner_apiKey',
    toggleArmor: 'lopecScanner_toggleArmor',
    toggleGem: 'lopecScanner_toggleGem',
    toggleAccessory: 'lopecScanner_toggleAccessory',
    toggleEngraving: 'lopecScanner_toggleEngraving',
    toggleKarma: 'lopecScanner_toggleKarma',
    toggleAvatar: 'lopecScanner_toggleAvatar'
  },
  
  // 요소 초기화
  initElements() {
    this.elements.scanBtn = document.getElementById('scanBtn');
    this.elements.viewDataBtn = document.getElementById('viewDataBtn');
    this.elements.statusText = document.getElementById('statusText');
    this.elements.progressContainer = document.getElementById('progressContainer');
    this.elements.progressBar = document.getElementById('progressBar');
    
    // 옵션 토글 버튼
    this.elements.toggleOptionsBtn = document.getElementById('toggleOptionsBtn');
    this.elements.optionsContent = document.getElementById('optionsContent');
    
    // API 키 입력 요소
    this.elements.apiKeyInput = document.getElementById('apiKeyInput');
    
    // 토글 버튼 요소 가져오기
    this.elements.toggleArmor = document.getElementById('toggleArmor');
    this.elements.toggleGem = document.getElementById('toggleGem');
    this.elements.toggleAccessory = document.getElementById('toggleAccessory');
    this.elements.toggleEngraving = document.getElementById('toggleEngraving');
    this.elements.toggleKarma = document.getElementById('toggleKarma');
    this.elements.toggleAvatar = document.getElementById('toggleAvatar');
  },
  
  // 저장된 설정 불러오기
  loadSettings() {
    // 토글 옵션 펼침/접기 상태 불러오기
    const savedCollapseState = localStorage.getItem(this.storageKeys.isCollapsed);
    
    // 저장된 값이 없는 경우 (처음 실행 시) 기본값을 true(접힌 상태)로 저장
    if (savedCollapseState === null) {
      localStorage.setItem(this.storageKeys.isCollapsed, 'true');
    } else if (savedCollapseState === 'false') {
      // 저장된 값이 'false'인 경우(펼친 상태)에만 펼침
      this.elements.optionsContent.classList.remove('collapsed');
      this.elements.toggleOptionsBtn.classList.remove('collapsed');
      this.elements.toggleOptionsBtn.textContent = '▼'; // 아래쪽 화살표
    }
    
    // API 키 불러오기 (chrome.storage.local 우선, localStorage 백업)
    chrome.storage.local.get(['lostarkApiKey'], (result) => {
      const chromeError = chrome.runtime.lastError;
      if (chromeError) {
        console.error('chrome.storage.local에서 API 키 불러오기 실패:', chromeError);
      }
      
      if (result && result.lostarkApiKey) {
        console.log('chrome.storage.local에서 불러온 API 키:', result.lostarkApiKey);
        this.elements.apiKeyInput.value = result.lostarkApiKey;

        // API 키 형식이 유효한지 확인 (API 키는 일반적으로 문자와 숫자의 조합)
        if (!/^[a-zA-Z0-9]+$/.test(result.lostarkApiKey)) {
          console.warn('API 키 형식이 유효하지 않을 수 있습니다:', result.lostarkApiKey);
        }
        
        // localStorage에도 동기화
        localStorage.setItem(this.storageKeys.apiKey, result.lostarkApiKey);
      } else {
        // chrome.storage.local에 없는 경우 localStorage에서 불러오기 시도
        try {
          const localApiKey = localStorage.getItem(this.storageKeys.apiKey);
          if (localApiKey) {
            console.log('localStorage에서 불러온 API 키:', localApiKey);
            this.elements.apiKeyInput.value = localApiKey;
            
            // API 키 형식이 유효한지 확인
            if (!/^[a-zA-Z0-9]+$/.test(localApiKey)) {
              console.warn('localStorage의 API 키 형식이 유효하지 않을 수 있습니다:', localApiKey);
            }
            
            // localStorage에서 가져온 키를 chrome.storage.local에도 저장
            chrome.storage.local.set({ lostarkApiKey: localApiKey }, () => {
              console.log('localStorage의 API 키를 chrome.storage.local에 동기화함');
            });
          } else {
            console.log('API 키가 저장되어 있지 않음');
          }
        } catch (e) {
          console.error('localStorage에서 API 키 불러오기 실패:', e);
        }
      }
    });
    
    // 각 토글 설정 불러오기
    this.elements.toggleArmor.checked = localStorage.getItem(this.storageKeys.toggleArmor) !== 'false';
    this.elements.toggleGem.checked = localStorage.getItem(this.storageKeys.toggleGem) !== 'false';
    this.elements.toggleAccessory.checked = localStorage.getItem(this.storageKeys.toggleAccessory) !== 'false';
    this.elements.toggleEngraving.checked = localStorage.getItem(this.storageKeys.toggleEngraving) !== 'false';
    this.elements.toggleKarma.checked = localStorage.getItem(this.storageKeys.toggleKarma) !== 'false';
    this.elements.toggleAvatar.checked = localStorage.getItem(this.storageKeys.toggleAvatar) !== 'false';
  },
  
  // 토글 설정 저장
  saveToggleSettings() {
    // 각 토글 설정 저장
    localStorage.setItem(this.storageKeys.toggleArmor, this.elements.toggleArmor.checked);
    localStorage.setItem(this.storageKeys.toggleGem, this.elements.toggleGem.checked);
    localStorage.setItem(this.storageKeys.toggleAccessory, this.elements.toggleAccessory.checked);
    localStorage.setItem(this.storageKeys.toggleEngraving, this.elements.toggleEngraving.checked);
    localStorage.setItem(this.storageKeys.toggleKarma, this.elements.toggleKarma.checked);
    localStorage.setItem(this.storageKeys.toggleAvatar, this.elements.toggleAvatar.checked);
  },
  
  // API 키 저장
  saveApiKey() {
    const apiKey = this.elements.apiKeyInput.value.trim();
    console.log('저장하려는 API 키:', apiKey); // 디버깅용 로그 추가
    
    if (!apiKey) {
      console.warn('API 키가 비어 있습니다.');
      return;
    }
    
    // localStorage에 저장 (구버전 호환성)
    try {
      localStorage.setItem(this.storageKeys.apiKey, apiKey);
      console.log('localStorage에 API 키가 저장됨:', apiKey);
    } catch (e) {
      console.error('localStorage에 API 키 저장 실패:', e);
    }
    
    // chrome.storage.local에 저장 (피 업데이트된 API로 공유)
    chrome.storage.local.set({ lostarkApiKey: apiKey }, () => {
      const error = chrome.runtime.lastError;
      if (error) {
        console.error('chrome.storage.local에 API 키 저장 실패:', error);
      } else {
        console.log('API 키가 chrome.storage.local에 저장되었습니다:', apiKey);
      }
      
      // API 키가 변경되었음을 배경 스크립트에 알림
      chrome.runtime.sendMessage({
        action: 'apiKeyChanged',
        apiKey: apiKey
      }, (response) => {
        const msgError = chrome.runtime.lastError;
        if (msgError) {
          console.error('API 키 변경 메시지 전송 실패:', msgError);
        } else {
          console.log('API 키 변경 메시지 전송 성공:', response);
        }
      });
    });
  },
  
  // 토글 버튼 상태 저장
  saveCollapseState(isCollapsed) {
    localStorage.setItem(this.storageKeys.isCollapsed, isCollapsed);
  },
  
  // 페이지 상태에 따라 UI 업데이트
  updateForValidPage(isValid) {
    if (isValid) {
      this.elements.statusText.textContent = '스캔을 시작하려면 "스캔 시작" 버튼을 클릭하세요.';
      this.elements.scanBtn.disabled = false;
    } else {
      this.elements.statusText.textContent = '로펙 시뮬레이터 페이지에서 실행해주세요.';
      this.elements.scanBtn.disabled = true;
    }
  },
  
  // 스캔 시작 시 UI 업데이트
  updateForScanStart() {
    this.elements.statusText.textContent = '스캔 중... 페이지를 닫지 마세요.';
    this.elements.scanBtn.disabled = true;
    this.elements.viewDataBtn.disabled = true;
    this.elements.progressContainer.style.display = 'block';
  },
  
  // 진행률 업데이트
  updateProgress(progress) {
    this.elements.progressBar.style.width = progress + '%';
    this.elements.progressBar.textContent = progress + '%';
  },
  
  // 스캔 완료 시 UI 업데이트
  updateForScanComplete() {
    this.elements.statusText.textContent = '스캔 완료! "데이터 조회" 버튼으로 결과를 확인하세요.';
    this.elements.scanBtn.disabled = false;
    this.elements.viewDataBtn.disabled = false;
    this.elements.progressBar.style.width = '100%';
    this.elements.progressBar.textContent = '100%';
  },
  
  // 스캔 설정 가져오기
  getScanSettings() {
    return {
      apiKey: this.elements.apiKeyInput.value.trim(),
      scanArmor: this.elements.toggleArmor.checked,
      scanGem: this.elements.toggleGem.checked,
      scanAccessory: this.elements.toggleAccessory.checked,
      scanEngraving: this.elements.toggleEngraving.checked,
      scanKarma: this.elements.toggleKarma.checked,
      scanAvatar: this.elements.toggleAvatar.checked
    };
  },
  
  // 옵션 펼침/접기 토글
  toggleOptions() {
    const optionsContent = this.elements.optionsContent;
    const toggleBtn = this.elements.toggleOptionsBtn;
    
    const isCollapsed = optionsContent.classList.toggle('collapsed');
    toggleBtn.classList.toggle('collapsed');
    
    // 화살표 방향 변경
    toggleBtn.textContent = isCollapsed ? '►' : '▼'; // 오른쪽 화살표 : 아래쪽 화살표
    
    // 상태 저장
    this.saveCollapseState(isCollapsed);
  }
};

// 팝업 기능 모듈
const PopupActions = {
  // 현재 탭이 유효한 페이지인지 확인
  checkCurrentTab() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0]?.url || '';
      const isValidPage = currentUrl.includes('lopec.kr/simulator');
      PopupUI.updateForValidPage(isValidPage);
    });
  },
  
  // 스캔 시작
  startScan() {
    // 현재 토글 설정 저장
    PopupUI.saveToggleSettings();
    // API 키 저장
    PopupUI.saveApiKey();
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // 토글 설정 가져오기
      const scanSettings = PopupUI.getScanSettings();
      
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'startScan',
        settings: scanSettings
      }, function(response) {
        if (response && response.status === 'started') {
          PopupUI.updateForScanStart();
        }
      });
    });
  },
  
  // 데이터 조회 페이지 열기
  openDataPage() {
    chrome.tabs.create({url: chrome.runtime.getURL('data.html')});
  },
  
  // 메시지 리스너 설정
  setupMessageListeners() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      if (request.action === 'updateProgress') {
        PopupUI.updateProgress(request.progress);
      } else if (request.action === 'scanComplete') {
        PopupUI.updateForScanComplete();
      }
    });
  }
};

// 이벤트 리스너 설정
function setupEventListeners() {
  // 스캔 및 데이터 조회 버튼
  PopupUI.elements.scanBtn.addEventListener('click', PopupActions.startScan);
  PopupUI.elements.viewDataBtn.addEventListener('click', PopupActions.openDataPage);
  
  // 옵션 펼침/접기 버튼
  PopupUI.elements.toggleOptionsBtn.addEventListener('click', function() {
    PopupUI.toggleOptions();
  });
  
  // 옵션 헤더 클릭 시 펼침/접기 토글
  const optionsHeader = document.querySelector('.options-header');
  optionsHeader.addEventListener('click', function(e) {
    // 토글 버튼 클릭은 버튼에서 처리하도록 제외
    if (e.target !== PopupUI.elements.toggleOptionsBtn) {
      PopupUI.toggleOptions();
    }
  });
  
  // 각 토글 버튼 변경 시 설정 저장
  PopupUI.elements.toggleArmor.addEventListener('change', function() {
    PopupUI.saveToggleSettings();
  });
  
  PopupUI.elements.toggleGem.addEventListener('change', function() {
    PopupUI.saveToggleSettings();
  });
  
  PopupUI.elements.toggleAccessory.addEventListener('change', function() {
    PopupUI.saveToggleSettings();
  });
  
  PopupUI.elements.toggleEngraving.addEventListener('change', function() {
    PopupUI.saveToggleSettings();
  });
  
  PopupUI.elements.toggleKarma.addEventListener('change', function() {
    PopupUI.saveToggleSettings();
  });
  
  PopupUI.elements.toggleAvatar.addEventListener('change', function() {
    PopupUI.saveToggleSettings();
  });
  
  // API 키 입력 필드 이벤트 처리
  // input 이벤트는 너무 자주 발생하미로 걷기(디바운스) 처리
  let apiKeyInputTimeout = null;
  
  // input 이벤트 - 변경사항 감지
  PopupUI.elements.apiKeyInput.addEventListener('input', function() {
    // 현재 입력값 로그 (디버깅용)
    console.log('API 키 입력 중:', this.value);
    
    // 500ms 동안 추가 키 입력이 없으면 저장 실행 (디바운스)
    clearTimeout(apiKeyInputTimeout);
    apiKeyInputTimeout = setTimeout(() => {
      console.log('API 키 입력 완료, 저장 시도');
      PopupUI.saveApiKey();
    }, 500);
  });
  
  // change 이벤트 - 포커스 상실시 저장
  PopupUI.elements.apiKeyInput.addEventListener('change', function() {
    console.log('API 키 change 이벤트 발생');
    clearTimeout(apiKeyInputTimeout); // 디바운스 취소
    PopupUI.saveApiKey(); // 즉시 저장
  });
  
  // blur 이벤트 - 포커스 상실시 저장
  PopupUI.elements.apiKeyInput.addEventListener('blur', function() {
    console.log('API 키 필드에서 포커스 상실');
    clearTimeout(apiKeyInputTimeout); // 디바운스 취소
    PopupUI.saveApiKey(); // 즉시 저장
  });
}

// 초기화 함수
function initialize() {
  PopupUI.initElements();
  PopupUI.loadSettings(); // 저장된 설정 불러오기
  PopupActions.checkCurrentTab();
  PopupActions.setupMessageListeners();
  setupEventListeners();
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize);