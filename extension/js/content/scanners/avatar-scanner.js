/**
 * 로펙 시뮬레이터 점수 분석기 - 아바타 스캐너 모듈
 * 아바타 장비(무기, 투구, 상의, 하의)의 등급에 따른 점수 변화를 스캔하는 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};

// 아바타 스캐너 모듈
LopecScanner.Scanners.AvatarScanner = (function() {
  // 기본 스캐너 참조
  const BaseScanner = LopecScanner.Scanners.BaseScanner;
  
  // 아바타 카테고리 매핑 (이름 => 설명)
  const AVATAR_CATEGORIES = {
    'weapon': '무기 아바타',
    'helmet': '투구 아바타',
    'armor': '상의 아바타',
    'pants': '하의 아바타'
  };
  
  // 아바타 등급 매핑 (클래스명 => 설명)
  const AVATAR_GRADES = {
    'none': '없음',
    'hero': '영웅',
    'legendary': '전설'
  };
  
  /**
   * 아바타 스캔 준비
   * @param {Object} avatarElements - 아바타 요소들 모음 객체
   * @return {number} - 스캔 항목 개수
   */
  function prepareAvatarScan(avatarElements) {
    let scanCount = 0;
    
    // 요소가 존재하는지 확인
    if (!avatarElements) {
      console.log('아바타 요소가 없습니다.');
      return scanCount;
    }
    
    console.log('아바타 스캔 준비 - 아바타 요소 확인:');
    
    // 라디오 버튼들 확인
    const radioCategories = Object.keys(AVATAR_CATEGORIES);
    const gradeClasses = Object.keys(AVATAR_GRADES);
    
    console.log(`아바타 카테고리: ${radioCategories.length}개, 등급: ${gradeClasses.length}개`);
    
    // 현재 값 저장 및 스캔 항목 계산
    for (const category of radioCategories) {
      let categoryRadios = [];
      let checkedGrade = null;
      let checkedIndex = -1;
      
      // 각 등급별 라디오 버튼 모음
      for (const grade of gradeClasses) {
        if (avatarElements[grade] && avatarElements[grade][category]) {
          categoryRadios.push({
            grade,
            radio: avatarElements[grade][category]
          });
          
          // 현재 선택된 라디오 버튼 확인
          if (avatarElements[grade][category].checked) {
            checkedGrade = grade;
            checkedIndex = categoryRadios.length - 1;
          }
        }
      }
      
      // 현재 선택된 아바타 등급 저장
      BaseScanner.state.originalValues[`avatar-${category}`] = checkedGrade || 'none';
      BaseScanner.state.originalValues[`avatar-${category}-index`] = checkedIndex >= 0 ? checkedIndex : 0;
      
      console.log(`${AVATAR_CATEGORIES[category]} 현재 등급: ${checkedGrade ? AVATAR_GRADES[checkedGrade] : '없음'}`);
      
      // 스캔할 항목 계산 - 현재 선택되지 않은 모든 등급
      const categoryItemCount = categoryRadios.length - (checkedIndex >= 0 ? 1 : 0);
      scanCount += categoryItemCount;
      
      console.log(`${AVATAR_CATEGORIES[category]} 스캔 항목: ${categoryItemCount}개 (총 ${categoryRadios.length}개 중 현재 선택 제외)`);
    }
    
    console.log(`아바타 스캔 항목 총계: ${scanCount}개`);
    return scanCount;
  }
  
  /**
   * 라디오 버튼 클릭 이벤트 발생
   * @param {HTMLInputElement} radio - 클릭할 라디오 버튼
   */
  async function clickRadio(radio) {
    // 디버그 정보 출력
    console.log(`아바타 라디오 버튼 클릭: name=${radio.name}, checked=${radio.checked}`);
    
    // 기존 값 저장
    const originalChecked = radio.checked;
    
    // 값 변경
    radio.checked = true;
    
    // 이벤트 발생 - 변경 이벤트와 클릭 이벤트 모두 발생
    const changeEvent = new Event('change', { bubbles: true });
    radio.dispatchEvent(changeEvent);
    
    const clickEvent = new MouseEvent('click', { bubbles: true });
    radio.dispatchEvent(clickEvent);
    
    // 값이 잘 변경되었는지 확인
    console.log(`아바타 라디오 버튼 클릭 후 상태: name=${radio.name}, checked=${radio.checked}`);
    
    // 변경되지 않았다면 다시 시도
    if (!radio.checked && !originalChecked) {
      console.warn(`아바타 라디오 버튼 값이 변경되지 않음. 다시 시도...`);
      setTimeout(() => {
        radio.click();
      }, 50);
    }
    
    // 변화가 적용될 시간 대기 - 조금 더 긴 시간으로 늘림
    await LopecScanner.Utils.delay(300);
  }
  
  /**
   * 아바타 스캔 실행
   * @param {Object} avatarElements - 아바타 요소들 모음 객체
   */
  async function scanAvatar(avatarElements) {
    console.log('아바타 스캔 시작');
    
    // 카테고리별 스캔
    const radioCategories = Object.keys(AVATAR_CATEGORIES);
    const gradeClasses = Object.keys(AVATAR_GRADES);
    
    for (const category of radioCategories) {
      // 현재 선택된 등급 정보 가져오기
      let originalGrade = 'none'; // 기본값은 '없음'
      let originalIndex = 0;
      
      try {
        originalGrade = BaseScanner.state.originalValues[`avatar-${category}`] || 'none';
        originalIndex = parseInt(BaseScanner.state.originalValues[`avatar-${category}-index`]) || 0;
        console.log(`${AVATAR_CATEGORIES[category]} 원래 등급: ${AVATAR_GRADES[originalGrade]} (인덱스 ${originalIndex})`);
      } catch (e) {
        console.error(`아바타 원래 등급 가져오기 오류:`, e);
      }
      
      console.log(`${AVATAR_CATEGORIES[category]} 스캔 시작:`);
      
      // 각 등급별 스캔
      for (const grade of gradeClasses) {
        // 이미 선택된 등급은 스킵
        if (grade === originalGrade) {
          console.log(`${AVATAR_CATEGORIES[category]} ${AVATAR_GRADES[grade]} - 이미 선택되어 있어 스킵`);
          continue;
        }
        
        if (!BaseScanner.state.isScanning) return;
        
        // 해당 등급의 라디오 버튼 가져오기
        const radio = avatarElements[grade] && avatarElements[grade][category];
        if (!radio) {
          console.warn(`${AVATAR_CATEGORIES[category]} ${AVATAR_GRADES[grade]} 라디오 버튼을 찾을 수 없음. 스킵.`);
          continue;
        }
        
        console.log(`${AVATAR_CATEGORIES[category]} ${AVATAR_GRADES[grade]} 스캔 시도...`);
        
        try {
          // 점수 확인 전 초기값 기록
          const initialScore = LopecScanner.Utils.getCurrentScore();
          
          // 라디오 버튼 클릭
          await clickRadio(radio);
          
          // 점수 변동을 모니터링
          const monitorDuration = 500; // 500ms로 설정
          let difference = 0;
          try {
            difference = await LopecScanner.Utils.monitorDifferenceChanges(monitorDuration);
          } catch (monitorError) {
            console.error(`아바타 변동 모니터링 오류:`, monitorError);
          }
          
          // 현재 점수 받아오기
          const newScore = LopecScanner.Utils.getCurrentScore();
          
          // 변동 계산 (모니터링에서 감지되지 않았다면 점수 차이로 계산)
          let calcDifference = difference;
          if (Math.abs(difference) < 0.001 && Math.abs(newScore - initialScore) > 0.001) {
            calcDifference = newScore - initialScore;
            console.log(`아바타 변동값 보정: 점수 차이 사용 ${calcDifference}`);
          }
          
          // 결과 저장
          const resultKey = `avatar-${category}-${grade}`;
          BaseScanner.state.scanResults[resultKey] = {
            type: AVATAR_CATEGORIES[category],
            category: category,
            item: `${AVATAR_CATEGORIES[category]} ${AVATAR_GRADES[grade]}`,
            from: AVATAR_GRADES[originalGrade],
            to: AVATAR_GRADES[grade],
            score: newScore,
            difference: calcDifference
          };
          
          console.log(`${AVATAR_CATEGORIES[category]} ${AVATAR_GRADES[grade]} 스캔 결과:`, {
            초기점수: initialScore,
            새점수: newScore,
            변화값: calcDifference
          });
          
          BaseScanner.updateScanProgress();
        } catch (e) {
          console.error(`아바타 스캔 오류 (${category} ${grade}):`, e);
          // 오류가 발생해도 계속 진행
          BaseScanner.updateScanProgress();
        }
      }
      
      // 원래 값으로 복원
      try {
        const originalRadio = avatarElements[originalGrade] && avatarElements[originalGrade][category];
        if (originalRadio) {
          console.log(`${AVATAR_CATEGORIES[category]} 원래 값으로 복원 시도...`);
          await clickRadio(originalRadio);
        } else {
          console.warn(`${AVATAR_CATEGORIES[category]} 원래 라디오 버튼을 찾을 수 없습니다.`);
        }
      } catch (e) {
        console.error(`아바타 복원 오류 (${category}):`, e);
      }
    }
    
    console.log('아바타 스캔 완료');
  }
  
  // 공개 API
  return {
    prepareAvatarScan,
    scanAvatar
  };
})();
