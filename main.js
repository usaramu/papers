const papers = [];
const memos = [];
const tasks = [];

// ===== 要素の取得 =====
const memoInput  = document.getElementById('memo-input');
const memoAddBtn = document.getElementById('memo-add-btn');
const memoList   = document.getElementById('memo-list');
const paperAddBtn = document.getElementById('paper-add-btn');
const paperList   = document.getElementById('paper-list');

// 最上部でのエラーを防ぐため、タスク用のグローバル変数はここで宣言のみ行います
let taskInput  = null;
let taskAddBtn = null;
let taskList   = null;

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
        if (pages[key]) {
            pages[key].classList.add('hidden');
        }
        if (navItems[key]) {
            navItems[key].classList.remove('active');
        }
    });
    
    if (pages[name]) {
        pages[name].classList.remove('hidden');
    }
    if (navItems[name]) {
        navItems[name].classList.add('active');
    }

    const subItems = document.querySelectorAll('.sub-item');
    subItems.forEach(function(item) { item.classList.add('hidden'); });

    if (name === 'paper') {
        const pForm = document.getElementById('nav-paper-form');
        const pIndex = document.getElementById('nav-paper-index');
        const pCards = document.getElementById('nav-paper-cards');
        if (pForm) pForm.classList.remove('hidden');
        if (pIndex) pIndex.classList.remove('hidden');
        if (pCards) pCards.classList.remove('hidden');
    }
    if (name === 'memo') {
        const mForm = document.getElementById('nav-memo-form');
        const mList = document.getElementById('nav-memo-list');
        if (mForm) mForm.classList.remove('hidden');
        if (mList) mList.classList.remove('hidden');
        
        // メモタブが開かれた瞬間に、非表示バグを回避してテキストの高さを再計算・描画します
        renderMemos();
    }
}

if (navItems.memo)  navItems.memo.addEventListener('click',  function() { showPage('memo'); });
if (navItems.paper) navItems.paper.addEventListener('click', function() { showPage('paper'); });
if (navItems.task)  navItems.task.addEventListener('click',  function() { showPage('task'); });

const navPaperForm = document.getElementById('nav-paper-form');
const navPaperIndex = document.getElementById('nav-paper-index');
const navPaperCards = document.getElementById('nav-paper-cards');
const navMemoForm = document.getElementById('nav-memo-form');
const navMemoList = document.getElementById('nav-memo-list');

