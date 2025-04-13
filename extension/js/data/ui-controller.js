/**
 * 롭크 시뮬레이터 점수 분석기 - UI 컨트롤러 모듈
 */

// UI 컨트롤러 모듈
const UIController = {
  // 요소 참조
  elements: {
    filterIncrease: null,
    categoryFilter: null,
    sortOption: null,
    dataBody: null,
    exportDataBtn: null
  },
  
  // 요소 초기화
  initElements() {
    this.elements.filterIncrease = document.getElementById('filterIncrease');
    this.elements.categoryFilter = document.getElementById('categoryFilter');
    this.elements.sortOption = document.getElementById('sortOption');
    this.elements.dataBody = document.getElementById('dataBody');
    this.elements.exportDataBtn = document.getElementById('exportData');
  },
  
  // 현재 필터 및 정렬 설정 가져오기
  getCurrentFilterSettings() {
    return {
      filterIncrease: this.elements.filterIncrease.checked,
      categoryFilter: this.elements.categoryFilter.value,
      sortBy: this.elements.sortOption.value
    };
  },
  
  // 테이블 렌더링
  renderTable(data) {
    const dataBody = this.elements.dataBody;
    dataBody.innerHTML = '';
    
    if (data.length === 0) {
      const noDataRow = document.createElement('tr');
      noDataRow.innerHTML = '<td colspan="5" class="no-data">데이터가 없거나 필터 조건에 맞는 항목이 없습니다.</td>';
      dataBody.appendChild(noDataRow);
      return;
    }
    
    data.forEach(item => {
      const row = document.createElement('tr');
      
      // 점수 변동에 따른 클래스 결정
      let differenceClass = 'zero';
      if (item.difference > 0) {
        differenceClass = 'positive';
      } else if (item.difference < 0) {
        differenceClass = 'negative';
      }
      
      row.innerHTML = `
        <td>${item.type}</td>
        <td>${item.item}</td>
        <td>${item.from}</td>
        <td>${item.to}</td>
        <td class="${differenceClass}">${item.difference > 0 ? '+' : ''}${item.difference.toFixed(2)}</td>
      `;
      
      dataBody.appendChild(row);
    });
  },
  
  // CSV 파일로 다운로드
  downloadCSV(csvContent, filename) {
    if (!csvContent) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
