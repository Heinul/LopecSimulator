/**
 * 로펙 시뮬레이터 점수 분석기 - 백그라운드 스크립트
 * 확장 프로그램의 백그라운드 처리 담당
 */

// 스토리지 관리 모듈
const StorageManager = {
  // 초기화
  initialize() {
    chrome.storage.local.get(['scanData'], function(result) {
      if (!result.scanData) {
        chrome.storage.local.set({scanData: {}});
      }
    });
  },
  
  // 스캔 데이터 저장
  saveScanData(data, callback) {
    chrome.storage.local.set({
      scanData: data
    }, callback);
  }
};

// 메시지 처리 모듈
const MessageHandler = {
  // 메시지 처리
  handleMessage(request, sender, sendResponse) {
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
      StorageManager.saveScanData(request.data, function() {
        sendResponse({status: 'saved'});
      });
      return true; // 비동기 응답을 위해 true 반환
    }
  }
};

// 확장 프로그램 설치/업데이트 시 초기화
chrome.runtime.onInstalled.addListener(function() {
  StorageManager.initialize();
});

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener(MessageHandler.handleMessage);
