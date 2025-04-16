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
   * @param {Object} scanSettings - 스캔 설정 (선택적 매개변수)
   * @return {Object} - 스캔할 요소들과 관련 정보
   */
  async function prepareElementsForScan(scanSettings) {
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
    
    // 기본 스캔 설정 (전부 활성화)
    const settings = scanSettings || {
      scanArmor: true,
      scanGem: true,
      scanAccessory: true,
      scanEngraving: true,
      scanKarma: true
    };
    
    console.log('스캔 준비: 페이지 구조 확인 시작');
    
    // 엘리먼트 수집
    // 장비 관련 엘리먼트
    const armorNameElements = document.querySelectorAll('.armor-name');
    const armorUpgradeElements = document.querySelectorAll('.armor-upgrade');
    
    console.log(`장비 항목: ${armorNameElements.length}개의 장비명, ${armorUpgradeElements.length}개의 강화 요소 있음`);
    
    // 보석 관련 엘리먼트
    const gemLevelElements = document.querySelectorAll('select[name="ArmoryGem Gems Level"]');
    
    console.log(`보석 항목: ${gemLevelElements.length}개의 보석 레벨 요소 있음`);
    
    // 장신구 관련 엘리먼트
    const accessoryTierElements = document.querySelectorAll('.accessory-item .tier.accessory');
    const accessoryQualityElements = document.querySelectorAll('.accessory-item .quality');
    const accessoryOptionElements = document.querySelectorAll('.accessory-item .option.tooltip-text');
    
    console.log(`장신구 항목: 
      - ${accessoryTierElements.length}개의 티어 요소 
      - ${accessoryQualityElements.length}개의 등급 요소 
      - ${accessoryOptionElements.length}개의 옵션 요소 있음`);
    
    // DOM 구조 확인을 위한 추가 검사
    console.log('DOM 구조 확인 - 장신구:');
    try {
      // Detector 객체가 존재하고 debugAccessoryStructure 함수가 존재하는지 안전하게 확인
      if (typeof LopecScanner !== 'undefined' && 
          LopecScanner.Scanners && 
          LopecScanner.Scanners.Accessory && 
          LopecScanner.Scanners.Accessory.Detector && 
          typeof LopecScanner.Scanners.Accessory.Detector.debugAccessoryStructure === 'function') {
        LopecScanner.Scanners.Accessory.Detector.debugAccessoryStructure();
      } else {
        console.log('장신구 구조 디버깅 함수가 없습니다.');
      }
    } catch (e) {
      console.warn('장신구 구조 디버깅 함수 오류:', e);
    }
    
    // 스캔 준비 전 장신구 옵션의 현재 값을 로그로 확인
    console.log('스캔 준비 전 장신구 옵션 값 확인:');
    if (accessoryOptionElements && accessoryOptionElements.length > 0) {
      accessoryOptionElements.forEach((element, index) => {
        // element가 유효한 DOM 요소인지 확인
        if (element && element.options && typeof element.selectedIndex !== 'undefined') {
          const selectedOption = element.options[element.selectedIndex];
          const selectedText = selectedOption ? selectedOption.textContent : '없음';
          const selectedValue = element.value;
          console.log(`장신구 옵션 [${index}]: ${selectedText} (${selectedValue})`);
        } else {
          console.log(`장신구 옵션 [${index}]: 유효하지 않은 요소`);
        }
      });
    } else {
      console.log('장신구 옵션 요소가 없습니다.');
    }
    
    // 팔찌 관련 엘리먼트 (bangle 클래스가 있는지 먼저 확인)
    let bangleStatElements = [];
    let bangleOptionElements = [];
    
    const bangleElements = document.querySelectorAll('.bangle');
    if (bangleElements && bangleElements.length > 0) {
      bangleStatElements = document.querySelectorAll('.bangle .option-item .stats');
      bangleOptionElements = document.querySelectorAll('.bangle .grinding-wrap .option.tooltip-text');
      console.log(`팔찌 항목: ${bangleStatElements.length}개의 스탯, ${bangleOptionElements.length}개의 옵션`);
    } else {
      console.log('팔찌 항목: 발견되지 않음');
    }
    
    // 각인 관련 엘리먼트 - .orange 클래스를 가진 요소 참조
    const engravingNameElements = document.querySelectorAll('.engraving-box .engraving-name');
    const engravingLevelElements = document.querySelectorAll('.engraving-box .grade');
    // orange 클래스를 가진 요소 확인
    const orangeEngravingLevelElements = document.querySelectorAll('.engraving-box .grade.orange');
    
    console.log(`각인 항목: ${engravingNameElements.length}개 각인명, ${engravingLevelElements.length}개 등급, (orange: ${orangeEngravingLevelElements.length}개)`);
    
    // 카르마 관련 엘리먼트
    const karmaRadioGroups = [
      document.querySelectorAll('input[name="enlight-karma"]'),
      document.querySelectorAll('input[name="leaf-karma"]')
    ];
    const karmaCheckboxes = document.querySelectorAll('.ark-list.enlightenment input[type="checkbox"]');
    
    console.log(`카르마 항목: ${karmaRadioGroups[0].length + karmaRadioGroups[1].length}개 라디오, ${karmaCheckboxes.length}개 체크박스`);
    
    // 아바타 관련 엘리먼트
    // 아바타 등급 및 카테고리별 라디오 버튼 가져오기
    const avatarCategories = ['weapon', 'helmet', 'armor', 'pants'];
    const avatarGrades = ['none', 'hero', 'legendary'];
    
    // 아바타 요소 객체 구성
    const avatarElements = {};
    
    // 각 등급별 객체 생성
    avatarGrades.forEach(grade => {
      avatarElements[grade] = {};
      
      // 각 카테고리별 라디오 버튼 찾기
      avatarCategories.forEach(category => {
        const radio = document.querySelector(`.name-wrap .${grade} input[name="${category}"]`);
        if (radio) {
          avatarElements[grade][category] = radio;
        }
      });
    });
    
    // 라디오 버튼 개수 확인
    let totalAvatarRadios = 0;
    avatarGrades.forEach(grade => {
      Object.keys(avatarElements[grade] || {}).forEach(category => {
        if (avatarElements[grade][category]) totalAvatarRadios++;
      });
    });
    
    console.log(`아바타 항목: ${totalAvatarRadios}개 라디오 버튼 (등급 ${avatarGrades.length}개 x 카테고리 ${avatarCategories.length}개)`);
    
    // 스캔 항목 개수 계산
    let armorScanCount = settings.scanArmor ? ArmorScanner.prepareArmorScan(armorNameElements, armorUpgradeElements) : 0;
    let gemScanCount = settings.scanGem ? GemScanner.prepareGemScan(gemLevelElements) : 0;
    
    // 장신구 스캔 항목 계산
    const accessoryElements = {
      tierElements: accessoryTierElements,
      qualityElements: accessoryQualityElements,
      optionElements: accessoryOptionElements,
      bangleStatElements: bangleStatElements,
      bangleOptionElements: bangleOptionElements
    };
    let accessoryScanCount = settings.scanAccessory ? AccessoryScanner.prepareAccessoryScan(accessoryElements) : 0;
    
    // 스캔 준비 후 장신구 옵션의 현재 값을 다시 로그로 확인
    console.log('스캔 준비 후 장신구 옵션 값 확인:');
    if (accessoryOptionElements && accessoryOptionElements.length > 0) {
      accessoryOptionElements.forEach((element, index) => {
        // element가 유효한 DOM 요소인지 확인
        if (element && element.options && typeof element.selectedIndex !== 'undefined') {
          const selectedOption = element.options[element.selectedIndex];
          const selectedText = selectedOption ? selectedOption.textContent : '없음';
          const selectedValue = element.value;
          
          // 원래 값 확인
          const originalKey = `accessory-option-${index}`;
          const originalValue = BaseScanner.state.originalValues[originalKey];
          
          // 원래 값과 현재 값이 다르면 경고
          if (originalValue && originalValue !== selectedValue) {
            console.warn(`장신구 옵션 [${index}] 값이 변경됨: ${originalValue} -> ${selectedValue}`);
            
            // 원래 값으로 복원 시도
            console.log(`원래 값으로 복원 시도: ${originalValue}`);
            try {
              element.value = originalValue;
              const event = new Event('change', { bubbles: true });
              element.dispatchEvent(event);
            } catch (e) {
              console.error(`옵션 복원 시 오류: ${e.message}`);
            }
          } else {
            console.log(`장신구 옵션 [${index}]: ${selectedText} (${selectedValue})`);
          }
        } else {
          console.log(`장신구 옵션 [${index}]: 유효하지 않은 요소`);
        }
      });
    } else {
      console.log('장신구 옵션 요소가 없습니다.');
    }
    
    // 각인 스캔 항목 계산
    const engravingElements = {
      engravingNameElements,
      engravingLevelElements
    };
    let engravingScanCount = settings.scanEngraving ? EngravingScanner.prepareEngravingScan(engravingElements) : 0;
    
    // 카르마 스캔 항목 계산
    const karmaElements = {
      karmaRadioGroups,
      karmaCheckboxes
    };
    let karmaScanCount = settings.scanKarma ? KarmaScanner.prepareKarmaScan(karmaElements) : 0;
    
    // 아바타 스캔 항목 계산
    let avatarScanCount = settings.scanAvatar ? (LopecScanner.Scanners.AvatarScanner ? LopecScanner.Scanners.AvatarScanner.prepareAvatarScan(avatarElements) : 0) : 0;
    
    // 전체 스캔 항목 개수 설정
    BaseScanner.state.totalScans = armorScanCount + gemScanCount + accessoryScanCount + engravingScanCount + karmaScanCount + avatarScanCount;
    
    console.log(`스캔 준비 완료: 총 ${BaseScanner.state.totalScans}개 항목 (장비:${armorScanCount}, 보석:${gemScanCount}, 장신구:${accessoryScanCount}, 각인:${engravingScanCount}, 카르마:${karmaScanCount}, 아바타:${avatarScanCount})`);
    
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
      },
      
      // 아바타 요소
      avatarElements
    };
  }
  
  // 공개 API
  return {
    prepareElementsForScan
  };
})();