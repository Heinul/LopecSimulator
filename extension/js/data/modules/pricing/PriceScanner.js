/**
 * 가격 스캐너 모듈
 * 옵션 변경 시 골드 변동을 계산하고 표시합니다.
 */

// 가격 스캐너 모듈
const PriceScanner = (function() {
  // 현재 페이지의 옵션 요소 캐시
  let optionElements = {
    comboBoxes: [],
    sliders: [],
    checkboxes: []
  };
  
  // 최근 변경 감지 결과
  let latestPriceChanges = [];
  
  // MutationObserver 인스턴스
  let observer = null;
  
  /**
   * 페이지 스캔하여 옵션 요소 추출
   */
  function scanPage() {
    console.log('[스캐너] 페이지 스캔 시작');
    
    // 콤보박스 스캔 (select 요소)
    optionElements.comboBoxes = Array.from(document.querySelectorAll('select'));
    
    // 슬라이더 스캔 (input[type="range"])
    optionElements.sliders = Array.from(document.querySelectorAll('input[type="range"]'));
    
    // 체크박스 스캔 (input[type="checkbox"])
    optionElements.checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    
    console.log('[스캐너] 콤보박스:', optionElements.comboBoxes.length);
    console.log('[스캐너] 슬라이더:', optionElements.sliders.length);
    console.log('[스캐너] 체크박스:', optionElements.checkboxes.length);
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 점수 표시 요소 감시
    setupScoreObserver();
  }
  
  /**
   * 옵션 요소에 이벤트 리스너 설정
   */
  function setupEventListeners() {
    // 콤보박스 이벤트 리스너
    optionElements.comboBoxes.forEach(comboBox => {
      comboBox.addEventListener('change', (event) => {
        console.log('[옵션 변경]', comboBox.name || comboBox.id, ':', comboBox.value);
        
        // 점수 변화 감지
        setTimeout(detectScoreChange, 100, event.target);
      });
    });
    
    // 슬라이더 이벤트 리스너
    optionElements.sliders.forEach(slider => {
      slider.addEventListener('change', (event) => {
        console.log('[옵션 변경]', slider.name || slider.id, ':', slider.value);
        
        // 점수 변화 감지
        setTimeout(detectScoreChange, 100, event.target);
      });
    });
    
    // 체크박스 이벤트 리스너
    optionElements.checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (event) => {
        console.log('[옵션 변경]', checkbox.name || checkbox.id, ':', checkbox.checked);
        
        // 점수 변화 감지
        setTimeout(detectScoreChange, 100, event.target);
      });
    });
  }
  
  /**
   * 점수 표시 요소 변화 감시 설정
   */
  function setupScoreObserver() {
    // 점수 표시 요소 (실제 페이지 구조에 맞게 수정 필요)
    const scoreContainer = document.querySelector('.score-display') || document.querySelector('.total-score');
    
    // 선택자가 맞지 않으면 무시
    if (!scoreContainer) {
      console.warn('[스캐너] 점수 표시 요소를 찾을 수 없습니다. DOM 감시를 설정할 수 없습니다.');
      return;
    }
    
    // MutationObserver 설정
    observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          console.log('[점수 변화 감지]', scoreContainer.innerText);
        }
      });
    });
    
    // DOM 변화 감시 시작
    observer.observe(scoreContainer, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }
  
  /**
   * 점수 변화 감지 및 분석
   * @param {HTMLElement} changedElement - 변경된 요소
   */
  function detectScoreChange(changedElement) {
    // 점수 표시 요소 (실제 페이지 구조에 맞게 수정 필요)
    const scoreElement = document.querySelector('.score-value') || document.querySelector('.total-score');
    
    if (!scoreElement) {
      console.warn('[스캐너] 점수 표시 요소를 찾을 수 없습니다.');
      return;
    }
    
    // 현재 점수 가져오기
    const currentScore = parseFloat(scoreElement.innerText);
    
    // 점수 변화가 없으면 무시
    if (isNaN(currentScore)) {
      console.warn('[스캐너] 현재 점수를 숫자로 변환할 수 없습니다.');
      return;
    }
    
    // 변경된 요소 정보 저장
    const changeInfo = {
      element: changedElement,
      elementType: changedElement.tagName.toLowerCase(),
      elementName: changedElement.name || changedElement.id,
      value: changedElement.tagName.toLowerCase() === 'select' ? changedElement.value : 
             changedElement.type === 'checkbox' ? changedElement.checked : changedElement.value,
      score: currentScore,
      timestamp: new Date()
    };
    
    // 점수 변화 기록
    latestPriceChanges.push(changeInfo);
    
    // 필요 시 가격 계산 로직 추가
    analyzePriceChange(changeInfo);
  }
  
  /**
   * 가격 변화 분석
   * @param {Object} changeInfo - 변경 정보
   */
  async function analyzePriceChange(changeInfo) {
    // 최근 2개의 변경 사항만 비교
    if (latestPriceChanges.length < 2) {
      console.log('[스캐너] 첫 번째 점수 변경:', changeInfo.score);
      return;
    }
    
    // 최근 변경 사항
    const current = latestPriceChanges[latestPriceChanges.length - 1];
    const previous = latestPriceChanges[latestPriceChanges.length - 2];
    
    // 점수 차이 계산
    const scoreDifference = current.score - previous.score;
    
    // 변경 요소 정보
    const elementInfo = `${current.elementName || '알 수 없음'} (${current.elementType}): ${current.value}`;
    
    console.log(`[점수 변화] ${scoreDifference.toFixed(2)} (${previous.score} → ${current.score}) | 변경: ${elementInfo}`);
    
    // 골드 비용 계산 (요소 유형에 따라 다름)
    let goldCost = 0;
    
    try {
      // 요소의 속성에 따라 적절한 가격 검색 기능 사용
      if (changeInfo.elementName && changeInfo.elementName.includes('보석')) {
        // 보석 관련 옵션
        const gemType = extractGemType(changeInfo.elementName);
        const gemLevel = extractGemLevel(changeInfo.value);
        
        if (gemType && gemLevel) {
          goldCost = await PriceManager.getGemPrice(gemType, gemLevel);
        }
      } 
      else if (changeInfo.elementName && changeInfo.elementName.includes('각인')) {
        // 각인 관련 옵션
        const engravingName = extractEngravingName(changeInfo.elementName);
        const engravingGrade = extractEngravingGrade(changeInfo.value);
        
        if (engravingName && engravingGrade) {
          goldCost = await PriceManager.getEngravingPrice(engravingName, engravingGrade);
        }
      }
      else if (changeInfo.elementName && 
               (changeInfo.elementName.includes('악세서리') || 
                changeInfo.elementName.includes('목걸이') || 
                changeInfo.elementName.includes('귀걸이') || 
                changeInfo.elementName.includes('반지'))) {
        // 악세서리 관련 옵션
        const accessoryOptions = extractAccessoryOptions(changeInfo);
        
        if (accessoryOptions) {
          goldCost = await PriceManager.getAccessoryPrice(accessoryOptions);
        }
      }
      
      // 골드 비용이 계산된 경우 표시
      if (goldCost > 0) {
        console.log(`[골드 비용] ${goldCost.toLocaleString()}G | 점수 변화당 효율: ${(goldCost / Math.abs(scoreDifference)).toFixed(2)}G/점`);
        
        // 팝업으로 표시
        showPriceChangePopup({
          element: elementInfo,
          scoreDifference: scoreDifference,
          goldCost: goldCost
        });
      }
    } catch (error) {
      console.error('[가격 분석 오류]', error);
    }
  }
  
  /**
   * 보석 유형 추출
   * @param {string} elementName - 요소 이름
   * @returns {string|null} 보석 유형 (겁화, 작열, 멸화, 홍염)
   */
  function extractGemType(elementName) {
    if (elementName.includes('겁화')) return '겁화';
    if (elementName.includes('작열')) return '작열';
    if (elementName.includes('멸화')) return '멸화';
    if (elementName.includes('홍염')) return '홍염';
    return null;
  }
  
  /**
   * 보석 레벨 추출
   * @param {string} value - 요소 값
   * @returns {number|null} 보석 레벨
   */
  function extractGemLevel(value) {
    // 값에서 숫자만 추출
    const level = parseInt(value.replace(/[^0-9]/g, ''));
    return !isNaN(level) ? level : null;
  }
  
  /**
   * 각인 이름 추출
   * @param {string} elementName - 요소 이름
   * @returns {string|null} 각인 이름
   */
  function extractEngravingName(elementName) {
    // 요소 이름에서 각인 이름 추출 로직
    // 실제 구현은 페이지 구조에 따라 다를 수 있음
    const nameMatch = elementName.match(/각인_(.*)/);
    return nameMatch ? nameMatch[1] : null;
  }
  
  /**
   * 각인 등급 추출
   * @param {string} value - 요소 값
   * @returns {string|null} 각인 등급 (전설, 영웅, 희귀, 고급)
   */
  function extractEngravingGrade(value) {
    if (value.includes('전설')) return '전설';
    if (value.includes('영웅')) return '영웅';
    if (value.includes('희귀')) return '희귀';
    if (value.includes('고급')) return '고급';
    return null;
  }
  
  /**
   * 악세서리 옵션 추출
   * @param {Object} changeInfo - 변경 정보
   * @returns {Object|null} 악세서리 옵션 객체
   */
  function extractAccessoryOptions(changeInfo) {
    // 이 함수는 페이지의 실제 구조에 맞게 구현해야 함
    // 현재는 간단한 예시만 제공
    
    let type = null;
    
    // 악세서리 유형 확인
    if (changeInfo.elementName.includes('목걸이')) {
      type = '목걸이';
    } else if (changeInfo.elementName.includes('귀걸이')) {
      type = '귀걸이';
    } else if (changeInfo.elementName.includes('반지')) {
      type = '반지';
    } else {
      return null;
    }
    
    // 품질은 값에서 추출
    let quality = '중중'; // 기본값
    if (changeInfo.value.includes('상상')) quality = '상상';
    else if (changeInfo.value.includes('상중')) quality = '상중';
    else if (changeInfo.value.includes('상하')) quality = '상하';
    else if (changeInfo.value.includes('중중')) quality = '중중';
    else if (changeInfo.value.includes('중하')) quality = '중하';
    else if (changeInfo.value.includes('하하')) quality = '하하';
    
    // 기본 옵션 반환
    return {
      type: type,
      grade: '유물', // 기본값
      quality: quality,
      // 다른 필드는 페이지 구조에 따라 필요 시 추가
    };
  }
  
  /**
   * 가격 변화 팝업 표시
   * @param {Object} data - 변화 데이터
   */
  function showPriceChangePopup(data) {
    // 기존 팝업 제거
    const existingPopup = document.getElementById('price-change-popup');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    // 팝업 컨테이너 생성
    const popup = document.createElement('div');
    popup.id = 'price-change-popup';
    popup.className = 'price-change-popup';
    
    // 점수 변화에 따른 스타일 적용
    const changeClass = data.scoreDifference >= 0 ? 'positive-change' : 'negative-change';
    const changeSign = data.scoreDifference >= 0 ? '+' : '';
    
    // 팝업 내용 구성
    popup.innerHTML = `
      <div class="popup-header">
        <span class="popup-title">옵션 변경 정보</span>
        <span class="popup-close">&times;</span>
      </div>
      <div class="popup-body">
        <div class="change-item">
          <span class="change-label">변경 요소:</span>
          <span class="change-value">${data.element}</span>
        </div>
        <div class="change-item">
          <span class="change-label">점수 변화:</span>
          <span class="change-value ${changeClass}">${changeSign}${data.scoreDifference.toFixed(2)}</span>
        </div>
        <div class="change-item">
          <span class="change-label">필요 골드:</span>
          <span class="change-value gold-value">${data.goldCost.toLocaleString()}G</span>
        </div>
        <div class="change-item">
          <span class="change-label">골드 효율:</span>
          <span class="change-value">${(data.goldCost / Math.abs(data.scoreDifference)).toFixed(2)}G/점</span>
        </div>
      </div>
    `;
    
    // 팝업 스타일 적용
    popup.style.position = 'fixed';
    popup.style.bottom = '20px';
    popup.style.right = '20px';
    popup.style.backgroundColor = '#fff';
    popup.style.border = '1px solid #ddd';
    popup.style.borderRadius = '5px';
    popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    popup.style.zIndex = '9999';
    popup.style.width = '300px';
    popup.style.padding = '10px';
    popup.style.transition = 'all 0.3s ease';
    
    // 팝업 요소 스타일 적용
    const style = document.createElement('style');
    style.textContent = `
      .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      .popup-title {
        font-weight: bold;
      }
      .popup-close {
        cursor: pointer;
        font-size: 20px;
      }
      .change-item {
        margin: 5px 0;
        display: flex;
        justify-content: space-between;
      }
      .change-label {
        color: #666;
      }
      .positive-change {
        color: #4CAF50;
        font-weight: bold;
      }
      .negative-change {
        color: #F44336;
        font-weight: bold;
      }
      .gold-value {
        color: #F9A825;
        font-weight: bold;
      }
    `;
    
    // 스타일 및 팝업을 DOM에 추가
    document.head.appendChild(style);
    document.body.appendChild(popup);
    
    // 닫기 버튼 이벤트 리스너
    popup.querySelector('.popup-close').addEventListener('click', () => {
      popup.remove();
    });
    
    // 5초 후 자동 제거
    setTimeout(() => {
      if (document.body.contains(popup)) {
        popup.style.opacity = '0';
        setTimeout(() => popup.remove(), 300);
      }
    }, 5000);
  }
  
  /**
   * 자동 스캔 시작
   */
  function startAutoScan() {
    console.log('[스캐너] 자동 스캔 시작');
    
    // 페이지 스캔
    scanPage();
    
    // 10초마다 페이지 재스캔 (DOM 변경 감지를 위해)
    setInterval(() => {
      scanPage();
    }, 10000);
  }
  
  // 공개 API
  return {
    scanPage,
    startAutoScan,
    initialize: function() {
      console.log('PriceScanner 모듈 초기화됨');
      
      // DOM 완전히 로드된 후 자동 스캔 시작 
      if (document.readyState === 'complete') {
        startAutoScan();
      } else {
        window.addEventListener('load', startAutoScan);
      }
    }
  };
})();

// 모듈이 로드되면 자동으로 초기화
document.addEventListener('DOMContentLoaded', PriceScanner.initialize);
