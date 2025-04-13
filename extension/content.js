// 스캔 관련 전역 변수
let isScanning = false;
let originalValues = {};
let scanResults = {};
let totalScans = 0;
let completedScans = 0;
let currentScoreValue = 0;

// 오버레이 요소 생성
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'scanner-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  `;
  
  const message = document.createElement('div');
  message.id = 'scanner-message';
  message.style.cssText = `
    color: white;
    font-size: 24px;
    margin-bottom: 20px;
  `;
  message.textContent = '스캔 중... 페이지를 조작하지 마세요.';
  
  const progress = document.createElement('div');
  progress.id = 'scanner-progress';
  progress.style.cssText = `
    width: 80%;
    max-width: 500px;
    height: 30px;
    background-color: #333;
    border-radius: 5px;
  `;
  
  const progressBar = document.createElement('div');
  progressBar.id = 'scanner-progress-bar';
  progressBar.style.cssText = `
    width: 0%;
    height: 100%;
    background-color: #4CAF50;
    border-radius: 5px;
    text-align: center;
    line-height: 30px;
    color: white;
  `;
  progressBar.textContent = '0%';
  
  progress.appendChild(progressBar);
  overlay.appendChild(message);
  overlay.appendChild(progress);
  
  return overlay;
}

// 스코어 변동값 파싱 (예: +0.25 -> 0.25, -1.36 -> -1.36)
function parseScoreDifference(differenceElement) {
  if (!differenceElement) return 0;
  
  let className = differenceElement.className;
  let value = parseFloat(differenceElement.textContent);
  
  // 클래스에 따라 값의 부호 결정
  if (className.includes('decrease')) {
    return value; // 이미 negative 값
  } else if (className.includes('increase')) {
    return value; // 이미 positive 값
  }
  
  return 0; // 변화 없음 (zero)
}

// 현재 점수 값 가져오기
function getCurrentScore() {
  const specPointElement = document.querySelector('.spec-point');
  if (specPointElement) {
    const scoreText = specPointElement.textContent.replace(/[^0-9.]/g, '');
    return parseFloat(scoreText);
  }
  return 0;
}

// 점수 변동 확인
function getScoreDifference() {
  const differenceElement = document.querySelector('.tier-box .difference');
  return parseScoreDifference(differenceElement);
}

// 스캔을 위한 엘리먼트 준비
async function prepareElementsForScan() {
  // 장비 관련 엘리먼트
  const armorNameElements = document.querySelectorAll('.armor-name');
  const armorUpgradeElements = document.querySelectorAll('.armor-upgrade');
  
  // 보석 관련 엘리먼트
  const gemLevelElements = document.querySelectorAll('select[name="ArmoryGem Gems Level"]');
  
  // 현재 값들 저장 및 스캔 항목 준비
  armorNameElements.forEach((element, index) => {
    originalValues[`armor-name-${index}`] = element.value;
  });
  
  armorUpgradeElements.forEach((element, index) => {
    originalValues[`armor-upgrade-${index}`] = element.value;
  });
  
  gemLevelElements.forEach((element, index) => {
    originalValues[`gem-level-${index}`] = element.value;
  });
  
  // 전체 스캔 갯수 계산
  let scanCount = 0;
  
  // 장비 스캔 갯수 (armor-name에 따른 armor-upgrade 규칙 고려)
  for (let i = 0; i < armorNameElements.length; i++) {
    const currentValue = parseInt(armorNameElements[i].value);
    const maxValue = parseInt(armorNameElements[i].getAttribute('data-max') || 25);
    
    for (let newValue = currentValue + 1; newValue <= maxValue; newValue++) {
      scanCount++;
      
      // armor-name이 변경되면 armor-upgrade 옵션도 스캔
      if (i < armorUpgradeElements.length) {
        const currentUpgrade = parseInt(armorUpgradeElements[i].value);
        let maxUpgrade = 40;
        
        // armor-name 6 미만에서는 armor-upgrade 불가
        if (newValue < 6) {
          continue;
        }
        
        // armor-name 14 이상일 때만 armor-upgrade 21 이상 선택 가능
        if (newValue >= 14) {
          for (let newUpgrade = Math.max(currentUpgrade + 1, 21); newUpgrade <= maxUpgrade; newUpgrade++) {
            scanCount++;
          }
        } else {
          for (let newUpgrade = currentUpgrade + 1; newUpgrade <= 20; newUpgrade++) {
            scanCount++;
          }
        }
      }
    }
  }
  
  // 보석 스캔 갯수
  gemLevelElements.forEach(element => {
    const currentValue = parseInt(element.value);
    const maxValue = parseInt(element.getAttribute('data-max') || 10);
    
    for (let newValue = currentValue + 1; newValue <= maxValue; newValue++) {
      scanCount++;
    }
  });
  
  totalScans = scanCount;
  return {
    armorNameElements,
    armorUpgradeElements,
    gemLevelElements
  };
}

