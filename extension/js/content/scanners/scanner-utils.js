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
    // 장신구 스캐너 참조
    const AccessoryScanner = LopecScanner.Scanners.AccessoryScanner;
    // 각인 스캐너 참조
    const EngravingScanner = LopecScanner.Scanners.EngravingScanner;
    // 카르마 스캐너 참조
    const KarmaScanner = LopecScanner.Scanners.KarmaScanner;
    
    // 엘리먼트 수집
    // 장비 관련 엘리먼트
    const armorNameElements = document.querySelectorAll('.armor-name');
    const armorUpgradeElements = document.querySelectorAll('.armor-upgrade');
    
    // 보석 관련 엘리먼트
    const gemLevelElements = document.querySelectorAll('select[name="ArmoryGem Gems Level"]');
    
    // 장신구 관련 엘리먼트
    const accessoryTierElements = document.querySelectorAll('.accessory-item .tier.accessory');
    const accessoryQualityElements = document.querySelectorAll('.accessory-item .quality');
    const accessoryOptionElements = document.querySelectorAll('.accessory-item .option.tooltip-text');
    
    // 팔찌 관련 엘리먼트 (bangle 클래스가 있는지 먼저 확인)
    let bangleStatElements = [];
    let bangleOptionElements = [];
    
    const bangleElements = document.querySelectorAll('.bangle');
    if (bangleElements && bangleElements.length > 0) {
      bangleStatElements = document.querySelectorAll('.bangle .option-item .stats');
      bangleOptionElements = document.querySelectorAll('.bangle .grinding-wrap .option.tooltip-text');
    }
    
    // 각인 관련 엘리먼트 - .orange 클래스를 가진 요소 참조
    const engravingNameElements = document.querySelectorAll('.engraving-box .engraving-name');
    const engravingLevelElements = document.querySelectorAll('.engraving-box .grade');
    // orange 클래스를 가진 요소 확인
    const orangeEngravingLevelElements = document.querySelectorAll('.engraving-box .grade.orange');
    
    // 카르마 관련 엘리먼트
    const karmaRadioGroups = [
      document.querySelectorAll('input[name="enlight-karma"]'),
      document.querySelectorAll('input[name="leaf-karma"]')
    ];
    const karmaCheckboxes = document.querySelectorAll('.ark-list.enlightenment input[type="checkbox"]');
    
    // 스캔 항목 개수 계산
    let armorScanCount = ArmorScanner.prepareArmorScan(armorNameElements, armorUpgradeElements);
    let gemScanCount = GemScanner.prepareGemScan(gemLevelElements);
    
    // 장신구 스캔 항목 계산
    const accessoryElements = {
      tierElements: accessoryTierElements,
      qualityElements: accessoryQualityElements,
      optionElements: accessoryOptionElements,
      bangleStatElements: bangleStatElements,
      bangleOptionElements: bangleOptionElements
    };
    let accessoryScanCount = AccessoryScanner.prepareAccessoryScan(accessoryElements);
    
    // 각인 스캔 항목 계산
    const engravingElements = {
      engravingNameElements,
      engravingLevelElements
    };
    let engravingScanCount = EngravingScanner.prepareEngravingScan(engravingElements);
    
    // 카르마 스캔 항목 계산
    const karmaElements = {
      karmaRadioGroups,
      karmaCheckboxes
    };
    let karmaScanCount = KarmaScanner.prepareKarmaScan(karmaElements);
    
    // 전체 스캔 항목 개수 설정
    BaseScanner.state.totalScans = armorScanCount + gemScanCount + accessoryScanCount + engravingScanCount + karmaScanCount;
    
    return {
      // 장비 요소
      armorNameElements,
      armorUpgradeElements,
      
      // 보석 요소
      gemLevelElements,
      
      // 장신구 요소
      accessoryElements: {
        tierElements: accessoryTierElements,
        qualityElements: accessoryQualityElements,
        optionElements: accessoryOptionElements,
        bangleStatElements: bangleStatElements,
        bangleOptionElements: bangleOptionElements
      },
      
      // 각인 요소
      engravingElements: {
        engravingNameElements,
        engravingLevelElements
      },
      
      // 카르마 요소
      karmaElements: {
        karmaRadioGroups,
        karmaCheckboxes
      }
    };
  }
  
  // 공개 API
  return {
    prepareElementsForScan
  };
})();
