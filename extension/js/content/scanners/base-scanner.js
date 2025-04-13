/**
 * 로펙 시뮬레이터 점수 분석기 - 기본 스캐너 모듈
 * 모든 스캐너 모듈의 기본 기능을 제공
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 기본 스캐너 모듈
LopecScanner.Scanners.BaseScanner = (function() {
  // 모듈 내부 공유 변수들
  const state = {
    isScanning: false,
    originalValues: {},
    scanResults: {},
    totalScans: 0,
    completedScans: 0
  };
  
  /**
   * 엘리먼트 값 변경 및 변동 확인
   * @param {HTMLElement} element - 값을 변경할 엘리먼트
   * @param {string} newValue - 새로 설정할 값
   * @return {Object} - 변경 후 점수와 변동 값
   */
  async function changeValueAndCheckDifference(element, newValue) {
    // 기존 화면의 점수를 저장
    const initialScore = LopecScanner.Utils.getCurrentScore();
    console.log(`변경 전 초기값: ${element.value}, 점수: ${initialScore}`);
    
    // 값 변경
    element.value = newValue;
    
    // 변경 이벤트 발생
    const event = new Event('change', { bubbles: true });
    element.dispatchEvent(event);
    
    // 점수 변경을 기다림 - 딜레이 적용용
    await LopecScanner.Utils.delay(200);
    
    // 현재 점수 및 변동값 읽기
    let newScore = LopecScanner.Utils.getCurrentScore();
    let difference = LopecScanner.Utils.getCurrentDifference();
    
    // 변동을 지정된 시간 동안 모니터링
    const monitorDuration = 500;
    
    // 초기 읽을 경우 변동이 없을 때
    if (Math.abs(difference) < 0.001) {
      console.log('초기 변동값이 감지되지 않음. 모니터링 확장...');
      
      // 추가 딜레이 후 다시 시도
      difference = await LopecScanner.Utils.monitorDifferenceChanges(monitorDuration);
      newScore = LopecScanner.Utils.getCurrentScore(); // 점수 다시 읽기
    }
    
    const scoreDiff = newScore - initialScore;
    
    console.log(`변경 후 값: ${newValue}, 점수: ${newScore}, 값 변동: ${difference}, 점수 변화: ${scoreDiff}`);
    
    // 변동이 감지되지 않았지만 점수가 변경되었다면 점수 차이 사용
    if (Math.abs(difference) < 0.001 && Math.abs(scoreDiff) > 0.001) {
      console.log(`표시된 변동값은 없지만 점수가 변경됨. 계산된 변동값: ${scoreDiff} 사용`);
      return {
        score: newScore,
        difference: scoreDiff
      };
    }
    
    // 어떤 변동도 감지되지 않았지만 값이 실제로 변경된 경우
    if (Math.abs(difference) < 0.001 && Math.abs(scoreDiff) < 0.001 && element.value !== newValue) {
      console.log('변동값이 감지되지 않았지만 값이 변경됨. 표준 변동값 0.01 사용');
      return {
        score: newScore,
        difference: 0.01 // 디폴트 미세 변동값 사용
      };
    }
    
    // 어떤 경우라도 결과 반환
    return {
      score: newScore,
      difference: difference || scoreDiff || 0
    };
  }

  /**
   * 스캔 진행 상황 업데이트
   */
  function updateScanProgress() {
    state.completedScans++;
    const progress = Math.floor((state.completedScans / state.totalScans) * 100);
    
    // UI 업데이트
    LopecScanner.UI.updateProgress(progress);
  }

  /**
   * 원래 값으로 복원 - 단순화된 버전
   */
  async function restoreOriginalValues() {
    console.log('원래 값으로 복원 시작...');

    try {
      // 장신구 복원
      console.log('장신구 값 복원 시작');
      
      const accessoryOptionKeys = [];
      for (const key in state.originalValues) {
        // 장신구 옵션 키를 배열에 추가
        if (key.startsWith('accessory-option-') && !key.includes('text')) {
          accessoryOptionKeys.push(key);
        }
      }
      
      // 장신구 아이템 리스트 가져오기
      const accessoryItems = document.querySelectorAll('.accessory-item.accessory');
      console.log(`총 ${accessoryItems.length}개의 장신구 아이템 발견`);
      
      // 각 장신구 아이템에 대해
      for (let i = 0; i < accessoryItems.length; i++) {
        const item = accessoryItems[i];
        
        // 장신구 타입 확인
        let accessoryType = 'unknown';
        const img = item.querySelector('img');
        if (img) {
          const src = img.src.toLowerCase();
          if (src.includes('acc_215')) {
            accessoryType = '목걸이';
          } else if (src.includes('acc_11')) {
            accessoryType = '귀걸이';
          } else if (src.includes('acc_22')) {
            accessoryType = '반지';
          }
        }
        
        // 현재 장신구의 옵션 셀렉트 요소들
        const optionSelects = item.querySelectorAll('.option.tooltip-text');
        
        // 각 옵션 셀렉트마다
        for (let j = 0; j < optionSelects.length; j++) {
          // 현재 장신구 옵션의 인덱스 계산
          const globalIndex = (i * optionSelects.length) + j;
          const optionKey = `accessory-option-${globalIndex}`;
          
          // 원래 값이 있으면 복원
          if (state.originalValues.hasOwnProperty(optionKey)) {
            const value = state.originalValues[optionKey];
            console.log(`${accessoryType} ${i+1} 옵션 ${j+1} 복원: ${optionSelects[j].value} => ${value}`);
            
            try {
              // 값 변경 및 이벤트 발생
              optionSelects[j].value = value;
              const event = new Event('change', { bubbles: true });
              optionSelects[j].dispatchEvent(event);
              
              // 목걸이의 경우 더 긴 딜레이 제공
              if (accessoryType === '목걸이') {
                await LopecScanner.Utils.delay(200);
              } else {
                await LopecScanner.Utils.delay(100);
              }
            } catch (e) {
              console.error(`장신구 옵션 복원 오류 (${accessoryType} ${i+1} 옵션 ${j+1}):`, e);
            }
          }
        }
        
        // 각 장신구마다 추가 딜레이
        if (accessoryType === '목걸이') {
          await LopecScanner.Utils.delay(300); // 목걸이는 더 긴 딜레이
        } else {
          await LopecScanner.Utils.delay(100);
        }
      }
      
      // 장신구 티어 복원 (별도로 처리, 필요한 경우 주석 해제)
      // for (const key in state.originalValues) {
      //   if (key.startsWith('accessory-tier-')) {
      //     const tierIndex = key.split('-')[2];
      //     if (!isNaN(tierIndex)) {
      //       try {
      //         const tierSelects = document.querySelectorAll('.accessory-item.accessory select.tier.accessory');
      //         if (tierSelects[tierIndex]) {
      //           const value = state.originalValues[key];
      //           console.log(`장신구 티어 복원 시도: ${tierIndex} => ${value}`);
      //           
      //           tierSelects[tierIndex].value = value;
      //           const event = new Event('change', { bubbles: true });
      //           tierSelects[tierIndex].dispatchEvent(event);
      //           await LopecScanner.Utils.delay(80);
      //         }
      //       } catch (e) {
      //         console.error(`장신구 티어 복원 오류 (${tierIndex}):`, e);
      //       }
      //     }
      //   }
      // }
      
      // 장비와 보석 복원 (기존 방식 유지)
      const restoreTypes = ['armor', 'gem'];
      for (const restoreType of restoreTypes) {
        for (const key in state.originalValues) {
          if (!key.startsWith(`${restoreType}-`)) continue;
          
          const [type, index] = key.split('-').slice(0, 2);
          const value = state.originalValues[key];
          
          console.log(`${type} 복원 시도: ${key} => ${value}`);
          
          let selector;
          if (type === 'armor' && key.includes('name')) {
            selector = '.armor-name';
          } else if (type === 'armor' && key.includes('upgrade')) {
            selector = '.armor-upgrade';
          } else if (type === 'gem') {
            selector = 'select[name="ArmoryGem Gems Level"]';
          }
          
          if (selector) {
            const elements = document.querySelectorAll(selector);
            if (elements[index]) {
              try {
                elements[index].value = value;
                const event = new Event('change', { bubbles: true });
                elements[index].dispatchEvent(event);
                await LopecScanner.Utils.delay(80);
                console.log(`${type} 복원 성공: ${key} => ${value}`);
              } catch (e) {
                console.error(`${type} 복원 실패: ${key}`, e);
              }
            } else {
              console.warn(`${type} 요소를 찾을 수 없음: ${key}`);
            }
          }
        }
      }
    } catch (e) {
      console.error('원래 값 복원 중 오류 발생:', e);
    }
    
    console.log('복원 완료');
  }
  
  /**
   * 스캔 완료 처리
   */
  async function finishScan() {
    state.isScanning = false;
    
    // 오버레이 제거
    LopecScanner.UI.removeOverlay();
    
    // 확장 프로그램에 완료 알림
    chrome.runtime.sendMessage({
      action: 'scanComplete'
    });
    
    // 데이터 저장
    chrome.runtime.sendMessage({
      action: 'saveData',
      data: state.scanResults
    });
  }
  
  // 공개 API
  return {
    state,
    changeValueAndCheckDifference,
    updateScanProgress,
    restoreOriginalValues,
    finishScan
  };
})();
