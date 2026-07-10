const papers = [];
const memos = [];
const tasks = [];

// ===== 要素の取得 =====
const memoInput  = document.getElementById('memo-input');
const memoAddBtn = document.getElementById('memo-add-btn');
const memoList   = document.getElementById('memo-list');
const paperAddBtn = document.getElementById('paper-add-btn');
const paperList   = document.getElementById('paper-list');
const taskInput  = document.getElementById('task-input');
const taskAddBtn = document.getElementById('task-add-btn');
const taskList   = document.getElementById('task-list');

// ===== ページ切り替え =====
const navItems = {
    memo:  document.getElementById('nav-memo'),
    paper: document.getElementById('nav-paper'),
    task:  document.getElementById('nav-task'),
};
const pages = {
    memo:  document.getElementById('page-memo'),
    paper: document.getElementById('page-paper'),
    task:  document.getElementById('page-task'),
};

function showPage(name) {
    Object.keys(pages).forEach(function(key) {
        pages[key].classList.add('hidden');
        navItems[key].classList.remove('active');
    });
    pages[name].classList.remove('hidden');
    navItems[name].classList.add('active');

    const subItems = document.querySelectorAll('.sub-item');
    subItems.forEach(function(item) { item.classList.add('hidden'); });

    if (name === 'paper') {
        document.getElementById('nav-paper-form').classList.remove('hidden');
        document.getElementById('nav-paper-index').classList.remove('hidden');
        document.getElementById('nav-paper-cards').classList.remove('hidden');
    }
    if (name === 'memo') {
        document.getElementById('nav-memo-form').classList.remove('hidden');
        document.getElementById('nav-memo-list').classList.remove('hidden');
    }
}

navItems.memo.addEventListener('click',  function() { showPage('memo'); });
navItems.paper.addEventListener('click', function() { showPage('paper'); });
navItems.task.addEventListener('click',  function() { showPage('task'); });

