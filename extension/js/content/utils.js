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
      const score = parseFloat(scoreText);
      console.log(`현재 점수: ${score} (${specPointElement.textContent})`);
      return score;
    }
    console.warn('점수 요소를 찾을 수 없습니다.');
    return 0;
  }

  /**
   * 점수 변동 확인
   * @return {number} - 점수 변동 값
   */
  function getScoreDifference() {
    const differenceElement = document.querySelector('.tier-box .difference');
    const diffValue = parseScoreDifference(differenceElement);
    
    // 클래스와 텍스트 확인
    const className = differenceElement ? differenceElement.className : '';
    const text = differenceElement ? differenceElement.textContent.trim() : '';
    
    // 텍스트에서 값 추출 시도
    let textValue = 0;
    if (text) {
      const matches = text.match(/([+-]?[0-9]*\.?[0-9]+)/);
      if (matches && matches[1]) {
        textValue = parseFloat(matches[1]);
        
        // 감소인 경우 음수로 변환
        if (className.includes('decrease') && textValue > 0) {
          textValue = -textValue;
        }
      }
    }
    
    console.log(`점수 변동 값: ${diffValue}`, 
        differenceElement ? `(클래스: ${className}, 텍스트: ${text}, 텍스트값: ${textValue})` : '(요소 없음)');
    
    // 값이 0이지만 텍스트 값이 있으면 텍스트 값 사용
    if (Math.abs(diffValue) < 0.001 && Math.abs(textValue) > 0.001) {
      console.log(`변동값이 0이지만 텍스트에서 값이 발견되어 사용: ${textValue}`);
      return textValue;
    }
    
    return diffValue;
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
  async function monitorDifferenceChanges(duration, interval = 20) { // 더 자주 새로고침 (20ms 간격)
    let maxDifference = 0;
    const startTime = Date.now();
    const differences = [];
    
    // 초기 점수 저장
    const initialScore = getCurrentScore();
    console.log(`모니터링 시작, 초기 점수: ${initialScore}`);
    
    // 변동이 감지될 때까지 시간 동안 계속 돌림
    const endTime = Date.now() + duration;
    let foundSignificantChange = false;
    
    while (Date.now() < endTime) {
      const currentDiff = getScoreDifference();
      differences.push(currentDiff);
      
      if (Math.abs(currentDiff) > 0.001) { // 유의미한 변화 감지
        foundSignificantChange = true;
        console.log(`변화 감지: ${currentDiff}`);
      }
      
      if (Math.abs(currentDiff) > Math.abs(maxDifference)) {
        maxDifference = currentDiff;
        console.log(`새로운 최대 변화 감지: ${maxDifference}`);
        
        // 유의미한 변화 감지 후 추가 시간 동안 계속 모니터링
        if (Math.abs(maxDifference) > 0.001) {
          endTime = Math.max(endTime, Date.now() + 500); // 추가 500ms 더 모니터링
        }
      }
      
      await delay(interval);
    }
    
    // 점수 차이 계산
    const finalScore = getCurrentScore();
    const scoreDiff = finalScore - initialScore;
    
    console.log(`모니터링 완료. 감지된 최대 변동값: ${maxDifference}, 점수 차이: ${scoreDiff}, 유의미한 변화 감지: ${foundSignificantChange}`);
    
    // 변동값이 감지되었으면 그 값 사용
    if (Math.abs(maxDifference) > 0.001) {
      return maxDifference;
    }
    
    // 점수 차이가 있으면 사용
    if (Math.abs(scoreDiff) > 0.001) {
      console.log(`변동값이 감지되지 않았지만 점수 차이 사용: ${scoreDiff}`);
      return scoreDiff;
    }
    
    // 아무 변화도 없으면 0 반환
    return 0;
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
