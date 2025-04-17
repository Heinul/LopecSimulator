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
    
    // 추가 확인 시도
    let attempts = 3;
    let maxDifference = initialDiff;
    
    while (Math.abs(maxDifference) < 0.011 && attempts > 0) {
      // 값 변경 후 기다림
      await LopecScanner.Utils.delay(400);
      
      // 현재 값 확인
      for (let i = 0; i < Math.min(newValues.length, elements.length); i++) {
        if (elements[i].element.value !== newValues[i]) {
          // 다시 적용 시도
          elements[i].element.value = newValues[i];
          const event = new Event('change', { bubbles: true });
          elements[i].element.dispatchEvent(event);
          await LopecScanner.Utils.delay(100);
        }
      }
      
      // 변동값 확인
      await LopecScanner.Utils.delay(300);
      const newDiff = LopecScanner.Utils.getCurrentDifference();
      
      if (Math.abs(newDiff) > Math.abs(maxDifference)) {
        maxDifference = newDiff;
      }
      
      attempts--;
    }
    
    const finalScore = LopecScanner.Utils.getCurrentScore();
    const scoreDiff = finalScore - initialScore;
    
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
   * 장신구 옵션 변경
   * @param {HTMLElement} element - 장신구 옵션 요소
   * @param {string} newValue - 변경할 값
   * @param {string} accessoryType - 장신구 타입
   * @return {boolean} - 변경 성공 여부
   */
  async function changeAccessoryOption(element, newValue, accessoryType) {
    // 디버깅 로그 추가
    console.log(`옵션 변경 시도: ${element.value} -> ${newValue} (${accessoryType})`);
    
    // 이미 같은 값이면 아무 것도 하지 않음
    if (element.value === newValue) {
      console.log(`현재 값이 동일해 변경 필요 없음: ${newValue}`);
      return false;
    }
    
    // 옵션 값이 존재하는지 확인
    const optionExists = Array.from(element.options).some(option => option.value === newValue);
    if (!optionExists) {
      console.warn(`요청한 옵션 값이 선택 목록에 없음: ${newValue}`);
      
      // 비슷한 값이 있는지 찾기 (예: 상:addDamagePer:2.6 -> 중:addDamagePer:1.6)
      if (newValue.includes(':')) {
        const [grade, key] = newValue.split(':');
        const similarOption = Array.from(element.options).find(option => 
          option.value.startsWith(`${grade}:${key}:`) || 
          option.value.includes(`:${key}:`)
        );
        
        if (similarOption) {
          console.log(`유사한 옵션 값으로 대체: ${similarOption.value}`);
          newValue = similarOption.value;
        } else {
          // 비슷한 옵션도 찾지 못함 - 없음 옵션 시도
          const noneOption = Array.from(element.options).find(option => 
            option.value.includes('value:0') || 
            option.textContent.includes('없음')
          );
          
          if (noneOption) {
            console.log(`없음 옵션으로 대체: ${noneOption.value}`);
            newValue = noneOption.value;
          } else {
            console.error(`적절한 대체 옵션을 찾을 수 없음`);
            return false;
          }
        }
      }
    }
    
    // 다양한 방법으로 값 변경 시도
    try {
      // 1. 직접 값 변경
      element.value = newValue;
      
      // 2. 인덱스 기반 변경
      const optionIndex = Array.from(element.options).findIndex(option => option.value === newValue);
      if (optionIndex >= 0) {
        element.selectedIndex = optionIndex;
      }
      
      // 3. 이벤트 발생
      const events = [
        new Event('change', { bubbles: true }),
        new Event('input', { bubbles: true })
      ];
      
      // 모든 이벤트 발생
      for (const event of events) {
        element.dispatchEvent(event);
      }
      
      // 짧은 지연 후 값이 변경되었는지 확인
      await LopecScanner.Utils.delay(100);
      
      if (element.value === newValue) {
        console.log(`옵션 변경 성공: ${newValue}`);
        return true;
      } else {
        console.warn(`옵션 변경 실패: ${element.value} != ${newValue}`);
        
        // 마지막 시도: 다시 값 설정 및 이벤트 발생
        element.value = newValue;
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
        await LopecScanner.Utils.delay(50);
        return element.value === newValue;
      }
    } catch (error) {
      console.error(`옵션 변경 중 오류 발생:`, error);
      return false;
    }
  }
  
  // 공개 API
  return {
    checkScoreDifferenceForAccessory,
    changeAccessoryOption
  };
})();