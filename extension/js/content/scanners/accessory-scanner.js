/**
 * 로펙 시뮬레이터 점수 분석기 - 장신구 스캐너 모듈 (호환성 래퍼)
 * 리팩토링된 코드와의 호환성을 위한 래퍼 모듈
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 모듈 통합 (서브모듈 로드)
// 1. 액세서리 옵션 모듈
// 2. 액세서리 탐지 모듈
// 3. 액세서리 조작 모듈 
// 4. 액세서리 스캐너 모듈

// 장신구 스캐너 모듈 (호환성 래퍼)
LopecScanner.Scanners.AccessoryScanner = (function() {
  // 장신구 관련 모듈 초기화 여부 확인
  const hasRefactoredModules = !!(window.LopecScanner.Scanners.Accessory && 
                               window.LopecScanner.Scanners.Accessory.AccessoryScanner);

  if (hasRefactoredModules) {
    console.log('리팩토링된 장신구 모듈 사용: AccessoryScanner');
  } else {
    console.warn('리팩토링된 장신구 모듈을 찾을 수 없습니다. 기본 구현 사용');
  }
  
  /**
   * 장신구 스캔 준비
   * @param {Object} elements - 장신구 요소들 모음 객체
   * @return {number} - 스캔 항목 개수
   */
  function prepareAccessoryScan(elements) {
    if (hasRefactoredModules) {
      return LopecScanner.Scanners.Accessory.AccessoryScanner.prepareAccessoryScan(elements);
    } else {
      console.error('장신구 스캔 준비 실패');
      return 0;
    }
  }
  
  /**
   * 장신구 스캔 실행
   * @param {Object} elements - 장신구 요소들 모음 객체
   */
  async function scanAccessories(elements) {
    if (hasRefactoredModules) {
      return await LopecScanner.Scanners.Accessory.AccessoryScanner.scanAccessories(elements);
    } else {
      console.error('장신구 스캔 실행 실패');
    }
  }
  
  /**
   * 현재 선택된 장신구 옵션 가져오기
   * @return {Array} - 선택된 옵션 정보 배열
   */
  function getSelectedAccessoryOptions() {
    if (hasRefactoredModules) {
      return LopecScanner.Scanners.Accessory.Detector.getSelectedAccessoryOptions();
    } else {
      console.error('장신구 옵션 정보 가져오기 실패');
      return [];
    }
  }
  
  // 공개 API (기존 API와 동일한 인터페이스 유지)
  return {
    prepareAccessoryScan,
    scanAccessories,
    getSelectedAccessoryOptions
  };
})();