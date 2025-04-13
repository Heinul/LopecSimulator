/**
 * API 진단 도구
 * API 연결 문제를 진단하고 해결하는 데 도움을 주는 도구입니다.
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.API = window.LopecScanner.API || {};

// API 진단 모듈
window.LopecScanner.API.Diagnostics = (function() {
  /**
   * API 연결 테스트
   * @returns {Promise<Object>} - 테스트 결과 정보
   */
  async function testApiConnection() {
    console.log('[API 진단] API 연결 테스트 시작');
    
    const results = {
      apiKey: false,
      cors: null,
      connection: false,
      errors: [],
      details: {}
    };

    try {
      // 1. API 키 확인
      const apiKey = await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          resolve(result.lostarkApiKey || null);
        });
      });

      if (!apiKey) {
        results.errors.push('API 키가 설정되지 않았습니다.');
        return results;
      }

      results.apiKey = true;
      results.details.apiKeyPrefix = apiKey.substring(0, 5) + '...';

      // 2. 단순 요청 테스트 (CORS 및 네트워크 문제 확인)
      try {
        const corsTestUrl = 'https://developer-lostark.game.onstove.com/news/notices';
        console.log('[API 진단] CORS 테스트 URL:', corsTestUrl);

        const corsTestResponse = await fetch(corsTestUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
          },
          mode: 'cors'
        });

        results.cors = true;
        results.details.corsStatus = corsTestResponse.status;
        results.details.corsStatusText = corsTestResponse.statusText;

        // 응답 상태 확인
        if (corsTestResponse.ok) {
          results.connection = true;
        } else {
          if (corsTestResponse.status === 401) {
            results.errors.push('인증 실패: API 키가 유효하지 않거나 만료되었습니다.');
          } else if (corsTestResponse.status === 403) {
            results.errors.push('권한 부족: API 키에 필요한 권한이 없습니다.');
          } else if (corsTestResponse.status === 429) {
            results.errors.push('요청 제한: API 요청 한도를 초과했습니다.');
          } else {
            results.errors.push(`API 서버 오류: ${corsTestResponse.status} ${corsTestResponse.statusText}`);
          }
        }

        // 응답 내용 확인
        try {
          const contentType = corsTestResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const jsonData = await corsTestResponse.clone().json();
            results.details.responseType = 'JSON';
            results.details.responsePreview = JSON.stringify(jsonData).substring(0, 100) + '...';
          } else {
            const textData = await corsTestResponse.clone().text();
            results.details.responseType = contentType || 'unknown';
            results.details.responsePreview = textData.substring(0, 100) + '...';
          }
        } catch (parseError) {
          results.details.responseParseError = parseError.message;
        }
      } catch (corsError) {
        results.cors = false;
        results.errors.push(`CORS 오류: ${corsError.message}`);
        results.details.corsError = corsError.message;
      }
    } catch (error) {
      results.errors.push(`테스트 중 오류 발생: ${error.message}`);
      results.details.mainError = error.message;
      results.details.mainErrorStack = error.stack;
    }

    console.log('[API 진단] API 연결 테스트 결과:', results);
    return results;
  }

  /**
   * 자세한 API 오류 보고서 생성
   * @returns {Promise<string>} - 오류 보고서 HTML
   */
  async function generateErrorReport() {
    console.log('[API 진단] 오류 보고서 생성 시작');
    
    try {
      // 테스트 실행
      const testResults = await testApiConnection();
      
      // 보고서 HTML 생성
      let reportHtml = `
        <div class="api-error-report">
          <h3>API 연결 진단 보고서</h3>
          
          <div class="report-section">
            <h4>진단 요약</h4>
            <ul>
              <li>API 키: ${testResults.apiKey ? '✅ 있음' : '❌ 없음'}</li>
              <li>CORS 테스트: ${testResults.cors === true ? '✅ 성공' : 
                               testResults.cors === false ? '❌ 실패' : '⚠️ 미실행'}</li>
              <li>API 연결: ${testResults.connection ? '✅ 성공' : '❌ 실패'}</li>
            </ul>
          </div>
          
          ${testResults.errors.length > 0 ? `
            <div class="report-section errors">
              <h4>발견된 문제</h4>
              <ul>
                ${testResults.errors.map(err => `<li>${err}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          
          <div class="report-section">
            <h4>해결 방법</h4>
            <ul>
              ${!testResults.apiKey ? `
                <li>로스트아크 개발자 센터에서 유효한 API 키를 발급받아 설정해주세요.</li>
              ` : ''}
              
              ${testResults.apiKey && !testResults.connection ? `
                <li>API 키가 유효한지 확인하세요. 개발자 센터에서 새로운 API 키를 발급받아 볼 수 있습니다.</li>
                <li>발급받은 API 키의 권한이 충분한지 확인하세요.</li>
                <li>API 요청 한도를 초과했다면, 잠시 후 다시 시도해보세요.</li>
              ` : ''}
              
              ${testResults.cors === false ? `
                <li>브라우저 확장 프로그램의 CORS 문제일 수 있습니다. 확장 프로그램을 다시 로드하세요.</li>
                <li>브라우저 캐시를 지우거나 시크릿 모드에서 시도해보세요.</li>
                <li>다른 브라우저나 기기에서 시도해보세요.</li>
              ` : ''}
              
              ${!testResults.errors.length ? `
                <li>문제가 발견되지 않았습니다. API가 정상적으로 작동하고 있습니다.</li>
              ` : ''}
            </ul>
          </div>
          
          <div class="report-section">
            <h4>추가 조치</h4>
            <ul>
              <li>확장 프로그램을 새로고침 해보세요 (chrome://extensions/ 에서 가능).</li>
              <li>브라우저를 완전히 종료하고 다시 실행해보세요.</li>
              <li>기기를 재부팅한 후 다시 시도해보세요.</li>
            </ul>
          </div>
          
          <div class="report-section technical">
            <h4>기술 정보 (개발자용)</h4>
            <pre>${JSON.stringify(testResults.details, null, 2)}</pre>
          </div>
        </div>
      `;
      
      console.log('[API 진단] 오류 보고서 생성 완료');
      return reportHtml;
    } catch (error) {
      console.error('[API 진단] 오류 보고서 생성 중 오류 발생:', error);
      
      return `<div class="api-error-report error">
        <h3>진단 중 오류 발생</h3>
        <p>${error.message}</p>
        <p>아래 조치를 시도해보세요:</p>
        <ul>
          <li>확장 프로그램을 다시 로드하세요 (chrome://extensions/ 에서 가능).</li>
          <li>브라우저를 재시작하세요.</li>
          <li>확장 프로그램을 제거하고 다시 설치하세요.</li>
        </ul>
      </div>`;
    }
  }

  /**
   * 진단 도구 UI 생성
   * @returns {HTMLElement} - 진단 도구 UI 요소
   */
  function createDiagnosticsUI() {
    console.log('[API 진단] 진단 도구 UI 생성');
    
    // 기존 UI가 있으면 제거
    const existingUI = document.getElementById('api-diagnostics-ui');
    if (existingUI) {
      existingUI.remove();
    }
    
    // 진단 도구 컨테이너 생성
    const container = document.createElement('div');
    container.id = 'api-diagnostics-ui';
    container.className = 'api-diagnostics-container';
    container.style.padding = '15px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.border = '1px solid #ddd';
    container.style.borderRadius = '5px';
    container.style.marginTop = '15px';
    container.style.marginBottom = '15px';
    
    // 헤더 생성
    const header = document.createElement('div');
    header.className = 'diagnostics-header';
    header.style.marginBottom = '10px';
    header.innerHTML = `
      <h3 style="margin: 0 0 10px 0;">API 진단 도구</h3>
      <p style="margin: 0; color: #666;">API 연결 문제를 진단하고 해결하는 데 도움을 줍니다.</p>
    `;
    
    // 버튼 컨테이너
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'diagnostics-buttons';
    buttonContainer.style.marginTop = '10px';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '10px';
    
    // 진단 시작 버튼
    const startButton = document.createElement('button');
    startButton.innerText = '진단 시작';
    startButton.style.padding = '8px 16px';
    startButton.style.backgroundColor = '#4CAF50';
    startButton.style.color = 'white';
    startButton.style.border = 'none';
    startButton.style.borderRadius = '4px';
    startButton.style.cursor = 'pointer';
    
    // 결과 컨테이너
    const resultContainer = document.createElement('div');
    resultContainer.id = 'diagnostics-result';
    resultContainer.className = 'diagnostics-result';
    resultContainer.style.marginTop = '15px';
    resultContainer.style.display = 'none';
    
    // 버튼 이벤트 리스너
    startButton.addEventListener('click', async function() {
      // 진단 시작 시 UI 상태 변경
      startButton.disabled = true;
      startButton.innerText = '진단 중...';
      resultContainer.innerHTML = '<p>API 진단 중입니다. 잠시만 기다려주세요...</p>';
      resultContainer.style.display = 'block';
      
      try {
        // 보고서 생성
        const report = await generateErrorReport();
        resultContainer.innerHTML = report;
        
        // 스타일 적용
        applyReportStyles(resultContainer);
      } catch (error) {
        console.error('[API 진단] 진단 실행 중 오류:', error);
        resultContainer.innerHTML = `
          <div class="api-error-report error">
            <h3>진단 도구 오류</h3>
            <p>${error.message}</p>
          </div>
        `;
      } finally {
        // 버튼 상태 복원
        startButton.disabled = false;
        startButton.innerText = '진단 다시 시작';
      }
    });
    
    // 요소 조합
    buttonContainer.appendChild(startButton);
    container.appendChild(header);
    container.appendChild(buttonContainer);
    container.appendChild(resultContainer);
    
    return container;
  }
  
  /**
   * 보고서 스타일 적용 함수
   * @param {HTMLElement} container - 스타일을 적용할 컨테이너
   */
  function applyReportStyles(container) {
    // 보고서 섹션 스타일
    const sections = container.querySelectorAll('.report-section');
    sections.forEach(section => {
      section.style.marginBottom = '15px';
      section.style.padding = '10px';
      section.style.borderRadius = '4px';
      section.style.backgroundColor = '#fff';
      section.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    });
    
    // 오류 섹션 스타일
    const errorSection = container.querySelector('.report-section.errors');
    if (errorSection) {
      errorSection.style.backgroundColor = '#FFF8F7';
      errorSection.style.borderLeft = '4px solid #F44336';
    }
    
    // 기술 정보 섹션 스타일
    const technicalSection = container.querySelector('.report-section.technical');
    if (technicalSection) {
      const pre = technicalSection.querySelector('pre');
      if (pre) {
        pre.style.backgroundColor = '#f5f5f5';
        pre.style.padding = '10px';
        pre.style.borderRadius = '4px';
        pre.style.overflow = 'auto';
        pre.style.fontSize = '12px';
      }
    }
  }

  /**
   * 진단 도구를 페이지에 추가
   * @param {string} targetSelector - 진단 도구를 추가할 요소의 선택자
   */
  function addDiagnosticsToPage(targetSelector = '.data-wrapper') {
    console.log('[API 진단] 페이지에 진단 도구 추가 시도:', targetSelector);
    
    // 대상 요소 확인
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
      console.error(`[API 진단] 대상 요소를 찾을 수 없습니다: ${targetSelector}`);
      return false;
    }
    
    // 진단 도구 UI 생성 및 추가
    const diagnosticsUI = createDiagnosticsUI();
    
    // 기존 API 설정 UI 뒤에 추가
    const apiSettings = document.getElementById('lostark-api-settings');
    if (apiSettings) {
      apiSettings.after(diagnosticsUI);
    } else {
      // API 설정 UI가 없으면 대상 요소의 첫 번째 자식으로 추가
      targetElement.insertBefore(diagnosticsUI, targetElement.firstChild);
    }
    
    console.log('[API 진단] 진단 도구가 페이지에 추가되었습니다');
    return true;
  }

  /**
   * 초기화 함수
   */
  function initialize() {
    // 페이지 로드 감지 및 UI 추가
    window.addEventListener('load', function() {
      // 데이터 페이지 확인
      if (window.location.href.includes('data.html')) {
        // 약간의 지연을 두고 진단 도구 추가 (API 설정 UI가 먼저 로드되도록)
        setTimeout(() => {
          addDiagnosticsToPage();
        }, 1000);
      }
    });
    
    console.log('[API 진단] 진단 도구 모듈이 초기화되었습니다');
  }

  // 공개 API
  return {
    initialize,
    testApiConnection,
    generateErrorReport,
    createDiagnosticsUI,
    addDiagnosticsToPage
  };
})();

// 모듈 자동 초기화
window.LopecScanner.API.Diagnostics.initialize();
