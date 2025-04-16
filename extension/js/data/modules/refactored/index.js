/**
 * API 모듈 통합 인덱스 파일
 * 모든 API 관련 모듈을 내보냅니다.
 */

// 설정 및 유틸리티
import API_CONFIG from './APIConfig.js';
import CacheManager from './APICache.js';

// API 서브모듈
import AccessoryAPI from './api/accessory-api.js';
import GemAPI from './api/gem-api.js';
import EngravingAPI from './api/engraving-api.js';

// 헬퍼 함수
import * as EngravingHelper from './EngravingHelper.js';
import * as UIHelper from './UIHelper.js';

// 메인 API 상태 모듈
import APIStatus from './APIStatus.js';

// 모든 모듈을 하나의 객체로 내보내기
export {
  API_CONFIG,
  CacheManager,
  AccessoryAPI,
  GemAPI,
  EngravingAPI,
  EngravingHelper,
  UIHelper,
  APIStatus
};

// 기본 내보내기
export default APIStatus;