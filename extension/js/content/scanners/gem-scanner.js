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
    
    // 디버깅 정보 출력
    console.log(`보석 스캔 준비: ${gemLevelElements.length}개 보석 발견`);
    
    // 현재 값들 저장
    gemLevelElements.forEach((element, index) => {
      const value = element.value;
      BaseScanner.state.originalValues[`gem-level-${index}`] = value;
      console.log(`보석 ${index} 원본 값 저장: ${value}`);
    });
    
    // 보석 스캔 갯수 계산
    gemLevelElements.forEach((element, index) => {
      const currentValue = parseInt(element.value);
      const maxValue = parseInt(element.getAttribute('data-max') || 10);
      
      console.log(`보석 ${index}: 현재 레벨 = ${currentValue}, 최대 레벨 = ${maxValue}`);
      
      for (let newValue = currentValue + 1; newValue <= maxValue; newValue++) {
        scanCount++;
      }
    });
    
    console.log(`보석 스캔 준비 완료: 총 ${scanCount}개 항목 스캔 예정`);
    return scanCount;
  }
  
  /**
   * 보석 스캔 (새로운 방식: 한 보석 완전 순회 후 다음으로 이동)
   * @param {NodeList} gemLevelElements - 보석 레벨 콤보박스 요소들
   */
  async function scanGems(gemLevelElements) {
    console.log(`보석 스캔 시작: ${gemLevelElements.length}개 보석 처리`);
    
    for (let i = 0; i < gemLevelElements.length; i++) {
      const element = gemLevelElements[i];
      const currentValue = parseInt(element.value);
      const maxValue = parseInt(element.getAttribute('data-max') || 10);
      
      // 보석 타입과 스킬 정보 가져오기
      let gemType = "알 수 없음";
      let skillName = "";
      
      try {
        // 보석 타입 (멸화/홍염) 가져오기
        const typeElement = element.nextElementSibling;
        if (typeElement && typeElement.tagName === 'SELECT') {
          const selectedOption = typeElement.options[typeElement.selectedIndex];
          gemType = selectedOption ? selectedOption.textContent : typeElement.value;
        }
        
        // 스킬 이름 가져오기
        const gemContainer = element.closest('.gem-box');
        if (gemContainer) {
          const skillElement = gemContainer.querySelector('.skill');
          if (skillElement) {
            skillName = skillElement.textContent.trim();
          }
        }
        
        // 로그 추가
        console.log(`보석 정보 추출: 레벨=${currentValue}, 타입=${gemType}, 스킬=${skillName}`);
      } catch (e) {
        console.error(`보석 ${i} 정보 추출 오류:`, e);
      }
      
      console.log(`보석 ${i} 스캔: ${gemType} ${skillName}, 현재 레벨 = ${currentValue}, 최대 레벨 = ${maxValue}`);
      
      // 현재값부터 최대값까지 순회
      for (let newValue = currentValue + 1; newValue <= maxValue; newValue++) {
        if (!BaseScanner.state.isScanning) {
          console.log('스캔이 중단되었습니다.');
          return;
        }
        
        console.log(`보석 ${i} 레벨 변경: ${currentValue} -> ${newValue}`);
        
        // 값 변경 및 변동 확인
        const result = await BaseScanner.changeValueAndCheckDifference(element, newValue.toString());
        
        // 결과 저장
        const resultKey = `gem-level-${i}-${newValue}`;
        // 보석 표시 형식 개선
        const gemDisplayName = `보석 (${gemType} ${skillName})`;
        
        BaseScanner.state.scanResults[resultKey] = {
          type: 'gem',  // type을 'gem'으로 변경 (스캔 결과의 'type' 필드가 영문 카테고리 이름이어야 함)
          index: i,
          item: gemDisplayName,
          from: `${currentValue}레벨`,
          to: `${newValue}레벨`,
          gemType: gemType,      // 보석 타입 추가
          skillName: skillName,  // 스킬 이름 추가
          score: result.score,
          difference: result.difference
        };
        
        console.log(`보석 ${i} 레벨 ${newValue} 스캔 결과: 점수 변화 = ${result.difference}`);
        
        BaseScanner.updateScanProgress();
      }
      
      // 원래 값으로 복원
      const originalValue = BaseScanner.state.originalValues[`gem-level-${i}`];
      console.log(`보석 ${i} 원래 값으로 복원: ${originalValue}`);
      await BaseScanner.changeValueAndCheckDifference(element, originalValue);
    }
    
    console.log('보석 스캔 완료');
  }
  
  // 공개 API
  return {
    prepareGemScan,
    scanGems
  };
})();
