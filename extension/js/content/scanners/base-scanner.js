/**
 * 로펙 시뮬레이터 점수 분석기 - 기본 스캐너 모듈
 * 모든 스캐너 모듈의 기본 기능을 제공
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 기본 스캐너 모듈
LopecScanner.Scanners.BaseScanner = (function() {
  // 모듈 내부 공유 변수들
  const state = {
    isScanning: false,
    originalValues: {},
    scanResults: {},
    totalScans: 0,
    completedScans: 0
  };
  
  /**
   * 엘리먼트 값 변경 및 변동 확인
   * @param {HTMLElement} element - 값을 변경할 엘리먼트
   * @param {string} newValue - 새로 설정할 값
   * @return {Object} - 변경 후 점수와 변동 값
   */
  async function changeValueAndCheckDifference(element, newValue) {
    // 기존 화면의 점수 및 변동 값을 초기화 받아둘
    const initialScore = LopecScanner.Utils.getCurrentScore();
    
    // 값 변경
    element.value = newValue;
    
    // 변경 이벤트 발생
    const event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
    
    // 점수 변경을 기다림
    await LopecScanner.Utils.delay(100);
    
    // 변동을 지정된 시간 동안 모니터링
    const monitorDuration = 300;
    const difference = await LopecScanner.Utils.monitorDifferenceChanges(monitorDuration);
    
    // 현재 점수 받아오기
    const newScore = LopecScanner.Utils.getCurrentScore();
    
    // 변동이 감지되지 않았지만 점수가 변경되었다면
    if (Math.abs(difference) < 0.001 && Math.abs(newScore - initialScore) > 0.001) {
      const calculatedDifference = newScore - initialScore;
      return {
        score: newScore,
        difference: calculatedDifference
      };
    }
    
    return {
      score: newScore,
      difference: difference
    };
  }

  /**
   * 스캔 진행 상황 업데이트
   */
  function updateScanProgress() {
    state.completedScans++;
    const progress = Math.floor((state.completedScans / state.totalScans) * 100);
    
    // UI 업데이트
    LopecScanner.UI.updateProgress(progress);
  }

  /**
   * 원래 값으로 복원
   */
  async function restoreOriginalValues() {
    for (const key in state.originalValues) {
      const [type, index] = key.split('-').slice(0, 2);
      const value = state.originalValues[key];
      
      let selector;
      if (type === 'armor' && key.includes('name')) {
        selector = '.armor-name';
      } else if (type === 'armor' && key.includes('upgrade')) {
        selector = '.armor-upgrade';
      } else if (type === 'gem') {
        selector = 'select[name="ArmoryGem Gems Level"]';
      }
      
      if (selector) {
        const elements = document.querySelectorAll(selector);
        if (elements[index]) {
          elements[index].value = value;
          const event = new Event('change', { bubbles: true });
          elements[index].dispatchEvent(event);
          await LopecScanner.Utils.delay(100);
        }
      }
    }
  }
  
  /**
   * 스캔 완료 처리
   */
  function finishScan() {
    state.isScanning = false;
    
    // 오버레이 제거
    LopecScanner.UI.removeOverlay();
    
    // 확장 프로그램에 완료 알림
    chrome.runtime.sendMessage({
      action: 'scanComplete'
    });
    
    // 데이터 저장
    chrome.runtime.sendMessage({
      action: 'saveData',
      data: state.scanResults
    });
  }
  
  // 공개 API
  return {
    state,
    changeValueAndCheckDifference,
    updateScanProgress,
    restoreOriginalValues,
    finishScan
  };
})();
