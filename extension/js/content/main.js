/**
 * 로펙 시뮬레이터 점수 분석기 - 메인 모듈
 * 확장 프로그램의 기본 초기화 및 이벤트 설정 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};
window.LopecScanner.Scanners.Accessory = window.LopecScanner.Scanners.Accessory || {};
window.LopecScanner.Scanners.Accessory.Detector = window.LopecScanner.Scanners.Accessory.Detector || {};
window.LopecScanner.Scanners.Accessory.Options = window.LopecScanner.Scanners.Accessory.Options || {};
window.LopecScanner.Scanners.Accessory.Manipulator = window.LopecScanner.Scanners.Accessory.Manipulator || {};
window.LopecScanner.Scanners.Accessory.AccessoryScanner = window.LopecScanner.Scanners.Accessory.AccessoryScanner || {};

// 초기화 및 메시지 처리 함수
(function() {
  // 스캔 설정 저장 변수
  let scanSettings = {
    scanArmor: true,
    scanGem: true,
    scanAccessory: true,
    scanEngraving: true,
    scanKarma: true,
    scanAvatar: true
  };
  
  // 메시지 리스너 설정
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'startScan' && !LopecScanner.Scanner.isScanningActive()) {
      // 스캔 설정 업데이트
      if (request.settings) {
        scanSettings = request.settings;
      }
      
      // 스캐너에 설정 전달
      LopecScanner.Scanners.Main.setScanSettings(scanSettings);
      
      // 스캔 시작
      LopecScanner.Scanner.startScan();
      sendResponse({status: 'started'});
    }
    return true;
  });

  // 페이지 로드 완료 시 초기화
  window.addEventListener('load', function() {
    console.log('로펙 시뮬레이터 점수 분석기가 로드되었습니다.');
    
    // 리팩토링된 모듈 확인
    if (window.LopecScanner.Scanners.Accessory && 
        window.LopecScanner.Scanners.Accessory.AccessoryScanner) {
      console.log('리팩토링된 장신구 스캐너 모듈이 로드되었습니다.');
    }
    

  });
})();