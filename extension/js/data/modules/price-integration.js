/**
 * 가격 통합 모듈
 * 로펙 시뮬레이터에 가격 검색 기능을 통합합니다.
 */

// 가격 통합 모듈
const PriceIntegration = (function() {
  // 초기화 상태
  let initialized = false;
  
  /**
   * 필수 모듈 로드 확인
   * @returns {boolean} 모듈 로드 상태
   */
  function checkDependencies() {
    return (
      typeof window.LopecScanner !== 'undefined' &&
      typeof window.LopecScanner.API !== 'undefined'
    );
  }
  
  /**
   * UI에 가격 표시 영역 추가
   */
  function addPriceDisplayToUI() {
    // 가격 표시할 컨테이너 찾기 (예: 점수 표시 영역 옆)
    const scoreContainer = document.querySelector('.score-display') || 
                          document.querySelector('.total-score') ||
                          document.querySelector('.main-content');
    
    if (!scoreContainer) {
      console.warn('[가격 통합] 가격 정보를 표시할 컨테이너를 찾을 수 없습니다.');
      return;
    }
    
    // 가격 정보 컨테이너 생성
    const priceContainer = document.createElement('div');
    priceContainer.id = 'price-info-container';
    priceContainer.className = 'price-display-container';
    
    // 기본 컨텐츠 추가
    priceContainer.innerHTML = `
      <div class="price-display-header">
        <h3>골드 소요 정보</h3>
        <button id="refresh-price-info" class="refresh-button" title="가격 정보 새로고침">↻</button>
      </div>
      <div id="price-display-content" class="price-display-content">
        <p class="loading-text">가격 정보 로드 중...</p>
      </div>
      <div class="price-api-info">
        <button id="setup-api-key" class="api-settings-button">API 키 설정</button>
      </div>
    `;
    
    // 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .price-display-container {
        margin: 10px 0;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        background-color: #f9f9f9;
      }
      .price-display-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      .price-display-header h3 {
        margin: 0;
        font-size: 16px;
      }
      .refresh-button {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #555;
      }
      .price-display-content {
        font-size: 14px;
      }
      .price-item {
        display: flex;
        justify-content: space-between;
        margin: 5px 0;
      }
      .price-category {
        font-weight: bold;
        margin-top: 10px;
        border-bottom: 1px dashed #eee;
        padding-bottom: 3px;
      }
      .price-label {
        color: #555;
      }
      .price-value {
        font-weight: bold;
        color: #F9A825;
      }
      .price-sum {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        padding-top: 5px;
        border-top: 1px solid #ddd;
        font-weight: bold;
      }
      .loading-text {
        color: #777;
        text-align: center;
        font-style: italic;
      }
      .price-error {
        color: #F44336;
        text-align: center;
      }
      .price-api-info {
        margin-top: 10px;
        font-size: 12px;
        color: #777;
        text-align: center;
      }
      .api-settings-button {
        background: #2196F3;
        color: #fff;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      .api-settings-button:hover {
        background: #1976D2;
      }
      .api-key-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
      }
      .api-modal-content {
        background: #fff;
        max-width: 500px;
        margin: 100px auto;
        padding: 20px;
        border-radius: 5px;
      }
      .api-input-container {
        margin: 10px 0;
      }
      .api-input-container input {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 3px;
      }
      .api-button-container {
        display: flex;
        justify-content: flex-end;
      }
      .api-save-button {
        background: #4CAF50;
        color: #fff;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        margin-left: 10px;
        cursor: pointer;
      }
      .api-cancel-button {
        background: #F44336;
        color: #fff;
        border: none;
        border-radius: 3px;
        padding: 5px 10px;
        cursor: pointer;
      }
    `;
    
    // 스타일과 컨테이너를 DOM에 추가
    document.head.appendChild(style);
    
    // 적절한 위치에 삽입
    if (scoreContainer.nextSibling) {
      scoreContainer.parentNode.insertBefore(priceContainer, scoreContainer.nextSibling);
    } else {
      scoreContainer.parentNode.appendChild(priceContainer);
    }
    
    // API 키 모달 추가
    const apiKeyModal = document.createElement('div');
    apiKeyModal.className = 'api-key-modal';
    apiKeyModal.innerHTML = `
      <div class="api-modal-content">
        <h3>로스트아크 API 키 설정</h3>
        <p>로스트아크 개발자 포털에서 발급받은 API 키를 입력해주세요.</p>
        <div class="api-input-container">
          <input type="text" id="api-key-input" placeholder="API 키 입력" />
        </div>
        <div class="api-button-container">
          <button id="api-cancel-button" class="api-cancel-button">취소</button>
          <button id="api-save-button" class="api-save-button">저장</button>
        </div>
      </div>
    `;
    document.body.appendChild(apiKeyModal);
    
    // 이벤트 리스너 추가
    const refreshButton = document.getElementById('refresh-price-info');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        updatePriceDisplay();
      });
    }
    
    // API 키 설정 버튼
    const setupApiKeyButton = document.getElementById('setup-api-key');
    if (setupApiKeyButton) {
      setupApiKeyButton.addEventListener('click', () => {
        // 기존에 저장된 API 키 가져와서 입력란에 표시
        if (window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.ApiKeyManager) {
          window.LopecScanner.API.ApiKeyManager.getApiKey().then(apiKey => {
            const apiKeyInput = document.getElementById('api-key-input');
            if (apiKeyInput && apiKey) {
              apiKeyInput.value = apiKey;
            }
          });
        }
        
        // 모달 표시
        const apiKeyModal = document.querySelector('.api-key-modal');
        if (apiKeyModal) {
          apiKeyModal.style.display = 'block';
        }
      });
    }
    
    // 모달 닫기 버튼
    const apiCancelButton = document.getElementById('api-cancel-button');
    if (apiCancelButton) {
      apiCancelButton.addEventListener('click', () => {
        const apiKeyModal = document.querySelector('.api-key-modal');
        if (apiKeyModal) {
          apiKeyModal.style.display = 'none';
        }
      });
    }
    
    // API 키 저장 버튼
    const apiSaveButton = document.getElementById('api-save-button');
    if (apiSaveButton) {
      apiSaveButton.addEventListener('click', () => {
        // API 키 저장
        const apiKeyInput = document.getElementById('api-key-input');
        if (apiKeyInput && window.LopecScanner && window.LopecScanner.API && window.LopecScanner.API.ApiKeyManager) {
          const apiKey = apiKeyInput.value.trim();
          if (apiKey) {
            window.LopecScanner.API.ApiKeyManager.saveApiKey(apiKey).then(success => {
              if (success) {
                alert('API 키가 저장되었습니다.');
                
                // 모달 닫기
                const apiKeyModal = document.querySelector('.api-key-modal');
                if (apiKeyModal) {
                  apiKeyModal.style.display = 'none';
                }
                
                // 가격 표시 업데이트
                updatePriceDisplay();
              } else {
                alert('API 키 저장에 실패했습니다.');
              }
            });
          } else {
            alert('API 키를 입력해주세요.');
          }
        }
      });
    }
  }
  
  /**
   * 현재 설정된 옵션에서 가격 정보 수집
   * @returns {Promise<Object>} 가격 정보
   */
  async function collectPriceInfo() {
    // 가격 정보 객체
    const priceInfo = {
      gems: [],       // 보석 정보
      engravings: [], // 각인 정보
      accessories: [], // 장신구 정보
      totalGold: 0    // 총 골드 비용
    };
    
    try {
      // API 모듈 사용 가능한지 확인
      if (!window.LopecScanner || !window.LopecScanner.API) {
        console.warn('[가격 통합] API 모듈을 가져올 수 없습니다.');
        return priceInfo;
      }
      
      // API 키 체크
      const apiKeyExists = await window.LopecScanner.API.ApiKeyManager.getApiKey();
      if (!apiKeyExists) {
        console.warn('[가격 통합] API 키가 설정되지 않았습니다.');
        return priceInfo;
      }
      
      // 시뮬레이터에서 현재 옵션 데이터 가져오기
      const currentData = window.LopecScanner.DataManager ? 
                      window.LopecScanner.DataManager.processedData : [];
      
      if (!currentData || currentData.length === 0) {
        return priceInfo; // 데이터 없음
      }
      
      // 데이터 순회하며 가격 정보 수집
      for (const item of currentData) {
        if (!item.difference || item.difference <= 0) continue; // 변화 없는 항목 무시
        
        let itemPrice = 0;
        
        // 아이템 유형에 따라 가격 검색
        if (item.type === 'gem') {
          // 보석 가격 검색
          // item에서 레벨과 보석 타입 정보 추출
          let gemLevel = 0;
          let gemType = "";
          
          // 레벨 추출
          if (item.from && typeof item.from === 'string') {
            const levelMatch = item.from.match(/(\d+)\uB808\uBCA8/);
            if (levelMatch && levelMatch[1]) {
              gemLevel = parseInt(levelMatch[1]);
            }
          }
          
          // gemType 추출
          if (item.gemType) {
            // 직접 필드가 있는 경우
            gemType = item.gemType;
          } else if (item.item && typeof item.item === 'string') {
            // 디버그 로그 추가
            console.log(`보석 아이템 문자열:`, item.item);
            
            // 이름에서 보석 타입(겁화, 멸화, 홍염, 작열) 추출 시도
            if (item.item.includes('겁화')) {
              gemType = '겁화';
            } else if (item.item.includes('멸화')) {
              gemType = '멸화';
            } else if (item.item.includes('홍염')) {
              gemType = '홍염';
            } else if (item.item.includes('작열')) {
              gemType = '작열';
            }
            
            // 정규식 시도 - 작열, 멸화, 겁화, 홍염
            if (!gemType) {
              const allTypeRegex = /(멸화|겁화|홍염|작열)/;
              const typeMatch = item.item.match(allTypeRegex);
              if (typeMatch && typeMatch[1]) {
                gemType = typeMatch[1];
                console.log(`[가격 통합] 정규식으로 보석 타입 추출: ${gemType}`);
              }
            }
          }
          
          // 유효한 레벨과 타입이 있는 경우에만 검색
          if (gemLevel > 0 && gemType) {
            console.log(`[가격 통합] 보석 가격 검색: ${gemLevel}레벨 ${gemType}`);
            
            // 같은 레벨/타입의 보석이 이미 검색되었는지 확인(캐싱)
            const cacheKey = `gem_${gemLevel}_${gemType}`;
            let priceResult = null;
            
            // 캐싱된 결과가 있는지 확인
            if (priceInfo._cache && priceInfo._cache[cacheKey]) {
              priceResult = priceInfo._cache[cacheKey];
              console.log(`[가격 통합] 캐싱된 보석 가격 사용: ${gemLevel}레벨 ${gemType}`);
            } else {
              try {
                // API로 가격 검색 - 고정 형식 "N레벨 타입"
                console.log(`[가격 통합] 보석 검색 시간: 레벨=${gemLevel}, 타입=${gemType}`);
                
                // 실제 검색어는 함수 내부에서 "N레벨 타입" 형식으로 고정
                priceResult = await window.LopecScanner.API.GemSearch.searchGem(gemLevel, gemType);
                
                // 결과 캐싱 추가
                if (priceResult) {
                  if (!priceInfo._cache) priceInfo._cache = {};
                  priceInfo._cache[cacheKey] = priceResult;
                }
              } catch (error) {
                console.error(`[가격 통합] 보석 가격 검색 오류:`, error);
              }
            }
            
            if (priceResult && priceResult.price) {
              itemPrice = priceResult.price;
              
              // 이미 같은 보석이 추가되었는지 확인
              const existingGem = priceInfo.gems.find(g => 
                g.level === gemLevel && g.type === gemType
              );
              
              if (!existingGem) {
                priceInfo.gems.push({
                  name: `${gemType} ${gemLevel}레벨`,
                  level: gemLevel,
                  type: gemType,
                  price: itemPrice,
                  score: item.difference
                });
              }
            }
          }
        } 
        else if (item.type === 'engraving') {
          // 각인서 가격 검색
          let engravingName = "";
          let engravingGrade = "유물";
          
          // 각인 이름 추출
          if (item.name) {
            engravingName = item.name;
          } else if (item.item && typeof item.item === 'string') {
            engravingName = item.item.replace(/\s*(\uc804\uc124|\uc601\uc6c5|\ud76c\uadc0|\uc720\ubb3c|\uace0\ub300)\s*/, '').trim();
          }
          
          // 전설/영웅/희귀/유물/고대 표기 추출
          if (item.grade) {
            engravingGrade = item.grade;
          } else if (item.item && typeof item.item === 'string') {
            const gradeMatch = item.item.match(/(\uc804\uc124|\uc601\uc6c5|\ud76c\uadc0|\uc720\ubb3c|\uace0\ub300)/);
            if (gradeMatch && gradeMatch[1]) {
              engravingGrade = gradeMatch[1];
            }
          }
          
          if (engravingName) {
            console.log(`[가격 통합] 각인서 가격 검색: ${engravingName} (${engravingGrade})`);
            try {
              // API로 가격 검색
              const priceResult = await window.LopecScanner.API.EngravingSearch.searchEngraving(
                engravingName, engravingGrade
              );
              
              if (priceResult && priceResult.price) {
                itemPrice = priceResult.price;
                
                // 구조화된 데이터 사용 시도
              const enhancedData = window.DataManager && window.DataManager.structuredData;
              let enhancedLevel = 0;
              
              if (enhancedData && enhancedData.engraving) {
                // 구조화된 데이터에서 레벨 가져오기 시도
                const matchedItem = enhancedData.engraving.find(eng => 
                  eng.engravingName === engravingName && eng.toGrade === engravingGrade
                );
                
                if (matchedItem && matchedItem.toLevel > 0) {
                  enhancedLevel = matchedItem.toLevel;
                  console.log(`구조화된 데이터에서 각인서 레벨 찾음: ${engravingName} ${engravingGrade} Lv.${enhancedLevel}`);
                }
              }
              
              // 각인서 레벨 추출
              let level = enhancedLevel || 1;
              if (!enhancedLevel) {
                if (item.level) {
                  level = parseInt(item.level);
                } else if (item.item && typeof item.item === 'string') {
                  const lvMatch = item.item.match(/Lv\.(\d+)/);
                  if (lvMatch && lvMatch[1]) {
                    level = parseInt(lvMatch[1]);
                  }
                }
              }
                
                // 필요 개수 계산 (레벨당 5장)
                const count = level * 5;
                const totalPrice = itemPrice * count;
                
                priceInfo.engravings.push({
                  name: `${engravingName} ${engravingGrade}`,
                  grade: engravingGrade,
                  price: itemPrice,
                  count: count,
                  totalPrice: totalPrice,
                  score: item.difference
                });
                
                // 총 가격에는 필요한 개수를 곱한 수를 추가
                itemPrice = totalPrice;
              }
            } catch (error) {
              console.error(`[가격 통합] 각인서 가격 검색 오류:`, error);
            }
          }
        }
        else if (item.type && item.type.includes('장신구')) {
          // 장신구 가격 검색
          let accessoryType = "";
          let combinationType = "상상";
          let classType = "딜러";
          
          // 장신구 타입 추출 (목걸이, 귀걸이, 반지)
          if (item.accessoryType) {
            accessoryType = item.accessoryType;
          } else if (item.item && typeof item.item === 'string') {
            if (item.item.includes('목걸이')) accessoryType = '목걸이';
            else if (item.item.includes('귀걸이')) accessoryType = '귀걸이';
            else if (item.item.includes('반지')) accessoryType = '반지';
          }
          
          // 클래스 타입 추출 (딜러 또는 서포터)
          if (item.type.includes('딜러')) classType = '딜러';
          else if (item.type.includes('서포터')) classType = '서포터';
          
          // 옵션 조합 타입 추출
          if (item.combo) {
            combinationType = item.combo;
          } else if (item.to && typeof item.to === 'string') {
            const comboMatch = item.to.match(/([\uc0c1\uc911\ud558\ubb34]{2})\s*\uc870\ud569/);
            if (comboMatch && comboMatch[1]) {
              combinationType = comboMatch[1];
            }
          }
          
          if (accessoryType) {
            console.log(`[가격 통합] 장신구 가격 검색: ${accessoryType} (${classType}, ${combinationType})`);
            try {
              // API로 가격 검색
              const priceResult = await window.LopecScanner.API.AccessorySearch.searchByStringType(
                classType, accessoryType, combinationType, [4.0, 4.0] // 기본 옵션 값 (API에서 실제 사용 시 조정 필요)
              );
              
              if (priceResult && priceResult.price) {
                itemPrice = priceResult.price;
                
                priceInfo.accessories.push({
                  name: `${accessoryType} (${combinationType})`,
                  price: itemPrice,
                  quality: priceResult.quality || 0,
                  score: item.difference
                });
              }
            } catch (error) {
              console.error(`[가격 통합] 장신구 가격 검색 오류:`, error);
            }
          }
        }
        
        // 총 가격에 추가
        priceInfo.totalGold += itemPrice;
      }
      
      return priceInfo;
      
    } catch (error) {
      console.error('[가격 통합] 가격 정보 수집 오류:', error);
      return priceInfo;
    }
  }
  
  /**
   * 가격 표시 업데이트
   */
  async function updatePriceDisplay() {
    const priceContent = document.getElementById('price-display-content');
    if (!priceContent) return;
    
    // 로딩 메시지 표시
    priceContent.innerHTML = '<p class="loading-text">가격 정보 로드 중...</p>';
    
    try {
      // 필수 모듈 확인
      if (!checkDependencies()) {
        priceContent.innerHTML = '<p class="price-error">가격 모듈이 로드되지 않았습니다.</p>';
        return;
      }
      
      // API 키 확인
      const apiKey = await window.LopecScanner.API.ApiKeyManager.getApiKey();
      if (!apiKey) {
        priceContent.innerHTML = '<p class="price-error">API 키가 설정되지 않았습니다.<br>"API 키 설정" 버튼을 클릭하여 설정해주세요.</p>';
        return;
      }
      
      // 가격 정보 수집
      const priceInfo = await collectPriceInfo();
      
      // 표시할 HTML 준비
      let html = '';
      
      // 보석 정보
      if (priceInfo.gems.length > 0) {
        html += '<div class="price-category">보석</div>';
        
        priceInfo.gems.forEach(gem => {
          html += `
            <div class="price-item">
              <span class="price-label">${gem.name}</span>
              <span class="price-value">${gem.price.toLocaleString()}G</span>
            </div>
          `;
        });
      }
      
      // 각인 정보
      if (priceInfo.engravings.length > 0) {
        html += '<div class="price-category">각인서</div>';
        
        priceInfo.engravings.forEach(engraving => {
          html += `
            <div class="price-item">
              <span class="price-label">${engraving.name} (${engraving.count}개)</span>
              <span class="price-value">${engraving.totalPrice.toLocaleString()}G</span>
            </div>
          `;
        });
      }
      
      // 장신구 정보
      if (priceInfo.accessories.length > 0) {
        html += '<div class="price-category">장신구</div>';
        
        priceInfo.accessories.forEach(accessory => {
          html += `
            <div class="price-item">
              <span class="price-label">${accessory.name}</span>
              <span class="price-value">${accessory.price.toLocaleString()}G</span>
            </div>
          `;
        });
      }
      
      // 총 비용
      html += `
        <div class="price-sum">
          <span class="price-label">총 골드 소요량</span>
          <span class="price-value">${priceInfo.totalGold.toLocaleString()}G</span>
        </div>
      `;
      
      // 정보가 없는 경우
      if (priceInfo.totalGold === 0) {
        html = '<p class="loading-text">현재 가격 정보가 없습니다.<br>옵션을 변경해 보세요.</p>';
      }
      
      // HTML 업데이트
      priceContent.innerHTML = html;
      
    } catch (error) {
      console.error('[가격 통합] 가격 표시 업데이트 오류:', error);
      priceContent.innerHTML = `<p class="price-error">가격 정보를 가져오는 중 오류가 발생했습니다.<br>${error.message}</p>`;
    }
  }
  
  /**
   * 옵션 변경 이벤트에 가격 업데이트 연결
   */
  function setupPriceUpdateEvents() {
    // 점수 표시 요소 (실제 페이지 구조에 맞게 수정 필요)
    const scoreElement = document.querySelector('.score-value') || 
                         document.querySelector('.total-score');
    
    if (!scoreElement) {
      console.warn('[가격 통합] 점수 표시 요소를 찾을 수 없습니다.');
      return;
    }
    
    // MutationObserver로 점수 변화 감지
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // 점수 변화 감지 시 가격 표시 업데이트
          updatePriceDisplay();
        }
      });
    });
    
    // DOM 변화 감시 시작
    observer.observe(scoreElement, {
      childList: true,
      characterData: true,
      subtree: true
    });
    
    // 추가로 모든 입력 요소 이벤트에도 연결
    const inputElements = [
      ...document.querySelectorAll('select'),
      ...document.querySelectorAll('input[type="range"]'),
      ...document.querySelectorAll('input[type="checkbox"]')
    ];
    
    inputElements.forEach(input => {
      input.addEventListener('change', () => {
        // 입력 변경 시 가격 표시 업데이트 (약간 지연)
        setTimeout(updatePriceDisplay, 300);
      });
    });
    
    // 버튼 클릭 이벤트도 감시 (특정 버튼 ID에 따라 수정 필요)
    const actionButtons = document.querySelectorAll('button');
    actionButtons.forEach(button => {
      button.addEventListener('click', () => {
        // 액션 버튼 클릭 후 가격 표시 업데이트 (약간 지연)
        setTimeout(updatePriceDisplay, 500);
      });
    });
  }

  // 공개 API
  return {
    updatePriceDisplay,
    
    // 초기화
    initialize: function() {
      console.log('[가격 통합] 모듈 초기화');
      
      // 중복 초기화 방지
      if (initialized) return;
      
      // UI에 가격 표시 영역 추가
      addPriceDisplayToUI();
      
      // 옵션 변경 이벤트 설정
      setupPriceUpdateEvents();
      
      // 초기 가격 정보 로드
      setTimeout(updatePriceDisplay, 1000);
      
      initialized = true;
    }
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', function() {
  // 가격 모듈이 로드된 후에 초기화 시도
  setTimeout(PriceIntegration.initialize, 1500);
});

// 전역 네임스페이스에 등록
if (window.LopecScanner) {
  window.LopecScanner.PriceIntegration = PriceIntegration;
} else {
  window.LopecScanner = {
    PriceIntegration: PriceIntegration
  };
}
