/**
 * 로펙 시뮬레이터 점수 분석기 - UI 관련 기능
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};

// UI 모듈
LopecScanner.UI = (function() {
  /**
   * 스캔 진행 중 오버레이 요소 생성
   * @return {HTMLElement} - 생성된 오버레이 요소
   */
  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'scanner-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    `;
    
    const message = document.createElement('div');
    message.id = 'scanner-message';
    message.style.cssText = `
      color: white;
      font-size: 24px;
      margin-bottom: 20px;
    `;
    message.textContent = '스캔 중... 페이지를 조작하지 마세요.';
    
    const progress = document.createElement('div');
    progress.id = 'scanner-progress';
    progress.style.cssText = `
      width: 80%;
      max-width: 500px;
      height: 30px;
      background-color: #333;
      border-radius: 5px;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.id = 'scanner-progress-bar';
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background-color: #4CAF50;
      border-radius: 5px;
      text-align: center;
      line-height: 30px;
      color: white;
    `;
    progressBar.textContent = '0%';
    
    progress.appendChild(progressBar);
    overlay.appendChild(message);
    overlay.appendChild(progress);
    
    return overlay;
  }

  /**
   * 스캔 진행 상황 업데이트
   * @param {number} progress - 진행률(0-100)
   */
  function updateProgress(progress) {
    const progressBar = document.getElementById('scanner-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
      progressBar.textContent = `${progress}%`;
    }
    
    // 확장 프로그램 팝업 업데이트
    chrome.runtime.sendMessage({
      action: 'scanProgress',
      progress: progress
    });
  }
  
  /**
   * 오버레이 제거
   */
  function removeOverlay() {
    const overlay = document.getElementById('scanner-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
  
  // 공개 API
  return {
    createOverlay,
    updateProgress,
    removeOverlay
  };
})();
