/**
 * 로펙 시뮬레이터 점수 분석기 - 장신구 탐지 모듈
 * 장신구 요소 탐지 및 관련 정보 수집 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};
window.LopecScanner.Scanners.Accessory = window.LopecScanner.Scanners.Accessory || {};

// 장신구 탐지 모듈
LopecScanner.Scanners.Accessory.Detector = (function() {
  /**
   * 장신구 타입 감지
   * @param {HTMLElement} element - 장신구 옵션 요소
   * @return {string} - 감지된 장신구 타입 (necklace, earring, ring 또는 unknown)
   */
  function detectAccessoryType(element) {
    // 1. 장신구 실제 DOM 구조 확인
    const parentLi = element.closest('li.accessory-item.accessory');
    if (!parentLi) return 'unknown';
    
    // 2. accessory-list 내에서의 인덱스 확인
    const accessoryItems = document.querySelectorAll('.accessory-list .accessory-item.accessory');
    const itemsArray = Array.from(accessoryItems);
    const itemIndex = itemsArray.indexOf(parentLi);
    
    // 인덱스 기반 구분 (가장 안정적인 방법)
    if (itemIndex >= 0) {
      console.log(`장신구 인덱스 기반 타입 구분: 인덱스 ${itemIndex}`);
      
      // 일반적으로 첫 번째는 목걸이, 두번째와 세번째는 귀걸이, 네번째와 다섯번째는 반지
      if (itemIndex === 0) {
        return 'necklace'; // 목걸이
      } else if (itemIndex === 1 || itemIndex === 2) {
        return 'earring'; // 귀걸이
      } else if (itemIndex === 3 || itemIndex === 4) {
        return 'ring'; // 반지
      }
    }
    
    // 3. text-box 또는 title 텍스트 확인 (인덱스 실패 시)
    const textBox = parentLi.querySelector('.text-box');
    if (textBox) {
      const textContent = textBox.textContent.toLowerCase();
      
      if (textContent.includes('목걸이')) {
        return 'necklace';
      } else if (textContent.includes('귀걸이')) {
        return 'earring';
      } else if (textContent.includes('반지')) {
        return 'ring';
      }
    }
    
    // 4. 현재 선택된 옵션 텍스트 기반 확인 (마지막 수단)
    // 옵션 텍스트 중 특정 스킷 옵션으로 구분
    const selectedOption = element.options[element.selectedIndex];
    if (selectedOption) {
      const optionText = selectedOption.textContent.toLowerCase();
      
      // 목걸이 특정 옵션 (추가 피해, 적에게 주는 피해)
      if (optionText.includes('추가 피해') || optionText.includes('적에게 주는 피해')) {
        return 'necklace';
      }
      // 귀걸이 특정 옵션 (무기 공격력 %, 공격력 %)
      else if ((optionText.includes('무기 공격력') && optionText.includes('%')) || 
               (optionText.includes('공격력') && optionText.includes('%'))) {
        return 'earring';
      }
      // 반지 특정 옵션 (치명타 적중률, 치명타 피해)
      else if (optionText.includes('치명타 적중률') || optionText.includes('치명타 피해')) {
        return 'ring';
      }
    }
    
    // 5. 로깅 및 기본값 반환
    console.warn(`장신구 타입 구분 실패: ${element.value}`);
    return 'unknown';
  }
  
  /**
   * 장신구 아이템 그룹화 (타입별로)
   * @param {Array|NodeList} elements - 장신구 옵션 요소들
   * @return {Object} - 타입별로 그룹화된 장신구 정보
   */
  function groupAccessoriesByType(elements) {
    // 타입별 그룹화를 위한 객체
    let accessoryGroups = {
      necklace: { elements: [], indices: [] },
      earring: { elements: [], indices: [] },
      ring: { elements: [], indices: [] }
    };
    
    // 0. 전체 장신구 요소 가져오기
    const accessoryList = document.querySelector('.accessory-list');
    const accessoryItems = accessoryList ? accessoryList.querySelectorAll('.accessory-item.accessory') : [];
    
    // 로그 추가
    console.log(`장신구 그룹화 시작: elements 타입=${Object.prototype.toString.call(elements)}, 길이=${elements.length}`);
    
    // 1. 장신구 아이템만큼 반복 (각 장신구 아이템에 대해)
    Array.from(accessoryItems).forEach((item, index) => {
      // 이 장신구 아이템에 연관된 옵션 요소들 찾기
      const optionElements = item.querySelectorAll('.option-box .grinding-wrap .option.tooltip-text');
      
      // 장신구 타입 확인 (인덱스 기반 - 가장 안정적)
      let accessoryType;
      if (index === 0) {
        accessoryType = 'necklace'; // 목걸이
      } else if (index === 1 || index === 2) {
        accessoryType = 'earring'; // 귀걸이
      } else if (index === 3 || index === 4) {
        accessoryType = 'ring'; // 반지
      } else {
        accessoryType = 'unknown';
      }
      
      // 타입 확인 및 로그
      console.log(`장신구 아이템 ${index}: ${accessoryType}, ${optionElements.length}개 옵션 찾음`);
      
      // 옵션 요소들을 해당 타입에 추가
      Array.from(optionElements).forEach(optElement => {
        // 이 장신구 옵션이 elements 배열에 있는지 확인
        // NodeList나 HTMLCollection을 배열로 변환
        const elementsArray = Array.from(elements);
        const elementIndex = elementsArray.indexOf(optElement);
        if (elementIndex !== -1) {
          // 배열에 있는 요소만 그룹에 추가
          if (accessoryType !== 'unknown') {
            accessoryGroups[accessoryType].elements.push(optElement);
            accessoryGroups[accessoryType].indices.push(elementIndex);
          }
        }
      });
    });
    
    // 2. 로그 및 추가 처리
    console.log('각 타입별 옵션 그룹 정보:');
    for (const [type, group] of Object.entries(accessoryGroups)) {
      console.log(`${type}: ${group.elements.length} 개의 요소, 인덱스: ${group.indices.join(', ')}`);
    }
    
    // 3. 목걸이가 없다면 추가 확인 시도
    if (accessoryGroups.necklace.elements.length === 0 && elements.length > 0) {
      console.warn('목걸이 없음, 개별 방식으로 목걸이 구분 시도');
      
      // 개별 요소마다 확인
      const elementsArray = Array.from(elements);
      elementsArray.forEach((element, index) => {
        // 이미 수집된 요소라면 건너뜀
        const isAlreadyGrouped = Object.values(accessoryGroups).some(group => 
          group.elements.includes(element));
          
        if (!isAlreadyGrouped) {
          // 타입 감지 시도
          const type = detectAccessoryType(element);
          if (type !== 'unknown') {
            accessoryGroups[type].elements.push(element);
            accessoryGroups[type].indices.push(index);
            console.log(`추가 감지된 ${type} 요소: ${index}`);
          }
        }
      });
      
      // 추가 처리 후 다시 로그
      console.log('추가 처리 후 그룹 정보:');
      for (const [type, group] of Object.entries(accessoryGroups)) {
        console.log(`${type}: ${group.elements.length} 개의 요소, 인덱스: ${group.indices.join(', ')}`);
      }
    }
    
    return accessoryGroups;
  }
  
  /**
   * 현재 선택된 장신구 옵션을 가져오는 함수
   * @return {Array} 선택된 옵션 정보 배열
   */
  function getSelectedAccessoryOptions() {
    // 장신구 종류 순서
    const accessoryTypes = ['necklace', 'earring', 'earring', 'ring', 'ring'];
    
    // 모든 장신구 아이템(li) 요소 찾기
    const accessoryItems = document.querySelectorAll('.accessory-item.accessory');
    console.log(`총 ${accessoryItems.length}개의 장신구 아이템 발견`);
    
    // 반환할 결과 배열
    const result = [];
    
    // 각 장신구 아이템에서 선택 요소와 옵션 찾기
    accessoryItems.forEach((item, index) => {
      // 장신구 타입 확인
      const typeIndex = index < accessoryTypes.length ? index : 0;
      const accessoryType = accessoryTypes[typeIndex];
      
      // 장신구 이미지 확인
      const img = item.querySelector('img');
      const imgSrc = img ? img.src : 'no-image';
      console.log(`장신구 ${index+1}: ${accessoryType} - 이미지 ${imgSrc}`);
      
      // 모든 option select 요소 찾기
      const optionSelects = item.querySelectorAll('.option.tooltip-text');
      console.log(`${index+1}번 장신구에서 ${optionSelects.length}개의 옵션 select 발견`);
      
      // 각 선택 요소에서 값 찾기
      optionSelects.forEach((select, selectIndex) => {
        // 현재 선택된 옵션
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption) {
          console.log(`${index+1}번 장신구 옵션 ${selectIndex+1}: 선택된 옵션 없음`);
          return;
        }
        
        // 장신구 등급 (상/중/하)
        const grindingWrap = select.closest('.grinding-wrap');
        const qualitySpan = grindingWrap ? grindingWrap.querySelector('.quality') : null;
        const grade = qualitySpan ? qualitySpan.textContent : '알 수 없음';
        
        // 결과에 추가
        result.push({
          item: index + 1,              // 장신구 번호
          optionIndex: selectIndex + 1, // 장신구 옵션 번호
          type: accessoryType,          // 장신구 타입
          grade,                        // 장신구 등급
          selectedValue: select.value,  // 선택된 값
          selectedText: selectedOption.textContent // 선택된 텍스트
        });
        
        // 상세 로그 출력
        console.log(`${index+1}번 장신구 [${accessoryType}] 옵션 ${selectIndex+1}: [${grade}] ${selectedOption.textContent} (${select.value})`);
      });
      
      // 티어 옵션 정보 추가
      const tierSelect = item.querySelector('select.tier.accessory');
      if (tierSelect) {
        const selectedTier = tierSelect.options[tierSelect.selectedIndex];
        console.log(`${index+1}번 장신구 티어: ${selectedTier ? selectedTier.textContent : '없음'} (${tierSelect.value})`);
      }
    });
    
    return result;
  }
  
  /**
   * 현재 페이지의 장신구 DOM 구조 디버깅
   * @return {Object} - 페이지의 장신구 구조 정보
   */
  function debugAccessoryStructure() {
    console.group('페이지 장신구 구조 디버깅:');
    
    // accessory-list 확인
    const accessoryList = document.querySelector('.accessory-list');
    if (!accessoryList) {
      console.warn('현재 페이지에서 .accessory-list를 찾을 수 없습니다.');
      return { error: '장신구 리스트 없음' };
    }
    
    // 장신구 아이템 확인
    const accessoryItems = accessoryList.querySelectorAll('.accessory-item.accessory');
    console.log(`장신구 개수: ${accessoryItems.length}`);
    
    // 각 장신구의 옵션 요소 확인
    const accessoryDetails = Array.from(accessoryItems).map((item, index) => {
      // 이미지 정보
      const imgElement = item.querySelector('.img-box img');
      const imgSrc = imgElement ? imgElement.src : 'no-image';
      const imgAlt = imgElement ? imgElement.alt : '';
      
      // 타입 확인
      let type = 'unknown';
      if (index === 0) type = 'necklace';
      else if (index === 1 || index === 2) type = 'earring';
      else if (index === 3 || index === 4) type = 'ring';
      
      // 옵션 요소
      const optionElements = item.querySelectorAll('.option-box .grinding-wrap .option.tooltip-text');
      const optionValues = Array.from(optionElements).map(opt => {
        const selectedOption = opt.options[opt.selectedIndex];
        return {
          value: opt.value,
          text: selectedOption ? selectedOption.textContent : 'none'
        };
      });
      
      // 탁돈 등급
      const qualityElements = item.querySelectorAll('.quality');
      const qualities = Array.from(qualityElements).map(q => q.textContent);
      
      return {
        index,
        type,
        imgSrc,
        imgAlt,
        optionCount: optionElements.length,
        optionValues,
        qualities
      };
    });
    
    console.log('장신구 세부 정보:', accessoryDetails);
    console.groupEnd();
    
    return accessoryDetails;
  }
  
  // 공개 API
  return {
    detectAccessoryType,
    getSelectedAccessoryOptions,
    groupAccessoriesByType,
    debugAccessoryStructure
  };
})();