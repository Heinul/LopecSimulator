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
   * 원래 값으로 복원 - 완전 재작성 버전
   */
  async function restoreOriginalValues() {
    console.log('원래 값으로 복원 시작...');

    try {
      // 키 그룹화 - 타입별로 키를 분류하고 각 타입별로 처리
      const keysByType = {};
      
      // 원본 값 키를 타입별로 분류
      for (const key in state.originalValues) {
        // 키에서 타입 추출 (예: 'accessory-option-0' -> 'accessory')
        const type = key.split('-')[0];
        
        if (!keysByType[type]) {
          keysByType[type] = [];
        }
        
        keysByType[type].push(key);
      }
      
      // 각 타입별로 복원 처리
      for (const type in keysByType) {
        console.log(`=== ${type} 타입 복원 시작 (${keysByType[type].length}개 항목) ===`);
        
        switch (type) {
          case 'accessory':
            await restoreAccessories(keysByType[type]);
            break;
          case 'armor':
            await restoreArmor(keysByType[type]);
            break;
          case 'gem':
            await restoreGems(keysByType[type]);
            break;
          default:
            console.log(`${type} 타입은 아직 복원 처리가 구현되지 않았습니다.`);
        }
      }
      
      console.log('모든 값 복원 완료');
      
    } catch (e) {
      console.error('원래 값 복원 중 오류 발생:', e);
    }
  }
  
  /**
   * 장신구 복원 처리
   * @param {Array} keys - 장신구 관련 키 배열
   */
  async function restoreAccessories(keys) {
    // 장신구 옵션 키만 필터링
    const optionKeys = keys.filter(key => key.includes('-option-') && !key.includes('text'));
    
    if (optionKeys.length === 0) {
      console.log('복원할 장신구 옵션이 없습니다.');
      return;
    }
    
    console.log(`${optionKeys.length}개의 장신구 옵션 복원 시작`);
    
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
    
    console.log('장신구 복원 완료');
  }
  
  /**
   * 장비 복원 처리
   * @param {Array} keys - 장비 관련 키 배열
   */
  async function restoreArmor(keys) {
    if (keys.length === 0) {
      console.log('복원할 장비가 없습니다.');
      return;
    }
    
    console.log(`${keys.length}개의 장비 값 복원 시작`);
    
    // 장비 이름과 강화도 복원
    const nameKeys = keys.filter(key => key.includes('-name-'));
    const upgradeKeys = keys.filter(key => key.includes('-upgrade-'));
    
    // 장비 이름 복원
    if (nameKeys.length > 0) {
      console.log(`${nameKeys.length}개의 장비 이름 복원`);
      const nameSelects = document.querySelectorAll('.armor-name');
      
      for (const key of nameKeys) {
        try {
          // 인덱스 추출 (예: 'armor-name-0' -> 0)
          const index = parseInt(key.split('-')[2]);
          
          if (!isNaN(index) && index >= 0 && index < nameSelects.length) {
            const value = state.originalValues[key];
            nameSelects[index].value = value;
            const event = new Event('change', { bubbles: true });
            nameSelects[index].dispatchEvent(event);
            await LopecScanner.Utils.delay(100);
            console.log(`장비 이름 복원 성공: 인덱스 ${index}, 값 ${value}`);
          } else {
            console.warn(`장비 이름 인덱스 범위 초과 또는 유효하지 않음: ${key} (인덱스: ${index}, 총 요소: ${nameSelects.length})`);
          }
        } catch (e) {
          console.error(`장비 이름 복원 오류: ${key}`, e);
        }
      }
    }
    
    // 장비 강화도 복원
    if (upgradeKeys.length > 0) {
      console.log(`${upgradeKeys.length}개의 장비 강화도 복원`);
      const upgradeSelects = document.querySelectorAll('.armor-upgrade');
      
      for (const key of upgradeKeys) {
        try {
          // 인덱스 추출 (예: 'armor-upgrade-0' -> 0)
          const index = parseInt(key.split('-')[2]);
          
          if (!isNaN(index) && index >= 0 && index < upgradeSelects.length) {
            const value = state.originalValues[key];
            upgradeSelects[index].value = value;
            const event = new Event('change', { bubbles: true });
            upgradeSelects[index].dispatchEvent(event);
            await LopecScanner.Utils.delay(100);
            console.log(`장비 강화도 복원 성공: 인덱스 ${index}, 값 ${value}`);
          } else {
            console.warn(`장비 강화도 인덱스 범위 초과 또는 유효하지 않음: ${key} (인덱스: ${index}, 총 요소: ${upgradeSelects.length})`);
          }
        } catch (e) {
          console.error(`장비 강화도 복원 오류: ${key}`, e);
        }
      }
    }
    
    console.log('장비 복원 완료');
  }
  
  /**
   * 보석 복원 처리
   * @param {Array} keys - 보석 관련 키 배열
   */
  async function restoreGems(keys) {
    if (keys.length === 0) {
      console.log('복원할 보석이 없습니다.');
      return;
    }
    
    console.log(`${keys.length}개의 보석 값 복원 시작`);
    
    // 보석 레벨 선택자
    const gemLevelElements = document.querySelectorAll('select[name="ArmoryGem Gems Level"]');
    console.log(`발견된 보석 레벨 요소: ${gemLevelElements.length}개`);
    
    // 보석 정보 출력 (디버깅용)
    console.log('각 보석 레벨 요소 정보:');
    for (let i = 0; i < gemLevelElements.length; i++) {
      console.log(`  보석 ${i}: 현재 레벨 = ${gemLevelElements[i].value}`);
    }
    
    // 원본 값 출력 (디버깅용)
    console.log('저장된 보석 원본 값:');
    const gemLevelKeys = keys.filter(key => key.startsWith('gem-level-'));
    for (const key of gemLevelKeys) {
      console.log(`  ${key}: ${state.originalValues[key]}`);
    }
    
    // 각 보석 키를 처리
    for (const key of gemLevelKeys) {
      try {
        // 인덱스 추출 (수정된 부분: 정규식 사용)
        const match = key.match(/^gem-level-(\d+)$/);
        
        if (match && match[1]) {
          const index = parseInt(match[1]);
          
          if (!isNaN(index) && index >= 0 && index < gemLevelElements.length) {
            const value = state.originalValues[key];
            gemLevelElements[index].value = value;
            const event = new Event('change', { bubbles: true });
            gemLevelElements[index].dispatchEvent(event);
            await LopecScanner.Utils.delay(80);
            console.log(`보석 복원 성공: ${key} (인덱스: ${index}, 값: ${value})`);
          } else {
            console.warn(`보석 인덱스 범위 초과 또는 유효하지 않음: ${key} (인덱스: ${index}, 총 보석: ${gemLevelElements.length})`);
          }
        } else {
          console.warn(`보석 키 형식이 유효하지 않음: ${key}`);
        }
      } catch (e) {
        console.error(`보석 복원 오류: ${key}`, e);
      }
    }
    
    console.log('보석 복원 완료');
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