document.getElementById('nav-paper-form').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('section-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.getElementById('nav-paper-index').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('section-index').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.getElementById('nav-paper-cards').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('section-cards').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.getElementById('nav-memo-form').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('section-memo-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.getElementById('nav-memo-list').addEventListener('click', function(e) {
    e.stopPropagation();
    document.getElementById('section-memo-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ===== Markdown変換 =====
function parseMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/~~(.*?)~~/g, '<s>$1</s>')
        .replace(/\n/g, '<br>');
}

// ===== 共通ユーティリティ =====
function getDateStr() {
    const now = new Date();
    return now.getFullYear() + '/'
        + pad(now.getMonth() + 1) + '/'
        + pad(now.getDate()) + ' '
        + pad(now.getHours()) + ':'
        + pad(now.getMinutes());
}
function pad(num) { return String(num).padStart(2, '0'); }

// ===== データ保存・読み込み =====
function saveData() {
    localStorage.setItem('papers', JSON.stringify(papers));
    localStorage.setItem('memos',  JSON.stringify(memos));
    localStorage.setItem('tasks',  JSON.stringify(tasks));
}

function loadData() {
    const savedPapers = localStorage.getItem('papers');
    const savedMemos  = localStorage.getItem('memos');
    const savedTasks  = localStorage.getItem('tasks');
    if (savedPapers) { papers.push(...JSON.parse(savedPapers)); renderPapers(); }
    if (savedMemos)  { memos.push(...JSON.parse(savedMemos));   renderMemos(); }
    if (savedTasks)  { tasks.push(...JSON.parse(savedTasks));   renderTasks(); }
}

// ===== ドラッグ＆ドロップ共通関数 =====
function setupDragOver(list, selector) {
    list.addEventListener('dragover', function(event) {
        event.preventDefault();
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const rect = mainContent.getBoundingClientRect();
            const relativeY = event.clientY - rect.top; // 親要素内でのマウスのY座標

            // スクロールを発火させる端の検知エリア（上下40px）
            const threshold = 40; 
            const scrollSpeed = 8; // スクロールの速さ（ピクセル）

            if (relativeY < threshold) {
                // マウスが上端に近づいたら上にスクロール
                mainContent.scrollTop -= scrollSpeed;
            } else if (rect.height - relativeY < threshold) {
                // マウスが下端に近づいたら下にスクロール
                mainContent.scrollTop += scrollSpeed;
            }
        }
        const siblings = [...list.querySelectorAll(selector + ':not(.dragging)')];
        siblings.forEach(function(s) { s.classList.remove('drag-over-top', 'drag-over-bottom'); });
        const next = siblings.find(function(s) {
            return event.clientY <= s.getBoundingClientRect().top + s.getBoundingClientRect().height / 2;
        });
        if (next) { next.classList.add('drag-over-top'); }
        else if (siblings.length > 0) { siblings[siblings.length - 1].classList.add('drag-over-bottom'); }
    });
    list.addEventListener('dragleave', function() {
        list.querySelectorAll(selector).forEach(function(el) {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
    });
}

function setupDrop(list, selector, dataArray, onDrop) {
    list.addEventListener('drop', function(event) {
        event.preventDefault();
        const dragging = list.querySelector('.dragging');
        if (!dragging) return; // 安全対策

        // 現在、上に横線が出ている要素、または下に横線が出ている要素を探す
        const nextTop = list.querySelector(selector + '.drag-over-top');
        const nextBottom = list.querySelector(selector + '.drag-over-bottom');
        
        // 横線のクラスをすべてクリア
        list.querySelectorAll(selector).forEach(function(el) {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        // 挿入位置（どの要素の前に差し込むか）を決定
        let nextElement = null;
        if (nextTop) {
            // 上に線がある要素の「前」に挿入
            nextElement = nextTop;
        } else if (nextBottom) {
            // 下に線がある要素（＝リストの最後尾の要素）の「後ろ」に挿入
            nextElement = nextBottom.nextElementSibling;
        } else {
            // どちらの線も出ていない場合は、安全のためマウス位置から計算
            const siblings = [...list.querySelectorAll(selector + ':not(.dragging)')];
            nextElement = siblings.find(function(s) {
                return event.clientY <= s.getBoundingClientRect().top + s.getBoundingClientRect().height / 2;
            });
        }

        // 実際のDOM要素を移動させる
        list.insertBefore(dragging, nextElement);

        // ★追加：ドロップ完了直後、リスト内のすべての横線クラスを強制的にクリアする
        list.querySelectorAll(selector).forEach(function(el) {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        // 配列（データ）の並び順を現在のDOMの並び順に同期
        const newOrder = [...list.querySelectorAll(selector)].map(function(el) {
            return dataArray[Number(el.dataset.index)];
        });
        dataArray.length = 0;
        newOrder.forEach(function(item) { dataArray.push(item); });
        
        saveData();
        if (onDrop) onDrop();
    });
}

// ===== メモ =====
memoAddBtn.addEventListener('click', function() { addMemo(); });
memoInput.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'Enter') addMemo();
});

function addMemo() {
    const text = memoInput.value.trim();
    if (text === '') return;
    const dateStr = getDateStr();
    const memo = { id: Date.now(), text: text, date: dateStr };
    memos.unshift(memo);
    saveData();
    renderMemos();
    memoInput.value = '';
    memoInput.focus();
}

function renderMemos() {
    memoList.innerHTML = '';
    memos.forEach(function(memo, index) {
        const li = document.createElement('li');
        li.className = 'memo-item';
        li.draggable = true;
        li.dataset.index = index;
        li.innerHTML = `
            <span class="drag-handle">☰</span>
            <div class="memo-content">
                <div class="memo-text-container">
                    <div class="memo-text">${parseMarkdown(memo.text)}</div>
                </div>
                <button class="memo-toggle-btn">すべて見る</button>
                
                <!-- ★ 日付とボタンを1つのフッターエリアにまとめる -->
                <div class="memo-footer">
                    <div class="memo-date">${memo.date}</div>
                    <div class="memo-btns">
                        <button class="memo-edit-btn">編集</button>
                        <button class="memo-delete-btn">削除</button>
                    </div>
                </div>
            </div>
        `;

        const container = li.querySelector('.memo-text-container');
        const toggleBtn = li.querySelector('.memo-toggle-btn');
        const textEl = li.querySelector('.memo-text');

        memoList.appendChild(li);

        const hasNewLine = memo.text.includes('\n');
        const isOverflowing = textEl.scrollWidth > container.clientWidth || textEl.scrollHeight > container.clientHeight;

        if (hasNewLine || isOverflowing) {
            toggleBtn.addEventListener('click', function() {
                const isExpanded = container.classList.toggle('expanded');
                toggleBtn.textContent = isExpanded ? '閉じる' : 'すべて見る';
            });
        } else {
            toggleBtn.remove();
        }

        li.querySelector('.memo-delete-btn').addEventListener('click', function() {
            const i = memos.findIndex(function(m) { return m.id === memo.id; });
            memos.splice(i, 1);
            saveData();
            renderMemos();
        });
        li.querySelector('.memo-edit-btn').addEventListener('click', function() {
            editMemo(memo.id, li);
        });
        li.addEventListener('dragstart', function() { li.classList.add('dragging'); });
        li.addEventListener('dragend',   function() { li.classList.remove('dragging'); });
    });
}

setupDragOver(memoList, 'li');
setupDrop(memoList, 'li', memos);

function editMemo(id, li) {
    const memo = memos.find(function(m) { return m.id === id; });
    li.innerHTML = `
        <textarea class="edit-memo-text" rows="3">${memo.text}</textarea>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button class="edit-cancel-btn">キャンセル</button>
            <button class="edit-save-btn">保存する</button>
        </div>
    `;
    li.querySelector('.edit-save-btn').addEventListener('click', function() {
        memo.text = li.querySelector('.edit-memo-text').value.trim();
        saveData();
        renderMemos();
    });
    li.querySelector('.edit-cancel-btn').addEventListener('click', function() { renderMemos(); });
}

// ===== 資料管理 =====
paperAddBtn.addEventListener('click', function() { addPaper(); });

function addPaper() {
    const title    = document.getElementById('paper-title').value.trim();
    const url      = document.getElementById('paper-url').value.trim();
    const reason   = document.getElementById('paper-reason').value.trim();
    const memo     = document.getElementById('paper-memo').value.trim();
    const citation = document.getElementById('paper-citation').value.trim();
    const category = document.getElementById('paper-category').value;
    if (title === '') { alert('タイトルを入力してください'); return; }
    const paper = { id: Date.now(), title, url, reason, memo, citation, date: getDateStr(), category };
    papers.unshift(paper);
    renderPapers();
    saveData();
    document.getElementById('paper-title').value    = '';
    document.getElementById('paper-url').value      = '';
    document.getElementById('paper-reason').value   = '';
    document.getElementById('paper-memo').value     = '';
    document.getElementById('paper-citation').value = '';
    document.getElementById('paper-category').value = 'primary';
}

function renderPapers() {
    paperList.innerHTML = '';
    const paperIndex = document.getElementById('paper-index');
    paperIndex.innerHTML = '';

    const indexList = document.createElement('ul');
    indexList.className = 'index-list';

    papers.forEach(function(paper, index) {
        const li = document.createElement('li');
        li.className = 'index-item';
        li.draggable = true;
        li.dataset.index = index;
        li.innerHTML = `<span class="drag-handle">☰</span><a href="#paper-${paper.id}">${paper.title}</a>`;
        // ⭕ 【ここに差し替えます】
        li.addEventListener('dragstart', function() { li.classList.add('dragging'); });
        li.addEventListener('dragend',   function() { li.classList.remove('dragging'); });
        indexList.appendChild(li);
    });

    // 「やること」「メモ」と同じ共通関数を資料管理のインデックスにも適用
    setupDragOver(indexList, '.index-item');
    setupDrop(indexList, '.index-item', papers, function() {
        // 1. 左の順序が変わったら、右側のカードの並び順も連動させる
        papers.forEach(function(p) {
            const card = document.getElementById('paper-' + p.id);
            if (card) paperList.appendChild(card);
        });
        
        // 2. 「やること」等と違い丸ごと再描画しないため、ここでインデックス番号を最新にする
        [...indexList.querySelectorAll('.index-item')].forEach(function(item, idx) {
            item.dataset.index = idx;
        });
    });

    paperIndex.appendChild(indexList);

    papers.forEach(function(paper) {
        const card = document.createElement('div');
        card.className = 'paper-card';
        card.id = `paper-${paper.id}`;
        card.dataset.index = papers.indexOf(paper);

        const isGoogleDoc = paper.url && paper.url.includes('docs.google.com');
        const embedUrl = isGoogleDoc ? paper.url.replace('/edit', '/preview') : '';
        const urlHTML = isGoogleDoc
            ? `<div class="paper-embed-wrapper">
                <a href="${paper.url}" target="_blank" class="paper-open-btn">↗ ドキュメントを開く</a>
                <iframe src="${embedUrl}" class="paper-embed" allowfullscreen></iframe>
               </div>`
            : paper.url ? `<a href="${paper.url}" target="_blank" class="paper-url">🔗 ${paper.url}</a>` : '';

        const categoryEmoji = { primary: '📜', research: '📚', draft: '🖋', '': '📄' };
        const emoji = categoryEmoji[paper.category] || '📄';

        card.innerHTML = `
            <div class="paper-content">
                <div class="paper-header">
                    <div class="paper-title">${emoji} ${paper.title}</div>
                    <div class="paper-btns">
                        <button class="paper-edit-btn" data-id="${paper.id}">編集</button>
                        <button class="paper-delete-btn" data-id="${paper.id}">削除</button>
                    </div>
                </div>
                ${urlHTML}
                ${paper.memo     ? `<div class="paper-section"><span class="label">要旨</span>${paper.memo}</div>` : ''}
                ${paper.reason   ? `<div class="paper-section"><span class="label">読んだ目的</span>${paper.reason}</div>` : ''}
                ${paper.citation ? `<div class="paper-section"><span class="label">引用</span>${paper.citation}</div>` : ''}
                ${paper.category ? `<div class="paper-section"><span class="label">分類</span>${
                    paper.category === 'primary' ? '一次資料' :
                    paper.category === 'research' ? '先行研究' : '下書き'
                }</div>` : ''}
                <div class="paper-date">${paper.date}</div>
            </div>
        `;
        card.querySelector('.paper-edit-btn').addEventListener('click', function() {
            editPaper(Number(card.id.replace('paper-', '')));
        });
        card.querySelector('.paper-delete-btn').addEventListener('click', function(e) {
            deletePaper(Number(e.target.dataset.id));
        });
        paperList.appendChild(card);
    });
}

function deletePaper(id) {
    const index = papers.findIndex(function(p) { return p.id === id; });
    papers.splice(index, 1);
    renderPapers();
    saveData();
}

function editPaper(id) {
    const paper = papers.find(function(p) { return p.id === id; });
    const card  = document.getElementById('paper-' + id);
    card.innerHTML = `
        <div class="form-row"><label>タイトル</label><input type="text" class="edit-title" value="${paper.title}" /></div>
        <div class="form-row"><label>URL</label><input type="text" class="edit-url" value="${paper.url}" /></div>
        <div class="form-row"><label>読む目的</label><textarea class="edit-reason" rows="2">${paper.reason}</textarea></div>
        <div class="form-row"><label>内容メモ</label><textarea class="edit-memo" rows="3">${paper.memo}</textarea></div>
        <div class="form-row"><label>引用</label><textarea class="edit-citation" rows="2">${paper.citation}</textarea></div>
        <div class="form-row"><label>カテゴリ</label>
            <select class="edit-category">
                <option value="primary"  ${paper.category === 'primary'  ? 'selected' : ''}>一次資料</option>
                <option value="research" ${paper.category === 'research' ? 'selected' : ''}>先行研究</option>
                <option value="draft"    ${paper.category === 'draft'    ? 'selected' : ''}>下書き</option>
            </select>
        </div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button class="edit-cancel-btn">キャンセル</button>
            <button class="edit-save-btn">保存する</button>
        </div>
    `;
    card.querySelector('.edit-save-btn').addEventListener('click', function() {
        paper.title    = card.querySelector('.edit-title').value.trim();
        paper.url      = card.querySelector('.edit-url').value.trim();
        paper.reason   = card.querySelector('.edit-reason').value.trim();
        paper.memo     = card.querySelector('.edit-memo').value.trim();
        paper.citation = card.querySelector('.edit-citation').value.trim();
        paper.category = card.querySelector('.edit-category').value;
        saveData();
        renderPapers();
    });
    card.querySelector('.edit-cancel-btn').addEventListener('click', function() { renderPapers(); });
}

// ===== タスク管理 =====
taskAddBtn.addEventListener('click', function() { addTask(); });
taskInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') addTask();
});

function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return;
    const task = { id: Date.now(), text: text, done: false };
    tasks.push(task);
    saveData();
    renderTasks();
    taskInput.value = '';
    taskInput.focus();
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach(function(task, index) {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.done ? ' task-done' : '');
        li.draggable = true;
        li.dataset.index = index;
        li.innerHTML = `
            <span class="drag-handle">☰</span>
            <label class="task-label">
                <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''} />
                <span class="task-text">${task.text}</span>
            </label>
            <button class="task-delete-btn" data-id="${task.id}">削除</button>
        `;
        li.querySelector('.task-checkbox').addEventListener('change', function() {
            task.done = this.checked;
            li.classList.toggle('task-done', task.done);
            saveData();
        });
        li.querySelector('.task-delete-btn').addEventListener('click', function() {
            const i = tasks.findIndex(function(t) { return t.id === task.id; });
            tasks.splice(i, 1);
            saveData();
            renderTasks();
        });
        li.addEventListener('dragstart', function() { li.classList.add('dragging'); });
        li.addEventListener('dragend',   function() { li.classList.remove('dragging'); });
        taskList.appendChild(li);
    });
}

