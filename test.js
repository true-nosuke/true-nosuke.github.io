const STOCK_URL = "https://script.google.com/macros/s/AKfycbzZtlu_z9bK2XL-0_z-Z_f1_dXBsLjkVfl22rXUOLVUZ-hdSN_bAhKnkliUFqaKR5Bb/exec";
const UPDATE_INTERVAL = 10_000;
let intervalId = null;

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function createCard(item) {
  const card = document.createElement('div');
  card.className = 'stock-card';

  const h3 = document.createElement('h3');
  h3.textContent = item.item || '—';
  card.appendChild(h3);

  const pStock = document.createElement('p');
  pStock.textContent = item.stock || '';
  card.appendChild(pStock);

  const pRemark = document.createElement('p');
  pRemark.textContent = `残り：${item.remark || ''}`;
  card.appendChild(pRemark);

  return card;
}

async function fetchStockOnce() {
  try {
    const res = await fetch(STOCK_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Network response was not ok: ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid data format');
    return data;
  } catch (err) {
    console.error('fetchStockOnce:', err);
    return null;
  }
}

async function loadStock() {
  const container = document.getElementById('stock-area');
  if (!container) return;
  // show loading state
  clearChildren(container);
  const loading = document.createElement('p');
  loading.className = 'loading';
  loading.textContent = '読み込み中…';
  container.appendChild(loading);

  const data = await fetchStockOnce();

  clearChildren(container);

  if (!data) {
    // fetch が失敗した（CORS 等）場合、自動で JSONP にフォールバックして取得を試みる
    // JSONP 用のグローバルコールバックを用意
    window.handleStockJsonp = function(jsonData) {
      try {
        clearChildren(container);
        if (!jsonData || !Array.isArray(jsonData) || jsonData.length === 0) {
          const msg = document.createElement('p');
          msg.textContent = '在庫情報がありません。';
          container.appendChild(msg);
          return;
        }
        const grid = document.createElement('div');
        grid.className = 'stock-grid';
        jsonData.forEach(d => grid.appendChild(createCard(d)));
        container.appendChild(grid);
      } finally {
        // cleanup: 割り当て解除
        try { delete window.handleStockJsonp; } catch (e) { window.handleStockJsonp = null; }
      }
    };

    // JSONP スクリプトを挿入（タイムスタンプを付けてキャッシュ回避）
    const script = document.createElement('script');
    script.async = true;
    script.src = STOCK_URL + '?callback=handleStockJsonp&ts=' + Date.now();
    script.onerror = function() {
      clearChildren(container);
      const err = document.createElement('p');
      err.className = 'error';
      err.textContent = 'データの取得に失敗しました（CORS またはネットワークエラー）。';
      container.appendChild(err);
      try { delete window.handleStockJsonp; } catch (e) { window.handleStockJsonp = null; }
    };
    document.head.appendChild(script);
    // JSONP が呼ばれるか、onerror が発火するまで待つ
    return;
  }

  if (data.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = '在庫情報がありません。';
    container.appendChild(empty);
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'stock-grid';
  data.forEach(d => grid.appendChild(createCard(d)));
  container.appendChild(grid);
}

function startAutoRefresh() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(loadStock, UPDATE_INTERVAL);
}

// 初回読み込み
loadStock();
startAutoRefresh();

// ページが非表示のときは更新を止める（リソース節約）
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  } else {
    startAutoRefresh();
    loadStock();
  }
});
