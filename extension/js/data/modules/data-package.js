/**
 * 로펙 시뮬레이터 점수 분석기 - 데이터 패키지
 * 모든 데이터 관련 모듈을 하나로 통합하는 패키지
 */

// API 모듈 불러오기
import API from './api/main-api.js';

// 각인서 계산기 불러오기
import EngravingCalculator from './engraving-calculator.js';

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Data = window.LopecScanner.Data || {};

// 모듈 초기화 함수
function initialize() {
  console.log('데이터 패키지 초기화 시작');
  
  // API 모듈 초기화
  if (API && typeof API.initialize === 'function') {
    API.initialize();
  }
  
  // 각 모듈을 전역 네임스페이스에 등록
  window.LopecScanner.Data.API = API;
  window.LopecScanner.Data.EngravingCalculator = EngravingCalculator;
  
  console.log('데이터 패키지 초기화 완료');
}

// 내보내기
export {
  API,
  EngravingCalculator,
  initialize
};

export default {
  API,
  EngravingCalculator,
  initialize
};

// 자동 초기화
initialize();
