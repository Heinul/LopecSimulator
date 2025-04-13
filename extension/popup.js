// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', function() {
  const scanBtn = document.getElementById('scanBtn');
  const viewDataBtn = document.getElementById('viewDataBtn');
  const statusText = document.getElementById('statusText');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  
  // 현재 활성화된 탭이 롭크 시뮬레이터 페이지인지 확인
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = tabs[0].url;
    
    if (currentUrl.includes('lopec.kr/simulator')) {
      statusText.textContent = '스캔을 시작하려면 "스캔 시작" 버튼을 클릭하세요.';
      scanBtn.disabled = false;
    } else {
      statusText.textContent = '롭크 시뮬레이터 페이지에서 실행해주세요.';
      scanBtn.disabled = true;
    }
  });
  
  // 스캔 시작 버튼 클릭 시
  scanBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'startScan'}, function(response) {
        if (response && response.status === 'started') {
          statusText.textContent = '스캔 중... 페이지를 닫지 마세요.';
          scanBtn.disabled = true;
          viewDataBtn.disabled = true;
          progressContainer.style.display = 'block';
        }
      });
    });
  });
  
  // 데이터 조회 버튼 클릭 시
  viewDataBtn.addEventListener('click', function() {
    chrome.tabs.create({url: chrome.runtime.getURL('data.html')});
  });
  
  // 진행 상황 업데이트를 위한 이벤트 리스너
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateProgress') {
      progressBar.style.width = request.progress + '%';
      progressBar.textContent = request.progress + '%';
    } else if (request.action === 'scanComplete') {
      statusText.textContent = '스캔 완료! "데이터 조회" 버튼으로 결과를 확인하세요.';
      scanBtn.disabled = false;
      viewDataBtn.disabled = false;
      progressBar.style.width = '100%';
      progressBar.textContent = '100%';
    }
  });
});
