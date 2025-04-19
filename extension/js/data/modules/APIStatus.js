// API 캐시 저장소 (전역 변수)
const API_CACHE = {
  gems: {}, // 보석 가격 캐싱 (예: '9레벨 겁화': 785000)
  engravings: {}, // 각인서 가격 캐싱
  lastUpdate: {}, // 마지막 업데이트 시간 (캐시 유효성 확인용)
};

/**
 * API 상태 관리 모듈
 * API 상태 업데이트 및 표시를 담당합니다.
 */

// API 관련 상수 가져오기
import API_CONFIG from './APIConfig.js';

// API 상태 관리 모듈
const APIStatus = (function() {
  /**
   * API 상태 요약 업데이트
   */
  async function updateApiStatusSummary() {
    const apiStatusElement = document.getElementById('api-status-summary');
    if (!apiStatusElement) return;
    
    try {
      // API 키 설정 여부 확인
      let apiKey = null;
      let apiAvailable = false;
      
      await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          apiKey = result && result.lostarkApiKey;
          resolve();
        });
      });
      
      // API 키가 있는 경우 직접 연결 테스트 수행
      if (apiKey) {
        try {
          // 직접 API 연결 테스트
          const testUrl = API_CONFIG.baseUrl + API_CONFIG.endpoints.auctionOptions;
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              ...API_CONFIG.headers,
              'authorization': `bearer ${apiKey}`
            }
          });
          
          apiAvailable = (response.status === 200);
          console.log('API 연결 테스트 결과:', apiAvailable, '(상태코드:', response.status, ')');
        } catch (e) {
          console.error('API 연결 테스트 오류:', e);
          apiAvailable = false;
        }
      }
      
      // API 키 설정 버튼 추가 (항상 표시)
      const apiSettingsButton = `
        <button id="open-api-settings" class="api-settings-button">API 설정</button>
      `;
      
      // HTML 컨텐츠 준비
      let htmlContent = '';
      
      if (apiAvailable) {
        htmlContent = `
          <div class="api-status-ok">
            <span class="status-icon">✓</span>
            <span class="status-text">로스트아크 API 연결됨</span>
            ${apiSettingsButton}
          </div>
          <div class="api-description">
            <p>골드 소요량이 시장 가격 기준으로 계산됩니다.</p>
            <button id="fetch-gold-data-summary" class="api-action-button">골드 정보 가져오기</button>
          </div>
        `;
      } else if (apiKey) {
        htmlContent = `
          <div class="api-status-warning">
            <span class="status-icon">!</span>
            <span class="status-text">API 연결 실패</span>
            ${apiSettingsButton}
          </div>
          <div class="api-description">API 키를 확인하거나 다시 설정해주세요.</div>
        `;
      } else {
        htmlContent = `
          <div class="api-status-neutral">
            <span class="status-icon">?</span>
            <span class="status-text">API 연결되지 않음</span>
            ${apiSettingsButton}
          </div>
          <div class="api-description">API 키를 설정하면 스펙업 요소별 소요 골드를 확인할 수 있습니다.</div>
        `;
      }
      
      // HTML 업데이트
      apiStatusElement.innerHTML = htmlContent;
      
      // DOM 업데이트 후 이벤트 리스너 추가
      const openApiSettingsBtn = document.getElementById('open-api-settings');
      if (openApiSettingsBtn) {
        openApiSettingsBtn.addEventListener('click', () => {
          const modal = APIManager.createApiSettingsModal();
          modal.style.display = 'block';
          APIManager.updateApiStatus();
        });
      }
      
      // 골드 정보 가져오기 버튼 이벤트 리스너 (있는 경우에만)
      const fetchButton = document.getElementById('fetch-gold-data-summary');
      if (fetchButton) {
        fetchButton.addEventListener('click', () => {
          APIStatus.fetchGoldData();
        });
      }
    } catch (error) {
      console.error('API 상태 요약 업데이트 중 오류 발생:', error);
      
      // 오류 발생 시 HTML 업데이트
      const htmlContent = `
        <div class="api-status-error">
          <span class="status-icon">✗</span>
          <span class="status-text">API 오류 발생</span>
          <button id="open-api-settings" class="api-settings-button">API 설정</button>
        </div>
        <div class="api-description">오류: ${error.message}</div>
      `;
      
      apiStatusElement.innerHTML = htmlContent;
      
      // DOM 업데이트 후 이벤트 리스너 추가
      const openApiSettingsBtn = document.getElementById('open-api-settings');
      if (openApiSettingsBtn) {
        openApiSettingsBtn.addEventListener('click', () => {
          const modal = APIManager.createApiSettingsModal();
          modal.style.display = 'block';
          APIManager.updateApiStatus();
        });
      }
    }
  }

  /**
   * 골드 데이터 가져오기
   */
  async function fetchGoldData() {
    // 로딩 표시 추가
    const dataTableContainer = document.getElementById('data-table-container');
    if (!dataTableContainer) return;
    
    // 오버레이 생성
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">골드 데이터 가져오는 중...</div>
    `;
    
    // 기존 데이터 테이블 위에 오버레이 추가
    dataTableContainer.style.position = 'relative';
    dataTableContainer.appendChild(loadingOverlay);
    
    try {
      // API 키 불러오기 (미리 확인)
      let apiKey = null;
      await new Promise((resolve) => {
        chrome.storage.local.get(['lostarkApiKey'], function(result) {
          apiKey = result && result.lostarkApiKey;
          resolve();
        });
      });
      
      if (!apiKey) {
        alert('API 키가 설정되지 않았습니다. API 설정에서 키를 등록해주세요.');
        loadingOverlay.remove();
        return;
      }

      // 현재 표시된 데이터 가져오기
      const filteredData = DataManager ? DataManager.processedData : null;
      
      if (!filteredData || filteredData.length === 0) {
        alert('표시할 데이터가 없습니다.');
        loadingOverlay.remove();
        return;
      }
      
      // API 요청 시작 로그
      console.log('골드 데이터 요청 시작...');
      console.log('처리할 데이터 항목 수:', filteredData.length);
      
      // API 캐시 초기화
      if (!API_CACHE.engravings) API_CACHE.engravings = {};
      if (!API_CACHE.gems) API_CACHE.gems = {};
      if (!API_CACHE.lastUpdate) API_CACHE.lastUpdate = {};
      
      try {
        // 실제 API 호출
        await fetchRealGoldData(filteredData);
        
        // 데이터 테이블 업데이트
        updateDataTableWithGoldInfo(filteredData);
        
        alert('골드 데이터를 성공적으로 가져왔습니다!');
      } catch (apiError) {
        console.error('API 호출 오류:', apiError);
        
        // API 오류에도 불구하고 가진 데이터로 테이블 업데이트
        try {
          // 데이터 테이블 업데이트
          updateDataTableWithGoldInfo(filteredData);
          
          // 일부 데이터만 가져왔을 수 있으므로 다른 메시지 표시
          const goldItems = filteredData.filter(item => item.goldCost).length;
          if (goldItems > 0) {
            alert(`일부 골드 데이터(${goldItems}/${filteredData.length})를 가져우는데 성공했지만, 일부 오류가 발생했습니다: ${apiError.message}`);
          } else {
            alert(`골드 데이터를 가져오는 중 오류가 발생했습니다: ${apiError.message}`);
          }
        } catch (e) {
          console.error('테이블 업데이트 오류:', e);
          alert(`골드 데이터를 가져오는 중 오류가 발생했습니다: ${apiError.message}`);
        }
      }
    } catch (error) {
      console.error('골드 데이터 가져오기 오류:', error);
      alert('골드 데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 로딩 오버레이 제거
      loadingOverlay.remove();
    }
  }
  

  
  /**
   * 실제 로스트아크 API를 통해 골드 데이터 가져오기
   * @param {Array} items - 아이템 데이터 배열
   */
  async function fetchRealGoldData(items) {
    // API 키 불러오기
    let apiKey = null;
    await new Promise((resolve) => {
      chrome.storage.local.get(['lostarkApiKey'], function(result) {
        apiKey = result && result.lostarkApiKey;
        resolve();
      });
    });
    
    if (!apiKey) {
      throw new Error('API 키가 설정되지 않았습니다.');
    }
    
    // 데이터 처리를 위한 배치 사이즈
    const batchSize = 10;
    const batches = [];
    

    // 배치로 나누기
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    
    // 각 배치 처리
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`배치 ${i+1}/${batches.length} 처리 중... (${batch.length} 항목)`);
      
      // 각 배치의 아이템을 형식에 맞게 그룹화
      const accessoryItems = batch.filter(item => isAccessoryItem(item));
      const gemItems = batch.filter(item => isGemItem(item));
      const engravingItems = batch.filter(item => isEngravingItem(item));

      // 각 아이템 그룹 처리
      try {
        if (accessoryItems.length > 0) {
          await processAccessoryItems(accessoryItems, apiKey);
        }
        
        if (gemItems.length > 0) {
          await processGemItems(gemItems, apiKey);
        }
        
        if (engravingItems.length > 0) {
          await processEngravingItems(engravingItems, apiKey);
        }
        
        // 요청 간 지연 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`배치 ${i+1} 처리 중 오류:`, error);
        // 오류가 발생해도 다음 배치 처리 계속
      }
    }
    
    console.log('모든 배치 처리 완료');
  }
  
  /**
   * 장신구 타입 확인
   * @param {Object} item - 아이템 데이터
   * @returns {boolean} 장신구 여부
   */
  function isAccessoryItem(item) {
    const accessoryTypes = ['accessory', 'earring1', 'earring2', 'ring1', 'ring2', 'necklace'];
    console.log('장신구 타입 확인:', item.item);
    return accessoryTypes.includes(item.accessoryType);
  }
  
  /**
   * 보석 타입 확인
   * @param {Object} item - 아이템 데이터
   * @returns {boolean} 보석 여부
   */
  function isGemItem(item) {
    return item.type === 'gem';
  }
  
  /**
   * 각인서 타입 확인
   * @param {Object} item - 아이템 데이터
   * @returns {boolean} 각인서 여부
   */
  function isEngravingItem(item) {
    // 각인서 타입 직접 체크
    const isEngraving = item.type === 'engraving' || item.type === '각인';
    
    if (!isEngraving) {
      console.log('각인서 타입 확인:', item.item, '불일치 (현재 타입: ' + item.type + ')');
    } else {
      console.log('각인서 아이템 감지:', item);
    }
    
    return isEngraving;
  }
  

  
  /**
   * 장신구 아이템 처리
   * @param {Array} items - 장신구 아이템 배열
   * @param {string} apiKey - API 키
   */
  async function processAccessoryItems(items, apiKey) {
    try {
      // 새 API 모듈 불러오기 시도
      let AccessoryApi;
      try {
        // 새 API 모듈 임포트 시도
        const moduleImport = await import('../../../../js/api/accessoryApi.js');
        AccessoryApi = moduleImport.default;
        console.log('새 장신구 API 모듈이 성공적으로 로드되었습니다.');
      } catch (importError) {
        console.error('새 장신구 API 모듈을 불러오는데 실패했습니다:', importError);
      }
      
      // 각 장신구 아이템 처리
      for (const item of items) {
        try {
          // 장신구 타입 추출 (목걸이, 귀걸이, 반지)
          let accessoryType = '';
          
          // 장신구 타입 추출
          if (item.item.includes('necklace')) accessoryType = '목걸이';
          else if (item.item.includes('earring')) accessoryType = '귀걸이';
          else if (item.item.includes('ring')) accessoryType = '반지';
          else {
            console.warn(`알 수 없는 장신구 타입: ${item.item}`);
            continue;
          }
          
          // 클래스 타입 (기본값 딜러)
          const classType = '딜러';
          
          // 옵션 조합 추출 (기본값 상상)
          let combinationType = '상상';
          
          // 조합 타입 추출
          const itemNameParts = item.item.split(' ');
          for (const part of itemNameParts) {
            if (part === '상상' || part === '상중' || part === '중상' || 
                part === '상하' || part === '하상' || part === '상무' || 
                part === '무상' || part === '중중' || part === '중하' || 
                part === '하중' || part === '중무' || part === '무중' || 
                part === '하하' || part === '하무' || part === '무하' || 
                part === '무무') {
              combinationType = part;
              break;
            }
          }
          
          // 아이템 등급 추출 (고대, 유물)
          let itemGrade = '고대'; // 기본값
          if (item.grade) {
            itemGrade = item.grade;
          } else if (item.item.includes('유물')) {
            itemGrade = '유물';
          }
          
          console.log(`장신구 검색: ${accessoryType} (${classType}, ${combinationType}, ${itemGrade})`);
          
          // 전역 객체에서 AccessoryApi 불러오기
          const AccessoryApi = window.AccessoryApi;
          
          if (!AccessoryApi || !AccessoryApi.searchByStringType) {
            console.error('AccessoryApi 또는 searchByStringType 함수를 찾을 수 없습니다.');
            continue;
          }
          
          // API를 사용하여 검색
          const result = await AccessoryApi.searchByStringType(classType, accessoryType, combinationType, itemGrade);
          
          if (result && result.price) {
            // 최저가 기준으로 가격 정보 가져오기
            item.goldCost = result.price;
            console.log(`장신구 '${item.item}' 가격 조회 성공:`, result.price);
          } else {
            console.warn(`장신구 '${item.item}' 가격 조회 실패 또는 가격 정보 없음`);
          }
        } catch (error) {
          console.error(`장신구 '${item.item}' 처리 중 오류:`, error);
        }
        
        // API 요청 간 지연
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
    } catch (error) {
      console.error('장신구 처리 중 오류:', error);
    }
  }
  
  /**
   * 보석 아이템 처리
   * @param {Array} items - 보석 아이템 배열
   * @param {string} apiKey - API 키
   */
  async function processGemItems(items, apiKey) {
    // gem-api.js 모듈 임포트
    let GemAPI;
    try {
      const moduleImport = await import('./api/gem-api.js');
      GemAPI = moduleImport.default;
      console.log('보석 API 모듈이 성공적으로 로드되었습니다.');
    } catch (error) {
      console.error('보석 API 모듈을 불러오는데 실패했습니다:', error);
      console.log('기본 내장 요청 방식으로 대체합니다.');
      
      // 모듈 불러오기 실패 시 내장된 기본 기능 사용
      GemAPI = {
        buildGemRequestBody: function(itemName) {
          return {
            CategoryCode: 210000,
            ItemName: itemName,
            PageNo: 1,
            Sort: "BUY_PRICE",
            SortCondition: "ASC"
          };
        }
      };
    }
    
    // 캐시 유효 시간 (6시간, 밀리초 단위)
    const CACHE_TTL = 6 * 60 * 60 * 1000;
    // 현재 시간
    const now = Date.now();
    
    // 경매장 API로 보석 가격 조회
    const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.auctionItems;
    
    // 완료된 요청 추적 하기
    let completedRequests = 0;
    
    for (const item of items) {
      try {
        // 보석 이름에서 레벨 및 타입 추출 (예: "보석 (작열 슈웅 곰)" -> "9레벨 겁화")
        let gemLevel = '';
        let gemType = '';
        
        // 정규식으로 보석 정보 추출
        const gemMatch = item.item.match(/보석 \(([가-힣]+) (.+)\)/);
        if (gemMatch && gemMatch.length >= 3) {
          gemType = gemMatch[1]; // 예: 작열
          
          // 보석 레벨 추출 (숫자+레벨 형식으로)
          if (item.to && item.to.match(/\d+레벨/)) {
            gemLevel = item.to; // 이미 "5레벨" 형식이면 그대로 사용
          } else if (item.to && item.to.match(/\d+/)) {
            // 숫자만 있으면 "레벨" 추가
            gemLevel = `${item.to}레벨`;
          } else {
            // 기본값 설정
            gemLevel = '7레벨';
            console.warn(`보석 레벨을 찾을 수 없어 기본값 ${gemLevel}로 설정합니다.`);
          }
        } else {
          console.warn(`보석 정보를 파싱할 수 없습니다: ${item.item}`);
          continue; // 다음 아이템으로 넘어감
        }
        
        // 검색할 보석 이름 생성 (예: "7레벨 작열")
        const searchGemName = `${gemLevel} ${gemType}`;
        console.log(`보석 검색: ${searchGemName}`);
        
        // 캐시에서 가격 확인
        const cacheKey = searchGemName;
        const cachedData = API_CACHE.gems[cacheKey];
        const lastUpdate = API_CACHE.lastUpdate[cacheKey] || 0;
        
        // 캐시 데이터가 있고, 유효 시간 내인 경우 캐시된 값 사용
        if (cachedData && (now - lastUpdate) < CACHE_TTL) {
          console.log(`캐시에서 가격 가져옴: ${cacheKey} = ${cachedData}`);
          item.goldCost = cachedData;
          completedRequests++;
          continue; // 다음 아이템으로 진행
        }
        
        // gem-api.js의 함수를 사용하여 요청 본문 생성
        const requestBody = GemAPI.buildGemRequestBody(searchGemName);
        
        // 원하는 정렬 방식으로 변경
        requestBody.Sort = "BUY_PRICE";
        
        console.log('보석 API 요청 본문:', JSON.stringify(requestBody, null, 2));
        
        // API 요청 수행
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            ...API_CONFIG.headers,
            'authorization': `bearer ${apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.Items && data.Items.length > 0) {
            // 최저가 기준으로 가격 정보 가져오기
            const lowestPrice = data.Items[0].AuctionInfo.BuyPrice;
            
            // 캐시에 저장
            API_CACHE.gems[cacheKey] = lowestPrice;
            API_CACHE.lastUpdate[cacheKey] = now;
            console.log(`캐시 업데이트: ${cacheKey} = ${lowestPrice}`);
            
            // 아이템에 가격 설정
            item.goldCost = lowestPrice;
            console.log(`보석 '${searchGemName}' 가격 조회 성공:`, lowestPrice);
          } else {
            console.warn(`보석 '${searchGemName}' 검색 결과가 없습니다.`);
          }
        } else {
          console.error(`보석 이름 '${searchGemName}' 조회 실패:`, response.status);
          if (response.status === 429) {
            console.error('API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.');
            break; // 한도 초과 시 더 이상의 요청 중단
          }
        }
      } catch (error) {
        console.error(`보석 '${item.item}' 처리 중 오류:`, error);
      }
      
      completedRequests++;
      // API 요청 전체 진행률 로그 (무시해도 될 빈도로 출력)
      if (completedRequests % 3 === 0 || completedRequests === items.length) {
        console.log(`보석 가격 처리 진행률: ${completedRequests}/${items.length} (${Math.round(completedRequests/items.length*100)}%)`);
      }
      
      // API 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  /**
   * 각인서 아이템 처리
   * @param {Array} items - 각인서 아이템 배열
   * @param {string} apiKey - API 키
   */
  async function processEngravingItems(items, apiKey) {
    console.log('각인서 아이템 총 개수:', items.length);
    // 모든 아이템의 타입 검사 추가
    items.forEach((item, index) => {
      console.log(`각인서 아이템[${index}] 타입:`, item.type, '내용:', item.item);
    });
    // 각인 API 모듈 임포트
    let EngravingAPI;
    try {
      const moduleImport = await import('./api/engraving-api.js');
      EngravingAPI = moduleImport.default;
      console.log('각인서 API 모듈이 성공적으로 로드되었습니다.');
    } catch (error) {
      console.error('각인서 API 모듈을 불러오는데 실패했습니다:', error);
    }
    
    // 캐시 유효 시간 (6시간, 밀리초 단위)
    const CACHE_TTL = 1 * 60 * 60 * 1000;
    // 현재 시간
    const now = Date.now();
    
    // 거래소 API로 각인서 가격 조회
    const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.marketItems;
    
    // 완료된 요청 추적
    let completedRequests = 0;
    
    for (const item of items) {
      try {
        // 각인서 정보 획득득
        let engravingName = item.engravingName;
        let fromGrade = item.fromGrade;
        let toGrade =  item.toGrade;
        let fromLevel = item.fromLevel;
        let toLevel = item.toLevel;
        
        // 캐시키 생성
        const cacheKey = `${engravingName}_${fromGrade}_${fromLevel}_${toGrade}_${toLevel}`;
        
        // 캐시에서 가격 확인
        const cachedData = API_CACHE.engravings[cacheKey];
        const lastUpdate = API_CACHE.lastUpdate[cacheKey] || 0;
        
        // 캐시 데이터가 있고, 유효 시간 내인 경우 캐시된 값 사용
        if (cachedData && (now - lastUpdate) < CACHE_TTL) {
          console.log(`캐시에서 각인서 가격 가져옴: ${cacheKey} = ${cachedData}`);
          item.goldCost = cachedData;
          completedRequests++;
          continue; // 다음 아이템으로 진행
        }
        
        if (EngravingAPI) {
          // API 모듈을 통한 검색
          try {
            // 유효한 각인서/등급/레벨 정보가 있는 경우 계산
            if (engravingName && fromGrade && toGrade && fromLevel >= 0 && toLevel >= 0) {
              // 각인서 가격 조회
              console.log(`각인서 가격 조회 시도: ${engravingName}`);
              const priceData = await EngravingAPI.getEngravingPrice(engravingName, null, apiKey);
              console.log(`각인서 가격 조회 결과:`, priceData);
              
              if (priceData) {
                // 등급별 필요 책 수량 계산
                const booksDetail = calculateDetailedEngravingBooks(fromGrade, fromLevel, toGrade, toLevel);
                
                if (booksDetail.totalBooks > 0) {
                  // 등급별 가격 정보 초기화
                  const costDetails = {
                    byGrade: {},
                    totalCost: 0
                  };
                  
                  // 각 등급별 계산
                  let totalCost = 0;
                  
                  // 각 등급별로 필요한 책 수와 가격 계산
                  for (const grade in booksDetail.byGrade) {
                    const booksNeeded = booksDetail.byGrade[grade];
                    
                    // 해당 등급의 가격 정보 확인
                    if (priceData[grade] && priceData[grade].price) {
                      const gradePrice = priceData[grade].price;
                      const gradeCost = gradePrice * booksNeeded;
                      
                      // 세부 정보 저장
                      costDetails.byGrade[grade] = {
                        price: gradePrice,
                        books: booksNeeded,
                        cost: gradeCost
                      };
                      
                      // 총 가격에 추가
                      totalCost += gradeCost;
                    } else {
                      console.warn(`각인서 ${engravingName}의 ${grade} 등급 가격 정보를 찾을 수 없습니다.`);
                      costDetails.byGrade[grade] = {
                        price: 0,
                        books: booksNeeded,
                        cost: 0
                      };
                    }
                  }
                  
                  // 총 가격 설정
                  costDetails.totalCost = totalCost;
                  
                  // 캐시에 저장
                  API_CACHE.engravings[cacheKey] = {
                    totalCost: totalCost,
                    costDetails: costDetails,
                    totalBooks: booksDetail.totalBooks
                  };
                  API_CACHE.lastUpdate[cacheKey] = now;
                  
                  // 아이템에 가격 설정
                  item.goldCost = totalCost;
                  item.costDetails = costDetails;
                  item.engravingBooks = booksDetail.totalBooks;
                  
                  // 로그 메시지
                  let logMessage = `각인서 ${engravingName} ${fromGrade}${fromLevel} → ${toGrade}${toLevel}: 총 ${booksDetail.totalBooks}개 = ${totalCost}G\n`;
                  
                  // 등급별 세부 정보 로그
                  for (const grade in costDetails.byGrade) {
                    const detail = costDetails.byGrade[grade];
                    logMessage += `  - ${grade} 등급: ${detail.books}개 x ${detail.price}G = ${detail.cost}G\n`;
                  }
                  
                  console.log(logMessage);
                } else {
                  console.warn(`각인서 ${engravingName} 필요한 책 수량이 0입니다.`);
                }
              } else {
                console.warn(`각인서 ${engravingName} 가격 조회 실패 또는 가격 정보 없음`);
              }
            }
          } catch (error) {
            console.error(`각인서 API 사용 중 오류:`, error);
            // 오류 발생시 기본 방식으로 빠져나감
          }
        }
      } catch (error) {
        console.error(`각인서 '${item.item}' 처리 중 오류:`, error);
      }
      
      completedRequests++;
      // API 요청 전체 진행률 로그
      if (completedRequests % 3 === 0 || completedRequests === items.length) {
        console.log(`각인서 가격 처리 진행률: ${completedRequests}/${items.length} (${Math.round(completedRequests/items.length*100)}%)`);
      }
      
      // API 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  
  /**
   * 각인서 필요 수량 계산
   * @param {string} fromGrade - 시작 등급 (예: legendary, relic)
   * @param {number} fromLevel - 시작 레벨 (0-4)
   * @param {string} toGrade - 목표 등급 (예: legendary, relic)
   * @param {number} toLevel - 목표 레벨 (0-4)
   * @returns {number} 필요한 각인서 책 수량
   */
  function calculateDetailedEngravingBooks(fromGrade, fromLevel, toGrade, toLevel) {
    // 등급 순서
    const gradeOrder = ['영웅', '전설', '유물'];
    
    // 등급 인덱스
    const fromGradeIndex = gradeOrder.indexOf(fromGrade);
    const toGradeIndex = gradeOrder.indexOf(toGrade);
    
    // 결과 객체 초기화
    const result = {
      totalBooks: 0,
      byGrade: {} // 각 등급별 필요 책 수량
    };
    
    // 유효한 등급 확인
    if (fromGradeIndex === -1 || toGradeIndex === -1) {
      console.error('유효하지 않은 등급입니다:', fromGrade, toGrade);
      return 0;
    }
    
    // 레벨 확인 (0~4 사이)
    if (fromLevel < 0 || fromLevel > 4 || toLevel < 0 || toLevel > 4) {
      console.error('유효하지 않은 레벨입니다:', fromLevel, toLevel);
      return 0;
    }
    
    // 상향 조건 확인
    if (fromGradeIndex > toGradeIndex || (fromGradeIndex === toGradeIndex && fromLevel >= toLevel)) {
      console.error('상향 조건이 충족되지 않습니다:', fromGrade, fromLevel, '->', toGrade, toLevel);
      return 0;
    }
    
     // 같은 등급 내 레벨 업그레이드
    if (fromGradeIndex === toGradeIndex) {
      const booksNeeded = (toLevel - fromLevel) * 5;
      result.totalBooks = booksNeeded;
      result.byGrade[fromGrade] = booksNeeded;
    } else {
      // 시작 등급에서 남은 레벨 채우기
      const booksForFromGrade = (4 - fromLevel) * 5;
      result.totalBooks += booksForFromGrade;
      result.byGrade[fromGrade] = booksForFromGrade;
      
      // 중간 등급들
      for (let i = fromGradeIndex + 1; i < toGradeIndex; i++) {
        const grade = gradeOrder[i];
        result.byGrade[grade] = 20; // 한 등급 전체 (0->4)는 20장
        result.totalBooks += 20;
      }
      
      // 목표 등급
      const booksForToGrade = toLevel * 5;
      result.totalBooks += booksForToGrade;
      result.byGrade[toGrade] = booksForToGrade;
    }
    
    return result;
  }
  
  /**
   * 데이터 테이블에 골드 정보 추가
   * @param {Array} data - 골드 정보가 추가된 데이터
   */
  function updateDataTableWithGoldInfo(data) {
    // 테이블 요소 선택
    const table = document.querySelector('.data-table');
    if (!table) {
      console.error('데이터 테이블을 찾을 수 없습니다.');
      return;
    }
    
    // 테이블 헤더에 골드 정보 컬럼 추가
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      // 기존 골드 헤더 확인
      let goldHeader = headerRow.querySelector('.gold-cost-header');
      
      // 없으면 추가
      if (!goldHeader) {
        goldHeader = document.createElement('th');
        goldHeader.className = 'gold-cost-header';
        goldHeader.textContent = '골드 소요량';
        headerRow.appendChild(goldHeader);
      }
    }
    
    // 테이블 본문의 각 행에 골드 정보 추가
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach((row, index) => {
      const item = data[index];
      if (!item) return;
      
      // 기존 골드 정보 확인
      let goldCell = row.querySelector('.gold-cost-cell');
      
      // 없으면 추가
      if (!goldCell) {
        goldCell = document.createElement('td');
        goldCell.className = 'gold-cost-cell';
        row.appendChild(goldCell);
      }
      
      // 골드 소요량 정보가 있는 경우
      if (item.goldCost) {
        // 각인서의 경우 책 수량도 표시
        if (item.type === 'engraving' && item.engravingBooks) {
          goldCell.innerHTML = `<span class="gold-value">${item.goldCost.toLocaleString()}G</span> <span class="book-count">(${item.engravingBooks}개)</span>`;
        } else {
          goldCell.innerHTML = `<span class="gold-value">${item.goldCost.toLocaleString()}G</span>`;
        }
        goldCell.style.color = '#F9A825'; // 골드 색상
        goldCell.style.fontWeight = 'bold';
      } else {
        goldCell.textContent = '-';
        goldCell.style.color = '#999';
      }
    });
    
    // 골드 표시 스타일 추가
    addGoldColumnStyle();
  }
  
  /**
   * 골드 정보 표시를 위한 CSS 스타일 추가
   */
  function addGoldColumnStyle() {
    // 이미 스타일이 있는지 확인
    if (document.getElementById('gold-column-style')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'gold-column-style';
    styleElement.textContent = `
      .gold-cost-header, .gold-cost-cell {
        text-align: right;
        padding-right: 15px;
      }
      
      .gold-value {
        position: relative;
      }
      
      .gold-value::before {
        content: '';
        display: inline-block;
        width: 12px;
        height: 12px;
        background-color: #F9A825;
        border-radius: 50%;
        margin-right: 4px;
        vertical-align: middle;
      }
      
      .book-count {
        font-size: 0.9em;
        color: #4CAF50;
        margin-left: 4px;
        font-weight: normal;
      }
    `;
    
    document.head.appendChild(styleElement);
  }

  /**
   * API 키 업데이트 메시지 리스너 설정
   */
  function setupApiKeyUpdateListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'apiKeyUpdated' && request.apiKey) {
        console.log('API 키 업데이트 메시지 수신:', request.apiKey.substring(0, 3) + '...');
        
        // API 상태 업데이트
        setTimeout(() => updateApiStatusSummary(), 1000);
        
        // 데이터 테이블 업데이트 (필요 시)
        if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.APIManager) {
          const processedData = DataManager.processedData;
          if (processedData && processedData.length > 0) {
            window.LopecScanner.API.APIManager.updateDataTableWithGoldInfo(processedData);
          }
        }
      }
    });
  }

  /**
   * 초기화 함수
   */
  function initialize() {
    // API 키 업데이트 메시지 리스너 설정
    setupApiKeyUpdateListener();
    
    // API 상태 자동 업데이트 시도
    setTimeout(() => updateApiStatusSummary(), 1000);
    
    console.log('APIStatus 모듈 초기화됨');
  }

  // 공개 API
  return {
    initialize,
    updateApiStatusSummary,
    fetchGoldData,
    updateDataTableWithGoldInfo
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', APIStatus.initialize);

// 모듈을 전역 객체에 노출 (기존 코드와의 호환성을 위해)
window.APIStatus = APIStatus;

// 모듈 내보내기
export default APIStatus;
