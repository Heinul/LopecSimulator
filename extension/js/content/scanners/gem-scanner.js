/**
 * 로펙 시뮬레이터 점수 분석기 - 보석 스캐너 모듈
 * 보석 관련 콤보박스를 스캔하는 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 보석 스캐너 모듈
LopecScanner.Scanners.GemScanner = (function() {
  // 기본 스캐너 참조
  const BaseScanner = LopecScanner.Scanners.BaseScanner;
  
  /**
   * 보석 스캔 준비
   * @param {NodeList} gemLevelElements - 보석 레벨 콤보박스 요소들
   * @return {number} - 스캔 항목 개수
   */
  function prepareGemScan(gemLevelElements) {
    let scanCount = 0;
    
    // 현재 값들 저장
    gemLevelElements.forEach((element, index) => {
      BaseScanner.state.originalValues[`gem-level-${index}`] = element.value;
    });
    
    // 보석 스캔 갯수 계산
    gemLevelElements.forEach(element => {
      const currentValue = parseInt(element.value);
      const maxValue = parseInt(element.getAttribute('data-max') || 10);
      
      for (let newValue = currentValue + 1; newValue <= maxValue; newValue++) {
        scanCount++;
      }
    });
    
    return scanCount;
  }
  
  /**
   * 보석 스캔 (새로운 방식: 한 보석 완전 순회 후 다음으로 이동)
   * @param {NodeList} gemLevelElements - 보석 레벨 콤보박스 요소들
   */
  async function scanGems(gemLevelElements) {
    for (let i = 0; i < gemLevelElements.length; i++) {
      const element = gemLevelElements[i];
      const currentValue = parseInt(element.value);
      const maxValue = parseInt(element.getAttribute('data-max') || 10);
      const gemType = element.nextElementSibling.value;
      const skillName = element.parentElement.querySelector('.skill')?.textContent || '';
      
      // 현재값부터 최대값까지 순회
      for (let newValue = currentValue + 1; newValue <= maxValue; newValue++) {
        if (!BaseScanner.state.isScanning) return;
        
        // 값 변경 및 변동 확인
        const result = await BaseScanner.changeValueAndCheckDifference(element, newValue.toString());
        
        // 결과 저장
        BaseScanner.state.scanResults[`gem-level-${i}-${newValue}`] = {
          type: '보석',
          index: i,
          item: `${gemType} ${skillName}`,
          from: currentValue,
          to: newValue,
          score: result.score,
          difference: result.difference
        };
        
        BaseScanner.updateScanProgress();
      }
      
      // 원래 값으로 복원
      await BaseScanner.changeValueAndCheckDifference(element, BaseScanner.state.originalValues[`gem-level-${i}`]);
    }
  }
  
  // 공개 API
  return {
    prepareGemScan,
    scanGems
  };
})();
