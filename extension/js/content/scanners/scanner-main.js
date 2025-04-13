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
  const AccessoryScanner = LopecScanner.Scanners.AccessoryScanner;
  const EngravingScanner = LopecScanner.Scanners.EngravingScanner;
  const KarmaScanner = LopecScanner.Scanners.KarmaScanner;
  const ScannerUtils = LopecScanner.Scanners.Utils;
  
  // 장신구 관련 스캔 옵션 초기화
  const accessoryOptions = {
    // 목걸이 옵션 (예: '적에게 주는 피해', '무기 공격력')
    necklaceOptions: ['피해', '공격력', '무기'],
    // 귀걸이 옵션
    earringOptions: ['무기', '공격력'],
    // 반지 옵션
    ringOptions: ['치명타', '피해', '공격력'],
    // 팔찌 옵션
    bangleOptions: ['피해', '치명타', '무기']
  };
  
  // 각인 관련 스캔 옵션 초기화
  const engravingOptions = {
    // 주요 각인만 스캔
    engravingNames: ['원한', '바리케이드', '슈퍼 차지', '안정된 상태', '결투의 대가'],
    // 최대 레벨 3까지만 스캔
    maxLevel: 3,
    // 특정 조합 스캔 (선택적)
    specificCombinations: []
  };
  
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
      // 장신구/각인 옵션 설정
      AccessoryScanner.setAccessoryOptions(accessoryOptions);
      EngravingScanner.setEngravingOptions(engravingOptions);
      
      // 스캔할 요소 준비
      const elements = await ScannerUtils.prepareElementsForScan();
      
      // 장비 스캔 (elements가 존재하는지 확인)
      if (elements.armorNameElements && elements.armorNameElements.length > 0 &&
          elements.armorUpgradeElements && elements.armorUpgradeElements.length > 0) {
        await ArmorScanner.scanArmor(elements.armorNameElements, elements.armorUpgradeElements);
      }
      
      // 보석 스캔
      if (elements.gemLevelElements && elements.gemLevelElements.length > 0) {
        await GemScanner.scanGems(elements.gemLevelElements);
      }
      
      // 장신구 스캔 (elements.accessoryElements가 존재하는지 확인)
      if (elements.accessoryElements) {
        await AccessoryScanner.scanAccessories(elements.accessoryElements);
      }
      
      // 각인 스캔 (elements.engravingElements가 존재하는지 확인)
      if (elements.engravingElements && 
          elements.engravingElements.engravingNameElements && 
          elements.engravingElements.engravingNameElements.length > 0) {
        await EngravingScanner.scanEngravings(elements.engravingElements);
      }
      
      // 카르마 스캔 (elements.karmaElements가 존재하는지 확인)
      if (elements.karmaElements && 
          elements.karmaElements.karmaRadioGroups && 
          elements.karmaElements.karmaRadioGroups.length > 0) {
        await KarmaScanner.scanKarma(elements.karmaElements);
      }
      
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
  
  /**
   * 장신구 스캔 옵션 설정
   * @param {Object} options - 장신구 스캔 옵션
   */
  function setAccessoryOptions(options) {
    Object.assign(accessoryOptions, options);
    AccessoryScanner.setAccessoryOptions(accessoryOptions);
  }
  
  /**
   * 각인 스캔 옵션 설정
   * @param {Object} options - 각인 스캔 옵션
   */
  function setEngravingOptions(options) {
    Object.assign(engravingOptions, options);
    EngravingScanner.setEngravingOptions(engravingOptions);
  }
  
  // 공개 API
  return {
    startScan,
    isScanningActive,
    setAccessoryOptions,
    setEngravingOptions
  };
})();

// LopecScanner.Scanner와의 호환성을 위한 리다이렉션
window.LopecScanner.Scanner = {
  startScan: function() {
    return LopecScanner.Scanners.Main.startScan();
  },
  isScanningActive: function() {
    return LopecScanner.Scanners.Main.isScanningActive();
  },
  setAccessoryOptions: function(options) {
    return LopecScanner.Scanners.Main.setAccessoryOptions(options);
  },
  setEngravingOptions: function(options) {
    return LopecScanner.Scanners.Main.setEngravingOptions(options);
  }
};
