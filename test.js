const STOCK_URL = "https://script.google.com/macros/s/AKfycbzZtlu_z9bK2XL-0_z-Z_f1_dXBsLjkVfl22rXUOLVUZ-hdSN_bAhKnkliUFqaKR5Bb/exec";
const REFRESH_INTERVAL = 10_000;
const NOTICE_WINDOW_MINUTES = 60;

let dismissedNoticeKey = null;

function toJst(date = new Date()) {
  return new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
}

function findActiveNotice(data) {
  const now = toJst();
  console.debug('[notice] current JST:', now.toISOString());
  console.debug('[notice] scanning', data.length, 'rows for active notices');
  
  for (const item of data) {
    const message = (item.notice || item.important || item.importantNotice || '').trim();
    const dateStr = (item.noticeDate || item.notice_date || '').trim();
    const timeStr = (item.noticeTime || item.notice_time || '').trim();

    console.debug('[notice] row check:', { message, dateStr, timeStr });

    if (!message || !dateStr || !timeStr) {
      console.debug('[notice] skipping: missing required fields');
      continue;
    }

    const target = new Date(`${dateStr}T${timeStr}:00+09:00`);
    if (Number.isNaN(target.getTime())) {
      console.debug('[notice] skipping: invalid date/time format');
      continue;
    }

    const diffMs = now.getTime() - target.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    console.debug('[notice] time diff:', diffMinutes, 'minutes');

    if (diffMs >= 0 && diffMs <= NOTICE_WINDOW_MINUTES * 60 * 1000) {
      console.debug('[notice] ✓ ACTIVE NOTICE FOUND');
      return {
        key: `${dateStr}|${timeStr}|${message}`,
        message,
        schedule: target.toLocaleString('ja-JP', {
          timeZone: 'Asia/Tokyo',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    }
  }
  console.debug('[notice] no active notices found');
  return null;
}

function renderNotice(noticeInfo) {
  const area = document.getElementById('notice-area');
  if (!area) {
    console.debug('[notice] render: #notice-area not found');
    return;
  }

  if (!noticeInfo || noticeInfo.key === dismissedNoticeKey) {
    console.debug('[notice] render: hiding (no info or dismissed)');
    area.classList.add('is-hidden');
    area.innerHTML = '';
    return;
  }

  console.debug('[notice] render: showing banner');
  area.classList.remove('is-hidden');
  area.innerHTML = '';

  const banner = document.createElement('div');
  banner.className = 'notice-banner';

  const content = document.createElement('div');
  content.className = 'notice-content';

  const label = document.createElement('p');
  label.className = 'notice-label';
  label.textContent = '重要なお知らせ';

  const schedule = document.createElement('p');
  schedule.className = 'notice-schedule';
  schedule.textContent = `予定: ${noticeInfo.schedule}`;

  const message = document.createElement('p');
  message.className = 'notice-message';
  message.textContent = noticeInfo.message;

  content.append(label, schedule, message);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'notice-close';
  closeBtn.setAttribute('aria-label', 'このお知らせを閉じる');
  closeBtn.textContent = '×';
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

    console.debug('[stock] fetched rows:', data.length);
    if (data.length) {
      console.debug('[stock] first row sample:', data[0]);
    }

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
    console.error('loadStock:', err);
    renderNotice(null);
    container.innerHTML = '<p class="error">データの取得に失敗しました。</p>';
  }
}

loadStock();
setInterval(loadStock, REFRESH_INTERVAL);
