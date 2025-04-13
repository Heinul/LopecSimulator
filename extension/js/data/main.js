/**
 * 로펙 시뮬레이터 점수 분석기 - 데이터 페이지 메인 스크립트
 */

// 초기화 함수
function initialize() {
  console.log('Initializing data page...');
  
  // UI 컨트롤러 초기화
  if (typeof UIController !== 'undefined' && typeof UIController.initializeAll === 'function') {
    UIController.initializeAll();
  } else {
    console.error('UIController 또는 initializeAll 함수를 찾을 수 없습니다.');
  }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize);
