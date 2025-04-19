/**
 * 로펙 시뮬레이터 점수 분석기 - UI 컨트롤러 모듈
 * 데이터 페이지 UI 업데이트 및 이벤트 처리
 */

// UI 컨트롤러 모듈
// import 관련 모듈
import DataManager from './data-manager.js';
import DataRenderer from './modules/DataRenderer.js';
import APIStatus from './modules/APIStatus.js';

// 참고: 해당 모듈은 APIStatus와 DataManager, DataRenderer를 사용함
// 해당 모듈들이 앞서 로드되어야 함
const UIController = (function() {
  /**
   * 모달 스타일 추가
   */
  function addModalStyles() {
    // 스타일이 이미 있는지 확인
    if (document.getElementById('modal-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'modal-styles';
    styleElement.textContent = `
      /* 모달 기본 스타일 */
      .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
      }
      
      .modal-content {
        background-color: #fff;
        margin: 10% auto;
        padding: 0;
        width: 500px;
        max-width: 90%;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }
      
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
        background-color: #f8f8f8;
        border-radius: 8px 8px 0 0;
      }
      
      .modal-header h2 {
        margin: 0;
        font-size: 20px;
        color: #333;
      }
      
      .close-modal {
        font-size: 24px;
        color: #999;
        cursor: pointer;
      }
      
      .close-modal:hover {
        color: #333;
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .modal-footer {
        padding: 15px 20px;
        text-align: right;
        border-top: 1px solid #eee;
        background-color: #f8f8f8;
        border-radius: 0 0 8px 8px;
      }
      
      /* API 설정 관련 스타일 */
      .api-input-container {
        display: flex;
        align-items: center;
        margin: 15px 0;
      }
      
      #api-key-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .modal-button {
        padding: 8px 15px;
        margin-left: 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .modal-button.primary {
        background-color: #2196F3;
        color: white;
      }
      
      .modal-button.secondary {
        background-color: #4CAF50;
        color: white;
      }
      
      .modal-button:hover {
        opacity: 0.9;
      }
      
      .api-status-display {
        margin: 15px 0;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }
      
      .api-status-indicator {
        display: flex;
        align-items: center;
      }
      
      .status-icon {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 8px;
        background-color: #ccc;
      }
      
      .api-info {
        margin-top: 15px;
        color: #666;
        font-size: 13px;
      }
      
      .api-info p {
        margin: 5px 0;
      }
      
      .api-info a {
        color: #2196F3;
        text-decoration: none;
      }
      
      /* 로딩 오버레이 */
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.8);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 10;
      }
      
      .loading-spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #2196F3;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: 10px;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        color: #333;
        font-size: 16px;
      }
      
      /* API 설정 버튼 */
      .api-settings-button {
        margin-left: 10px;
        padding: 4px 8px;
        background-color: #2196F3;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      }
      
      .api-settings-button:hover {
        background-color: #1976D2;
      }
      
      /* API 액션 버튼 */
      .api-action-button {
        margin-top: 8px;
        padding: 6px 12px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        font-size: 13px;
      }
      
      .api-action-button:hover {
        background-color: #3E8E41;
      }
      
      /* API 상태 스타일 추가 */
      .api-status-neutral {
        display: flex;
        align-items: center;
        color: #607D8B;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .api-status-neutral .status-icon {
        background-color: #607D8B;
      }

      /* 문제 해결 도우미 스타일 */
      .api-troubleshoot {
        margin-top: 20px;
        padding: 15px;
        background-color: #f0f8ff;
        border-radius: 5px;
        border-left: 4px solid #2196F3;
      }
      
      .api-troubleshoot h4 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #2196F3;
      }
      
      .troubleshoot-result {
        margin-top: 15px;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        background-color: #fff;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .api-error-report {
        font-size: 13px;
      }
      
      .api-error-report h3 {
        margin-top: 0;
        color: #333;
      }
      
      .report-section {
        margin-bottom: 15px;
      }
      
      .report-section h4 {
        margin-bottom: 8px;
        color: #555;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      
      .report-section.errors {
        background-color: #fff9f9;
        border-left: 3px solid #f44336;
        padding: 10px;
      }
      
      .report-section.technical pre {
        background-color: #f5f5f5;
        padding: 10px;
        overflow-x: auto;
        font-size: 12px;
        border-radius: 3px;
      }
    `;
    
    document.head.appendChild(styleElement);
  }

  /**
   * 모든 UI 컴포넌트 초기화
   */
  function initializeAll() {
    // 모달 스타일 추가
    addModalStyles();
    
    // 데이터 로드
    DataManager.loadData(() => {
      // 요약 정보 업데이트
      const summaryData = DataManager.getSummary();
      DataRenderer.updateSummary(summaryData);
      
      // 데이터 테이블 업데이트
      const processedData = DataManager.processData(false, 'all', 'differenceDesc');
      DataRenderer.updateDataTable(processedData);
      
      // API 상태 요약 업데이트 (요약 정보가 로드된 후)
      if (APIStatus && typeof APIStatus.updateApiStatusSummary === 'function') {
        setTimeout(() => APIStatus.updateApiStatusSummary(), 100);
      }
    });
  }

  // 공개 API
  return {
    initializeAll
  };
})();

// 페이지 로드 시 UI 초기화
document.addEventListener('DOMContentLoaded', () => {
  UIController.initializeAll();
});
