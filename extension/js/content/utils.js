/**
 * 로펙 시뮬레이터 점수 분석기 - 유틸리티 함수
 */

// 전역 네임스페이스
window.LopecScanner = window.LopecScanner || {};

// 유틸리티 모듈
LopecScanner.Utils = (function() {
  /**
   * 지연 함수 (ms 단위)
   * @param {number} ms - 지연 시간(밀리초)
   * @return {Promise} - 지연 시간 후 resolve되는 Promise
   */
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 스코어 변동값 파싱
   * @param {HTMLElement} differenceElement - 점수 변동을 표시하는 요소
   * @return {number} - 파싱된 변동값
   */
  function parseScoreDifference(differenceElement) {
    if (!differenceElement) return 0;
    
    // 클래스 이름 확인
    const className = differenceElement.className || '';
    // 텍스트 내용 확인
    const text = differenceElement.textContent.trim();
    
    // 기본값 설정
    let value = 0;
    
    // 텍스트에서 숫자 추출 시도
    if (text) {
      // + 또는 - 기호와 숫자 추출
      const matches = text.match(/([+-]?[0-9]*\.?[0-9]+)/);
      if (matches && matches[1]) {
        value = parseFloat(matches[1]);
      }
    }
    
    // 클래스에 따른 값 조정
    if (className.includes('decrease')) {
      // 감소일 경우 음수 보장
      return value <= 0 ? value : -Math.abs(value);
    } else if (className.includes('increase')) {
      // 증가일 경우 양수 보장
      return value >= 0 ? value : Math.abs(value);
    }
    
    // 변화 없음 (zero 클래스)
    return 0;
  }

  /**
   * 현재 점수 값 가져오기
   * @return {number} - 현재 점수 값
   */
  function getCurrentScore() {
    const specPointElement = document.querySelector('.spec-point');
    if (specPointElement) {
      const scoreText = specPointElement.textContent.replace(/[^0-9.]/g, '');
      return parseFloat(scoreText);
    }
    return 0;
  }

  /**
   * 점수 변동 확인
   * @return {number} - 점수 변동 값
   */
  function getScoreDifference() {
    const differenceElement = document.querySelector('.tier-box .difference');
    return parseScoreDifference(differenceElement);
  }
  
  /**
   * 현재 점수 변동 값 가져오기
   * @return {number} - 현재 변동 값
   */
  function getCurrentDifference() {
    return getScoreDifference();
  }
  
  /**
   * 특정 시간 동안 값 변화 모니터링
   * @param {number} duration - 모니터링 시간(ms)
   * @param {number} interval - 확인 간격(ms)
   * @return {Promise<number>} - 모니터링 기간 중 감지된 가장 큰 변화 값
   */
  async function monitorDifferenceChanges(duration, interval = 50) {
    let maxDifference = 0;
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
      const currentDiff = getScoreDifference();
      if (Math.abs(currentDiff) > Math.abs(maxDifference)) {
        maxDifference = currentDiff;
      }
      await delay(interval);
    }
    
    return maxDifference;
  }
  
  // 공개 API
  return {
    delay,
    parseScoreDifference,
    getCurrentScore,
    getScoreDifference,
    getCurrentDifference,
    monitorDifferenceChanges
  };
})();
