/**
 * API 문제 해결 유틸리티
 * API 연결 문제를 진단하고 해결하는 데 도움을 줍니다.
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.API = window.LopecScanner.API || {};

// API 문제 해결 모듈
window.LopecScanner.API.Troubleshooter = (function() {
  /**
   * API 연결 테스트
   * @returns {Promise<Object>} - 테스트 결과 정보
   */
  async function testApiConnection() {
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
      results.details.apiKeyPrefix = apiKey;

      // 2. 단순 요청 테스트 (CORS 및 네트워크 문제 확인)
      try {
        const corsTestUrl = 'https://developer-lostark.game.onstove.com/markets/categories';
        console.log('[API 문제해결] CORS 테스트 URL:', corsTestUrl);

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

    return results;
  }

  /**
   * 자세한 API 오류 보고서 생성
   * @returns {Promise<string>} - 오류 보고서 HTML
   */
  async function generateErrorReport() {
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
                <li>브라우저 확장 프로그램의 CORS 문제일 수 있습니다. manifest.json 파일에 호스트 권한이 있는지 확인하세요.</li>
                <li>다른 브라우저나 기기에서 시도해보세요.</li>
              ` : ''}
            </ul>
          </div>
          
          <div class="report-section technical">
            <h4>기술 정보 (개발자용)</h4>
            <pre>${JSON.stringify(testResults.details, null, 2)}</pre>
          </div>
        </div>
      `;
      
      return reportHtml;
    } catch (error) {
      return `<div class="api-error-report error">
        <h3>진단 중 오류 발생</h3>
        <p>${error.message}</p>
      </div>`;
    }
  }

  /**
   * API 키 검증
   * @param {string} apiKey - 검증할 API 키
   * @returns {boolean} - 형식적으로 유효한지 여부
   */
  function validateApiKeyFormat(apiKey) {
    if (!apiKey) return false;
    
    // API 키 형식 검증 (일반적인 JWT 형식)
    const jwtPattern = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
    return jwtPattern.test(apiKey);
  }

  /**
   * API 키 저장 및 검증
   * @param {string} apiKey - 저장할 API 키
   * @returns {Promise<Object>} - 저장 결과
   */
  async function saveAndValidateApiKey(apiKey) {
    const result = {
      success: false,
      formatValid: false,
      connectionTest: false,
      message: ''
    };
    
    // 키 형식 검증
    result.formatValid = validateApiKeyFormat(apiKey);
    if (!result.formatValid) {
      result.message = 'API 키 형식이 올바르지 않습니다. 개발자 센터에서 발급받은 키를 확인해주세요.';
      return result;
    }
    
    // 저장
    try {
      await new Promise((resolve) => {
        chrome.storage.local.set({ lostarkApiKey: apiKey }, resolve);
      });
      
      // 잠시 대기 (저장 완료 확인)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 연결 테스트
      const testResults = await testApiConnection();
      result.connectionTest = testResults.connection;
      
      if (result.connectionTest) {
        result.success = true;
        result.message = 'API 키가 성공적으로 저장되었고, 연결 테스트도 성공했습니다.';
      } else {
        result.message = 'API 키는 저장되었지만, 연결 테스트에 실패했습니다. ' + 
                        (testResults.errors.length > 0 ? testResults.errors[0] : '알 수 없는 오류');
      }
    } catch (error) {
      result.message = `API 키 저장 중 오류 발생: ${error.message}`;
    }
    
    return result;
  }

  // 공개 API
  return {
    testApiConnection,
    generateErrorReport,
    validateApiKeyFormat,
    saveAndValidateApiKey
  };
})();
