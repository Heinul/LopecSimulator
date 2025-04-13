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
    summaryContainer: null,
    exportDataBtn: null
  },
  
  // 요소 초기화
  initElements() {
    this.elements.filterIncrease = document.getElementById('filterIncrease');
    this.elements.categoryFilter = document.getElementById('categoryFilter');
    this.elements.sortOption = document.getElementById('sortOption');
    this.elements.dataBody = document.getElementById('dataBody');
    this.elements.summaryContainer = document.getElementById('summaryContainer');
    this.elements.exportDataBtn = document.getElementById('exportData');
    
    console.log('UI elements initialized');
  },
  
  // 현재 필터 및 정렬 설정 가져오기
  getCurrentFilterSettings() {
    return {
      filterIncrease: this.elements.filterIncrease.checked,
      categoryFilter: this.elements.categoryFilter.value,
      sortBy: this.elements.sortOption.value
    };
  },
  
  // 요약 정보 렌더링
  renderSummary(summary) {
    if (!summary || !this.elements.summaryContainer) {
      return;
    }
    
    let html = `
      <div class="summary-box">
        <h3>데이터 요약</h3>
        <p>총 항목 수: <strong>${summary.totalItems}</strong></p>
        <p>점수 상승 항목: <strong>${summary.positiveChanges}</strong></p>
        
        <h4>카테고리별 통계</h4>
        <ul>
    `;
    
    for (const category in summary.categories) {
      const data = summary.categories[category];
      html += `
        <li>
          <strong>${category}</strong>: ${data.count}항목 중 ${data.positive}개 상승
          ${data.maxItem ? `<br>최대 상승: ${data.maxItem.item} (${data.maxItem.from} → ${data.maxItem.to}): +${data.maxChange.toFixed(2)}` : ''}
        </li>
      `;
    }
    
    html += `
        </ul>
      </div>
    `;
    
    this.elements.summaryContainer.innerHTML = html;
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
    
    console.log('Rendering table with', data.length, 'items');
    
    data.forEach(item => {
      const row = document.createElement('tr');
      
      // 점수 변동에 따른 클래스 결정
      let differenceClass = 'zero';
      if (item.difference > 0) {
        differenceClass = 'positive';
      } else if (item.difference < 0) {
        differenceClass = 'negative';
      }
      
      // 숫자 포맷팅
      const formattedDifference = item.difference.toFixed(2);
      const prefix = item.difference > 0 ? '+' : '';
      
      row.innerHTML = `
        <td>${item.type}</td>
        <td>${item.item}</td>
        <td>${item.from}</td>
        <td>${item.to}</td>
        <td class="${differenceClass}">${prefix}${formattedDifference}</td>
      `;
      
      dataBody.appendChild(row);
    });
    
    console.log('Table rendered successfully');
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
    
    console.log('CSV downloaded:', filename);
  }
};
