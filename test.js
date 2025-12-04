const STOCK_URL = "https://script.google.com/macros/s/AKfycbwRDV8X6_iHqbipxxH0pixUeL8StmX0q5hIJHXnepwS1N0cQwp5Y9_COLexaPsr-jjd/exec";
const REFRESH_INTERVAL = 10_000;
const NOTICE_WINDOW_MINUTES = 60;

let dismissedNoticeKey = null;

function toJst(date = new Date()) {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
}

function findActiveNotice(data) {
  const now = toJst();
  const notices = [];
  
  for (const item of data) {
    const message = (item.notice || item.important || item.importantNotice || '').trim();
    const dateStr = (item.noticeDate || item.notice_date || '').trim();
    const timeStr = (item.noticeTime || item.notice_time || '').trim();

    if (!message || !dateStr || !timeStr) continue;

    const target = new Date(`${dateStr}T${timeStr}:00+09:00`);
    if (Number.isNaN(target.getTime())) continue;

    const diffMs = now.getTime() - target.getTime();
    if (diffMs >= 0 && diffMs <= NOTICE_WINDOW_MINUTES * 60 * 1000) {
      notices.push({
        message,
        dateStr,
        timeStr,
        schedule: target.toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    }
  }
  
  if (notices.length === 0) return null;
  
  return {
    key: notices.map(n => `${n.dateStr}|${n.timeStr}|${n.message}`).join('::'),
    notices
  };
}

function renderNotice(noticeInfo) {
  const area = document.getElementById('notice-area');
  if (!area) return;

  if (!noticeInfo || noticeInfo.key === dismissedNoticeKey) {
    area.classList.add('is-hidden');
    area.innerHTML = '';
    return;
  }

  area.classList.remove('is-hidden');
  area.innerHTML = '';

  const banner = document.createElement('div');
  banner.className = 'notice-banner';

  const content = document.createElement('div');
  content.className = 'notice-content';

  const label = document.createElement('p');
  label.className = 'notice-label';
  label.textContent = '重要なお知らせ';

  content.appendChild(label);

  noticeInfo.notices.forEach(notice => {
    const message = document.createElement('p');
    message.className = 'notice-message';
    message.textContent = notice.message;
    content.appendChild(message);
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'notice-close';
  closeBtn.setAttribute('aria-label', 'このお知らせを閉じる');
  //!closeBtn.textContent = '×';
  closeBtn.addEventListener('click', () => {
    dismissedNoticeKey = noticeInfo.key;
    renderNotice(null);
  });

  banner.append(content, closeBtn);
  area.appendChild(banner);
}

async function loadStock() {
  const container = document.getElementById('stock-area');
  if (!container) return;

  container.innerHTML = '<p class="loading">しばらくお待ち下さい…</p>';

  try {
    const res = await fetch(STOCK_URL, { cache: 'no-store' });
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid data format');

    renderNotice(findActiveNotice(data));

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
    console.error('loadStock error:', err);
    renderNotice(null);
    container.innerHTML = '<p class="error">データの取得に失敗しました。</p>';
  }
}

loadStock();
setInterval(loadStock, REFRESH_INTERVAL);
