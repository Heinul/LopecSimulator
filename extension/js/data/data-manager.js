/**
 * 로펙 시뮬레이터 점수 분석기 - 데이터 관리 모듈
 */

// 데이터 관리 모듈
const DataManager = {
  // 원본 스캔 데이터
  scanData: {},
  
  // 처리된 데이터 (필터링 및 정렬 적용)
  processedData: [],
  

  
  // 스토리지에서 데이터 로드
  loadData(callback) {
    chrome.storage.local.get(['scanData'], (result) => {
      this.scanData = result.scanData || {};
      callback && callback();
    });
  },
  
  // 필터 및 정렬 옵션 적용
  processData(filterIncrease, categoryFilter, sortBy) {
    this.processedData = [];
    
    // 데이터 변환
    for (const key in this.scanData) {
      const item = this.scanData[key];
      
      this.processedData.push({
        ...item
      });
    }
    
    // 2. 증가 항목 필터
    if (filterIncrease) {
      this.processedData = this.processedData.filter(item => item.difference > 0);
    }
    
    // 3. 카테고리 필터
    if (categoryFilter !== 'all') {
      this.processedData = this.processedData.filter(item => item.type === categoryFilter);
    }
    
    // 4. 정렬
    this.sortData(sortBy);
    
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
  

  
  // 데이터 내보내기 (CSV)
  exportDataToCSV() {
    if (this.processedData.length === 0) {
      return null;
    }
    
    const headers = ['카테고리', '항목', '현재값', '변경값', '점수변동'];
    const rows = this.processedData.map(item => [
      item.type,
      item.item,
      item.from,
      item.to,
      item.difference.toFixed(2)
    ]);
    
    let csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
};
