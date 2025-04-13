/**
 * 로펙 시뮬레이터 점수 분석기 - 메인 스캐너 모듈
 * 스캐너의 통합 인터페이스 및 진입점
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 메인 스캐너 모듈
LopecScanner.Scanners.Main = (function() {
  // 모듈 참조
  const BaseScanner = LopecScanner.Scanners.BaseScanner;
  const ArmorScanner = LopecScanner.Scanners.ArmorScanner;
  const GemScanner = LopecScanner.Scanners.GemScanner;
  const ScannerUtils = LopecScanner.Scanners.Utils;
  
  /**
   * 스캔 시작 함수
   */
  async function startScan() {
    if (BaseScanner.state.isScanning) return;
    
    BaseScanner.state.isScanning = true;
    BaseScanner.state.completedScans = 0;
    BaseScanner.state.scanResults = {};
    
    // 오버레이 추가
    const overlay = LopecScanner.UI.createOverlay();
    document.body.appendChild(overlay);
    
    try {
      // 스캔할 요소 준비
      const {
        armorNameElements,
        armorUpgradeElements,
        gemLevelElements
      } = await ScannerUtils.prepareElementsForScan();
      
      // 장비 스캔
      await ArmorScanner.scanArmor(armorNameElements, armorUpgradeElements);
      
      // 보석 스캔
      await GemScanner.scanGems(gemLevelElements);
      
    } catch (error) {
      console.error('스캔 중 오류 발생:', error);
    } finally {
      BaseScanner.finishScan();
    }
  }
  
  /**
   * 스캔 진행 중인지 확인
   * @return {boolean} - 스캔 진행 중 여부
   */
  function isScanningActive() {
    return BaseScanner.state.isScanning;
  }
  
  // 공개 API
  return {
    startScan,
    isScanningActive
  };
})();

// LopecScanner.Scanner와의 호환성을 위한 리다이렉션
window.LopecScanner.Scanner = {
  startScan: function() {
    return LopecScanner.Scanners.Main.startScan();
  },
  isScanningActive: function() {
    return LopecScanner.Scanners.Main.isScanningActive();
  }
};