if (navPaperForm) {
    navPaperForm.addEventListener('click', function(e) {
        e.stopPropagation();
        const el = document.getElementById('section-form');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
if (navPaperIndex) {
    navPaperIndex.addEventListener('click', function(e) {
        e.stopPropagation();
        const el = document.getElementById('section-index');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
if (navPaperCards) {
    navPaperCards.addEventListener('click', function(e) {
        e.stopPropagation();
        const el = document.getElementById('section-cards');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
if (navMemoForm) {
    navMemoForm.addEventListener('click', function(e) {
        e.stopPropagation();
        const el = document.getElementById('section-memo-form');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}
if (navMemoList) {
    navMemoList.addEventListener('click', function(e) {
        e.stopPropagation();
        const el = document.getElementById('section-memo-list');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
    if (!list) return;
    list.addEventListener('dragover', function(event) {
        event.preventDefault();
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            const rect = mainContent.getBoundingClientRect();
            const relativeY = event.clientY - rect.top;

            const threshold = 40; 
            const scrollSpeed = 8; 

            if (relativeY < threshold) {
                mainContent.scrollTop -= scrollSpeed;
            } else if (rect.height - relativeY < threshold) {
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
    if (!list) return;
    list.addEventListener('drop', function(event) {
        event.preventDefault();
        const dragging = list.querySelector('.dragging');
        if (!dragging) return;

        const nextTop = list.querySelector(selector + '.drag-over-top');
        const nextBottom = list.querySelector(selector + '.drag-over-bottom');
        
        list.querySelectorAll(selector).forEach(function(el) {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });

        let nextElement = null;
        if (nextTop) {
            nextElement = nextTop;
        } else if (nextBottom) {
            nextElement = nextBottom.nextElementSibling;
        } else {
            const siblings = [...list.querySelectorAll(selector + ':not(.dragging)')];
            nextElement = siblings.find(function(s) {
                return event.clientY <= s.getBoundingClientRect().top + s.getBoundingClientRect().height / 2;
            });
        }

        list.insertBefore(dragging, nextElement);

        list.querySelectorAll(selector).forEach(function(el) {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });

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
if (memoAddBtn) {
    memoAddBtn.addEventListener('click', function() { addMemo(); });
}
if (memoInput) {
    memoInput.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'Enter') addMemo();
    });
}

function addMemo() {
    if (!memoInput) return;
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
    if (!memoList) return;
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
        
        // ★修正点：非表示タブの時は横幅が0になるため、安全に文字数オーバーを判定します
        const isOverflowing = (container && textEl && container.clientWidth > 0) 
            ? (textEl.scrollWidth > container.clientWidth || textEl.scrollHeight > container.clientHeight)
            : memo.text.length > 40; // 幅が取れないロード時は文字数で暫定判定

        if (toggleBtn) {
            if (hasNewLine || isOverflowing) {
                toggleBtn.addEventListener('click', function() {
                    const isExpanded = container.classList.toggle('expanded');
                    toggleBtn.textContent = isExpanded ? '閉じる' : 'すべて見る';
                });
            } else {
                toggleBtn.remove();
            }
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
    const contentArea = li.querySelector('.memo-content');
    
    contentArea.innerHTML = `
        <div class="inline-edit-form">
            <textarea class="edit-memo-textarea" rows="3">${memo.text}</textarea>
            <div class="inline-edit-btns">
                <button class="inline-cancel-btn">キャンセル</button>
                <button class="inline-save-btn">保存</button>
            </div>
        </div>
    `;
    
    const textarea = contentArea.querySelector('.edit-memo-textarea');
    textarea.focus();

    textarea.addEventListener('keydown', function(event) {
        if (event.ctrlKey && event.key === 'Enter') save();
    });

    contentArea.querySelector('.inline-save-btn').addEventListener('click', save);
    contentArea.querySelector('.inline-cancel-btn').addEventListener('click', function() { 
        renderMemos(); 
    });

    function save() {
        const newText = textarea.value.trim();
        if (newText === '') return;
        memo.text = newText;
        saveData();
        renderMemos();
    }
}

// ===== 資料管理 =====
if (paperAddBtn) {
    paperAddBtn.addEventListener('click', function() { addPaper(); });
}

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
    if (!paperList) return;
    paperList.innerHTML = '';
    const paperIndex = document.getElementById('paper-index');
    if (!paperIndex) return;
    paperIndex.innerHTML = '';

    const indexList = document.createElement('ul');
    indexList.className = 'index-list';

    papers.forEach(function(paper, index) {
        const li = document.createElement('li');
        li.className = 'index-item';
        li.draggable = true;
        li.dataset.index = index;
        li.innerHTML = `<span class="drag-handle">☰</span><a href="#paper-${paper.id}">${paper.title}</a>`;
        li.addEventListener('dragstart', function() { li.classList.add('dragging'); });
        li.addEventListener('dragend',   function() { li.classList.remove('dragging'); });
        indexList.appendChild(li);
    });

    setupDragOver(indexList, '.index-item');
    setupDrop(indexList, '.index-item', papers, function() {
        papers.forEach(function(p) {
            const card = document.getElementById('paper-' + p.id);
            if (card) paperList.appendChild(card);
        });
        
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
    const card = document.getElementById('paper-' + id);
    const contentArea = card.querySelector('.paper-content');
    
    const origBtns = card.querySelector('.paper-btns');
    if (origBtns) origBtns.style.display = 'none';

    contentArea.innerHTML = `
        <div class="inline-paper-form">
            <div class="inline-row"><label>タイトル</label><input type="text" class="edit-p-title" value="${paper.title}" /></div>
            <div class="inline-row"><label>URL</label><input type="text" class="edit-p-url" value="${paper.url}" /></div>
            <div class="inline-row"><label>読む目的</label><textarea class="edit-p-reason" rows="2">${paper.reason}</textarea></div>
            <div class="inline-row"><label>内容メモ</label><textarea class="edit-p-memo" rows="3">${paper.memo}</textarea></div>
            <div class="inline-row"><label>引用</label><textarea class="edit-p-citation" rows="2">${paper.citation}</textarea></div>
            <div class="inline-row"><label>カテゴリ</label>
                <select class="edit-p-category">
                    <option value="primary"  ${paper.category === 'primary'  ? 'selected' : ''}>一次資料</option>
                    <option value="research" ${paper.category === 'research' ? 'selected' : ''}>先行研究</option>
                    <option value="draft"    ${paper.category === 'draft'    ? 'selected' : ''}>下書き</option>
                </select>
            </div>
            <div class="inline-edit-btns">
                <button class="inline-cancel-btn">キャンセル</button>
                <button class="inline-save-btn">保存</button>
            </div>
        </div>
    `;

    contentArea.querySelector('.inline-save-btn').addEventListener('click', function() {
        paper.title    = contentArea.querySelector('.edit-p-title').value.trim();
        paper.url      = contentArea.querySelector('.edit-p-url').value.trim();
        paper.reason   = contentArea.querySelector('.edit-p-reason').value.trim();
        paper.memo     = contentArea.querySelector('.edit-p-memo').value.trim();
        paper.citation = contentArea.querySelector('.edit-p-citation').value.trim();
        paper.category = contentArea.querySelector('.edit-p-category').value;
        saveData();
        renderPapers();
    });

    contentArea.querySelector('.inline-cancel-btn').addEventListener('click', function() { 
        renderPapers(); 
    });
}


// ===== タスク管理 =====

document.addEventListener('DOMContentLoaded', function() {
    taskInput = document.getElementById('task-input');
    taskAddBtn = document.getElementById('task-add-btn');
    taskList = document.getElementById('task-list');

    if (taskAddBtn) {
        taskAddBtn.addEventListener('click', function() { addTask(); });
    }
    if (taskInput) {
        taskInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); 
                addTask();
            }
        });
    }
    
    if (taskList) {
        setupDragOver(taskList, 'li');
        setupDrop(taskList, 'li', tasks);
    }
    
    renderTasks();
});

function addTask() {
    if (!taskInput) taskInput = document.getElementById('task-input');
    if (!taskInput) return;

    const text = taskInput.value.trim();
    if (text === '') return;
    
    const chapterSelect = document.getElementById('task-chapter-select');
    const chosenChapter = chapterSelect ? chapterSelect.value : '1';

    const task = {
        id:      Date.now(),
        text:    text,
        chapter: chosenChapter, 
        done:    false,
    };
    tasks.push(task);
    saveData();
    renderTasks();
    taskInput.value = '';
    taskInput.focus();
}

function renderTasks() {
    if (!taskList) taskList = document.getElementById('task-list');
    if (!taskList) return;
    taskList.innerHTML = '';
    
    const chapterTitles = {
        '1': '第１章　序論',
        '2': '第２章　ピンダーリーとは',
        '3': '第３章　ボーパール侵攻とその歴史的背景',
        '4': '第４章　英国史料におけるピンダーリー像',
        '5': '第５章　ボーパール史料におけるピンダーリー',
        '9': 'その他'
    };

    const displayTasks = [...tasks].filter(function(t) { return t !== null && typeof t === 'object'; }).sort(function(a, b) {
        if (!a.chapter) return 1;
        if (!b.chapter) return -1;
        return a.chapter.localeCompare(b.chapter);
    });

    let lastRenderedChapter = null;

    displayTasks.forEach(function(task) {
        if (task.chapter !== lastRenderedChapter) {
            if (task.chapter && chapterTitles[task.chapter]) {
                const headerLi = document.createElement('li');
                headerLi.className = 'task-inline-chapter-header';
                headerLi.innerText = chapterTitles[task.chapter];
                taskList.appendChild(headerLi);
            }
            lastRenderedChapter = task.chapter;
        }

        const li = document.createElement('li');
        li.className = 'task-item' + (task.done ? ' task-done' : '');
        li.draggable = true;
        li.dataset.index = tasks.indexOf(task);
        
        li.innerHTML = `
            <span class="drag-handle">☰</span>
            <label class="task-label">
                <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''} />
                <span class="task-text">${parseMarkdown(task.text)}</span>
            </label>
            <div class="task-btns">
                <button class="task-edit-btn">編集</button>
                <button class="task-delete-btn" data-id="${task.id}">削除</button>
            </div>
        `;
        
        li.querySelector('.task-checkbox').addEventListener('change', function() {
            task.done = this.checked;
            li.classList.toggle('task-done', task.done);
            saveData();
        });
        li.querySelector('.task-delete-btn').addEventListener('click', function() {
            const i = tasks.findIndex(function(t) { return t && t.id === task.id; });
            if (i !== -1) {
                tasks.splice(i, 1);
                saveData();
                renderTasks();
            }
        });
        li.querySelector('.task-edit-btn').addEventListener('click', function() {
            editTask(task.id, li);
        });
        li.addEventListener('dragstart', function() { li.classList.add('dragging'); });
        li.addEventListener('dragend',   function() { 
            li.classList.remove('dragging'); 
            taskList.querySelectorAll('li').forEach(function(el) {
                el.classList.remove('drag-over-top', 'drag-over-bottom');
            });
        });
        taskList.appendChild(li);
    });
}

function editTask(id, li) {
    const task = tasks.find(function(t) { return t.id === id; });
    
    li.innerHTML = `
        <div class="task-edit-form">
            <input type="text" class="edit-task-input" value="${task.text}" />
            <div class="task-edit-btns">
                <button class="task-cancel-btn">キャンセル</button>
                <button class="task-save-btn">保存</button>
            </div>
        </div>
    `;
    
    const input = li.querySelector('.edit-task-input');
    input.focus();
    
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') save();
    });

    li.querySelector('.task-save-btn').addEventListener('click', save);
    li.querySelector('.task-cancel-btn').addEventListener('click', function() { 
        renderTasks(); 
    });

    function save() {
        const newText = input.value.trim();
        if (newText === '') return;
        task.text = newText;
        saveData();
        renderTasks();
    }
}

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
        if (card && paper) {
            card.style.display = (tab === 'all' || paper.category === tab) ? 'block' : 'none';
        }
    });
    const paperIndex = document.getElementById('paper-index');
    if (!paperIndex) return;
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
if (resizer) {
    resizer.addEventListener('mousedown', function(event) {
        event.preventDefault();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });
}
function onMouseMove(event) {
    const newWidth = event.clientX;
    if (newWidth > 100 && newWidth < 400 && sidebar) { sidebar.style.width = newWidth + 'px'; }
}
function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
}

// ===== 起動 =====
loadData();