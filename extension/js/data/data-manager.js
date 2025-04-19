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
   * @param {string} tierFilter - 티어 필터 (선택적)
   * @returns {Array} - 각인서 가격 정보 배열
   */
  getEnhancedEngravingInfo(gradeFilter = null, tierFilter = null) {
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
    
    // 티어 필터링 (지정된 경우)
    if (tierFilter && filteredEngravings.length > 0) {
      filteredEngravings = filteredEngravings.filter(item => 
        item.tier === tierFilter
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
        difference: engraving.difference || 0,
        tier: engraving.tier || '',  // 티어 정보 추가
        tierValue: engraving.tierValue || '' // 티어 값 추가
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
      
      // 새 오브젝트 생성 (원본 객체의 모든 프로퍼티를 복사)
      const processedItem = {
        ...item,
        difference: normalizedDiff,
        // 원본 키 추가
        key: key
      };
      
      // 골드 정보가 원본에 있는 경우 복사
      if (item.goldCost !== undefined) {
        processedItem.goldCost = item.goldCost;
        if (item.engravingBooks) processedItem.engravingBooks = item.engravingBooks;
        if (item.costDetails) processedItem.costDetails = item.costDetails;
      }
      
      this.processedData.push(processedItem);
    }
    
    console.log('Processed items before filtering:', this.processedData.length);
    
    // 증가 항목 필터
    if (filterIncrease) {
      this.processedData = this.processedData.filter(item => item.difference > 0);
      console.log('After positive filter:', this.processedData.length);
    }
    
    // 카테고리 필터
    if (categoryFilter !== 'all') {
      // type 필드를 사용하여 필터링
      this.processedData = this.processedData.filter(item => {
        // 영문 카테고리 type 필드가 있는지 확인
        if (item.type && typeof item.type === 'string') {
          // 영문 표기 카테고리의 경우 (예: 'armor', 'gem' 등)
          if (item.type === categoryFilter) {
            return true;
          }
          
          // 한글 표기 카테고리의 경우 ('장비', '보석' 등)
          // 카테고리와 비교하여 매칭
          if (categoryFilter === 'armor' && item.type.includes('장비')) {
            return true;
          } else if (categoryFilter === 'gem' && item.type.includes('보석')) {
            return true;
          } else if (categoryFilter === 'accessory' && item.type.includes('장신구')) {
            return true;
          } else if (categoryFilter === 'engraving' && item.type.includes('각인')) {
            return true;
          } else if (categoryFilter === 'karma' && item.type.includes('카르마')) {
            return true;
          } else if (categoryFilter === 'avatar' && item.type.includes('아바타')) {
            return true;
          }
        }
        return false;
      });
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
      case 'tierDesc':
        // 티어가 있는 항목을 먼저 보여주고, 티어 정보로 정렬
        this.processedData.sort((a, b) => {
          if (a.tier && !b.tier) return -1;
          if (!a.tier && b.tier) return 1;
          if (!a.tier && !b.tier) return 0;
          return b.tierValue - a.tierValue;
        });
        break;
      case 'tierAsc':
        // 티어가 있는 항목을 먼저 보여주고, 티어 정보로 정렬 (T3 먼저, T4 다음)
        this.processedData.sort((a, b) => {
          if (a.tier && !b.tier) return -1;
          if (!a.tier && b.tier) return 1;
          if (!a.tier && !b.tier) return 0;
          return a.tierValue - b.tierValue;
        });
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
          maxItem: null,
          tierData: {} // 티어별 데이터 추가
        };
      }
      
      categories[item.type].count++;
      
      // 티어 정보가 있는 경우 티어별 통계 추가
      if (item.tier) {
        if (!categories[item.type].tierData[item.tier]) {
          categories[item.type].tierData[item.tier] = {
            count: 0,
            positive: 0,
            maxChange: 0,
            maxItem: null
          };
        }
        
        categories[item.type].tierData[item.tier].count++;
        
        if (parseFloat(item.difference) > 0) {
          categories[item.type].tierData[item.tier].positive++;
          
          if (parseFloat(item.difference) > categories[item.type].tierData[item.tier].maxChange) {
            categories[item.type].tierData[item.tier].maxChange = parseFloat(item.difference);
            categories[item.type].tierData[item.tier].maxItem = item;
          }
        }
      }
      
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
    
    const headers = ['카테고리', '세부 구분', '항목', '현재값', '변경값', '점수변동', '티어 정보'];
    const rows = this.processedData.map(item => {
      // 카테고리 이름 변환
      let categoryName = '';
      let subTypeName = item.subType || '';
      
      // type이 영문으로 되어 있으면 변환
      if (typeof item.type === 'string') {
        if (item.type === 'armor') {
          categoryName = '장비';
        } else if (item.type === 'gem') {
          categoryName = '보석';
        } else if (item.type === 'accessory') {
          categoryName = '장신구';
        } else if (item.type === 'engraving') {
          categoryName = '각인';
        } else if (item.type === 'karma') {
          categoryName = '카르마';
        } else if (item.type === 'avatar') {
          categoryName = '아바타';
        } else if (item.type.includes('장비')) {
          categoryName = '장비';
        } else if (item.type.includes('보석')) {
          categoryName = '보석';
        } else if (item.type.includes('장신구')) {
          categoryName = '장신구';
        } else if (item.type.includes('각인')) {
          categoryName = '각인';
        } else if (item.type.includes('카르마')) {
          categoryName = '카르마';
        } else if (item.type.includes('아바타')) {
          categoryName = '아바타';
        } else {
          categoryName = item.type;
        }
      } else {
        categoryName = item.type || '';
      }
      
      return [
        categoryName,
        subTypeName,
        item.item,
        item.from,
        item.to,
        item.difference.toFixed(2),
        item.tier || '' // 티어 정보 추가 (없으면 빈 문자열)
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
      // 카테고리 이름 확인 및 정리
      let categoryKey = item.type;
      
      // type이 영문이거나 한글이라도 일관된 키로 정리
      if (typeof categoryKey === 'string') {
        if (categoryKey === 'armor' || categoryKey.includes('장비')) {
          categoryKey = 'armor';
        } else if (categoryKey === 'gem' || categoryKey.includes('보석')) {
          categoryKey = 'gem';
        } else if (categoryKey === 'accessory' || categoryKey.includes('장신구')) {
          categoryKey = 'accessory';
        } else if (categoryKey === 'engraving' || categoryKey.includes('각인')) {
          categoryKey = 'engraving';
        } else if (categoryKey === 'karma' || categoryKey.includes('카르마')) {
          categoryKey = 'karma';
        } else if (categoryKey === 'avatar' || categoryKey.includes('아바타')) {
          categoryKey = 'avatar';
        }
      }
      
      if (!categories[categoryKey]) {
        categories[categoryKey] = [];
      }
      categories[categoryKey].push(item);
      
      // 세부 구분(서브타입)별 그룹화도 추가
      if (item.subType) {
        const subTypeKey = `${categoryKey}_${item.subType}`;
        if (!categories[subTypeKey]) {
          categories[subTypeKey] = [];
        }
        categories[subTypeKey].push(item);
      }
      
      // 티어별 그룹화도 추가
      if (item.tier) {
        const tierCategory = `${categoryKey}_${item.tier}`;
        if (!categories[tierCategory]) {
          categories[tierCategory] = [];
        }
        categories[tierCategory].push(item);
        
        // 티어와 서브타입 모두 가진 그룹도 추가
        if (item.subType) {
          const combinedKey = `${categoryKey}_${item.subType}_${item.tier}`;
          if (!categories[combinedKey]) {
            categories[combinedKey] = [];
          }
          categories[combinedKey].push(item);
        }
      }
    });
    
    // 각 카테고리에서 상위 5개 항목 추출
    const result = {};
    for (const category in categories) {
      // 점수 변동 기준으로 내림차순 정렬
      categories[category].sort((a, b) => b.difference - a.difference);
      
      // 상위 5개 항목만 선택
      result[category] = categories[category].slice(0, 5).map(item => {
        // 카테고리 이름 생성
        let categoryName = '';
        if (typeof item.type === 'string') {
          if (item.type === 'armor' || item.type.includes('장비')) {
            categoryName = '장비';
          } else if (item.type === 'gem' || item.type.includes('보석')) {
            categoryName = '보석';
          } else if (item.type === 'accessory' || item.type.includes('장신구')) {
            categoryName = '장신구';
          } else if (item.type === 'engraving' || item.type.includes('각인')) {
            categoryName = '각인';
          } else if (item.type === 'karma' || item.type.includes('카르마')) {
            categoryName = '카르마';
          } else if (item.type === 'avatar' || item.type.includes('아바타')) {
            categoryName = '아바타';
          } else {
            categoryName = item.type;
          }
        } else {
          categoryName = item.type || '';
        }
        
        // 세부 구분 정보 추가
        const subTypePart = item.subType ? `[${item.subType}] ` : '';
        
        // 티어 정보 추가
        const tierPart = item.tier ? `[${item.tier}] ` : '';
        
        // 전체 이름 구성 ([카테고리][세부구분][티어] 항목 (현재값 -> 변경값))
        const nameWithDetails = `${categoryName && subTypePart ? `[${categoryName}]` : ''}${subTypePart}${tierPart}${item.item} (${item.from} → ${item.to})`;
        
        return {
          name: nameWithDetails,
          value: item.difference,
          category: categoryName,
          subType: item.subType || '',
          tier: item.tier || ''
        };
      });
    }
    
    return result;
  }
};

// 전역 객체에 노출
window.DataManager = DataManager;

// 모듈 내보내기
export default DataManager;