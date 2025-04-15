// API 캠시 저장소 (전역 변수)
const API_CACHE = {
  gems: {}, // 보석 가격 캐싱 (예: '9레벨 겁화': 785000)
  lastUpdate: {}, // 마지막 업데이트 시간 (캠시 유효성 확인용)
};

/**
 * API 상태 관리 모듈
 * API 상태 업데이트 및 표시를 담당합니다.
 */

// API 관련 상수 정의
const API_CONFIG = {
  baseUrl: "https://developer-lostark.game.onstove.com",
  headers: {
    "content-type": "application/json;charset=UTF-8",
    "accept": "application/json",
  },
  endpoints: {
    auctionOptions: "/auctions/options",
    auctionItems: "/auctions/items", // 경매장 아이템 검색 (장신구, 보석 등)
    marketItems: "/markets/items",   // 거래소 아이템 검색 (각인서 등)
  },
  // 아이템 유형별 카테고리 코드
  categoryCodes: {
    // 경매장 카테고리
    auction: {
      accessory: 200000,  // 장신구 (Code: 200000, CodeName: 장신구)
      gem: 210000,       // 보석 (Code: 210000, CodeName: 보석)
    },
    // 거래소 카테고리
    market: {
      engraving: 40000,   // 각인서 (Code: 40000, CodeName: 각인서)
    }
  },
  // 아이템 등급
  itemGrades: {
    legendary: "전설", // 전설
    relic: "유물",     // 유물
    ancient: "고대",   // 고대
    epic: "영웅"       // 영웅
  }
};

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
      // 현재 표시된 데이터 가져오기
      const filteredData = DataManager.processedData;
      
      if (!filteredData || filteredData.length === 0) {
        alert('표시할 데이터가 없습니다.');
        loadingOverlay.remove();
        return;
      }
      
      // 여기에 API 요청 구현
      console.log('골드 데이터 요청 시작...');
      console.log('처리할 데이터 항목 수:', filteredData.length);
      
      // 실제 API 호출 로직을 사용할지 가짜 데이터를 사용할지 결정
      let useRealApi = true; // 실제 API 호출 사용
      
      if (useRealApi) {
        // 실제 API 호출
        await fetchRealGoldData(filteredData);
      } else {
        // 가짜 데이터 생성 (테스트용)
        await mockGoldDataFetch(filteredData);
      }
      
      // 데이터 테이블 업데이트
      updateDataTableWithGoldInfo(filteredData);
      
      alert('골드 데이터를 성공적으로 가져왔습니다!');
    } catch (error) {
      console.error('골드 데이터 가져오기 오류:', error);
      alert('골드 데이터를 가져오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 로딩 오버레이 제거
      loadingOverlay.remove();
    }
  }
  
  /**
   * 가짜 골드 데이터 생성 (개발용)
   * @param {Array} items - 아이템 데이터 배열
   */
  async function mockGoldDataFetch(items) {
    return new Promise(resolve => {
      // 1초 대기하여 로딩 상태 테스트
      setTimeout(() => {
        // 각 아이템에 가짜 골드 정보 추가
        items.forEach(item => {
          // difference가 양수인 경우에만 골드 정보 추가
          if (item.difference > 0) {
            // 랜덤 골드 값 생성 (100 ~ 10000)
            const goldCost = Math.floor(Math.random() * 9900) + 100;
            item.goldCost = goldCost;
          }
        });
        
        resolve();
      }, 1000);
    });
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
    return item.type === 'accessory';
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
    return item.type === 'engraving';
  }
  
  /**
   * 장신구 아이템 처리
   * @param {Array} items - 장신구 아이템 배열
   * @param {string} apiKey - API 키
   */
  async function processAccessoryItems(items, apiKey) {
    // 경매장 API로 장신구 가격 조회
    const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.auctionItems;
    
    for (const item of items) {
      try {
        // API 요청 작성
        const requestBody = {
          ItemLevelMin: 0,
          ItemLevelMax: 0,
          ItemGradeQuality: null,
          ItemName: item.item, // 아이템 이름
          CategoryCode: API_CONFIG.categoryCodes.auction.accessory, // 장신구 카테고리
          Sort: "BIDSTART_PRICE", // 가격 순 정렬
          SortCondition: "ASC", // 오름차순
          PageNo: 1
        };
        
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
            item.goldCost = lowestPrice;
            console.log(`장신구 '${item.item}' 가격 조회 성공:`, lowestPrice);
          }
        } else {
          console.error(`장신구 이름 '${item.item}' 조회 실패:`, response.status);
        }
      } catch (error) {
        console.error(`장신구 '${item.item}' 처리 중 오류:`, error);
      }
      
      // API 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 200));
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
    
    // 캠시 유효 시간 (6시간, 밀리초 단위)
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
          item.fromCache = true; // 캐시에서 가져왔음을 표시
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
            
            // 캠시에 저장
            API_CACHE.gems[cacheKey] = lowestPrice;
            API_CACHE.lastUpdate[cacheKey] = now;
            console.log(`캐시 업데이트: ${cacheKey} = ${lowestPrice}`);
            
            // 아이템에 가격 설정
            item.goldCost = lowestPrice;
            console.log(`보석 '${searchGemName}' 가격 조회 성공:`, lowestPrice);
            
            // localStorage에도 캐시 저장 (세션 간 유지)
            try {
              // 현재 캐시 로드
              const savedCache = localStorage.getItem('lopecScanner_gemCache');
              let gemCache = savedCache ? JSON.parse(savedCache) : { gems: {}, lastUpdate: {} };
              
              // 새 데이터 추가
              gemCache.gems[cacheKey] = lowestPrice;
              gemCache.lastUpdate[cacheKey] = now;
              
              // 다시 저장
              localStorage.setItem('lopecScanner_gemCache', JSON.stringify(gemCache));
            } catch (e) {
              console.warn('캐시를 localStorage에 저장하는 데 실패했습니다:', e);
            }
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
    // 거래소 API로 각인서 가격 조회
    const endpoint = API_CONFIG.baseUrl + API_CONFIG.endpoints.marketItems;
    
    for (const item of items) {
      try {
        // API 요청 작성
        const requestBody = {
          Sort: "GRADE",
          CategoryCode: API_CONFIG.categoryCodes.market.engraving, // 각인서 카테고리
          ItemName: item.item, // 각인서 이름
          ItemGrade: API_CONFIG.itemGrades.legendary, // 전설 각인서 기본
          SortCondition: "ASC", // 오름차순
          PageNo: 1
        };
        
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
            const lowestPrice = data.Items[0].CurrentMinPrice;
            item.goldCost = lowestPrice;
            console.log(`각인서 '${item.item}' 가격 조회 성공:`, lowestPrice);
          }
        } else {
          console.error(`각인서 이름 '${item.item}' 조회 실패:`, response.status);
        }
      } catch (error) {
        console.error(`각인서 '${item.item}' 처리 중 오류:`, error);
      }
      
      // API 요청 간 지연
      await new Promise(resolve => setTimeout(resolve, 200));
    }
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
        // 캐시에서 가져온 값인지 표시
        if (item.fromCache) {
          goldCell.innerHTML = `<span class="gold-value cached">${item.goldCost.toLocaleString()}G</span><span class="cache-indicator" title="캐시에서 가져온 값">💾</span>`;
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
      
      .cache-indicator {
        display: inline-block;
        font-size: 14px;
        margin-left: 4px;
        color: #0277BD;
        cursor: help;
      }
      
      .gold-value.cached {
        border-bottom: 1px dotted #0277BD;
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
    // 이전 세션 로드
    try {
      const savedCache = localStorage.getItem('lopecScanner_gemCache');
      if (savedCache) {
        const gemCache = JSON.parse(savedCache);
        // 유효 기간이 지나지 않은 아이템만 로드 (기본 6시간)
        const now = Date.now();
        const CACHE_TTL = 6 * 60 * 60 * 1000;
        
        // 유효한 아이템만 유지
        let cacheCount = 0;
        if (gemCache.gems && gemCache.lastUpdate) {
          Object.keys(gemCache.gems).forEach(key => {
            const lastUpdate = gemCache.lastUpdate[key] || 0;
            if ((now - lastUpdate) < CACHE_TTL) {
              API_CACHE.gems[key] = gemCache.gems[key];
              API_CACHE.lastUpdate[key] = lastUpdate;
              cacheCount++;
            }
          });
        }
        
        console.log(`이전 세션의 보석 캐시 ${cacheCount}개 로드됨`);
      }
    } catch (e) {
      console.warn('이전 캐시시 로드 중 오류:', e);
    }
    
    // API 키 업데이트 메시지 리스너 설정
    setupApiKeyUpdateListener();
    
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
