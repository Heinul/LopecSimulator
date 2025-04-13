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
  
  // 스캔 설정 객체
  let scanSettings = {
    scanArmor: true,
    scanGem: true,
    scanAccessory: true,
    scanEngraving: true,
    scanKarma: true
  };
  
  /**
   * 스캔 설정 지정
   * @param {Object} settings - 스캔 설정 객체
   */
  function setScanSettings(settings) {
    scanSettings = {...scanSettings, ...settings};
  }
  
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
      AccessoryScanner.setAccessoryOptions({
        // 목걸이 옵션 (추가피해, 적에게 주는 피해, 공격력, 무기공격력)
        necklaceOptions: ['추가피해', '적에게 주는 피해', '공격력', '무기 공격력'],
        // 귀걸이 옵션 (공격력과 무기공격력 퍼센트와 고정값 모두 포함)
        earringOptions: ['공격력 +', '무기 공격력 +', '공격력', '무기 공격력'],
        // 반지 옵션 (치명타 적중률, 치명타 피해, 공격력, 무기공격력)
        ringOptions: ['치명타 적중률', '치명타 피해', '공격력', '무기 공격력']
      });
      
      // 각인은 orange 클래스를 가진 잔류 요소만 스캔
      
      // 스캔할 요소 준비
      const elements = await ScannerUtils.prepareElementsForScan(scanSettings);
      
      // 장비 스캔 (선택된 경우에만)
      if (scanSettings.scanArmor && 
          elements.armorNameElements && elements.armorNameElements.length > 0 &&
          elements.armorUpgradeElements && elements.armorUpgradeElements.length > 0) {
        await ArmorScanner.scanArmor(elements.armorNameElements, elements.armorUpgradeElements);
      }
      
      // 보석 스캔 (선택된 경우에만)
      if (scanSettings.scanGem && 
          elements.gemLevelElements && elements.gemLevelElements.length > 0) {
        await GemScanner.scanGems(elements.gemLevelElements);
      }
      
      // 장신구 스캔 (선택된 경우에만)
      if (scanSettings.scanAccessory && elements.accessoryElements) {
        await AccessoryScanner.scanAccessories(elements.accessoryElements);
      }
      
      // 각인 스캔 (선택된 경우에만)
      if (scanSettings.scanEngraving && 
          elements.engravingElements && 
          elements.engravingElements.engravingNameElements && 
          elements.engravingElements.engravingNameElements.length > 0) {
        await EngravingScanner.scanEngravings(elements.engravingElements);
      }
      
      // 카르마 스캔 (선택된 경우에만)
      if (scanSettings.scanKarma && 
          elements.karmaElements && 
          elements.karmaElements.karmaRadioGroups && 
          elements.karmaElements.karmaRadioGroups.length > 0) {
        await KarmaScanner.scanKarma(elements.karmaElements);
      }
      
    } catch (error) {
      console.error('스캔 중 오류 발생:', error);
    } finally {
      // 원래 값으로 복원
      console.log('스캔 완료 - 원래 값으로 복원 시도...');
      await BaseScanner.restoreOriginalValues();
      
      // 스캔 완료 처리
      await BaseScanner.finishScan();
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
    AccessoryScanner.setAccessoryOptions(options);
  }
  
  /**
   * 각인 스캔 옵션 설정
   * @param {Object} options - 각인 스캔 옵션
   */
  function setEngravingOptions(options) {
    EngravingScanner.setEngravingOptions(options);
  }
  
  // 공개 API
  return {
    startScan,
    isScanningActive,
    setAccessoryOptions,
    setEngravingOptions,
    setScanSettings
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
