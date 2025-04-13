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
        const checkedRadio = Array.from(group).find(radio => radio.checked);
        if (checkedRadio) {
          const currentIndex = Array.from(group).indexOf(checkedRadio);
          // 현재 선택된 것보다 높은 랭크만 스캔
          scanCount += group.length - (currentIndex + 1);
        } else {
          // 아무것도 선택되지 않았으면 모든 옵션 스캔
          scanCount += group.length;
        }
      });
    }
    
    // 2. 카르마 체크박스 스캔
    if (elements.karmaCheckboxes) {
      elements.karmaCheckboxes.forEach(checkbox => {
        // 체크되지 않은 체크박스만 스캔
        if (!checkbox.checked) {
          scanCount++;
        }
      });
    }
    
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
          
          // 점수 확인 전 초기값 기록
          const initialScore = LopecScanner.Utils.getCurrentScore();
          
          // 라디오 버튼 클릭
          await clickRadio(radio);
          
          // 점수 변동을 모니터링
          const monitorDuration = 300;
          const difference = await LopecScanner.Utils.monitorDifferenceChanges(monitorDuration);
          
          // 현재 점수 받아오기
          const newScore = LopecScanner.Utils.getCurrentScore();
          
          // 변동 계산 (모니터링에서 감지되지 않았다면 점수 차이로 계산)
          let calcDifference = difference;
          if (Math.abs(difference) < 0.001 && Math.abs(newScore - initialScore) > 0.001) {
            calcDifference = newScore - initialScore;
          }
          
          // 카르마 타입 판별 (깨달음/도약)
          let karmaType = '카르마';
          if (group[0].name === 'enlight-karma') {
            karmaType = '깨달음 카르마';
          } else if (group[0].name === 'leaf-karma') {
            karmaType = '도약 카르마';
          }
          
          // 결과 저장
          BaseScanner.state.scanResults[`karma-radio-${groupIndex}-${i}`] = {
            type: karmaType,
            index: groupIndex,
            item: `${karmaType} 랭크 ${i}`,
            from: `랭크 ${originalCheckedIndex}`,
            to: `랭크 ${i}`,
            score: newScore,
            difference: calcDifference
          };
          
          BaseScanner.updateScanProgress();
        }
        
        // 원래 값으로 복원
        const originalRadio = group[originalCheckedIndex];
        await clickRadio(originalRadio);
      }
    }
    
    // 2. 카르마 체크박스 스캔
    if (elements.karmaCheckboxes) {
      for (let i = 0; i < elements.karmaCheckboxes.length; i++) {
        const checkbox = elements.karmaCheckboxes[i];
        const originalChecked = BaseScanner.state.originalValues[`karma-checkbox-${i}`];
        
        // 체크되지 않은 체크박스만 스캔
        if (!originalChecked) {
          if (!BaseScanner.state.isScanning) return;
          
          // 점수 확인 전 초기값 기록
          const initialScore = LopecScanner.Utils.getCurrentScore();
          
          // 체크박스 클릭
          await clickCheckbox(checkbox, true);
          
          // 점수 변동을 모니터링
          const monitorDuration = 300;
          const difference = await LopecScanner.Utils.monitorDifferenceChanges(monitorDuration);
          
          // 현재 점수 받아오기
          const newScore = LopecScanner.Utils.getCurrentScore();
          
          // 변동 계산 (모니터링에서 감지되지 않았다면 점수 차이로 계산)
          let calcDifference = difference;
          if (Math.abs(difference) < 0.001 && Math.abs(newScore - initialScore) > 0.001) {
            calcDifference = newScore - initialScore;
          }
          
          // 옵션 텍스트 가져오기
          const optionText = checkbox.nextElementSibling?.textContent || `옵션 ${i+1}`;
          
          // 결과 저장
          BaseScanner.state.scanResults[`karma-checkbox-${i}`] = {
            type: '카르마 옵션',
            index: i,
            item: optionText,
            from: '미적용',
            to: '적용',
            score: newScore,
            difference: calcDifference
          };
          
          BaseScanner.updateScanProgress();
          
          // 원래 값으로 복원
          await clickCheckbox(checkbox, originalChecked);
        }
      }
    }
  }
  
  // 공개 API
  return {
    prepareKarmaScan,
    scanKarma
  };
})();
