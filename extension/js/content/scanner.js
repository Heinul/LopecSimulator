/**
 * 로펙 시뮬레이터 점수 분석기 - 스캐너 기능
 * 콤보박스를 순회하며 점수 변동을 기록하는 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};

// 스캐너 모듈
LopecScanner.Scanner = (function() {
  // 모듈 내부 변수
  let isScanning = false;
  let originalValues = {};
  let scanResults = {};
  let totalScans = 0;
  let completedScans = 0;
  
  /**
   * 스캔을 위한 엘리먼트 준비 및 스캔 항목 계산
   * @return {Object} - 스캔할 요소들과 관련 정보
   */
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

  /**
   * 엘리먼트 값 변경 및 변동 확인
   * @param {HTMLElement} element - 값을 변경할 엘리먼트
   * @param {string} newValue - 새로 설정할 값
   * @return {Object} - 변경 후 점수와 변동 값
   */
  async function changeValueAndCheckDifference(element, newValue) {
    // 기존 화면의 점수 및 변동 값을 초기화 받아둘
    const initialScore = LopecScanner.Utils.getCurrentScore();
    console.log('Initial score:', initialScore);
    
    // 값 변경
    element.value = newValue;
    
    // 변경 이벤트 발생
    const event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
    
    // 점수 변경을 기다림
    await LopecScanner.Utils.delay(100);
    
    // 변동을 지정된 시간 동안 모니터링
    const monitorDuration = 300; // 모니터링
    console.log('Monitoring for changes over', monitorDuration, 'ms');
    const difference = await LopecScanner.Utils.monitorDifferenceChanges(monitorDuration);
    
    // 현재 점수 받아오기
    const newScore = LopecScanner.Utils.getCurrentScore();
    console.log('New score:', newScore, 'Detected difference:', difference);
    
    // 변동이 감지되지 않았지만 점수가 변경되었다면
    if (Math.abs(difference) < 0.001 && Math.abs(newScore - initialScore) > 0.001) {
      const calculatedDifference = newScore - initialScore;
      console.log('Calculated difference from score change:', calculatedDifference);
      return {
        score: newScore,
        difference: calculatedDifference
      };
    }
    
    return {
      score: newScore,
      difference: difference
    };
  }

  /**
   * 스캔 진행 상황 업데이트
   */
  function updateScanProgress() {
    completedScans++;
    const progress = Math.floor((completedScans / totalScans) * 100);
    
    // UI 업데이트
    LopecScanner.UI.updateProgress(progress);
  }

  /**
   * 원래 값으로 복원
   */
  async function restoreOriginalValues() {
    console.log('Restoring original values...');
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
          // 더 긴 딜레이로 반영 시간 확보
          await LopecScanner.Utils.delay(100);
        }
      }
    }
    console.log('Restored all original values');
  }

  /**
   * 장비 스캔
   * @param {NodeList} armorNameElements - 장비 강화 콤보박스 요소들
   * @param {NodeList} armorUpgradeElements - 장비 상재 콤보박스 요소들
   */
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

  /**
   * 보석 스캔
   * @param {NodeList} gemLevelElements - 보석 레벨 콤보박스 요소들
   */
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

  /**
   * 스캔 시작 함수
   */
  async function startScan() {
    if (isScanning) return;
    
    isScanning = true;
    completedScans = 0;
    scanResults = {};
    
    // 오버레이 추가
    const overlay = LopecScanner.UI.createOverlay();
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

  /**
   * 스캔 완료 처리
   */
  function finishScan() {
    isScanning = false;
    
    // 오버레이 제거
    LopecScanner.UI.removeOverlay();
    
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
  
  /**
   * 스캔 진행 중인지 확인
   * @return {boolean} - 스캔 진행 중 여부
   */
  function isScanningActive() {
    return isScanning;
  }
  
  // 공개 API
  return {
    startScan,
    isScanningActive
  };
})();
