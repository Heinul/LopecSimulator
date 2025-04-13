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
    progressBar: null
  },
  
  // 요소 초기화
  initElements() {
    this.elements.scanBtn = document.getElementById('scanBtn');
    this.elements.viewDataBtn = document.getElementById('viewDataBtn');
    this.elements.statusText = document.getElementById('statusText');
    this.elements.progressContainer = document.getElementById('progressContainer');
    this.elements.progressBar = document.getElementById('progressBar');
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
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'startScan'}, function(response) {
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
  PopupUI.elements.scanBtn.addEventListener('click', PopupActions.startScan);
  PopupUI.elements.viewDataBtn.addEventListener('click', PopupActions.openDataPage);
}

// 초기화 함수
function initialize() {
  PopupUI.initElements();
  PopupActions.checkCurrentTab();
  PopupActions.setupMessageListeners();
  setupEventListeners();
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize);
