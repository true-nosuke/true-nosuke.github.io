const STOCK_URL = "https://script.google.com/macros/s/AKfycbzZtlu_z9bK2XL-0_z-Z_f1_dXBsLjkVfl22rXUOLVUZ-hdSN_bAhKnkliUFqaKR5Bb/exec";

async function loadStock() {
  const container = document.getElementById('stock-area');
  if (!container) return;
  
  container.innerHTML = '<p class="loading">読み込み中…</p>';
  
  try {
    const res = await fetch(STOCK_URL, { cache: 'no-store' });
    const data = await res.json();
    
    if (!data.length) {
      container.innerHTML = '<p>在庫情報がありません。</p>';
      return;
    }
    
    container.innerHTML = '<div class="stock-grid">' + 
      data.map(item => `
        <div class="stock-card">
          <h3>${item.item || '—'}</h3>
          <p>残り：${item.stock || ''}</p>
          <p>${item.remark || ''}</p>
        </div>
      `).join('') + '</div>';
  } catch (err) {
    container.innerHTML = '<p class="error">データの取得に失敗しました。</p>';
  }
}

loadStock();
setInterval(loadStock, 10000);
