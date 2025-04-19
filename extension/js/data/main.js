/**
 * 로펙 시뮬레이터 점수 분석기 - 데이터 페이지 메인 스크립트
 */

// API 모듈 임포트
import * as ApiModule from './modules/api/main-api.js';

// 글로벌 변수 (모듈 참조 저장)
window.ApiModule = ApiModule;

// 초기화 함수
function initialize() {
  console.log('Initializing data page...');
  
  // API 모듈 초기화
  ApiModule.initialize();
  console.log('API 모듈 초기화 완료');
  
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initialize);

// 모듈 내보내기
export default {
  initialize
};
