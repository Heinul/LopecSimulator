// 데이터 페이지 초기화
document.addEventListener('DOMContentLoaded', function() {
  const filterIncrease = document.getElementById('filterIncrease');
  const categoryFilter = document.getElementById('categoryFilter');
  const sortOption = document.getElementById('sortOption');
  const dataBody = document.getElementById('dataBody');
  const exportDataBtn = document.getElementById('exportData');
  const applyCostBtn = document.getElementById('applyCost');
  
  let scanData = {};
  let processedData = [];
  
  // 비용 설정 값
  let costs = {
    armorName: 1000,    // 장비 강화 비용
    armorUpgrade: 500,  // 장비 상재 비용
    gem: 2000          // 보석 비용
  };
  
  // 스토리지에서 데이터 로드
  function loadData() {
    chrome.storage.local.get(['scanData'], function(result) {
      scanData = result.scanData || {};
      processData();
      renderTable();
    });
  }
  
  // 데이터 처리 (필터링 및 정렬)
  function processData() {
    processedData = [];
    
    // 1. 데이터 변환 및 비용 계산
    for (const key in scanData) {
      const item = scanData[key];
      const costPerLevel = getCostPerLevel(item.type);
      const levels = item.to - item.from;
      const cost = levels * costPerLevel;
      const efficiency = item.difference > 0 ? (item.difference / cost) : 0;
      
      processedData.push({
        ...item,
        cost: cost,
        efficiency: efficiency
      });
    }
    
    // 2. 증가 항목 필터
    if (filterIncrease.checked) {
      processedData = processedData.filter(item => item.difference > 0);
    }
    
    // 3. 카테고리 필터
    if (categoryFilter.value !== 'all') {
      processedData = processedData.filter(item => item.type === categoryFilter.value);
    }
    
    // 4. 정렬
    sortData();
  }
  
  // 정렬 함수
  function sortData() {
    const sortBy = sortOption.value;
    
    switch (sortBy) {
      case 'differenceDesc':
        processedData.sort((a, b) => b.difference - a.difference);
        break;
      case 'differenceAsc':
        processedData.sort((a, b) => a.difference - b.difference);
        break;
      case 'costDesc':
        processedData.sort((a, b) => b.cost - a.cost);
        break;
      case 'costAsc':
        processedData.sort((a, b) => a.cost - b.cost);
        break;
      case 'efficiencyDesc':
        processedData.sort((a, b) => b.efficiency - a.efficiency);
        break;
      case 'efficiencyAsc':
        processedData.sort((a, b) => a.efficiency - b.efficiency);
        break;
    }
  }
  
  // 항목 유형에 따른 비용 반환
  function getCostPerLevel(type) {
    if (type === '장비 강화') {
      return costs.armorName;
    } else if (type === '장비 상재') {
      return costs.armorUpgrade;
    } else if (type === '보석') {
      return costs.gem;
    }
    return 0;
  }
  
  // 테이블 렌더링
  function renderTable() {
    dataBody.innerHTML = '';
    
    if (processedData.length === 0) {
      const noDataRow = document.createElement('tr');
      noDataRow.innerHTML = '<td colspan="7" class="no-data">데이터가 없거나 필터 조건에 맞는 항목이 없습니다.</td>';
      dataBody.appendChild(noDataRow);
      return;
    }
    
    processedData.forEach(item => {
      const row = document.createElement('tr');
      
      // 점수 변동에 따른 클래스 결정
      let differenceClass = 'zero';
      if (item.difference > 0) {
        differenceClass = 'positive';
      } else if (item.difference < 0) {
        differenceClass = 'negative';
      }
      
      // 효율 포맷팅 (소수점 6자리까지)
      const formattedEfficiency = item.efficiency > 0 
        ? item.efficiency.toFixed(6) 
        : '0';
      
      row.innerHTML = `
        <td>${item.type}</td>
        <td>${item.item}</td>
        <td>${item.from}</td>
        <td>${item.to}</td>
        <td class="${differenceClass}">${item.difference > 0 ? '+' : ''}${item.difference.toFixed(2)}</td>
        <td>${item.cost.toLocaleString()}</td>
        <td>${formattedEfficiency}</td>
      `;
      
      dataBody.appendChild(row);
    });
  }
  
  // 데이터 내보내기 (CSV)
  function exportDataToCSV() {
    if (processedData.length === 0) {
      alert('내보낼 데이터가 없습니다.');
      return;
    }
    
    const headers = ['카테고리', '항목', '현재값', '변경값', '점수변동', '예상비용', '효율(점수/비용)'];
    const rows = processedData.map(item => [
      item.type,
      item.item,
      item.from,
      item.to,
      item.difference.toFixed(2),
      item.cost,
      item.efficiency.toFixed(6)
    ]);
    
    let csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', '롭크_시뮬레이터_데이터.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // 비용 적용 함수
  function applyCustomCosts() {
    costs.armorName = parseInt(document.getElementById('costArmorName').value) || 1000;
    costs.armorUpgrade = parseInt(document.getElementById('costArmorUpgrade').value) || 500;
    costs.gem = parseInt(document.getElementById('costGem').value) || 2000;
    
    processData();
    renderTable();
  }
  
  // 이벤트 리스너 설정
  filterIncrease.addEventListener('change', function() {
    processData();
    renderTable();
  });
  
  categoryFilter.addEventListener('change', function() {
    processData();
    renderTable();
  });
  
  sortOption.addEventListener('change', function() {
    processData();
    renderTable();
  });
  
  exportDataBtn.addEventListener('click', exportDataToCSV);
  
  applyCostBtn.addEventListener('click', applyCustomCosts);
  
  // 초기 데이터 로드
  loadData();
});
