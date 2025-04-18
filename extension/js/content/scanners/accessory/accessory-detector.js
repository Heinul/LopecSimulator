/**
 * 로펙 시뮬레이터 점수 분석기 - 장신구 탐지 모듈
 * 장신구 요소 탐지 및 관련 정보 수집 기능 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};
window.LopecScanner.Scanners.Accessory = window.LopecScanner.Scanners.Accessory || {};
window.LopecScanner.Scanners.Accessory.Detector = window.LopecScanner.Scanners.Accessory.Detector || {};

// 장신구 탐지 모듈
LopecScanner.Scanners.Accessory.Detector = (function() {
  /**
   * 직업 타입을 감지 (서포터 또는 딜러)
   * @return {string} - 'SUPPORTER' 또는 'DEALER' 중 하나
   */
  function detectJobType() {
    try {
      // 직업 정보가 있는 엘리먼트 찾기 - /html/body/div/section[1]/div[2]/div[1]
      const jobElement = document.querySelector('.name-area .job');
      
      if (jobElement) {
        const jobText = jobElement.textContent.toLowerCase();
        
        // 서폿 관련 키워드 포함 여부 확인
        if (jobText.includes('서폿')) {
          console.log('서포터 직업 감지됨:', jobElement.textContent);
          return 'SUPPORTER';
        }
      }
      
      // 서폿이 아니거나 엘리먼트를 찾을 수 없으면 기본적으로 딜러로 처리
      console.log('딜러 직업으로 처리됨');
      return 'DEALER';
    } catch (e) {
      console.error('직업 타입 감지 오류:', e);
      // 오류 발생 시 기본값은 딜러
      return 'DEALER';
    }
  }

  /**
   * 장신구 타입 감지
   * @param {HTMLElement} element - 장신구 옵션 요소
   * @return {string} - 감지된 장신구 타입 (necklace, earring1, earring2, ring1, ring2 또는 unknown)
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
      // 5개 장신구 구분: 목걸이, 귀걸이1, 귀걸이2, 반지1, 반지2
      if (itemIndex === 0) {
        return 'necklace'; // 목걸이
      } else if (itemIndex === 1) {
        return 'earring1'; // 귀걸이1
      } else if (itemIndex === 2) {
        return 'earring2'; // 귀걸이2
      } else if (itemIndex === 3) {
        return 'ring1'; // 반지1
      } else if (itemIndex === 4) {
        return 'ring2'; // 반지2
      }
    }
    
    return 'unknown';
  }
  
  /**
   * 장신구 아이템 그룹화 (타입별로)
   * @param {Array|NodeList} elements - 장신구 옵션 요소들
   * @return {Object} - 타입별로 그룹화된 장신구 정보
   */
  function groupAccessoriesByType(elements) {
    try {
      // 타입별 그룹화를 위한 객체 (5개 장신구 모두 개별 처리)
      let accessoryGroups = {
        necklace: { elements: [], indices: [] },
        earring1: { elements: [], indices: [] },
        earring2: { elements: [], indices: [] },
        ring1: { elements: [], indices: [] },
        ring2: { elements: [], indices: [] }
      };
      
      if (!elements || elements.length === 0) {
        console.log('그룹화할 장신구 옵션 요소가 없습니다.');
        return accessoryGroups;
      }
      
      // 0. 전체 장신구 요소 가져오기
      const accessoryList = document.querySelector('.accessory-list');
      if (!accessoryList) {
        console.log('.accessory-list 요소를 찾을 수 없습니다.');
        return accessoryGroups;
      }
      
      const accessoryItems = accessoryList.querySelectorAll('.accessory-item.accessory');
      if (!accessoryItems || accessoryItems.length === 0) {
        console.log('장신구 아이템 요소를 찾을 수 없습니다.');
        return accessoryGroups;
      }
      
      // 1. 장신구 아이템만큼 반복 (각 장신구 아이템에 대해)
      Array.from(accessoryItems).forEach((item, index) => {
        if (!item) return;
        
        try {
          // 이 장신구 아이템에 연관된 옵션 요소들 찾기
          const optionElements = item.querySelectorAll('.option-box .grinding-wrap .option.tooltip-text');
          if (!optionElements || optionElements.length === 0) return;
          
          // 장신구 타입 확인 (인덱스 기반 - 가장 안정적)
          let accessoryType;
          if (index === 0) {
            accessoryType = 'necklace'; // 목걸이
          } else if (index === 1) {
            accessoryType = 'earring1'; // 귀걸이1
          } else if (index === 2) {
            accessoryType = 'earring2'; // 귀걸이2
          } else if (index === 3) {
            accessoryType = 'ring1'; // 반지1
          } else if (index === 4) {
            accessoryType = 'ring2'; // 반지2
          } else {
            accessoryType = 'unknown';
          }
          
          if (accessoryType === 'unknown') return;
          
          // 옵션 요소들을 해당 타입에 추가
          Array.from(optionElements).forEach(optElement => {
            // 이 장신구 옵션이 elements 배열에 있는지 확인
            // NodeList나 HTMLCollection을 배열로 변환
            try {
              if (!optElement) return;
              
              const elementsArray = Array.from(elements);
              const elementIndex = elementsArray.indexOf(optElement);
              if (elementIndex !== -1) {
                // 배열에 있는 요소만 그룹에 추가
                accessoryGroups[accessoryType].elements.push(optElement);
                accessoryGroups[accessoryType].indices.push(elementIndex);
              }
            } catch (e) {
              console.error(`장신구 옵션 요소 처리 중 오류:`, e);
            }
          });
        } catch (e) {
          console.error(`장신구 아이템 ${index} 처리 중 오류:`, e);
        }
      });
      
      // 각 타입별 요소 수 로그
      console.log(`그룹화 결과: 목걸이 ${accessoryGroups.necklace.elements.length}개, ` + 
                 `귀걸이1 ${accessoryGroups.earring1.elements.length}개, ` + 
                 `귀걸이2 ${accessoryGroups.earring2.elements.length}개, ` + 
                 `반지1 ${accessoryGroups.ring1.elements.length}개, ` + 
                 `반지2 ${accessoryGroups.ring2.elements.length}개`);
      
      return accessoryGroups;
      
    } catch (e) {
      console.error('장신구 그룹화 중 오류:', e);
      return {
        necklace: { elements: [], indices: [] },
        earring1: { elements: [], indices: [] },
        earring2: { elements: [], indices: [] },
        ring1: { elements: [], indices: [] },
        ring2: { elements: [], indices: [] }
      };
    }
  }
  
  /**
   * 장신구 티어 요소 그룹화 (타입별로)
   * @param {Array|NodeList} elements - 티어 선택 요소들
   * @return {Object} - 타입별로 그룹화된 티어 정보
   */
  function groupTierElementsByType(elements) {
    try {
      // 타입별 그룹화를 위한 객체
      let tierGroups = {
        necklace: null,
        earring1: null,
        earring2: null,
        ring1: null,
        ring2: null
      };
      
      if (!elements || elements.length === 0) {
        console.log('그룹화할 티어 요소가 없습니다.');
        return tierGroups;
      }
      
      // 전체 장신구 요소 가져오기
      const accessoryList = document.querySelector('.accessory-list');
      if (!accessoryList) {
        console.log('.accessory-list 요소를 찾을 수 없습니다.');
        return tierGroups;
      }
      
      const accessoryItems = accessoryList.querySelectorAll('.accessory-item.accessory');
      if (!accessoryItems || accessoryItems.length === 0) {
        console.log('장신구 아이템 요소를 찾을 수 없습니다.');
        return tierGroups;
      }
      
      // 1. 각 장신구 아이템에 대해
      Array.from(accessoryItems).forEach((item, index) => {
        if (!item) return;
        
        try {
          // 장신구 타입 확인 (인덱스 기반 - 가장 안정적)
          let accessoryType;
          if (index === 0) {
            accessoryType = 'necklace'; // 목걸이
          } else if (index === 1) {
            accessoryType = 'earring1'; // 귀걸이1
          } else if (index === 2) {
            accessoryType = 'earring2'; // 귀걸이2
          } else if (index === 3) {
            accessoryType = 'ring1'; // 반지1
          } else if (index === 4) {
            accessoryType = 'ring2'; // 반지2
          } else {
            accessoryType = 'unknown';
          }
          
          if (accessoryType === 'unknown') return;
          
          // 해당 장신구의 티어 요소 찾기 (select.tier.accessory)
          const tierElement = item.querySelector('select.tier.accessory');
          if (!tierElement) return;
          
          // 요소들 같은지 비교
          const elementsArray = Array.from(elements);
          const foundIndex = elementsArray.findIndex(el => el === tierElement);
          
          if (foundIndex !== -1) {
            // 티어 요소 정보 저장
            tierGroups[accessoryType] = {
              element: tierElement,
              index: foundIndex,
              originalValue: tierElement.value,
              originalText: tierElement.options[tierElement.selectedIndex]?.textContent || ''
            };
            
            console.log(`${accessoryType} 티어 요소 인덱스: ${foundIndex}, 값: ${tierElement.value}`);
          }
        } catch (e) {
          console.error(`장신구 티어 요소 ${index} 처리 중 오류:`, e);
        }
      });
      
      // 각 타입별 요소 로그
      console.log(
        `티어 그룹화 결과: 목걸이 ${tierGroups.necklace ? 'O' : 'X'}, ` + 
        `귀걸이1 ${tierGroups.earring1 ? 'O' : 'X'}, ` + 
        `귀걸이2 ${tierGroups.earring2 ? 'O' : 'X'}, ` + 
        `반지1 ${tierGroups.ring1 ? 'O' : 'X'}, ` + 
        `반지2 ${tierGroups.ring2 ? 'O' : 'X'}`
      );
      
      return tierGroups;
      
    } catch (e) {
      console.error('티어 요소 그룹화 중 오류:', e);
      return {
        necklace: null,
        earring1: null,
        earring2: null,
        ring1: null,
        ring2: null
      };
    }
  }
  
  /**
   * 현재 선택된 장신구 옵션을 가져오는 함수
   * @return {Array} 선택된 옵션 정보 배열
   */
  function getSelectedAccessoryOptions() {
    try {
      // 장신구 종류 순서
      const accessoryTypes = ['necklace', 'earring1', 'earring2', 'ring1', 'ring2'];
      
      // 모든 장신구 아이템(li) 요소 찾기
      const accessoryItems = document.querySelectorAll('.accessory-item.accessory');
      if (!accessoryItems || accessoryItems.length === 0) {
        console.log('장신구 아이템을 찾을 수 없습니다.');
        return [];
      }
      
      // 반환할 결과 배열
      const result = [];
      
      // 각 장신구 아이템에서 선택 요소와 옵션 찾기
      accessoryItems.forEach((item, index) => {
        if (!item) return;
        
        try {
          // 장신구 타입 확인
          const typeIndex = index < accessoryTypes.length ? index : 0;
          const accessoryType = accessoryTypes[typeIndex];
          
          // 모든 option select 요소 찾기
          const optionSelects = item.querySelectorAll('.option.tooltip-text');
          if (!optionSelects || optionSelects.length === 0) return;
          
          // 각 선택 요소에서 값 찾기
          optionSelects.forEach((select, selectIndex) => {
            if (!select || !select.options || typeof select.selectedIndex === 'undefined') return;
            
            // 현재 선택된 옵션
            const selectedOption = select.options[select.selectedIndex];
            if (!selectedOption) return;
            
            try {
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
            } catch (e) {
              console.error(`장신구 ${index+1} 옵션 ${selectIndex+1} 처리 중 오류:`, e);
            }
          });
        } catch (e) {
          console.error(`장신구 ${index+1} 처리 중 오류:`, e);
        }
      });
      
      return result;
    } catch (e) {
      console.error('선택된 장신구 옵션 정보 가져오기 오류:', e);
      return [];
    }
  }
  

  
  // 공개 API
  return {
    detectAccessoryType,
    getSelectedAccessoryOptions,
    groupAccessoriesByType,
    groupTierElementsByType,
    detectJobType
  };
})();