setupDragOver(taskList, 'li');
setupDrop(taskList, 'li', tasks);

// ===== タブ切り替え =====
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        tabBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        filterPapers(btn.dataset.tab);
    });
});

function filterPapers(tab) {
    document.querySelectorAll('.paper-card').forEach(function(card) {
        const paper = papers.find(function(p) { return p.id === Number(card.id.replace('paper-', '')); });
        card.style.display = (tab === 'all' || paper.category === tab) ? 'block' : 'none';
    });
    const paperIndex = document.getElementById('paper-index');
    paperIndex.innerHTML = '';
    const indexList = document.createElement('ul');
    indexList.className = 'index-list';
    const filtered = tab === 'all' ? papers : papers.filter(function(p) { return p.category === tab; });
    filtered.forEach(function(paper) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#paper-${paper.id}">${paper.title}</a>`;
        indexList.appendChild(li);
    });
    paperIndex.appendChild(indexList);
}

// ===== サイドバーリサイズ =====
const resizer = document.getElementById('sidebar-resizer');
const sidebar = document.querySelector('.sidebar');
resizer.addEventListener('mousedown', function(event) {
    event.preventDefault();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});
function onMouseMove(event) {
    const newWidth = event.clientX;
    if (newWidth > 100 && newWidth < 400) { sidebar.style.width = newWidth + 'px'; }
}
function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

// ===== 起動 =====
loadData();