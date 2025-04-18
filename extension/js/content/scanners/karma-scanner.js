/**
 * 로펙 시뮬레이터 점수 분석기 - 카르마 스캐너 모듈
 * 카르마 관련 라디오 버튼 및 체크박스를 스캔하는 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 카르마 스캐너 모듈
LopecScanner.Scanners.KarmaScanner = (function() {
  // 기본 스캐너 참조
  const BaseScanner = LopecScanner.Scanners.BaseScanner;
  
  /**
   * 카르마 스캔 준비
   * @param {Object} elements - 카르마 요소들 모음 객체
   * @return {number} - 스캔 항목 개수
   */
  function prepareKarmaScan(elements) {
    let scanCount = 0;
    
    // 요소가 존재하는지 확인
    if (!elements) {
      return scanCount;
    }
    
    // 현재 값들 저장
    if (elements.karmaRadioGroups) {
      elements.karmaRadioGroups.forEach((group, groupIndex) => {
        const checkedRadio = Array.from(group).find(radio => radio.checked);
        if (checkedRadio) {
          BaseScanner.state.originalValues[`karma-radio-${groupIndex}`] = checkedRadio.value;
          // 현재 인덱스도 저장
          const currentIndex = Array.from(group).indexOf(checkedRadio);
          BaseScanner.state.originalValues[`karma-radio-index-${groupIndex}`] = currentIndex;
        }
      });
    }
    
    if (elements.karmaCheckboxes) {
      elements.karmaCheckboxes.forEach((checkbox, index) => {
        BaseScanner.state.originalValues[`karma-checkbox-${index}`] = checkbox.checked;
      });
    }
    // 스캔 항목 계산
    // 1. 카르마 랭크 라디오 버튼 스캔
    if (elements.karmaRadioGroups) {
      elements.karmaRadioGroups.forEach((group, groupIndex) => {
        if (group.length === 0) {
          console.warn(`그룹 ${groupIndex}에 라디오 버튼이 없습니다.`);
          return;
        }
        
        const checkedRadio = Array.from(group).find(radio => radio.checked);
        if (checkedRadio) {
          const currentIndex = Array.from(group).indexOf(checkedRadio);
          // 현재 선택된 것보다 높은 랭크만 스캔
          const groupScanCount = group.length - (currentIndex + 1);
          scanCount += groupScanCount;
          console.log(`라디오 그룹 ${groupIndex} 스캔 항목: ${groupScanCount}개 (선택된 인덱스 ${currentIndex}, 높은 랭크만 스캔)`);
        } else {
          // 아무것도 선택되지 않았으면 모든 옵션 스캔 (기본값 0번 제외)
          const groupScanCount = group.length - 1; // 기본값 0번은 스캔하지 않음
          scanCount += groupScanCount > 0 ? groupScanCount : 0;
          console.log(`라디오 그룹 ${groupIndex} 스캔 항목: ${groupScanCount}개 (선택된 것 없음, 1번 인덱스부터 스캔)`);
        }
      });
    }
    
    // 2. 카르마 체크박스 스캔
    if (elements.karmaCheckboxes) {
      let checkboxScanCount = 0;
      elements.karmaCheckboxes.forEach((checkbox, index) => {
        if (!checkbox) {
          console.warn(`체크박스 ${index} 요소가 없습니다.`);
          return;
        }
        
        // 체크되지 않은 체크박스만 스캔
        if (!checkbox.checked) {
          checkboxScanCount++;
          console.log(`체크박스 ${index} 스캔 항목에 추가 (체크되지 않음)`);
        }
      });
      
      console.log(`체크박스 스캔 항목 총 ${checkboxScanCount}개`);
      scanCount += checkboxScanCount;
    }
    
    console.log(`카르마 스캔 항목 총계: ${scanCount}개`);
    return scanCount;
  }
  
  /**
   * 라디오 버튼 클릭 이벤트 발생
   * @param {HTMLInputElement} radio - 클릭할 라디오 버튼
   */
  async function clickRadio(radio) {
    radio.checked = true;
    const event = new Event('change', { bubbles: true });
    radio.dispatchEvent(event);
    
    // 변화가 적용될 시간 대기
    await LopecScanner.Utils.delay(100);
  }
  
  /**
   * 체크박스 클릭 이벤트 발생
   * @param {HTMLInputElement} checkbox - 클릭할 체크박스
   * @param {boolean} checked - 체크 상태
   */
  async function clickCheckbox(checkbox, checked) {
    checkbox.checked = checked;
    const event = new Event('change', { bubbles: true });
    checkbox.dispatchEvent(event);
    
    // 변화가 적용될 시간 대기
    await LopecScanner.Utils.delay(100);
  }
  
  /**
   * 카르마 스캔 실행
   * @param {Object} elements - 카르마 요소들 모음 객체
   */
  async function scanKarma(elements) {
    // 1. 카르마 랭크 라디오 버튼 스캔
    if (elements.karmaRadioGroups) {
      for (let groupIndex = 0; groupIndex < elements.karmaRadioGroups.length; groupIndex++) {
        const group = elements.karmaRadioGroups[groupIndex];
        const originalCheckedIndex = parseInt(BaseScanner.state.originalValues[`karma-radio-index-${groupIndex}`]);
        // 현재 선택된 것보다 높은 랭크만 스캔
        for (let i = originalCheckedIndex + 1; i < group.length; i++) {
          if (!BaseScanner.state.isScanning) return;
          
          const radio = group[i];
          if (!radio) {
            console.warn(`라디오 그룹 ${groupIndex} 랭크 ${i} 요소가 없습니다. 스킵합니다.`);
            continue;
          }
          
          console.log(`라디오 그룹 ${groupIndex} 랭크 ${i} 스캔 시도...`);
          
          // 점수 확인 전 초기값 기록
          const initialScore = LopecScanner.Utils.getCurrentScore();
          
          try {
            // 라디오 버튼 클릭
            await clickRadio(radio);
            
            // 점수 변동을 모니터링 - 시간을 더 길게 주어 반응 시간 확보
            const monitorDuration = 500; // 500ms로 늘림
            let difference = 0;
            try {
              difference = await LopecScanner.Utils.monitorDifferenceChanges(monitorDuration);
            } catch (monitorError) {
              console.error(`변동 모니터링 오류:`, monitorError);
            }
            
            // 현재 점수 받아오기
            const newScore = LopecScanner.Utils.getCurrentScore();
            
            // 변동 계산 (모니터링에서 감지되지 않았다면 점수 차이로 계산)
            let calcDifference = difference;
            if (Math.abs(difference) < 0.001 && Math.abs(newScore - initialScore) > 0.001) {
              calcDifference = newScore - initialScore;
              console.log(`변동값 오류 보정: 점수 차이 사용 ${calcDifference}`);
            }
            
            // 카르마 타입 판별 (깨달음/도약)
            let karmaType = '카르마';
            if (group[0] && group[0].name === 'enlight-karma') {
              karmaType = '깨달음 카르마';
            } else if (group[0] && group[0].name === 'leaf-karma') {
              karmaType = '도약 카르마';
            }
            
            // 결과 저장
            BaseScanner.state.scanResults[`karma-radio-${groupIndex}-${i}`] = {
              type: 'karma',
              subType: karmaType,
              index: groupIndex,
              item: `${karmaType} 랭크 ${i}`,
              from: `랭크 ${originalCheckedIndex}`,
              to: `랭크 ${i}`,
              score: newScore,
              difference: calcDifference
            };
            
            console.log(`라디오 그룹 ${groupIndex} 랭크 ${i} 스캔 결과:`, {
              초기점수: initialScore,
              새점수: newScore,
              변화값: calcDifference
            });
            
            BaseScanner.updateScanProgress();
          } catch (e) {
            console.error(`카르마 라디오 스캔 오류:`, e);
            // 오류가 발생해도 계속 진행
            BaseScanner.updateScanProgress();
          }
        }
        
        // 원래 값으로 복원
        try {
          const originalRadio = group[originalCheckedIndex];
          if (originalRadio) {
            console.log(`라디오 그룹 ${groupIndex} 원래 값으로 복원 시도...`);
            await clickRadio(originalRadio);
          } else {
            console.warn(`라디오 그룹 ${groupIndex} 원래 라디오 요소를 찾을 수 없습니다.`);
          }
        } catch (e) {
          console.error(`라디오 복원 오류:`, e);
        }
      }
    }
    
    // 2. 카르마 체크박스 스캔
    if (elements.karmaCheckboxes) {
      console.log(`카르마 체크박스 스캔 시작 - 총 ${elements.karmaCheckboxes.length}개`);
      
      for (let i = 0; i < elements.karmaCheckboxes.length; i++) {
        const checkbox = elements.karmaCheckboxes[i];
        if (!checkbox) {
          console.warn(`체크박스 ${i}번 요소가 없습니다. 스킵합니다.`);
          continue;
        }
        
        // 원래 체크 상태 확인
        let originalChecked = false;
        try {
          originalChecked = BaseScanner.state.originalValues[`karma-checkbox-${i}`] || false;
          console.log(`체크박스 ${i}번 원래 상태: ${originalChecked}`);
        } catch (e) {
          console.error(`체크박스 원래 상태 가져오기 오류:`, e);
        }
        
        // 체크되지 않은 체크박스만 스캔 
        if (!originalChecked) {
          if (!BaseScanner.state.isScanning) return;
          
          console.log(`체크박스 ${i}번 스캔 시도...`);
          
          try {
            // 점수 확인 전 초기값 기록
            const initialScore = LopecScanner.Utils.getCurrentScore();
            
            // 체크박스 클릭
            await clickCheckbox(checkbox, true);
            
            // 점수 변동을 모니터링 - 시간을 더 길게 주어 반응 시간 확보
            const monitorDuration = 500; // 500ms로 늘림
            let difference = 0;
            try {
              difference = await LopecScanner.Utils.monitorDifferenceChanges(monitorDuration);
            } catch (monitorError) {
              console.error(`체크박스 변동 모니터링 오류:`, monitorError);
            }
            
            // 현재 점수 받아오기
            const newScore = LopecScanner.Utils.getCurrentScore();
            
            // 변동 계산 (모니터링에서 감지되지 않았다면 점수 차이로 계산)
            let calcDifference = difference;
            if (Math.abs(difference) < 0.001 && Math.abs(newScore - initialScore) > 0.001) {
              calcDifference = newScore - initialScore;
              console.log(`체크박스 변동값 보정: 점수 차이 사용 ${calcDifference}`);
            }
            
            // 옵션 텍스트 가져오기 - 안전하게 처리
            let optionText = `옵션 ${i+1}`;
            try {
              if (checkbox.nextElementSibling) {
                optionText = checkbox.nextElementSibling.textContent || optionText;
              }
            } catch (e) {
              console.warn(`옵션 텍스트 가져오기 오류:`, e);
            }
            
            // 결과 저장
            BaseScanner.state.scanResults[`karma-checkbox-${i}`] = {
              type: 'karma',
              subType: '카르마 옵션',
              index: i,
              item: optionText,
              from: '미적용',
              to: '적용',
              score: newScore,
              difference: calcDifference
            };
            
            console.log(`체크박스 ${i}번 (${optionText}) 스캔 결과:`, {
              초기점수: initialScore,
              새점수: newScore,
              변화값: calcDifference
            });
            
            BaseScanner.updateScanProgress();
            
            // 원래 값으로 복원
            try {
              console.log(`체크박스 ${i}번 원래 값으로 복원 시도...`);
              await clickCheckbox(checkbox, originalChecked);
            } catch (e) {
              console.error(`체크박스 복원 오류:`, e);
            }
          } catch (e) {
            console.error(`체크박스 ${i}번 스캔 오류:`, e);
            // 오류가 발생해도 계속 진행
            BaseScanner.updateScanProgress();
          }
        } else {
          console.log(`체크박스 ${i}번은 이미 체크되어 있어 스캔하지 않습니다.`);
        }
      }
      
      console.log('카르마 체크박스 스캔 완료');
    } else {
      console.log('카르마 체크박스 없음');
    }
  }
  
  // 공개 API
  return {
    prepareKarmaScan,
    scanKarma
  };
})();
