/**
 * 로펙 시뮬레이터 점수 분석기 - 스캐너 유틸리티 모듈
 * 스캐너에서 사용하는 공통 유틸리티 함수들
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 스캐너 유틸리티 모듈
LopecScanner.Scanners.Utils = (function() {
  /**
   * 스캔할 엘리먼트 준비 및 스캔 항목 계산
   * @return {Object} - 스캔할 요소들과 관련 정보
   */
  async function prepareElementsForScan() {
    // 기본 스캐너 참조
    const BaseScanner = LopecScanner.Scanners.BaseScanner;
    // 장비 스캐너 참조
    const ArmorScanner = LopecScanner.Scanners.ArmorScanner;
    // 보석 스캐너 참조
    const GemScanner = LopecScanner.Scanners.GemScanner;
    
    // 엘리먼트 수집
    // 장비 관련 엘리먼트
    const armorNameElements = document.querySelectorAll('.armor-name');
    const armorUpgradeElements = document.querySelectorAll('.armor-upgrade');
    
    // 보석 관련 엘리먼트
    const gemLevelElements = document.querySelectorAll('select[name="ArmoryGem Gems Level"]');
    
    // 스캔 항목 개수 계산
    let armorScanCount = ArmorScanner.prepareArmorScan(armorNameElements, armorUpgradeElements);
    let gemScanCount = GemScanner.prepareGemScan(gemLevelElements);
    
    // 전체 스캔 항목 개수 설정
    BaseScanner.state.totalScans = armorScanCount + gemScanCount;
    
    return {
      armorNameElements,
      armorUpgradeElements,
      gemLevelElements
    };
  }
  
  // 공개 API
  return {
    prepareElementsForScan
  };
})();