// 지연 함수 (ms 단위)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 엘리먼트 값 변경 및 변동 확인
async function changeValueAndCheckDifference(element, newValue) {
  // 값 변경
  element.value = newValue;
  
  // 변경 이벤트 발생
  const event = new Event('change', { bubbles: true });
  element.dispatchEvent(event);
  
  // 점수 변동 확인을 위해 딜레이
  await delay(300);
  
  // 현재 스코어와 변동 확인
  const newScore = getCurrentScore();
  const difference = getScoreDifference();
  
  return {
    score: newScore,
    difference: difference
  };
}

// 스캔 진행 상황 업데이트
function updateScanProgress() {
  completedScans++;
  const progress = Math.floor((completedScans / totalScans) * 100);
  
  // 오버레이 업데이트
  const progressBar = document.getElementById('scanner-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${progress}%`;
  }
  
  // 확장 프로그램 팝업 업데이트
  chrome.runtime.sendMessage({
    action: 'scanProgress',
    progress: progress
  });
}

// 스캔 완료 처리
function finishScan() {
  isScanning = false;
  
  // 오버레이 제거
  const overlay = document.getElementById('scanner-overlay');
  if (overlay) {
    overlay.remove();
  }
  
  // 확장 프로그램에 완료 알림
  chrome.runtime.sendMessage({
    action: 'scanComplete'
  });
  
  // 데이터 저장
  chrome.runtime.sendMessage({
    action: 'saveData',
    data: scanResults
  });
}

// 원래 값으로 복원
async function restoreOriginalValues() {
  for (const key in originalValues) {
    const [type, index] = key.split('-').slice(0, 2);
    const value = originalValues[key];
    
    let selector;
    if (type === 'armor' && key.includes('name')) {
      selector = '.armor-name';
    } else if (type === 'armor' && key.includes('upgrade')) {
      selector = '.armor-upgrade';
    } else if (type === 'gem') {
      selector = 'select[name="ArmoryGem Gems Level"]';
    }
    
    if (selector) {
      const elements = document.querySelectorAll(selector);
      if (elements[index]) {
        elements[index].value = value;
        const event = new Event('change', { bubbles: true });
        elements[index].dispatchEvent(event);
        await delay(100);
      }
    }
  }
}

