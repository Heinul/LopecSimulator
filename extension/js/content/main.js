/**
 * 로펙 시뮬레이터 점수 분석기 - 메인 모듈
 * 확장 프로그램의 기본 초기화 및 이벤트 설정 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};

// 초기화 및 메시지 처리 함수
(function() {
  // 메시지 리스너 설정
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'startScan' && !LopecScanner.Scanner.isScanningActive()) {
      LopecScanner.Scanner.startScan();
      sendResponse({status: 'started'});
    }
    return true;
  });

  // 페이지 로드 완료 시 초기화
  window.addEventListener('load', function() {
    console.log('로펙 시뮬레이터 점수 분석기가 로드되었습니다.');
  });
})();
