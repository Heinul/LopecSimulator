/**
 * 롭크 시뮬레이터 점수 분석기 - 유틸리티 함수
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
   * 스코어 변동값 파싱 (예: +0.25 -> 0.25, -1.36 -> -1.36)
   * @param {HTMLElement} differenceElement - 점수 변동을 표시하는 요소
   * @return {number} - 파싱된 변동값
   */
  function parseScoreDifference(differenceElement) {
    if (!differenceElement) return 0;
    
    let className = differenceElement.className;
    let text = differenceElement.textContent.trim();
    let value = 0;
    
    // 텍스트에서 모든 숫자와 표시를 추출
    const numberMatch = text.match(/([+-]?\\d+\\.?\\d*)/); 
    if (numberMatch && numberMatch[1]) {
      value = parseFloat(numberMatch[1]);
    }
    
    // 클래스에 따라 값의 부호 결정
    if (className.includes('decrease')) {
      return value < 0 ? value : -value; // 반드시 음수값으로 보장
    } else if (className.includes('increase')) {
      return value > 0 ? value : Math.abs(value); // 반드시 양수값으로 보장
    }
    
    return 0; // 변화 없음 (zero)
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
  
  // 공개 API
  return {
    delay,
    parseScoreDifference,
    getCurrentScore,
    getScoreDifference
  };
})();
