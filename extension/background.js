// 확장 프로그램 설치/업데이트 시 필요한 초기화 처리
chrome.runtime.onInstalled.addListener(function() {
  // 스토리지 초기화 (필요한 경우)
  chrome.storage.local.get(['scanData'], function(result) {
    if (!result.scanData) {
      chrome.storage.local.set({scanData: {}});
    }
  });
});

// 콘텐츠 스크립트와 팝업 간의 메시지 릴레이
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // 스캔 진행 상황 업데이트
  if (request.action === 'scanProgress') {
    chrome.runtime.sendMessage({
      action: 'updateProgress',
      progress: request.progress
    });
  }
  
  // 스캔 완료 알림
  else if (request.action === 'scanComplete') {
    chrome.runtime.sendMessage({
      action: 'scanComplete'
    });
  }
  
  // 스캔 데이터 저장
  else if (request.action === 'saveData') {
    chrome.storage.local.set({
      scanData: request.data
    }, function() {
      sendResponse({status: 'saved'});
    });
    return true; // 비동기 응답을 위해 true 반환
  }
});