// 장비 스캔
async function scanArmor(armorNameElements, armorUpgradeElements) {
  for (let i = 0; i < armorNameElements.length; i++) {
    const element = armorNameElements[i];
    const currentValue = parseInt(element.value);
    const maxValue = parseInt(element.getAttribute('data-max') || 25);
    
    // 현재값보다 큰 값만 스캔
    for (let newValue = currentValue + 1; newValue <= maxValue; newValue++) {
      if (!isScanning) return;
      
      const result = await changeValueAndCheckDifference(element, newValue.toString());
      
      scanResults[`armor-name-${i}-${newValue}`] = {
        type: '장비 강화',
        index: i,
        item: document.querySelectorAll('.armor-tag')[i]?.textContent || `장비 ${i+1}`,
        from: currentValue,
        to: newValue,
        score: result.score,
        difference: result.difference
      };
      
      updateScanProgress();
      
      // armor-name에 따른 armor-upgrade 규칙 적용
      if (i < armorUpgradeElements.length) {
        const upgradeElement = armorUpgradeElements[i];
        const currentUpgrade = parseInt(upgradeElement.value);
        let maxUpgrade = 40;
        
        // armor-name이 6 미만이면 upgrade 스캔 불가
        if (newValue < 6) {
          continue;
        }
        
        let minUpgrade = currentUpgrade + 1;
        
        // armor-name이 14 이상일 때만 21 이상 선택 가능
        if (newValue >= 14) {
          minUpgrade = Math.max(minUpgrade, 21);
        } else {
          maxUpgrade = 20;
        }
        
        for (let newUpgrade = minUpgrade; newUpgrade <= maxUpgrade; newUpgrade++) {
          if (!isScanning) return;
          
          const upgradeResult = await changeValueAndCheckDifference(upgradeElement, newUpgrade.toString());
          
          scanResults[`armor-upgrade-${i}-${newUpgrade}`] = {
            type: '장비 상재',
            index: i,
            item: document.querySelectorAll('.armor-tag')[i]?.textContent || `장비 ${i+1} 상재`,
            from: currentUpgrade,
            to: newUpgrade,
            score: upgradeResult.score,
            difference: upgradeResult.difference
          };
          
          updateScanProgress();
        }
        
        // 원래 값으로 복원
        await changeValueAndCheckDifference(upgradeElement, originalValues[`armor-upgrade-${i}`]);
      }
      
      // 원래 값으로 복원
      await changeValueAndCheckDifference(element, originalValues[`armor-name-${i}`]);
    }
  }
}

// 보석 스캔
async function scanGems(gemLevelElements) {
  for (let i = 0; i < gemLevelElements.length; i++) {
    const element = gemLevelElements[i];
    const currentValue = parseInt(element.value);
    const maxValue = parseInt(element.getAttribute('data-max') || 10);
    const gemType = element.nextElementSibling.value;
    const skillName = element.parentElement.querySelector('.skill')?.textContent || '';
    
    // 현재값보다 큰 값만 스캔
    for (let newValue = currentValue + 1; newValue <= maxValue; newValue++) {
      if (!isScanning) return;
      
      const result = await changeValueAndCheckDifference(element, newValue.toString());
      
      scanResults[`gem-level-${i}-${newValue}`] = {
        type: '보석',
        index: i,
        item: `${gemType} ${skillName}`,
        from: currentValue,
        to: newValue,
        score: result.score,
        difference: result.difference
      };
      
      updateScanProgress();
    }
    
    // 원래 값으로 복원
    await changeValueAndCheckDifference(element, originalValues[`gem-level-${i}`]);
  }
}

// 메인 스캔 함수
async function startScan() {
  if (isScanning) return;
  
  isScanning = true;
  completedScans = 0;
  scanResults = {};
  
  // 스캔 시작 전 현재 스코어 저장
  currentScoreValue = getCurrentScore();
  
  // 오버레이 추가
  const overlay = createOverlay();
  document.body.appendChild(overlay);
  
  try {
    // 스캔할 요소 준비
    const {
      armorNameElements,
      armorUpgradeElements,
      gemLevelElements
    } = await prepareElementsForScan();
    
    // 장비 스캔
    await scanArmor(armorNameElements, armorUpgradeElements);
    
    // 보석 스캔
    await scanGems(gemLevelElements);
    
    // 원래 값으로 복원
    await restoreOriginalValues();
    
  } catch (error) {
    console.error('스캔 중 오류 발생:', error);
  } finally {
    finishScan();
  }
}

// 메시지 리스너 설정
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'startScan' && !isScanning) {
    startScan();
    sendResponse({status: 'started'});
  }
  return true;
});

// 페이지 로드 완료 시 초기화
window.addEventListener('load', function() {
  console.log('롭크 시뮬레이터 점수 분석기가 로드되었습니다.');
});
