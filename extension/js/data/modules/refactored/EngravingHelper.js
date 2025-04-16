/**
 * 각인서 관련 헬퍼 함수 모음
 */

/**
 * 각인서 API 요청 파라미터 수정
 * 잘못된 파라미터를 개선하는 함수
 * @param {Object} item - 각인서 아이템
 * @param {string} itemName - 추출된 이름
 * @param {string} grade - 등급(전설, 유물 등)
 * @returns {Object} 수정된 파라미터
 */
function fixEngravingAPIRequest(item, itemName, grade) {
  console.log('각인서 API 요청 수정 전:', { itemName, grade });
  
  // 이름 수정
  let fixedName = itemName;
  let fixedGrade = grade || '전설';
  
  // 이름에 등급이 포함된 경우 수정
  if (fixedName.includes('전설') || fixedName.includes('유물')) {
    // 각인서 이름 목록에서 찾기
    const knownEngravings = [
      '타격의 대가', '강화 방패', '기동방박', '금지 패턴',
      '아드레날린', '시너지', '창수의 기술', '실드 스트라이크',
      '주술의 대가', '전문가', '금공장', '기동거', '얼괴마루', '조절', '상장'
    ];
    
    // 알려진 각인서와 일치하는지 확인
    for (const name of knownEngravings) {
      if (item.item.includes(name)) {
        fixedName = name;
        break;
      }
    }
    
    // 여전히 이름에 등급이 포함된 경우
    if (fixedName.includes('전설')) {
      // 전설 제거
      fixedName = fixedName.replace('전설', '').trim();
      fixedGrade = '전설';
    } else if (fixedName.includes('유물')) {
      // 유물 제거
      fixedName = fixedName.replace('유물', '').trim();
      fixedGrade = '유물';
    }
  }
  
  // 직접 각인서 이름 확인
  if (item.item.includes('타격의 대가')) {
    fixedName = '타격의 대가';
  } else if (item.item.includes('주술의 대가')) {
    fixedName = '주술의 대가';
  } else if (item.item.includes('금지 패턴')) {
    fixedName = '금지 패턴';
  }
  
  // Lv. 또는 숫자 제거
  fixedName = fixedName.replace(/Lv\.?\s*\d+/g, '').trim();
  fixedName = fixedName.replace(/\s+\d+/, '').trim();
  
  console.log('각인서 API 요청 수정 후:', { fixedName, fixedGrade });
  
  return {
    name: fixedName,
    grade: fixedGrade
  };
}

/**
 * 각인서 정보에서 이름만 추출
 * @param {string} itemText - 각인서 전체 텍스트
 * @returns {string} 추출된 각인서 이름
 */
function extractEngravingName(itemText) {
  if (!itemText) return '알 수 없음';
  
  // 예시: "주술의 전설서" -> "주술의"
  // 예시: "전설 주술의 Lv.3" -> "주술의"
  // 다양한 패턴 지원
  
  // 패턴 1: 첫 번째 한글 단어를 각인 이름으로 가정
  const pattern1 = /^\s*([\uac00-\ud7a3A-Za-z0-9]+)\s/;
  const match1 = itemText.match(pattern1);
  
  if (match1 && match1[1]) {
    return match1[1].trim();
  }
  
  // 패턴 2: 등급을 제외한 첫 번째 단어
  const pattern2 = /^\s*(?:\uc804\uc124|\uc720\ubb3c|\uc601\uc6c5|\uace0\ub300)\s+([\uac00-\ud7a3A-Za-z0-9]+)/;
  const match2 = itemText.match(pattern2);
  
  if (match2 && match2[1]) {
    return match2[1].trim();
  }
  
  // 패턴 3: Lv 패턴 제거
  const pattern3 = /^\s*([\uac00-\ud7a3A-Za-z0-9]+)\s+Lv\./;
  const match3 = itemText.match(pattern3);
  
  if (match3 && match3[1]) {
    return match3[1].trim();
  }
  
  // 그 외의 경우 공백으로 분리해서 첫 번째 단어 사용
  const parts = itemText.split(/\s+/);
  if (parts.length > 0) {
    return parts[0].trim();
  }
  
  // 여전히 추출 실패시 전체 사용
  return itemText;
}

/**
 * 각인서 필요 수량 계산
 * @param {string} fromGrade - 시작 등급 (예: legendary, relic)
 * @param {number} fromLevel - 시작 레벨 (0-4)
 * @param {string} toGrade - 목표 등급 (예: legendary, relic)
 * @param {number} toLevel - 목표 레벨 (0-4)
 * @returns {Object} 등급별 필요 수량 정보
 */
function calculateDetailedEngravingBooks(fromGrade, fromLevel, toGrade, toLevel) {
  // 등급 순서
  const gradeOrder = ['영웅', '전설', '유물'];
  
  // 등급 인덱스
  const fromGradeIndex = gradeOrder.indexOf(fromGrade);
  const toGradeIndex = gradeOrder.indexOf(toGrade);
  
  // 결과 객체 초기화
  const result = {
    totalBooks: 0,
    byGrade: {} // 각 등급별 필요 책 수량
  };
  
  // 유효한 등급 확인
  if (fromGradeIndex === -1 || toGradeIndex === -1) {
    console.error('유효하지 않은 등급입니다:', fromGrade, toGrade);
    return result;
  }
  
  // 레벨 확인 (0~4 사이)
  if (fromLevel < 0 || fromLevel > 4 || toLevel < 0 || toLevel > 4) {
    console.error('유효하지 않은 레벨입니다:', fromLevel, toLevel);
    return result;
  }
  
  // 상향 조건 확인
  if (fromGradeIndex > toGradeIndex || (fromGradeIndex === toGradeIndex && fromLevel >= toLevel)) {
    console.error('상향 조건이 충족되지 않습니다:', fromGrade, fromLevel, '->', toGrade, toLevel);
    return result;
  }
  
   // 같은 등급 내 레벨 업그레이드
  if (fromGradeIndex === toGradeIndex) {
    const booksNeeded = (toLevel - fromLevel) * 5;
    result.totalBooks = booksNeeded;
    result.byGrade[fromGrade] = booksNeeded;
  } else {
    // 시작 등급에서 남은 레벨 채우기
    const booksForFromGrade = (4 - fromLevel) * 5;
    result.totalBooks += booksForFromGrade;
    result.byGrade[fromGrade] = booksForFromGrade;
    
    // 중간 등급들
    for (let i = fromGradeIndex + 1; i < toGradeIndex; i++) {
      const grade = gradeOrder[i];
      result.byGrade[grade] = 20; // 한 등급 전체 (0->4)는 20장
      result.totalBooks += 20;
    }
    
    // 목표 등급
    const booksForToGrade = toLevel * 5;
    result.totalBooks += booksForToGrade;
    result.byGrade[toGrade] = booksForToGrade;
  }
  
  return result;
}

export {
  fixEngravingAPIRequest,
  extractEngravingName,
  calculateDetailedEngravingBooks
};