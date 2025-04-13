/**
 * 로펙 시뮬레이터 점수 분석기 - 장신구 조작 모듈
 * 장신구 옵션 변경 및 조작 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};
window.LopecScanner.Scanners.Accessory = window.LopecScanner.Scanners.Accessory || {};

// 장신구 조작 모듈
LopecScanner.Scanners.Accessory.Manipulator = (function() {
  /**
   * 점수 변동이 제대로 감지되지 않을 때 추가 확인
   * @param {string} accessoryType - 장신구 타입 (necklace, earring, ring)
   * @param {Array} originalValues - 원래 값 배열
   * @param {Array} newValues - 새 값 배열
   * @param {Array} elements - 장신구 요소 배열
   * @return {number} - 확인된 변동값 또는 추정된 변동값
   */
  async function checkScoreDifferenceForAccessory(accessoryType, originalValues, newValues, elements) {
    // 점수 변동이 0.01로 나오는지 확인
    const initialScore = LopecScanner.Utils.getCurrentScore();
    const initialDiff = LopecScanner.Utils.getCurrentDifference();
    
    console.log(`${accessoryType} 점수 변동 확인 시작 - 현재 점수: ${initialScore}, 변동값: ${initialDiff}`);
    
    // 추가 확인 시도
    let attempts = 3;
    let maxDifference = initialDiff;
    
    while (Math.abs(maxDifference) < 0.011 && attempts > 0) {
      console.log(`${accessoryType} 변동값이 작음: ${maxDifference}, 추가 확인 시도 ${4-attempts}/3`);
      
      // 값 변경 후 더 긴 기다림
      await LopecScanner.Utils.delay(400);
      
      // 현재 값 확인
      for (let i = 0; i < Math.min(newValues.length, elements.length); i++) {
        if (elements[i].element.value !== newValues[i]) {
          console.log(`값이 제대로 적용되지 않음: ${elements[i].element.value} != ${newValues[i]}`);
          
          // 다시 적용 시도
          elements[i].element.value = newValues[i];
          const event = new Event('change', { bubbles: true });
          elements[i].element.dispatchEvent(event);
          await LopecScanner.Utils.delay(100);
        }
      }
      
      // 변동값 확인
      await LopecScanner.Utils.delay(500);
      const newDiff = LopecScanner.Utils.getCurrentDifference();
      
      if (Math.abs(newDiff) > Math.abs(maxDifference)) {
        maxDifference = newDiff;
        console.log(`더 큰 변동값 감지: ${maxDifference}`);
      }
      
      attempts--;
    }
    
    const finalScore = LopecScanner.Utils.getCurrentScore();
    const scoreDiff = finalScore - initialScore;
    
    // 최종 점수 변화 유무 확인
    console.log(`${accessoryType} 점수 변동 확인 완료 - 최종 점수: ${finalScore}, 변동값: ${maxDifference}, 점수 차이: ${scoreDiff}`);
    
    // 가장 적합한 값 선택
    if (Math.abs(maxDifference) > 0.02) {
      // 감지된 변동값이 의미있으면 그것 사용
      return maxDifference;
    } else if (Math.abs(scoreDiff) > 0.02) {
      // 감지된 점수 차이가 의미있으면 그것 사용
      return scoreDiff;
    } else if (accessoryType === 'necklace' && Math.abs(maxDifference) <= 0.02) {
      // 목걸이인 경우 최소한 0.05로 처리
      return (maxDifference >= 0) ? 0.05 : -0.05;
    }
    
    // 기본값 사용
    return (maxDifference >= 0) ? 0.02 : -0.02;
  }
  
  /**
   * 목걸이 옵션 강제 변경 시도 - 특별 처리
   * @param {HTMLElement} element - 목걸이 셀렉트 요소
   * @param {string} newValue - 변경할 값
   * @param {number} attempt - 시도 횟수
   * @return {boolean} - 변경 성공 여부
   */
  async function forceNecklaceOptionChange(element, newValue, attempt = 0) {
    // 이미 변경됐는지 확인
    if (element.value === newValue) return true;
    
    console.log(`목걸이 옵션 강제 변경 시도 #${attempt+1}: ${element.value} -> ${newValue}`);
    
    try {
      // 옵션 인덱스 찾기
      let optionIndex = -1;
      for (let i = 0; i < element.options.length; i++) {
        if (element.options[i].value === newValue) {
          optionIndex = i;
          break;
        }
      }
      
      if (optionIndex < 0) {
        console.error(`목걸이 옵션 값 ${newValue}를 찾을 수 없음`);
        return false;
      }
      
      // 포커스 초기화
      try {
        document.activeElement.blur();
      } catch (e) {
        // 무시
      }
      
      // 여러 방법으로 변경 시도
      await LopecScanner.Utils.delay(150);
      
      // 1. 직접 속성 변경
      element.selectedIndex = optionIndex;
      element.value = newValue;
      
      // 2. 모든 이벤트 발생
      // 마우스 이벤트
      element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      
      // 키보드 이벤트
      element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      element.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
      
      // 표준 이벤트
      element.dispatchEvent(new Event('focus', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 3. 변경 후 딜레이
      await LopecScanner.Utils.delay(200);
      
      // 변경 확인
      if (element.value === newValue) {
        console.log(`목걸이 옵션 변경 성공: ${newValue}`);
        return true;
      } else {
        console.log(`목걸이 옵션 변경 실패: ${element.value} !== ${newValue}`);
        
        // 다시 시도 (마지막 수단)
        element.value = newValue;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        await LopecScanner.Utils.delay(100);
        
        return element.value === newValue;
      }
    } catch (e) {
      console.error('목걸이 옵션 변경 오류:', e);
      return false;
    }
  }
  
  /**
   * 장신구 옵션 변경
   * @param {HTMLElement} element - 장신구 옵션 요소
   * @param {string} newValue - 변경할 값
   * @param {string} accessoryType - 장신구 타입
   * @return {boolean} - 변경 성공 여부
   */
  async function changeAccessoryOption(element, newValue, accessoryType) {
    // 이미 같은 값이면 아무 것도 하지 않음
    if (element.value === newValue) return false;
    
    console.log(`장신구 옵션 변경: ${accessoryType} - ${element.value} -> ${newValue}`);

    // 목걸이인 경우 특별 처리
    if (accessoryType === 'necklace') {
      return await forceNecklaceOptionChange(element, newValue);
    }
    
    // 일반적인 경우
    element.value = newValue;
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  
  // 공개 API
  return {
    checkScoreDifferenceForAccessory,
    forceNecklaceOptionChange,
    changeAccessoryOption
  };
})();