/**
 * 로펙 시뮬레이터 점수 분석기 - 장신구 스캐너 모듈
 * 장신구 스캔 프로세스의 중앙 제어 역할
 */

// 전역 네임스페이스 확인
window.LopecScanner = window.LopecScanner || {};
window.LopecScanner.Scanners = window.LopecScanner.Scanners || {};
window.LopecScanner.Scanners.Accessory = window.LopecScanner.Scanners.Accessory || {};

// 장신구 스캐너 모듈
LopecScanner.Scanners.Accessory.AccessoryScanner = (function() {
  // 모듈 참조
  const BaseScanner = LopecScanner.Scanners.BaseScanner;
  const Options = LopecScanner.Scanners.Accessory.Options;
  const Detector = LopecScanner.Scanners.Accessory.Detector;
  const Manipulator = LopecScanner.Scanners.Accessory.Manipulator;
  
  /**
   * 장신구 옵션 설정
   * @param {Object} options - 장신구 스캐닝 옵션
   */
  function setAccessoryOptions(options) {
    Options.setAccessoryOptions(options);
  }
  
  /**
   * 장신구 스캔 준비
   * @param {Object} elements - 장신구 요소들 모음 객체
   * @return {number} - 스캔 항목 개수
   */
  function prepareAccessoryScan(elements) {
    let scanCount = 0;
    
    // 직업 타입 감지
    const jobType = Detector.detectJobType(); // 'SUPPORTER' 또는 'DEALER'
    console.log(`직업 타입 감지된 상태: ${jobType}`);
    
    // 직업 타입 저장 (추후 참조를 위해)
    BaseScanner.state.jobType = jobType;
    
    // 현재 값들 저장
    if (elements.tierElements) {
      try {
        elements.tierElements.forEach((element, index) => {
          if (element && element.value) {
            BaseScanner.state.originalValues[`accessory-tier-${index}`] = element.value;
            // 티어 옵션 텍스트도 저장
            if (element.options && typeof element.selectedIndex !== 'undefined') {
              const selectedOption = element.options[element.selectedIndex];
              const selectedText = selectedOption ? selectedOption.textContent : '';
              BaseScanner.state.originalValues[`accessory-tier-text-${index}`] = selectedText;
            }
          }
        });
      } catch (e) {
        console.error('장신구 tier 요소 저장 오류:', e);
      }
    }
    
    if (elements.qualityElements) {
      try {
        elements.qualityElements.forEach((element, index) => {
          if (element) {
            const numberBox = element.closest('.number-box');
            if (numberBox) {
              const inputElement = numberBox.querySelector('.progress');
              if (inputElement && inputElement.value) {
                BaseScanner.state.originalValues[`accessory-quality-${index}`] = inputElement.value;
              }
            }
          }
        });
      } catch (e) {
        console.error('장신구 quality 요소 저장 오류:', e);
      }
    }
    
    if (elements.optionElements) {
      try {
        elements.optionElements.forEach((element, index) => {
          if (element && element.value) {
            // 기본 값 저장
            BaseScanner.state.originalValues[`accessory-option-${index}`] = element.value;
            
            // 옵션 텍스트도 저장
            if (element.options && typeof element.selectedIndex !== 'undefined') {
              const selectedOption = element.options[element.selectedIndex];
              const selectedText = selectedOption ? selectedOption.textContent : '';
              BaseScanner.state.originalValues[`accessory-option-text-${index}`] = selectedText;
            }
          }
        });
      } catch (e) {
        console.error('장신구 옵션 요소 저장 오류:', e);
      }
    }
    
    // 장신구 초기값 보존 상태 로그
    console.log('장신구 초기값 저장 완료');
    
    // 장신구 조합 개수 계산
    // 장신구 조합.txt 파일에 따른 16개의 조합(상상, 상중, 중상, ..., 무무)
    const combinationsPerType = 16;
    
    // 티어(등급) 개수 계산
    // 티어 옵션 (T3유물, T3고대, T4유물, T4고대) 중에서 T4유물, T4고대만 스캔
    // 현재 티어가 T3유물, T3고대인 경우에는 자동으로 높은 T4유물부터 시작
    const tierOptionCount = 2; // T4유물, T4고대만 검사
    
    // 목걸이, 귀걸이1, 귀걸이2, 반지1, 반지2 총 5가지 타입
    // 각 타입마다 티어 옵션 개수와 조합 개수를 곱함
    scanCount = 5 * combinationsPerType * tierOptionCount; // 총 160개
    
    return scanCount;
  }
  
  /**
   * 장신구 스캔 실행
   * @param {Object} elements - 장신구 요소들 모음 객체
   */
  async function scanAccessories(elements) {
    // 직업 타입 확인 (초기화 시 저장한 값 그대로 사용)
    const jobType = BaseScanner.state.jobType || Detector.detectJobType();
    console.log(`장신구 스캔 실행 - 직업 타입: ${jobType}`);
    
    // 장신구 옵션 스캔 (조합 방식으로 수정)
    if (elements.optionElements && elements.optionElements.length > 0) {
      try {
        // 장신구 타입별로 요소들 그룹화
        let accessoryGroups = Detector.groupAccessoriesByType(elements.optionElements);
        
        // 현재 선택된 모든 장신구 옵션 가져오기 - 스캔 전 값 기록
        let currentSelectedOptions = [];
        try {
          currentSelectedOptions = Detector.getSelectedAccessoryOptions() || [];
        } catch (e) {
          console.error('장신구 옵션 정보 가져오기 오류:', e);
          currentSelectedOptions = [];
        }
        
        // 티어 요소들 그룹화 (장신구 타입별로)
        let tierGroups = {};
        if (elements.tierElements && elements.tierElements.length > 0) {
          tierGroups = Detector.groupTierElementsByType(elements.tierElements);
          console.log('티어 요소 그룹화:', tierGroups);
        }
        
        // 직업 타입에 따른 옵션 리스트 사용
        // 상상, 상중, 상하, 중중, 중하, 하하, 상무, 무상, 중무, 무중, 하무, 무하, 무무 조합 방식으로 사용
        console.log(`${jobType} 리스트 사용하여 스캔 실행`);
        
        // 각 장신구 타입별로 옵션 조합 스캔 실행 (5개 전부 개별 스캔)
        if (accessoryGroups.necklace && accessoryGroups.necklace.elements && accessoryGroups.necklace.elements.length > 0) {
          await scanAccessoryByType('necklace', accessoryGroups.necklace, currentSelectedOptions, jobType, tierGroups.necklace);
        } else {
          console.log('목걸이 요소가 없어 건너뛰기');
          // 목걸이 스캔 건너뛰 시 진행률 반영 (티어 2개 * 조합 16개)
          for (let i = 0; i < 32; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
        // 귀걸이1 스캔
        if (accessoryGroups.earring1 && accessoryGroups.earring1.elements && accessoryGroups.earring1.elements.length > 0) {
          await scanAccessoryByType('earring1', accessoryGroups.earring1, currentSelectedOptions, jobType, tierGroups.earring1);
        } else {
          console.log('귀걸이1 요소가 없어 건너뛰기');
          // 귀걸이1 스캔 건너뛰 시 진행률 반영 (티어 2개 * 조합 16개)
          for (let i = 0; i < 32; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
        // 귀걸이2 스캔
        if (accessoryGroups.earring2 && accessoryGroups.earring2.elements && accessoryGroups.earring2.elements.length > 0) {
          await scanAccessoryByType('earring2', accessoryGroups.earring2, currentSelectedOptions, jobType, tierGroups.earring2);
        } else {
          console.log('귀걸이2 요소가 없어 건너뛰기');
          // 귀걸이2 스캔 건너뛰 시 진행률 반영 (티어 2개 * 조합 16개)
          for (let i = 0; i < 32; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
        // 반지1 스캔
        if (accessoryGroups.ring1 && accessoryGroups.ring1.elements && accessoryGroups.ring1.elements.length > 0) {
          await scanAccessoryByType('ring1', accessoryGroups.ring1, currentSelectedOptions, jobType, tierGroups.ring1);
        } else {
          console.log('반지1 요소가 없어 건너뛰기');
          // 반지1 스캔 건너뛰 시 진행률 반영 (티어 2개 * 조합 16개)
          for (let i = 0; i < 32; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
        // 반지2 스캔
        if (accessoryGroups.ring2 && accessoryGroups.ring2.elements && accessoryGroups.ring2.elements.length > 0) {
          await scanAccessoryByType('ring2', accessoryGroups.ring2, currentSelectedOptions, jobType, tierGroups.ring2);
        } else {
          console.log('반지2 요소가 없어 건너뛰기');
          // 반지2 스캔 건너뛰 시 진행률 반영 (티어 2개 * 조합 16개)
          for (let i = 0; i < 32; i++) {
            BaseScanner.updateScanProgress();
          }
        }
        
      } catch (e) {
        console.error('장신구 스캔 중 오류 발생:', e);
        // 오류 발생 시 남은 스캔 처리
        for (let i = 0; i < 160; i++) { // 5개 장신구 타입 * 16개 조합 * 2개 티어
          BaseScanner.updateScanProgress();
        }
      }
    } else {
      console.log('장신구 옵션 요소가 없어 건너뛰기');
      // 장신구 스캔 건너뛰 시 진행률 반영
      for (let i = 0; i < 160; i++) { // 5개 장신구 타입 * 16개 조합 * 2개 티어
        BaseScanner.updateScanProgress();
      }
    }
  }
  
  /**
   * 특정 타입의 장신구 스캔 실행
   * @param {string} type - 장신구 타입 (necklace, earring1, earring2, ring1, ring2)
   * @param {Object} group - 장신구 그룹 정보
   * @param {Array} currentSelectedOptions - 현재 선택된 옵션 정보
   * @param {string} jobType - 직업 타입 ('DEALER' 또는 'SUPPORTER')
   * @param {Object} tierElement - 티어 요소 정보 (선택적)
   */
  async function scanAccessoryByType(type, group, currentSelectedOptions, jobType = 'DEALER', tierElement = null) {
    // 그룹이 유효하고 스캔중이면 실행
    if (!group || !group.elements || group.elements.length <= 0 || !BaseScanner.state.isScanning) {
      console.log(`${type} 장신구 스캔 실행 실패: 그룹 요소가 없거나 스캔이 중지되었습니다.`);
      return;
    }
    
    try {
      // 현재 타입의 장신구 옵션 참조 가져오기
      const currentTypeOptions = Array.isArray(currentSelectedOptions) ? 
        currentSelectedOptions.filter(option => option && option.type === type) : [];
      
      // 원래 선택된 옵션 텍스트 가져오기
      const originalOptionTexts = currentTypeOptions.map(option => {
        if (option && option.grade && option.selectedText) {
          return `[${option.grade}] ${option.selectedText}`;
        }
        return '';
      }).filter(text => text !== '');
      
      // 장신구 타입 변환 (necklace -> NECKLACE)
      const accessoryTypeUppercase = type.toUpperCase();
    
      // 직업 타입과 장신구 타입에 맞는 옵션 가져오기
      // 상상, 상중, 상하, 중중, 중하, 하하, 상무, 무상, 중무, 무중, 하무, 무하, 무무 조합 생성
      let qualityCombinations = [];
      try {
        qualityCombinations = Options.getAccessoryCombinations(type, jobType) || [];
      } catch (e) {
        console.error(`${type} 옵션 조합 가져오기 오류:`, e);
        qualityCombinations = [];
      }
      
      // 화면에 표시할 때 사용하는 타입 이름
      let typeDisplayName;
      if (type === 'necklace') {
        typeDisplayName = '목걸이';
      } else if (type === 'earring1') {
        typeDisplayName = '귀걸이1';
      } else if (type === 'earring2') {
        typeDisplayName = '귀걸이2';
      } else if (type === 'ring1') {
        typeDisplayName = '반지1';
      } else if (type === 'ring2') {
        typeDisplayName = '반지2';
      } else {
        typeDisplayName = '장신구';
      }
      
      // 원래 장신구 옵션의 점수 계산 (상=3, 중=2, 하=1, 무=0)
      let currentOptionsScore = 0;
      originalOptionTexts.forEach(optText => {
        if (optText.includes('[상]')) {
          currentOptionsScore += 3;
        } else if (optText.includes('[중]')) {
          currentOptionsScore += 2;
        } else if (optText.includes('[하]')) {
          currentOptionsScore += 1;
        }
        // '무' 인 경우는 0점
      });
      
      console.log(`현재 ${type} 장신구 옵션 점수: ${currentOptionsScore}`);
      
      // 옵션 가져오기 에러 처리
      if (!qualityCombinations || qualityCombinations.length === 0) {
        console.error(`${jobType} 직업의 ${type} 옵션 조합을 생성할 수 없습니다.`);
        
        // 스캔 완료로 처리 (전체 16개 조합)
        for (let i = 0; i < 32; i++) { // 티어 2개 * 16개 조합
          BaseScanner.updateScanProgress();
        }
        return;
      }
      
      // 티어 요소가 있는 경우 티어 스캔 수행
      // 현재 티어보다 높은 티어만 스캔
      let tierOptions = [];
      if (tierElement && tierElement.element) {
        // 현재 티어 값 가져오기
        const currentTierValue = tierElement.element.value;
        const currentTierText = tierElement.element.options[tierElement.element.selectedIndex]?.textContent || '';
        
        console.log(`현재 티어: ${currentTierText} (${currentTierValue})`);
        
        // 티어 옵션에서 현재 티어와 동일하거나 더 높은 티어만 추출
        let options = Array.from(tierElement.element.options);
        let currentTierIndex = -1;
        
        // 현재 티어의 인덱스 찾기
        for (let i = 0; i < options.length; i++) {
          if (options[i].value === currentTierValue) {
            currentTierIndex = i;
            break;
          }
        }
        
        // 현재 티어와 그 이상의 티어만 필터링
        if (currentTierIndex !== -1) {
          // T3유물, T3고대일 경우 무시하고 T4유물부터 시작
          // 이건 모든 장신구에 적용
          const isT3 = currentTierText.toLowerCase().includes('t3');
          
          if (isT3) {
            // T3는 무시하고 T4유물, T4고대만 스캔
            tierOptions = options
              .filter(option => {
                const text = option.textContent.toLowerCase();
                return text.includes('t4');
              })
              .map(option => ({
                value: option.value,
                text: option.textContent
              }));
          } else {
            // 현재 티어부터 위로만 스캔 (예: T4고대는 T4고대만)
            tierOptions = options
              .filter((option, index) => index >= currentTierIndex)
              .map(option => ({
                value: option.value,
                text: option.textContent
              }));
          }
        } else {
          // 인덱스를 찾지 못하면 모든 티어 옵션 포함
          tierOptions = options.map(option => ({
            value: option.value,
            text: option.textContent
          }));
        }
        
        // 원래 티어 정보 저장
        tierElement.originalValue = currentTierValue;
        tierElement.originalText = currentTierText;
        
        console.log(`장신구 타입 ${type}의 스캔할 티어 옵션:`, tierOptions);
      } else {
        console.log(`${type} 장신구에 티어 요소가 없거나 찾을 수 없음`);
        // 티어 요소가 없는 경우 빈 배열로 처리 - 일반 스캔만 진행
        tierOptions = [{ value: null, text: '티어 없음' }];
      }
      
      // 상중, 중상, 상상 등의 조합 변형 구하기
      // 원래 조합 라벨 저장 (구성 명칭)
      let originalLabel = '';
      
      // 원래 옵션 구성을 통해 원래 라벨 추정
      if (originalOptionTexts.length >= 2) {
        if (originalOptionTexts[0].includes('[상]') && originalOptionTexts[1].includes('[상]')) {
          originalLabel = '상상';
        } else if (originalOptionTexts[0].includes('[상]') && originalOptionTexts[1].includes('[중]')) {
          originalLabel = '상중';
        } else if (originalOptionTexts[0].includes('[중]') && originalOptionTexts[1].includes('[상]')) {
          originalLabel = '중상';
        } else if (originalOptionTexts[0].includes('[중]') && originalOptionTexts[1].includes('[중]')) {
          originalLabel = '중중';
        } else if (originalOptionTexts[0].includes('[상]') && originalOptionTexts[1].includes('[하]')) {
          originalLabel = '상하';
        } else if (originalOptionTexts[0].includes('[하]') && originalOptionTexts[1].includes('[상]')) {
          originalLabel = '하상';
        } else if (originalOptionTexts[0].includes('[중]') && originalOptionTexts[1].includes('[하]')) {
          originalLabel = '중하';
        } else if (originalOptionTexts[0].includes('[하]') && originalOptionTexts[1].includes('[중]')) {
          originalLabel = '하중';
        } else if (originalOptionTexts[0].includes('[하]') && originalOptionTexts[1].includes('[하]')) {
          originalLabel = '하하';
        } else if (originalOptionTexts[0].includes('[상]') && !originalOptionTexts[1]) {
          originalLabel = '상무';
        } else if (!originalOptionTexts[0] && originalOptionTexts[1].includes('[상]')) {
          originalLabel = '무상';
        } else if (originalOptionTexts[0].includes('[중]') && !originalOptionTexts[1]) {
          originalLabel = '중무';
        } else if (!originalOptionTexts[0] && originalOptionTexts[1].includes('[중]')) {
          originalLabel = '무중';
        } else if (originalOptionTexts[0].includes('[하]') && !originalOptionTexts[1]) {
          originalLabel = '하무';
        } else if (!originalOptionTexts[0] && originalOptionTexts[1].includes('[하]')) {
          originalLabel = '무하';
        } else if (!originalOptionTexts[0] && !originalOptionTexts[1]) {
          originalLabel = '무무';
        }
      }
      
      console.log(`원래 옵션 라벨 추정: ${originalLabel}`);
      
      // 각 개별 옵션 조합들의 점수 계산하고 정렬 (점수 높은 순)
      for (const combo of qualityCombinations) {
        // 조합 점수 계산
        let comboScore = 0;
        combo.options.forEach(option => {
          // 상/중/하/무 등급 확인
          if (option.startsWith('상:')) {
            comboScore += 3;
          } else if (option.startsWith('중:')) {
            comboScore += 2;
          } else if (option.startsWith('하:')) {
            comboScore += 1;
          }
          // 무 시 점수 추가 없음
        });
        
        // 점수 저장
        combo.score = comboScore;
      }
      
      // 현재 점수보다 높은 조합 + 등급이 달라도 확인해야 하는 경우 추가 (상중 -> 중상, 상상 추가)
      // 점수순으로 정렬
      qualityCombinations.sort((a, b) => b.score - a.score);
      
      // 스캔할 조합을 분류하여 선택
      // 현재 옵션의 점수 확인 (상=3, 중=2, 하=1, 무=0)
      console.log(`현재 ${type} 장신구 옵션 점수: ${currentOptionsScore}`);
      
      // 특정 점수 이상의 모든 조합 찾기
      // 하하옵션이면 합계 2점이므로 2점 이상 모든 조합 스캔
      // 중중옵션이면 합계 4점이므로 4점 이상 모든 조합 스캔
      // 상단일이면 3점 이상인 조합들을 부게
      
      // 현재 옵션 구성에 따른 최소 점수 계산
      // 요구사항에 따라, 현재 점수가 아닌 특정 점수 기준으로 조합 선택

      // 상=3, 중=2, 하=1, 무=0의 가중치로 계산
      // 하하=1+1=2, 중중=2+2=4, 하중=1+2=3, 상하=3+1=4 등
      let minimumScoreThreshold = 2; // 기본값은 2점 (하하 기준)

      // originalLabel 및 현재 점수에 따라 점수 기준 설정
      if (originalLabel.includes('하하')) {
        minimumScoreThreshold = 2; // 하하 = 1+1 = 2
      } else if (originalLabel.includes('중하') || originalLabel.includes('하중')) {
        minimumScoreThreshold = 3; // 중하 = 2+1 = 3
      } else if (originalLabel.includes('중중') || originalLabel.includes('상하') || originalLabel.includes('하상')) {
        minimumScoreThreshold = 4; // 중중 = 2+2 = 4, 상하 = 3+1 = 4
      } else if (originalLabel.includes('상중') || originalLabel.includes('중상')) {
        minimumScoreThreshold = 5; // 상중 = 3+2 = 5
      } else if (originalLabel.includes('상상')) {
        minimumScoreThreshold = 6; // 상상 = 3+3 = 6
      } else if (originalLabel.includes('상무') || originalLabel.includes('무상')) {
        minimumScoreThreshold = 3; // 상무 = 3+0 = 3
      } else if (originalLabel.includes('중무') || originalLabel.includes('무중')) {
        minimumScoreThreshold = 2; // 중무 = 2+0 = 2
      } else if (originalLabel.includes('하무') || originalLabel.includes('무하')) {
        minimumScoreThreshold = 1; // 하무 = 1+0 = 1
      } else if (originalLabel.includes('무무')) {
        minimumScoreThreshold = 0; // 무무 = 0+0 = 0
      } else {
        // 라벨을 찾지 못하면 현재 점수 사용
        minimumScoreThreshold = currentOptionsScore;
      }

      console.log(`원래 라벨 추정: ${originalLabel}, 현재 점수: ${currentOptionsScore}, 일치 기준 점수: ${minimumScoreThreshold}`);

      console.log(`옵션 조합 점수 테스트 - 각 조합 점수:`);
      qualityCombinations.forEach(combo => {
        console.log(`${combo.label}: ${combo.score}점`);
      });
      
      // 엔진 검색 전략을 용도에 맞게 수정
      // 최소 점수 기준 이상인 모든 조합 선택
      const betterCombinations = qualityCombinations.filter(combo => {
        return combo.score >= minimumScoreThreshold;
      });
      
      console.log(`점수 ${minimumScoreThreshold} 이상 조합 개수: ${betterCombinations.length}`);
      
      // 현재 조합과 점수가 같지만 다른 구성의 조합 선택 (예: 상중 -> 중상 등)
      // 이미 minimumScoreThreshold에 포함되어 있을 수 있으므로 현재 점수 기준으로 변경
      const equalScoreCombinations = qualityCombinations.filter(combo => {
        // 점수가 같고 라벨이 서로 다른 조합만 추가
        return combo.score === currentOptionsScore && combo.label !== originalLabel;
      });
      
      // 필터링된 조합 병합 (중복 제거)
      let combinationsToScan = [];
      
      // 모든 betterCombinations 추가
      betterCombinations.forEach(combo => {
        if (!combinationsToScan.some(c => c.label === combo.label)) {
          combinationsToScan.push(combo);
        }
      });
      
      // 같은 점수의 다른 구성 조합 추가 (이미 betterCombinations에 있을 수 있음)
      equalScoreCombinations.forEach(combo => {
        if (!combinationsToScan.some(c => c.label === combo.label)) {
          combinationsToScan.push(combo);
        }
      });
      
      console.log(`최종 스캔 조합 개수: ${combinationsToScan.length}`);
      
      // 점수순으로 다시 정렬
      combinationsToScan.sort((a, b) => b.score - a.score);
      
      console.log(`현재 ${type} 장신구 옵션 최소 점수: ${minimumScoreThreshold}`);
      
      console.log(`스캔할 조합: 높은 점수 ${betterCombinations.length}개 + 같은 점수 다른 구성 ${equalScoreCombinations.length}개 = 총 ${combinationsToScan.length}개`);
      console.log(`전체 ${qualityCombinations.length}개 중 ${combinationsToScan.length}개 스캔 예정`);
      
      // 원래 값을 배열로 저장 (elements마다 원래 값 저장)
      const originalElements = [];
      try {
        for (let i = 0; i < group.elements.length; i++) {
          if (group.elements[i] && typeof group.indices[i] !== 'undefined') {
            originalElements.push({
              element: group.elements[i],
              originalValue: group.elements[i].value,
              originalIndex: group.indices[i]
            });
          }
        }
      } catch (e) {
        console.error('원래 요소 정보 저장 오류:', e);
      }
      
      // 추후 복원을 위해 원래 값 보관
      const originalValues = [];
      originalElements.forEach(item => {
        if (item && item.element) {
          originalValues.push(item.element.value);
        }
      });
      
      // 티어별 스캔 수행
      for (const tierOption of tierOptions) {
        if (!BaseScanner.state.isScanning) {
          console.log('스캔이 중지되었습니다.');
          // 스캔 중지시 티어 복원 후 원래 값으로 복원
          if (tierElement && tierElement.element && tierElement.originalValue) {
            console.log(`${type} 장신구 티어 복원: ${tierElement.element.value} -> ${tierElement.originalValue}`);
            tierElement.element.value = tierElement.originalValue;
            const event = new Event('change', { bubbles: true });
            tierElement.element.dispatchEvent(event);
            await LopecScanner.Utils.delay(300);
          }
          // 티어 복원 후 옵션 복원
          await restoreOriginalValues(type, originalElements, originalValues);
          return;
        }
        
        // 티어 옵션 변경 여부 확인 - 원래 티어와 비교
        const originalTierText = tierElement && tierElement.originalText ? tierElement.originalText.toLowerCase() : '';
        const currentTierText = tierOption.text ? tierOption.text.toLowerCase() : '';
        // 티어 변경 시 모든 조합 검색 플래그
        let scanAllCombinations = false;
        
        // 유물 -> 고대로 등급 상승 시 모든 조합 검색
        if (originalTierText !== currentTierText) {
          // 더 높은 등급으로 변경 시 모든 조합 검색
          const isUpgrade = 
            (originalTierText.includes('유물') && currentTierText.includes('고대')) ||
            (!originalTierText.includes('고대') && currentTierText.includes('고대'));
            
          if (isUpgrade) {
            console.log(`티어 업그레이드 감지: ${originalTierText} -> ${currentTierText}, 모든 조합 검색 실행`);
            scanAllCombinations = true;
          }
        }
        
        // 티어 값이 있으면 먼저 변경
        let tierChanged = false;
        if (tierOption.value && tierElement && tierElement.element) {
          try {
            console.log(`${type} 장신구 티어 변경: ${tierElement.element.value} -> ${tierOption.value}`);
            tierElement.element.value = tierOption.value;
            const event = new Event('change', { bubbles: true });
            tierElement.element.dispatchEvent(event);
            tierChanged = true;
            
            // 티어 변경 후 이벤트 처리를 위한 대기
            await LopecScanner.Utils.delay(300);
          } catch (e) {
            console.error(`티어 변경 중 오류:`, e);
          }
        }
        
        // 티어 변경 로직에 따라 스캔할 조합 다시 필터링
        let combinationsToScanForTier = [...combinationsToScan]; // 기본값은 원래 필터링된 조합들
        
        // 티어 업그레이드 시 모든 조합 검색
        if (scanAllCombinations) {
          console.log(`티어 업그레이드로 인해 모든 조합 검색: 기존 ${combinationsToScanForTier.length}개 -> 전체 ${qualityCombinations.length}개`);
          combinationsToScanForTier = qualityCombinations;
        }
        
        // 각 옵션 조합마다 스캔 수행
        for (const combo of combinationsToScanForTier) {
          if (!BaseScanner.state.isScanning) {
            console.log('스캔이 중지되었습니다.');
            // 스캔 중지시 티어 복원 후 원래 값으로 복원
            if (tierElement && tierElement.element && tierElement.originalValue) {
              console.log(`${type} 장신구 티어 복원: ${tierElement.element.value} -> ${tierElement.originalValue}`);
              tierElement.element.value = tierElement.originalValue;
              const event = new Event('change', { bubbles: true });
              tierElement.element.dispatchEvent(event);
              await LopecScanner.Utils.delay(300);
            }
            // 티어 복원 후 옵션 복원
            await restoreOriginalValues(type, originalElements, originalValues);
            return;
          }
        
          try {
            console.log(`스캔 실행 - ${combo.label}, 옵션: ${JSON.stringify(combo.options)}`);
            
            let changed = false;
            
            // 모든 장신구에 대해 동일한 방식 적용
            for (let i = 0; i < Math.min(combo.options.length, originalElements.length); i++) {
              if (!originalElements[i] || !originalElements[i].element) continue;
              
              const currentElement = originalElements[i].element;
              
              // 값 변경 시도
              const changeResult = await Manipulator.changeAccessoryOption(
                currentElement, 
                combo.options[i], 
                type
              );
              
              if (changeResult) changed = true;
            }
            
            // 변경이 있으면 이벤트를 처리할 시간을 제공
            if (changed) {
              await LopecScanner.Utils.delay(500); // 모든 장신구에 동일한 딜레이 적용
            }
            
            // 변경 적용 후 점수 측정
            const currentScore = LopecScanner.Utils.getCurrentScore();
            let difference = LopecScanner.Utils.getCurrentDifference();
            
            // 변동값이 매우 작은 경우, 더 상세히 확인
            if (Math.abs(difference) < 0.02 && changed) {
              // 추가 확인 처리
              try {
                difference = await Manipulator.checkScoreDifferenceForAccessory(
                  type, 
                  originalValues, 
                  combo.options, 
                  originalElements
                );
              } catch (e) {
                console.error('점수 변동 확인 중 오류:', e);
                difference = 0;
              }
            }
            
            // 현재 적용된 옵션들의 레이블 가져오기
            const appliedOptions = [];
            for (let i = 0; i < Math.min(combo.options.length, originalElements.length); i++) {
              if (!originalElements[i] || !originalElements[i].element) continue;
              
              const currentElement = originalElements[i].element;
              // 옵션 텍스트 구하기
              let optionText = '';
              if (currentElement.options) {
                for (let j = 0; j < currentElement.options.length; j++) {
                  if (currentElement.options[j].value === combo.options[i]) {
                    optionText = currentElement.options[j].textContent;
                    break;
                  }
                }
              }
              
              // 상/중/하 등급 정보 추가
              let grade = '';
              try {
                const qualitySpan = currentElement.closest('.grinding-wrap')?.querySelector('.quality');
                grade = qualitySpan ? qualitySpan.textContent : '';
              } catch (e) {
                console.error('등급 정보 가져오기 오류:', e);
                grade = '';
              }
              
              if (grade && optionText) {
                appliedOptions.push(`[${grade}] ${optionText}`);
              } else if (optionText) {
                appliedOptions.push(optionText);
              }
              
              // 옵션 텍스트 확인
              console.log(`옵션 ${i+1} 적용: ${currentElement.value} -> ${optionText} (등급: ${grade})`);
            }
            
            // 결과 저장 (티어와 조합별로 하나의 결과)
            const tierText = tierOption.text || '기본 티어';
            const resultKey = `accessory-combo-${jobType}-${type}-${tierText}-${combo.label}`;
            
            // 사용자가 보기 쉽게 조합 설명 추가
            let comboDescription = combo.label;
            // 옵션 값이 있는 경우에만 추가
            if (appliedOptions.length > 0 && appliedOptions.every(opt => opt.includes('[') && opt.includes(']'))) {
              comboDescription += ` (${appliedOptions.join(', ')})`;
            } else {
              // 옵션 값이 없는 경우 기본 설명 사용
              comboDescription += ` (옵션 정보 없음, 상/중/하/무 조합)`;
            }
            
            // 원래 옵션과 신규 옵션 분리 - 최대 3개만 저장
            const maxOptionsToShow = 3;
            const originalOptionsFormatted = originalOptionTexts.slice(0, maxOptionsToShow).join(', ') || '원본 옵션 없음';
            const appliedOptionsFormatted = appliedOptions.slice(0, maxOptionsToShow).join(', ') || '적용된 옵션 없음';
            
            // 결과 저장
            try {
              let parentItem;
              let itemName = type;
              
              if (originalElements[0] && originalElements[0].element) {
                parentItem = originalElements[0].element.closest('li.accessory-item');
                if (parentItem) {
                  const imgElement = parentItem.querySelector('img');
                  if (imgElement && imgElement.alt) {
                    itemName = imgElement.alt;
                  }
                }
              }
              
              BaseScanner.state.scanResults[resultKey] = {
                type: 'accessory',
                subType: `${typeDisplayName} 옵션 조합 (${jobType === 'DEALER' ? '딜러' : '서포터'})`,
                combo: combo.label,
                tier: tierText, // 티어 정보 추가
                item: `${itemName}`,
                from: `원래 옵션: ${originalOptionsFormatted}`,
                to: `${tierText} / ${combo.label} 조합: ${appliedOptionsFormatted}`,
                accessoryType: type,           // 장신구 타입 추가
                originalOptions: originalOptionTexts.slice(0, maxOptionsToShow),  // 원래 옵션 배열
                appliedOptions: appliedOptions.slice(0, maxOptionsToShow),       // 적용된 옵션 배열
                fromGrade: tierElement && tierElement.originalText ? tierElement.originalText : '', // 원래 등급 추가
                toGrade: tierText, // 변경 등급 추가
                score: currentScore,
                difference: difference
              };
            } catch (e) {
              console.error('결과 저장 중 오류:', e);
            }
            
            BaseScanner.updateScanProgress();
          } catch (e) {
            console.error(`${type} 장신구 조합 ${combo.label} 스캔 중 오류:`, e);
            BaseScanner.updateScanProgress(); // 오류 발생해도 진행률 업데이트
          }
        } // combinationsToScan 반복문 종료
        
        // 스캔하지 않는 조합들에 대해서도 진행률 업데이트
        const scannedCombinationLabels = combinationsToScanForTier.map(combo => combo.label);
        const skippedCombinations = qualityCombinations.filter(combo => 
          !scannedCombinationLabels.includes(combo.label)
        );
        console.log(`이 티어에서 검색한 조합: ${combinationsToScanForTier.length}개, 건너뛰는 조합: ${skippedCombinations.length}개`);
        
        for (let i = 0; i < skippedCombinations.length; i++) {
          BaseScanner.updateScanProgress();
        }
      } // tierOptions 반복문 종료
      
      // 모든 티어 및 조합 스캔 후 원래 값으로 복원
      // 티어 값이 변경되었다면 먼저 복원
      if (tierElement && tierElement.element && tierElement.originalValue) {
        console.log(`${type} 장신구 티어 복원: ${tierElement.element.value} -> ${tierElement.originalValue}`);
        tierElement.element.value = tierElement.originalValue;
        const event = new Event('change', { bubbles: true });
        tierElement.element.dispatchEvent(event);
        await LopecScanner.Utils.delay(300); // 티어 변경은 전체 옵션에 영향을 주므로 더 긴 딜레이 적용
      }
      
      // 티어 복원 후 옵션 값 복원
      await restoreOriginalValues(type, originalElements, originalValues);
      
    } catch (e) {
      console.error(`${type} 장신구 스캔 전체 처리 오류:`, e);
      
      // 남은 스캔 처리 - 모든 티어 및 조합에 대해 진행률 업데이트
      for (let i = 0; i < 32; i++) { // 2개 티어 * 16개 조합
        BaseScanner.updateScanProgress();
      }
    }
  }
  
  /**
   * 원래 값으로 복원
   * @param {string} type - 장신구 타입
   * @param {Array} originalElements - 원래 요소 정보
   * @param {Array} originalValues - 원래 값
   */
  async function restoreOriginalValues(type, originalElements, originalValues) {
    try {
      // 각 요소마다 개별적으로 복원 및 이벤트 발생
      let changed = false;
      
      for (let i = 0; i < originalElements.length; i++) {
        if (!originalElements[i] || !originalElements[i].element) continue;
        
        if (originalElements[i].element.value !== originalValues[i]) {
          try {
            originalElements[i].element.value = originalValues[i];
            const event = new Event('change', { bubbles: true });
            originalElements[i].element.dispatchEvent(event);
            changed = true;
            
            // 각 요소 복원 후 짧은 딜레이
            await LopecScanner.Utils.delay(50);
          } catch (e) {
            console.error(`복원 중 오류 (${type}, 요소 ${i}):`, e);
          }
        }
      }
      
      // 변경이 있었다면 모든 복원이 적용될 시간을 충분히 제공
      if (changed) {
        await LopecScanner.Utils.delay(300); // 모든 장신구에 동일한 딜레이 적용
      }
    } catch (e) {
      console.error(`원래 값으로 복원 중 오류 (${type}):`, e);
    }
  }
  
  // 공개 API
  return {
    setAccessoryOptions,
    prepareAccessoryScan,
    scanAccessories,
    getSelectedAccessoryOptions: Detector.getSelectedAccessoryOptions
  };
})();