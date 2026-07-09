// ===== データの初期化（すべて先頭で宣言） =====
const papers = [];
const memos = [];
const tasks = [];

// 要素の取得
const memoInput = document.getElementById('memo-input');
const memoAddBtn = document.getElementById('memo-add-btn');
const memoList = document.getElementById('memo-list');

const paperAddBtn = document.getElementById('paper-add-btn');
const paperList = document.getElementById('paper-list');

const taskInput = document.getElementById('task-input');
const taskAddBtn = document.getElementById('task-add-btn');
const taskList = document.getElementById('task-list');

// ページ切り替え用要素
const navItems = {
    memo: document.getElementById('nav-memo'),
    paper: document.getElementById('nav-paper'),
    task: document.getElementById('nav-task'),
};

const pages = {
    memo: document.getElementById('page-memo'),
    paper: document.getElementById('page-paper'),
    task: document.getElementById('page-task'),
};

// 指定したページに切り替える関数
function showPage(name) {
    Object.keys(pages).forEach(function (key) {
        pages[key].classList.add('hidden');
        navItems[key].classList.remove('active');
    });
    pages[name].classList.remove('hidden');
    navItems[name].classList.add('active');

    // サブ項目を一旦すべて非表示
    const subItems = document.querySelectorAll('.sub-item');
    subItems.forEach(function (item) {
        item.classList.add('hidden');
    });

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

// ナビクリックでページ切り替え
navItems.memo.addEventListener('click', function () { showPage('memo'); });
navItems.paper.addEventListener('click', function () { showPage('paper'); });
navItems.task.addEventListener('click', function () { showPage('task'); });

// サブメニューのクリックでスクロール
document.getElementById('nav-paper-form').addEventListener('click', function (event) {
    event.stopPropagation();
    document.getElementById('section-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('nav-paper-index').addEventListener('click', function (event) {
    event.stopPropagation();
    document.getElementById('section-index').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('nav-paper-cards').addEventListener('click', function (event) {
    event.stopPropagation();
    document.getElementById('section-cards').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('nav-memo-form').addEventListener('click', function (event) {
    event.stopPropagation();
    document.getElementById('section-memo-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('nav-memo-list').addEventListener('click', function (event) {
    event.stopPropagation();
    document.getElementById('section-memo-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// メモボタンクリック
memoAddBtn.addEventListener('click', function () {
    addMemo();
});

// Ctrl+Enterでメモ追加
memoInput.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === 'Enter') {
        addMemo();
    }
});

// メモを追加する関数
function addMemo() {
    const text = memoInput.value.trim();
    if (text === '') return;

    const dateStr = getDateStr();

    const memo = {
        id: Date.now(),
        text: text,
        date: dateStr,
    };

    memos.unshift(memo);
    saveData();

    // リストの項目<li>をつくる
    const li = document.createElement('li');
    li.className = 'memo-item';
    li.innerHTML = `
        <div class="memo-text">${parseMarkdown(text)}</div>
        <div class="memo-date">${dateStr}</div>
        <div class="memo-btns">
            <button class="memo-edit-btn">編集</button>
            <button class="memo-delete-btn">削除</button>
        </div>
        `;

    // 削除ボタン
    li.querySelector('.memo-delete-btn').addEventListener('click', function () {
        const index = memos.findIndex(m => m.id === memo.id);
        memos.splice(index, 1);
        li.remove();
        saveData();
    });

    // 編集ボタン
    li.querySelector('.memo-edit-btn').addEventListener('click', function () {
        editMemo(memo.id, li);
    });

    memoList.prepend(li);
    memoInput.value = '';
    memoInput.focus();
}

// 資料登録ボタン
paperAddBtn.addEventListener('click', function () { addPaper(); });

// 資料を登録する処理
function addPaper() {
    const title = document.getElementById('paper-title').value.trim();
    const url = document.getElementById('paper-url').value.trim();
    const reason = document.getElementById('paper-reason').value.trim();
    const memo = document.getElementById('paper-memo').value.trim();
    const citation = document.getElementById('paper-citation').value.trim();
    const category = document.getElementById('paper-category').value;
    
    if (title === '') {
        alert('タイトルを入力してください');
        return;
    }
    
    const paper = {
        id: Date.now(),
        title: title,
        url: url,
        reason: reason,
        memo: memo,
        citation: citation,
        date: getDateStr(),
        category: category,
    };

    papers.unshift(paper);
    renderPapers();
    saveData();

    document.getElementById('paper-title').value = '';
    document.getElementById('paper-url').value = '';
    document.getElementById('paper-reason').value = '';
    document.getElementById('paper-memo').value = '';
    document.getElementById('paper-citation').value = '';
    document.getElementById('paper-category').value = 'primary';
}

function renderPapers() {
    paperList.innerHTML = '';
    const paperIndex = document.getElementById('paper-index');
    paperIndex.innerHTML = '';

    const indexList = document.createElement('ul');
    indexList.className = 'index-list';

    papers.forEach(function (paper, index) {
        const li = document.createElement('li');
        li.className = 'index-item';
        li.draggable = true;
        li.dataset.index = index;
        li.innerHTML = `<span class="drag-handle">☰</span><a href="#paper-${paper.id}">${paper.title}</a>`;

        li.addEventListener('dragstart', function(){
            li.classList.add('dragging');
        });

        li.addEventListener('dragend', function(){
            li.classList.remove('dragging');
            const newOrder = [...indexList.querySelectorAll('.index-item')].map(function(item){
                return papers[Number(item.dataset.index)];
            });
            papers.length = 0;
            newOrder.forEach(function(p){ papers.push(p); });
            saveData();
            // カードの順番だけ更新する
            papers.forEach(function(paper){
                const card = document.getElementById('paper-' + paper.id);
                if(card) paperList.appendChild(card);
            });
        });

        indexList.appendChild(li);
    });

    indexList.addEventListener('dragover', function(event){
        event.preventDefault();
        const dragging = indexList.querySelector('.dragging');
        const siblings = [...indexList.querySelectorAll('.index-item:not(.dragging)')];
        const next = siblings.find(function(s){
            return event.clientY <= s.getBoundingClientRect().top + s.getBoundingClientRect().height / 2;
        });
        indexList.insertBefore(dragging, next || null);
    });

    paperIndex.appendChild(indexList);

    papers.forEach(function (paper) {
        const card = document.createElement('div');
        card.className = 'paper-card';
        card.id = `paper-${paper.id}`;
        card.draggable = true;
        card.dataset.index = papers.indexOf(paper);

        const isGoogleDoc = paper.url && paper.url.includes('docs.google.com');
        const embedUrl = isGoogleDoc ? paper.url.replace('/edit', '/preview') : '';

        const urlHTML = isGoogleDoc
            ? `<div class="paper-embed-wrapper">
               <a href="${paper.url}" target="_blank" class="paper-open-btn">↗ ドキュメントを開く</a>
               <iframe src="${embedUrl}" class="paper-embed" allowfullscreen></iframe>
             </div>`
            : paper.url
                ? `<a href="${paper.url}" target="_blank" class="paper-url">🔗 ${paper.url}</a>`
                : '';

        const categoryEmoji = {
            primary: '📜',
            research: '📚',
            draft: '🖋',
            '': '📄',
        };
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
                ${paper.memo   ? `<div class="paper-section"><span class="label">要旨</span>${paper.memo}</div>` : ''}
                ${paper.reason ? `<div class="paper-section"><span class="label">読んだ目的</span>${paper.reason}</div>` : ''}
                ${paper.citation ? `<div class="paper-section"><span class="label">引用</span>${paper.citation}</div>` : ''}
                ${paper.category ? `<div class="paper-section"><span class="label">分類</span>${
                paper.category === 'primary' ? '一次資料' :
                paper.category === 'research' ? '先行研究' :
                paper.category === 'draft' ? '下書き' : ''
                }</div>` : ''}
                <div class="paper-date">${paper.date}</div>
            </div>
            `;

        card.querySelector('.paper-edit-btn').addEventListener('click', function () {
            const id = Number(card.id.replace('paper-', ''));
            editPaper(id);
        });

        card.querySelector('.paper-delete-btn').addEventListener('click', function (event) {
            const id = Number(event.target.dataset.id);
            deletePaper(id);
        });

        card.addEventListener('dragstart', function(){
            card.classList.add('dragging');
            });

        card.addEventListener('dragend', function(){
            card.classList.remove('dragging');
            });
        paperList.appendChild(card);
    });

    // ドロップ処理
    paperList.addEventListener('dragover', function(event){
    event.preventDefault();
    const dragging = paperList.querySelector('.dragging');
    const siblings = [...paperList.querySelectorAll('.paper-card:not(.dragging)')];
    const next = siblings.find(function(s){
        return event.clientY <= s.getBoundingClientRect().top + s.getBoundingClientRect().height / 2;
    });
    paperList.insertBefore(dragging, next || null);
    });

   paperList.addEventListener('drop', function(){
  const newOrder = [...paperList.querySelectorAll('.paper-card')].map(function(card){
    return papers[Number(card.dataset.index)];
  });
  papers.length = 0;
  newOrder.forEach(function(p){ papers.push(p); });
  saveData();

  // リストも更新する ← 追加
  const paperIndex = document.getElementById('paper-index');
  paperIndex.innerHTML = '';
  const indexList = document.createElement('ul');
  indexList.className = 'index-list';
  papers.forEach(function (paper, index) {
    const li = document.createElement('li');
    li.className = 'index-item';
    li.draggable = true;
    li.dataset.index = index;
    li.innerHTML = `<span class="drag-handle">☰</span><a href="#paper-${paper.id}">${paper.title}</a>`;

    li.addEventListener('dragstart', function(){
        li.classList.add('dragging');
    });

    li.addEventListener('dragend', function(){
        li.classList.remove('dragging');
        // ドラッグ終了時に順番を保存してカードも更新
        const newOrder = [...indexList.querySelectorAll('.index-item')].map(function(item){
            return papers[Number(item.dataset.index)];
        });
        papers.length = 0;
        newOrder.forEach(function(p){ papers.push(p); });
        saveData();
    });

    indexList.appendChild(li);
});

indexList.addEventListener('dragover', function(event){
    event.preventDefault();
    const dragging = indexList.querySelector('.dragging');
    const siblings = [...indexList.querySelectorAll('.index-item:not(.dragging)')];
    const next = siblings.find(function(s){
        return event.clientY <= s.getBoundingClientRect().top + s.getBoundingClientRect().height / 2;
    });
    indexList.insertBefore(dragging, next || null);
});
    paperIndex.appendChild(indexList);
    });
}

function deletePaper(id) {
    const index = papers.findIndex(p => p.id === id);
    papers.splice(index, 1);
    renderPapers();
    saveData();
}

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

function pad(num) {
    return String(num).padStart(2, '0');
}

// ===== データの保存・読み込み =====
function saveData() {
    localStorage.setItem('papers', JSON.stringify(papers));
    localStorage.setItem('memos', JSON.stringify(memos));
    localStorage.setItem('tasks', JSON.stringify(tasks));
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
            <div class="memo-text">${parseMarkdown(memo.text)}</div>
            <div class="memo-date">${memo.date}</div>
            <div class="memo-btns">
            <button class="memo-edit-btn">編集</button>
            <button class="memo-delete-btn">削除</button>
            </div>
        </div>
        `;

    li.querySelector('.memo-delete-btn').addEventListener('click', function(){
      const index = memos.findIndex(m => m.id === memo.id);
      memos.splice(index, 1);
      li.remove();
      saveData();
    });

    li.querySelector('.memo-edit-btn').addEventListener('click', function(){
      editMemo(memo.id, li);
    });

    li.addEventListener('dragstart', function(){
      li.classList.add('dragging');
    });

    li.addEventListener('dragend', function(){
      li.classList.remove('dragging');
    });

    memoList.appendChild(li);
  });

  // ドロップ処理
  memoList.addEventListener('dragover', function(event){
    event.preventDefault();
    const dragging = memoList.querySelector('.dragging');
    const siblings = [...memoList.querySelectorAll('li:not(.dragging)')];
    const next = siblings.find(function(s){
      return event.clientY <= s.getBoundingClientRect().top + s.getBoundingClientRect().height / 2;
    });
    memoList.insertBefore(dragging, next || null);
  });

  memoList.addEventListener('drop', function(){
    const newOrder = [...memoList.querySelectorAll('li')].map(function(li){
      return memos[Number(li.dataset.index)];
    });
    memos.length = 0;
    newOrder.forEach(function(m){ memos.push(m); });
    saveData();
  });
}

function loadData() {
    const savedPapers = localStorage.getItem('papers');
    const savedMemos = localStorage.getItem('memos');
    const savedTasks = localStorage.getItem('tasks');

    if (savedPapers) {
        const parsed = JSON.parse(savedPapers);
        papers.push(...parsed);
        renderPapers();
    }

    if (savedMemos) {
        const parsed = JSON.parse(savedMemos);
        memos.push(...parsed);
        renderMemos();
    }

    if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        tasks.push(...parsed);
        renderTasks();
    }
}

// ===== サイドバーリサイズ =====
const resizer = document.getElementById('sidebar-resizer');
const sidebar = document.querySelector('.sidebar');

resizer.addEventListener('mousedown', function (event) {
    event.preventDefault();
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

function onMouseMove(event) {
    const newWidth = event.clientX;
    if (newWidth > 100 && newWidth < 400) {
        sidebar.style.width = newWidth + 'px';
    }
}

function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

// ===== タブ切り替え =====
const tabBtns = document.querySelectorAll('.tab-btn');

tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        filterPapers(tab);
    });
});

function filterPapers(tab) {
    const cards = document.querySelectorAll('.paper-card');
    cards.forEach(function (card) {
        const id = Number(card.id.replace('paper-', ''));
        const paper = papers.find(p => p.id === id);

        if (tab === 'all' || paper.category === tab) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    const paperIndex = document.getElementById('paper-index');
    paperIndex.innerHTML = '';

    const indexList = document.createElement('ul');
    indexList.className = 'index-list';

    const filteredPapers = tab === 'all' ? papers : papers.filter(p => p.category === tab);

    filteredPapers.forEach(function (paper) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#paper-${paper.id}">${paper.title}</a>`;
        indexList.appendChild(li);
    });

    paperIndex.appendChild(indexList);
}

// ===== 資料編集 =====
function editPaper(id) {
    const paper = papers.find(p => p.id === id);
    const card = document.getElementById('paper-' + id);

    card.innerHTML = `
    <div class="form-row">
      <label>タイトル</label>
      <input type="text" class="edit-title" value="${paper.title}" />
    </div>
    <div class="form-row">
      <label>URL</label>
      <input type="text" class="edit-url" value="${paper.url}" />
    </div>
    <div class="form-row">
      <label>読む目的</label>
      <textarea class="edit-reason" rows="2">${paper.reason}</textarea>
    </div>
    <div class="form-row">
      <label>内容メモ</label>
      <textarea class="edit-memo" rows="3">${paper.memo}</textarea>
    </div>
    <div class="form-row">
      <label>引用</label>
      <textarea class="edit-citation" rows="2">${paper.citation}</textarea>
    </div>
    <div class="form-row">
      <label>カテゴリ</label>
      <select class="edit-category">
        <option value="primary" ${paper.category === 'primary' ? 'selected' : ''}>一次資料</option>
        <option value="research" ${paper.category === 'research' ? 'selected' : ''}>先行研究</option>
        <option value="draft" ${paper.category === 'draft' ? 'selected' : ''}>下書き</option>
      </select>
    </div>
    <div style="display:flex; gap:8px; justify-content:flex-end;">
      <button class="edit-cancel-btn">キャンセル</button>
      <button class="edit-save-btn">保存する</button>
    </div>
  `;

    card.querySelector('.edit-save-btn').addEventListener('click', function () {
        paper.title = card.querySelector('.edit-title').value.trim();
        paper.url = card.querySelector('.edit-url').value.trim();
        paper.reason = card.querySelector('.edit-reason').value.trim();
        paper.memo = card.querySelector('.edit-memo').value.trim();
        paper.citation = card.querySelector('.edit-citation').value.trim();
        paper.category = card.querySelector('.edit-category').value;

        saveData();
        renderPapers();
    });

    card.querySelector('.edit-cancel-btn').addEventListener('click', function () {
        renderPapers();
    });
}

// ===== メモ編集 =====
function editMemo(id, li) {
    const memo = memos.find(m => m.id === id);

    li.innerHTML = `
    <textarea class="edit-memo-text" rows="3">${memo.text}</textarea>
    <div style="display:flex; gap:8px; justify-content:flex-end;">
      <button class="edit-cancel-btn">キャンセル</button>
      <button class="edit-save-btn">保存する</button>
    </div>
  `;

    li.querySelector('.edit-save-btn').addEventListener('click', function () {
        memo.text = li.querySelector('.edit-memo-text').value.trim();
        saveData();
        renderMemos();
    });

    li.querySelector('.edit-cancel-btn').addEventListener('click', function () {
        renderMemos();
    });
}

// ===== タスク管理 =====
taskAddBtn.addEventListener('click', function () { addTask(); });

taskInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') addTask();
});

function addTask() {
    const text = taskInput.value.trim();
    if (text === '') return;

    const task = {
        id: Date.now(),
        text: text,
        done: false,
    };

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

    // チェックボックス
    li.querySelector('.task-checkbox').addEventListener('change', function(){
      task.done = this.checked;
      li.classList.toggle('task-done', task.done);
      saveData();
    });

    // 削除ボタン
    li.querySelector('.task-delete-btn').addEventListener('click', function(){
      const index = tasks.findIndex(t => t.id === task.id);
      tasks.splice(index, 1);
      saveData();
      renderTasks();
    });

    // ドラッグイベント
    li.addEventListener('dragstart', function(){
      li.classList.add('dragging');
    });

    li.addEventListener('dragend', function(){
      li.classList.remove('dragging');
    });

    taskList.appendChild(li);
  });

  // ドロップ処理
  taskList.addEventListener('dragover', function(event){
    event.preventDefault();
    const dragging = taskList.querySelector('.dragging');
    const siblings = [...taskList.querySelectorAll('li:not(.dragging)')];
    const next = siblings.find(function(s){
      return event.clientY <= s.getBoundingClientRect().top + s.getBoundingClientRect().height / 2;
    });
    taskList.insertBefore(dragging, next || null);
  });

  taskList.addEventListener('drop', function(){
    const newOrder = [...taskList.querySelectorAll('li')].map(function(li){
      return tasks[Number(li.dataset.index)];
    });
    tasks.length = 0;
    newOrder.forEach(function(t){ tasks.push(t); });
    saveData();
  });
}

// アプリ起動時にデータ読み込みを実行
loadData();