/**
 * 로펙 시뮬레이터 점수 분석기 - 데이터 관리 모듈
 */

// 데이터 관리 모듈
const DataManager = {
  // 원본 스캔 데이터
  scanData: {},
  
  // 처리된 데이터 (필터링 및 정렬 적용)
  processedData: [],
  
  // 구조화된 데이터 저장
  structuredData: {},
  
  // 스토리지에서 데이터 로드
  loadData(callback) {
    chrome.storage.local.get(['scanData'], (result) => {
      this.scanData = result.scanData || {};
      console.log('Loaded data:', Object.keys(this.scanData).length, 'items');
      
      // 구조화된 데이터 처리 (스캐너 향상 모듈이 있는 경우)
      if (window.LopecScanner && window.LopecScanner.ScannerEnhancement) {
        this.structuredData = window.LopecScanner.ScannerEnhancement.processRawScanData(this.scanData);
        console.log('Enhanced data structure created:', this.structuredData);
      }
      
      callback && callback();
    });
  },
  
  /**
   * 각인서 가격 계산
   * @param {string} engravingName - 각인 이름
   * @param {string} grade - 각인서 등급
   * @param {number} price - 각인서 가격 
   * @param {number} level - 각인서 레벨
   * @returns {number} - 총 가격
   */
  calculateEngravingPrice(engravingName, grade, price, level) {
    // 각 각인서는 레벨당 5장씩 소요
    const bookPerLevel = 5;
    const totalBooks = level * bookPerLevel;
    return price * totalBooks;
  },
  
  /**
   * 구조화된 데이터에서 각인서 가격 정보 가져오기
   * @param {string} gradeFilter - 등급 필터 (선택적)
   * @returns {Array} - 각인서 가격 정보 배열
   */
  getEnhancedEngravingInfo(gradeFilter = null) {
    // 구조화된 데이터가 없으면 빈 배열 반환
    if (!this.structuredData || !this.structuredData.engraving) {
      return [];
    }
    
    const engravings = this.structuredData.engraving;
    
    // 등급 필터링 (지정된 경우)
    let filteredEngravings = engravings;
    if (gradeFilter) {
      filteredEngravings = engravings.filter(item => 
        item.toGrade === gradeFilter || item.fromGrade === gradeFilter
      );
    }
    
    return filteredEngravings.map(engraving => {
      // 필요 개수 계산 (5장/레벨)
      const fromCount = engraving.fromLevel * 5;
      const toCount = engraving.toLevel * 5;
      const diffCount = Math.max(0, toCount - fromCount);
      
      return {
        name: engraving.engravingName || '',
        fromGrade: engraving.fromGrade || '',
        toGrade: engraving.toGrade || '',
        fromLevel: engraving.fromLevel || 0,
        toLevel: engraving.toLevel || 0,
        fromCount: fromCount,
        toCount: toCount,
        diffCount: diffCount,
        score: engraving.score || 0,
        difference: engraving.difference || 0
      };
    });
  },
  
  // 필터 및 정렬 옵션 적용
  processData(filterIncrease, categoryFilter, sortBy) {
    this.processedData = [];
    console.log('Processing data with filters:', { filterIncrease, categoryFilter, sortBy });
    
    // 데이터 변환
    for (const key in this.scanData) {
      const item = this.scanData[key];
      
      // 음수 값은 절대값으로 변환하지만 표시는 -로 유지
      const normalizedDiff = parseFloat(item.difference);
      
      this.processedData.push({
        ...item,
        difference: normalizedDiff,
        // 원본 키 추가
        key: key
      });
    }
    
    console.log('Processed items before filtering:', this.processedData.length);
    
    // 증가 항목 필터
    if (filterIncrease) {
      this.processedData = this.processedData.filter(item => item.difference > 0);
      console.log('After positive filter:', this.processedData.length);
    }
    
    // 카테고리 필터
    if (categoryFilter !== 'all') {
      this.processedData = this.processedData.filter(item => item.type === categoryFilter);
      console.log('After category filter:', this.processedData.length);
    }
    
    // 정렬
    this.sortData(sortBy);
    
    console.log('Final processed items:', this.processedData.length);
    return this.processedData;
  },
  
  // 정렬 함수
  sortData(sortBy) {
    switch (sortBy) {
      case 'differenceDesc':
        this.processedData.sort((a, b) => b.difference - a.difference);
        break;
      case 'differenceAsc':
        this.processedData.sort((a, b) => a.difference - b.difference);
        break;
    }
  },
  
  // 데이터 요약 얻기
  getSummary() {
    if (Object.keys(this.scanData).length === 0) {
      return null;
    }
    
    const categories = {};
    let totalItems = 0;
    let positiveChanges = 0;
    
    // 기본 통계 계산
    for (const key in this.scanData) {
      const item = this.scanData[key];
      totalItems++;
      
      // 카테고리별 카운트
      if (!categories[item.type]) {
        categories[item.type] = {
          count: 0,
          positive: 0,
          maxChange: 0,
          maxItem: null
        };
      }
      
      categories[item.type].count++;
      
      if (parseFloat(item.difference) > 0) {
        positiveChanges++;
        categories[item.type].positive++;
        
        if (parseFloat(item.difference) > categories[item.type].maxChange) {
          categories[item.type].maxChange = parseFloat(item.difference);
          categories[item.type].maxItem = item;
        }
      }
    }
    
    return {
      totalItems,
      positiveChanges,
      categories
    };
  },
  
  // 데이터 내보내기 (CSV)
  exportDataToCSV() {
    if (this.processedData.length === 0) {
      return null;
    }
    
    const headers = ['카테고리', '항목', '현재값', '변경값', '점수변동'];
    const rows = this.processedData.map(item => {
      // 카테고리 이름 변환
      let categoryName = '';
      switch(item.type) {
        case 'armor': categoryName = '장비'; break;
        case 'gem': categoryName = '보석'; break;
        case 'accessory': categoryName = '장신구'; break;
        case 'engraving': categoryName = '각인'; break;
        case 'karma': categoryName = '카르마'; break;
        case 'avatar': categoryName = '아바타'; break;
        default: categoryName = item.type;
      }
      
      return [
        categoryName,
        item.item,
        item.from,
        item.to,
        item.difference.toFixed(2)
      ];
    });
    
    let csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  },
  
  // 차트 데이터 준비
  prepareChartData() {
    if (this.processedData.length === 0) {
      return null;
    }
    
    // 카테고리별로 그룹화
    const categories = {};
    
    this.processedData.forEach(item => {
      if (!categories[item.type]) {
        categories[item.type] = [];
      }
      categories[item.type].push(item);
    });
    
    // 각 카테고리에서 상위 5개 항목 추출
    const result = {};
    for (const category in categories) {
      // 점수 변동 기준으로 내림차순 정렬
      categories[category].sort((a, b) => b.difference - a.difference);
      
      // 상위 5개 항목만 선택
      result[category] = categories[category].slice(0, 5).map(item => ({
        name: `${item.item} (${item.from} → ${item.to})`,
        value: item.difference
      }));
    }
    
    return result;
  }
};
