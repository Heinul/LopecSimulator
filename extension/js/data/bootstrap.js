/**
 * 로펙 시뮬레이터 점수 분석기 - 부트스트랩 스크립트
 * 필요한 모듈들을 로드하고 초기화하는 역할
 */

// 데이터 패키지 모듈 로드 및 초기화
import DataPackage from './modules/data-package.js';

// API 상태 모듈 로드
import APIStatus from './modules/APIStatus.js';

// API 관리자 모듈 로드
import APIManager from './modules/APIManager.js';

// 초기화 함수
function initialize() {
  console.log('부트스트랩 초기화 시작');
  
  // 글로벌 오브젝트에 모듈 등록
  window.LopecScanner = window.LopecScanner || {};
  window.LopecScanner.Data = window.LopecScanner.Data || {};
  
  // API 상태 모듈 등록
  window.LopecScanner.Data.APIStatus = APIStatus;
  
  // API 관리자 모듈 등록
  window.LopecScanner.Data.APIManager = APIManager;
  
  // 모듈 초기화
  if (APIStatus && typeof APIStatus.initialize === 'function') {
    APIStatus.initialize();
  }
  
  if (APIManager && typeof APIManager.initialize === 'function') {
    APIManager.initialize();
  }
  
  console.log('부트스트랩 초기화 완료');
}

// 내보내기
export {
  DataPackage,
  APIStatus,
  APIManager,
  initialize
};

export default {
  DataPackage,
  APIStatus,
  APIManager,
  initialize
};

// 자동 초기화
initialize();
