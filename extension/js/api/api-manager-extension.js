/**
 * API 관리 모듈 확장
 * 문제 해결 도구 및 진단 기능을 추가합니다.
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.API = window.LopecScanner.API || {};

// API 관리 모듈 확장
(function() {
  // API 관리자 모듈 참조
  const APIManager = window.LopecScanner.API.APIManager;
  
  // 모듈이 로드되지 않은 경우 종료
  if (!APIManager) {
    console.error('[API Manager 확장] API 관리자 모듈이 로드되지 않았습니다.');
    return;
  }
  
  /**
   * API 문제 해결 대화상자 표시
   */
  function showTroubleshootingDialog() {
    console.log('[API Manager 확장] 문제 해결 대화상자 표시');
    
    // 기존 대화상자 제거
    const existingDialog = document.getElementById('api-troubleshoot-dialog');
    if (existingDialog) {
      existingDialog.remove();
    }
    
    // 대화상자 생성
    const dialog = document.createElement('div');
    dialog.id = 'api-troubleshoot-dialog';
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.backgroundColor = 'white';
    dialog.style.padding = '20px';
    dialog.style.borderRadius = '8px';
    dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    dialog.style.zIndex = '9999';
    dialog.style.maxWidth = '80%';
    dialog.style.width = '600px';
    dialog.style.maxHeight = '80vh';
    dialog.style.overflow = 'auto';
    
    // 대화상자 제목
    const title = document.createElement('h3');
    title.textContent = 'API 연결 문제 해결';
    title.style.margin = '0 0 15px 0';
    title.style.borderBottom = '1px solid #eee';
    title.style.paddingBottom = '10px';
    
    // 닫기 버튼
    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.border = 'none';
    closeButton.style.background = 'none';
    closeButton.style.fontSize = '16px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.color = '#666';
    
    // 진단 도구 시작 메시지
    const contentArea = document.createElement('div');
    contentArea.id = 'troubleshoot-content';
    
    // 먼저 새 진단 도구를 확인하고, 없으면 기존 도구 사용
    if (window.LopecScanner.API.Diagnostics) {
      contentArea.innerHTML = '<p>API 연결 진단을 시작하려면 아래 버튼을 클릭하세요.</p>';
    } else if (window.LopecScanner.API.Troubleshooter) {
      contentArea.innerHTML = '<p>API 연결 진단을 시작하려면 아래 버튼을 클릭하세요.</p>';
    } else {
      contentArea.innerHTML = `
        <div class="api-error-report error">
          <h3>진단 도구를 찾을 수 없습니다</h3>
          <p>API 문제 해결 도구가 로드되지 않았습니다. 다음 방법을 시도해보세요:</p>
          <ul>
            <li>확장 프로그램을 다시 로드해보세요.</li>
            <li>브라우저를 재시작해보세요.</li>
            <li>확장 프로그램을 제거하고 다시 설치해보세요.</li>
          </ul>
        </div>
      `;
    }
    
    // 진단 시작 버튼
    const startButton = document.createElement('button');
    startButton.textContent = '진단 시작';
    startButton.style.padding = '8px 16px';
    startButton.style.backgroundColor = '#4CAF50';
    startButton.style.color = 'white';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '4px';
    startButton.style.cursor = 'pointer';
    startButton.style.marginTop = '10px';
    
    // 요소 조합
    dialog.appendChild(title);
    dialog.appendChild(closeButton);
    dialog.appendChild(contentArea);
    dialog.appendChild(startButton);
    
    // 닫기 버튼 이벤트
    closeButton.addEventListener('click', function() {
      dialog.remove();
    });
    
    // 진단 시작 이벤트
    startButton.addEventListener('click', async function() {
      // 진단 버튼 비활성화
      startButton.disabled = true;
      startButton.textContent = '진단 중...';
      contentArea.innerHTML = '<p>API 연결 진단 중입니다. 잠시만 기다려주세요...</p>';
      
      try {
        // 새 진단 도구 우선 사용
        if (window.LopecScanner.API.Diagnostics) {
          console.log('[API Manager 확장] Diagnostics 모듈 발견, 진단 보고서 생성 중');
          const report = await window.LopecScanner.API.Diagnostics.generateErrorReport();
          contentArea.innerHTML = report;
        }
        // 기존 진단 도구 사용
        else if (window.LopecScanner.API.Troubleshooter) {
          console.log('[API Manager 확장] Troubleshooter 모듈 발견, 진단 보고서 생성 중');
          const report = await window.LopecScanner.API.Troubleshooter.generateErrorReport();
          contentArea.innerHTML = report;
        } else {
          console.error('[API Manager 확장] 진단 도구 모듈이 없습니다');
          contentArea.innerHTML = `
            <div class="api-error-report error">
              <h3>진단 도구를 찾을 수 없습니다</h3>
              <p>API 문제 해결 도구가 로드되지 않았습니다. 다음 방법을 시도해보세요:</p>
              <ul>
                <li>확장 프로그램을 다시 로드해보세요.</li>
                <li>브라우저를 재시작해보세요.</li>
                <li>확장 프로그램을 제거하고 다시 설치해보세요.</li>
              </ul>
            </div>
          `;
        }
      } catch (error) {
        console.error('[API Manager 확장] 진단 중 오류 발생:', error);
        contentArea.innerHTML = `
          <div class="api-error-report error">
            <h3>진단 중 오류 발생</h3>
            <p>${error.message}</p>
            <p>개발자 도구 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.</p>
          </div>
        `;
      } finally {
        // 진단 버튼 복구
        startButton.disabled = false;
        startButton.textContent = '진단 다시 시작';
      }
    });
    
    // 대화상자 추가
    document.body.appendChild(dialog);
  }

  // APIManager에 메서드 추가
  if (typeof APIManager === 'object') {
    APIManager.showTroubleshootingDialog = showTroubleshootingDialog;
    console.log('[API Manager 확장] 문제 해결 기능이 추가되었습니다.');
  }

  // 전역 함수로도 등록
  window.LopecScanner.API.showTroubleshootingDialog = showTroubleshootingDialog;
})();
