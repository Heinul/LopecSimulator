/**
 * 로펙 시뮬레이터 점수 분석기 - 메인 모듈
 * 확장 프로그램의 기본 초기화 및 이벤트 설정 담당
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};

// 초기화 및 메시지 처리 함수
(function() {
  // 스캔 설정 저장 변수
  let scanSettings = {
    scanArmor: true,
    scanGem: true,
    scanAccessory: true,
    scanEngraving: true,
    scanKarma: true
  };
  
  // 메시지 리스너 설정
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'startScan' && !LopecScanner.Scanner.isScanningActive()) {
      // 스캔 설정 업데이트
      if (request.settings) {
        scanSettings = request.settings;
      }
      
      // 스캐너에 설정 전달
      LopecScanner.Scanners.Main.setScanSettings(scanSettings);
      
      // 스캔 시작
      LopecScanner.Scanner.startScan();
      sendResponse({status: 'started'});
    }
    return true;
  });

  // 페이지 로드 완료 시 초기화
  window.addEventListener('load', function() {
    console.log('로펙 시뮬레이터 점수 분석기가 로드되었습니다.');
    
    // 장신구 옵션 유틸리티 글로벌 함수 추가
    window.debugAccessory = {
      // 장신구 옵션 상세 확인
      check: function() {
        if (!window.LopecScanner || !window.LopecScanner.Scanners || !window.LopecScanner.Scanners.AccessoryScanner) {
          console.error('장신구 스캐너가 로드되지 않았습니다.');
          return;
        }
        
        try {
          // 파일 시작 메시지
          console.log('%c현재 선택된 장신구 옵션 처리 시작', 'background: #4CAF50; color: white; padding: 5px; border-radius: 3px;');
          const selectedOptions = window.LopecScanner.Scanners.AccessoryScanner.getSelectedAccessoryOptions();
          
          // 전체 결과 수 출력
          console.log(`총 ${selectedOptions.length}개의 장신구 옵션 발견`);
          
          // 콘솔 테이블로 출력
          console.table(selectedOptions);
          
          // 마무리 메시지
          console.log('%c장신구 옵션 처리 완료', 'background: #2196F3; color: white; padding: 5px; border-radius: 3px;');
          
          return selectedOptions;
        } catch (e) {
          console.error('장신구 옵션 가져오기 오류:', e);
        }
      },
      
      // HTML 구조 상세 확인
      structure: function() {
        console.log('%c장신구 영역 HTML 구조 확인', 'background: #9C27B0; color: white; padding: 5px; border-radius: 3px;');
        
        const accessoryArea = document.querySelector('.accessory-area');
        if (!accessoryArea) {
          console.error('장신구 영역(.accessory-area)를 찾을 수 없습니다.');
          return;
        }
        
        // 장신구 아이템들 찾기
        const accessoryItems = accessoryArea.querySelectorAll('li.accessory-item.accessory');
        console.log(`총 ${accessoryItems.length}개의 장신구 아이템 요소 발견`);
        
        // 각 장신구 아이템 구조 확인
        accessoryItems.forEach((item, index) => {
          // 타입 확인
          const img = item.querySelector('img');
          const imgSrc = img ? img.src : 'no-image';
          const imgAlt = img ? img.alt : 'no-alt';
          
          // 선택 요소 확인
          const selects = item.querySelectorAll('select');
          const tierSelect = item.querySelector('select.tier.accessory');
          const optionSelects = item.querySelectorAll('.option.tooltip-text');
          
          // 구조 정보 출력
          console.group(`장신구 ${index+1} (${imgAlt})`);
          console.log(`이미지: ${imgSrc}`);
          console.log(`전체 select 요소: ${selects.length}개`);
          console.log(`티어 select: ${tierSelect ? tierSelect.value : '없음'}`);
          console.log(`옵션 select: ${optionSelects.length}개`);
          
          // 각 옵션 요소 확인
          optionSelects.forEach((select, selectIndex) => {
            const selectedOption = select.options[select.selectedIndex];
            const selectedText = selectedOption ? selectedOption.textContent : '선택 없음';
            const selectedValue = select.value;
            
            // 등급 확인
            const grindingWrap = select.closest('.grinding-wrap');
            const qualitySpan = grindingWrap ? grindingWrap.querySelector('.quality') : null;
            const grade = qualitySpan ? qualitySpan.textContent : '알 수 없음';
            
            console.log(`옵션 ${selectIndex+1}: [${grade}] ${selectedText} (${selectedValue})`);
          });
          
          console.groupEnd();
        });
      },
      
      // 장신구 DOM 이벤트 모니터링
      monitor: function() {
        console.log('%c장신구 옵션 변경 모니터링 시작', 'background: #FF9800; color: white; padding: 5px; border-radius: 3px;');
        
        // 모니터링 플래그
        if (window._accessoryMonitoring) {
          console.log('이미 모니터링 중입니다');
          return;
        }
        
        window._accessoryMonitoring = true;
        
        // 변경 이벤트 리스너 추가
        document.addEventListener('change', function accessoryChangeListener(event) {
          // 장신구 옵션 요소인지 확인
          if (event.target.classList.contains('option') && event.target.classList.contains('tooltip-text')) {
            const select = event.target;
            const selectedOption = select.options[select.selectedIndex];
            if (!selectedOption) return;
            
            // 장신구 번호 확인
            const parentLi = select.closest('li.accessory-item');
            if (!parentLi) return;
            
            const accessoryItems = document.querySelectorAll('li.accessory-item.accessory');
            const itemIndex = Array.from(accessoryItems).indexOf(parentLi);
            
            // 등급 확인
            const grindingWrap = select.closest('.grinding-wrap');
            const qualitySpan = grindingWrap ? grindingWrap.querySelector('.quality') : null;
            const grade = qualitySpan ? qualitySpan.textContent : '알 수 없음';
            
            // 옵션 변경 로깅
            console.log(`%c장신구 옵션 변경: ${itemIndex+1}번 장신구 [${grade}] ${selectedOption.textContent} (${select.value})`, 'color: #FF5722; font-weight: bold;');
          }
        });
        
        console.log('장신구 옵션 변경 모니터링이 설정되었습니다. 변경사항이 콘솔에 표시됩니다.');
      },
      
      // 초기 값 강제로 변경하기
      setOption: function(itemIndex, optionIndex, value) {
        const accessoryItems = document.querySelectorAll('li.accessory-item.accessory');
        
        if (itemIndex < 0 || itemIndex >= accessoryItems.length) {
          console.error(`유효하지 않은 장신구 번호: ${itemIndex}. 범위: 0-${accessoryItems.length-1}`);
          return false;
        }
        
        const item = accessoryItems[itemIndex];
        const optionSelects = item.querySelectorAll('.option.tooltip-text');
        
        if (optionIndex < 0 || optionIndex >= optionSelects.length) {
          console.error(`유효하지 않은 옵션 번호: ${optionIndex}. 범위: 0-${optionSelects.length-1}`);
          return false;
        }
        
        const select = optionSelects[optionIndex];
        
        // 값 변경 시도
        select.value = value;
        
        // 변경 이벤트 발생
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
        
        console.log(`장신구 ${itemIndex}번 옵션 ${optionIndex}번 값을 ${value}(으)로 변경했습니다.`);
        return true;
      }
    };
    
    // 초기화 메시지
    console.log('로펙 시뮬레이터 점수 분석기가 로드되었습니다 - 장신구 디버그 함수 사용 가능');
    console.log('사용 방법: debugAccessory.check() - 현재 옵션 확인');
    console.log('         debugAccessory.structure() - HTML 구조 확인');
    console.log('         debugAccessory.monitor() - 변경 모니터링');
    console.log('         debugAccessory.setOption(itemIndex, optionIndex, value) - 옵션 변경');
  });
})();