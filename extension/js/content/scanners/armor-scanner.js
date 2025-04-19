/**
 * 로펙 시뮬레이터 점수 분석기 - 장비 스캐너 모듈
 * 장비 관련 콤보박스를 스캔하는 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 장비 스캐너 모듈
LopecScanner.Scanners.ArmorScanner = (function() {
  // 기본 스캐너 참조
  const BaseScanner = LopecScanner.Scanners.BaseScanner;
  
  /**
   * 장비 스캔 준비
   * @param {NodeList} armorNameElements - 장비 강화 콤보박스 요소들
   * @param {NodeList} armorUpgradeElements - 장비 상재 콤보박스 요소들
   * @return {number} - 스캔 항목 개수
   */
  function prepareArmorScan(armorNameElements, armorUpgradeElements) {
    let scanCount = 0;
    
    // 현재 값들 저장 및 장비 티어 정보 저장
    armorNameElements.forEach((element, index) => {
      BaseScanner.state.originalValues[`armor-name-${index}`] = element.value;
      
      // 장비 티어 정보 가져오기 (상위 select 요소)
      const parentDiv = element.closest('.name-wrap');
      if (parentDiv) {
        const gradeSelect = parentDiv.querySelector('select.plus');
        if (gradeSelect) {
          const gradeValue = gradeSelect.value;
          const gradeText = gradeSelect.options[gradeSelect.selectedIndex].text;
          BaseScanner.state.originalValues[`armor-grade-${index}`] = gradeValue;
          BaseScanner.state.originalValues[`armor-grade-text-${index}`] = gradeText;
        }
      }
    });
    
    armorUpgradeElements.forEach((element, index) => {
      BaseScanner.state.originalValues[`armor-upgrade-${index}`] = element.value;
    });
    
    // 장비 스캔 개수 계산 (실제 스캔 함수와 동일한 방식으로 계산)
    for (let i = 0; i < armorNameElements.length; i++) {
      const nameElement = armorNameElements[i];
      const nameCurrentValue = parseInt(nameElement.value);
      const nameMaxValue = parseInt(nameElement.getAttribute('data-max') || 25);
      
      // 1. 장비 강화 옵션 개수 계산
      for (let newNameValue = nameCurrentValue + 1; newNameValue <= nameMaxValue; newNameValue++) {
        scanCount++;
      }
      
      // 2. 상재 옵션이 있으면 계산
      if (i < armorUpgradeElements.length) {
        const upgradeElement = armorUpgradeElements[i];
        const upgradeCurrentValue = parseInt(upgradeElement.value);
        
        // 현재 장비 강화 레벨에 맞게 계산
        if (nameCurrentValue >= 6) {
          let maxUpgrade = nameCurrentValue >= 14 ? 40 : 20;
          let minUpgrade = nameCurrentValue >= 14 ? Math.max(upgradeCurrentValue + 1, 21) : upgradeCurrentValue + 1;
          
          // 상재 개수 계산
          for (let newUpgradeValue = minUpgrade; newUpgradeValue <= maxUpgrade; newUpgradeValue++) {
            scanCount++;
          }
        }
      }
    }
    
    return scanCount;
  }
  
  /**
   * 장비 스캔 (새로운 방식: 한 콤보박스 완전 순회 후 다음으로 이동)
   * @param {NodeList} armorNameElements - 장비 강화 콤보박스 요소들
   * @param {NodeList} armorUpgradeElements - 장비 상재 콤보박스 요소들
   */
  async function scanArmor(armorNameElements, armorUpgradeElements) {
    // 각 장비 아이템에 대해 스캔
    for (let i = 0; i < armorNameElements.length; i++) {
      const nameElement = armorNameElements[i];
      const nameCurrentValue = parseInt(nameElement.value);
      const nameMaxValue = parseInt(nameElement.getAttribute('data-max') || 25);
      
      // 1. 먼저 armor-name 옵션을 모두 순회
      for (let newNameValue = nameCurrentValue + 1; newNameValue <= nameMaxValue; newNameValue++) {
        if (!BaseScanner.state.isScanning) return;
        
        // 값 변경 및 변동 확인
        const result = await BaseScanner.changeValueAndCheckDifference(nameElement, newNameValue.toString());
        
        // 값이 변경되었지만 변화가 0인 경우 추가 기다림
        if (Math.abs(result.difference) < 0.001) {
          // 추가 딜레이를 적용하고 점수를 다시 확인
          await LopecScanner.Utils.delay(300);
          const updatedResult = {
            score: LopecScanner.Utils.getCurrentScore(),
            difference: LopecScanner.Utils.getCurrentDifference()
          };
          
          // 두 번째 값을 사용하되, 여전히 0이면 최소값 0.01 사용
          if (Math.abs(updatedResult.difference) < 0.001) {
            console.log(`장비 강화 변경 후에도 변화가 0임: ${newNameValue}, 최소값 0.01 사용`);
            result.difference = 0.01; // 최소값 사용
          } else {
            console.log(`장비 강화 지연 후 변화 감지: ${updatedResult.difference}`);
            result.difference = updatedResult.difference;
          }
        }
        
        // 장비 티어 정보 가져오기
        let tierInfo = '';
        let tierValue = '';
        const parentDiv = nameElement.closest('.name-wrap');
        if (parentDiv) {
          const gradeSelect = parentDiv.querySelector('select.plus');
          if (gradeSelect) {
            tierValue = gradeSelect.value;
            tierInfo = gradeSelect.options[gradeSelect.selectedIndex].text;
          }
        }
        
        // 결과 저장
        BaseScanner.state.scanResults[`armor-name-${i}-${newNameValue}`] = {
          type: 'armor',  // 주요 카테고리
          subType: '장비 강화', // 세부 구분
          index: i,
          item: document.querySelectorAll('.armor-tag')[i]?.textContent || `장비 ${i+1}`,
          from: nameCurrentValue,
          to: newNameValue,
          score: result.score,
          difference: result.difference,
          tier: tierInfo,  // 티어 정보 저장 (예: 'T3 고대')
          tierValue: tierValue // 티어 값 저장 (예: '1525')
        };
        
        BaseScanner.updateScanProgress();
      }
      
      // 원래 값으로 복원
      await BaseScanner.changeValueAndCheckDifference(nameElement, BaseScanner.state.originalValues[`armor-name-${i}`]);
      
      // 2. 상재 옵션이 있으면 별도로 순회
      if (i < armorUpgradeElements.length) {
        await scanArmorUpgrade(i, armorUpgradeElements[i], nameCurrentValue);
      }
    }
  }
  
  /**
   * 장비 상재 스캔
   * @param {number} index - 장비 인덱스
   * @param {HTMLElement} upgradeElement - 상재 콤보박스 요소
   * @param {number} nameCurrentValue - 현재 장비 강화 값
   */
  async function scanArmorUpgrade(index, upgradeElement, nameCurrentValue) {
    const upgradeCurrentValue = parseInt(upgradeElement.value);
    
    // armor-name이 6 이상인 경우에만 상재 적용 가능
    if (nameCurrentValue >= 6) {
      let maxUpgrade = nameCurrentValue >= 14 ? 40 : 20;
      let minUpgrade = nameCurrentValue >= 14 ? Math.max(upgradeCurrentValue + 1, 21) : upgradeCurrentValue + 1;
      
      // 상재 값 순회
      for (let newUpgradeValue = minUpgrade; newUpgradeValue <= maxUpgrade; newUpgradeValue++) {
        if (!BaseScanner.state.isScanning) return;
        
        // 값 변경 및 변동 확인
        const result = await BaseScanner.changeValueAndCheckDifference(upgradeElement, newUpgradeValue.toString());
        
        // 값이 변경되었지만 변화가 0인 경우 추가 기다림
        if (Math.abs(result.difference) < 0.001) {
          // 추가 딜레이를 적용하고 점수를 다시 확인
          await LopecScanner.Utils.delay(300);
          const updatedResult = {
            score: LopecScanner.Utils.getCurrentScore(),
            difference: LopecScanner.Utils.getCurrentDifference()
          };
          
          // 두 번째 값을 사용하되, 여전히 0이면 최소값 0.01 사용
          if (Math.abs(updatedResult.difference) < 0.001) {
            console.log(`장비 상재 변경 후에도 변화가 0임: ${newUpgradeValue}, 최소값 0.01 사용`);
            result.difference = 0.01; // 최소값 사용
          } else {
            console.log(`장비 상재 지연 후 변화 감지: ${updatedResult.difference}`);
            result.difference = updatedResult.difference;
          }
        }
        
        // 장비 티어 정보 가져오기
        let tierInfo = '';
        let tierValue = '';
        const parentDiv = upgradeElement.closest('.name-wrap');
        if (parentDiv) {
          const gradeSelect = parentDiv.querySelector('select.plus');
          if (gradeSelect) {
            tierValue = gradeSelect.value;
            tierInfo = gradeSelect.options[gradeSelect.selectedIndex].text;
          }
        }
        
        // 결과 저장
        BaseScanner.state.scanResults[`armor-upgrade-${index}-${newUpgradeValue}`] = {
          type: 'armor',  // 주요 카테고리
          subType: '장비 상재', // 세부 구분
          index: index,
          item: document.querySelectorAll('.armor-tag')[index]?.textContent || `장비 ${index+1} 상재`,
          from: upgradeCurrentValue,
          to: newUpgradeValue,
          score: result.score,
          difference: result.difference,
          tier: tierInfo,  // 티어 정보 저장 (예: 'T3 고대')
          tierValue: tierValue // 티어 값 저장 (예: '1525')
        };
        
        BaseScanner.updateScanProgress();
      }
      
      // 원래 값으로 복원
      await BaseScanner.changeValueAndCheckDifference(upgradeElement, BaseScanner.state.originalValues[`armor-upgrade-${index}`]);
    }
  }
  
  // 공개 API
  return {
    prepareArmorScan,
    scanArmor
  };
})();