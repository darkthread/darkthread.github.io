const cssA = 'x6';
const cssN = 'x8';
const cssQ = 'xc';

// 等待 DOM 載入完成後再執行
document.addEventListener('DOMContentLoaded', function () {
    // 動態加入 CSS style 區塊
    const style = document.createElement('style');
    style.innerHTML = `
        :root {
            --font-size-title: 10pt;
            --font-size-button: 8pt;
            --font-size-timer: 14pt;
            --font-size-control: 9pt;
            --font-size-stats: 9.5pt;
        }
        .control-panel {
            position: fixed;
            top: 4px;
            left: 4px;
            background-color: rgba(0, 0, 0, 0.6);
            padding: 4px;
            border-radius: 8px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 9999;
            width: 100px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            text-align: center;
        }
        .control-panel .title {
            margin: 0 6px;
            font-size: var(--font-size-title);
            width: 80px;
            button {
                font-size: var(--font-size-button);
                padding: 0px 4px;
            }
            #timer {
                font-family: 'Digital7', monospace;
                font-size: 28px;            
                color: #00ff00;
                background-color: rgba(0, 0, 0, 0.8);
                padding: 4px 8px;
                border-radius: 4px;
            }
            .control {
                margin-top: 6px;
                font-size: var(--font-size-control);
            }
        }
        .control-panel #stats {
            flex: 1;
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
            font-size: var(--font-size-stats);
            gap: 6px;
            margin-top: 12px;
            padding-right: 4px;
            align-content: flex-start;
            margin-left: 4px;
            .no {
                cursor: pointer;
                width: calc(25% - 6px);
                text-align: center;
                &.empty {
                    color: #bbb;
                }
                &.filled {
                    color: yellow;
                }
            }
        }
        .wrong {
            position: relative; 
            .should {
                color: red;
                position: absolute;
                left: 0.9em;
            }
        }
        .slash {
            position: relative;
            display: inline-block;
            color: gray;
        }
        .slash::after {
            content: '';
            position: absolute;
            top: -0.3em;
            left: -0.2em;
            width: 1em;
            height: 1.2em;
            border-left: 4px solid red;
            transform: rotate(45deg);
            transform-origin: left bottom;
        }
        #result {
            color: white;
        }
    `;
    document.head.appendChild(style);

    // 使用 innerHTML 定義 DOM
    const controlPanel = document.createElement('div');
    controlPanel.className = 'control-panel';
    controlPanel.innerHTML = `
        <div class="title">
            <div id="timer"></div>
            <div class="control">
                <button id="check">評分</button>
                <button id="reset" onclick="localStorage.removeItem('${storageKey}');location.reload();">重設</button>
            </div>
            <div id="result"></div>
        </div>
        <div id="stats"></div>
    `;
    // 將控制區插入到頁面
    document.body.appendChild(controlPanel);

    scanQuestions();
    controlPanel.addEventListener('click', function (event) {
        if (event.target.classList.contains('no')) {
            const qNo = event.target.textContent;
            const qBody = document.querySelector(`.q-body[data-no='${qNo}']`);
            if (qBody) {
                const page = qBody.closest('.pf');
                if (page) {
                    page.scrollIntoView({ behavior: 'smooth' });
                }
                qBody.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        if (event.target.tagName === 'BUTTON') {
            CheckAnswers();
        }
    });
    updateTimer();
});

function CheckAnswers() {
    document.querySelectorAll('.q-option').forEach(el => {
        el.classList.remove('q-option');
    });
    event.target.disabled = true;
    clearInterval(timerHandle);
    const ansFields = document.querySelectorAll(`.q-ans`);
    let correctCount = 0;
    ansFields.forEach(el => {
        const no = el.getAttribute('data-no');
        const ans = el.getAttribute('data-ans');
        const userAns = el.textContent.trim();
        if (userAns === ans) {
            el.style.color = 'green';
            document.querySelector('#stats .no[data-no="' + no + '"]').style.color = 'lightgreen';
            correctCount++;
        } else {
            el.style.color = 'red';
            el.style.fontWeight = 'bold';
            el.style.webkitTextStroke = '0px transparent';
            el.innerHTML = `<span class="wrong"><span class="slash">${userAns}</span><span class="should">${ans}</span></span>`;
            document.querySelector('#stats .no[data-no="' + no + '"]').style.color = 'orange';
        }
    });
    const score = ((correctCount / ansFields.length) * 100).toFixed(0);

    document.getElementById('result').innerHTML = `得分：<strong>${score} 分</strong>`;
}

const storageKey = 'stats-' + window.location.pathname;
class SessionState {
    constructor() {
        this.answers = [];
        this.seconds = 0;
    }
}
function saveSessionState() {
    localStorage.setItem(storageKey, JSON.stringify(stat));
}
let stat = JSON.parse(localStorage.getItem(storageKey)) || new SessionState();
function updateTimer() {
    const mins = Math.floor(stat.seconds / 60);
    const secs = stat.seconds % 60;
    document.getElementById('timer').textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    stat.seconds++;
    saveSessionState();
}
const timerHandle = setInterval(updateTimer, 1000);
const emptyChar = '？';
function updateStats() {
    const ansFields = document.querySelectorAll(`.q-ans`);
    let filledCount = 0;
    stat.answers = [];
    const html = [...ansFields].map(el => {
        const no = el.getAttribute('data-no');
        const ans = el.getAttribute('data-ans');
        const userAns = el.textContent.trim();
        const filled = (userAns !== emptyChar);
        if (filled) filledCount++;
        const flag = filled ? 'filled' : 'empty';
        stat.answers.push({ no, ans: filled ? userAns : '' });
        return `<div class="no ${flag}" data-no="${no}">${no}</div>`;
    });
    saveSessionState();
    document.getElementById('stats').innerHTML = html.join('');
}


function scanQuestions() {
    const last = [...document.querySelectorAll('.c.x1.y1.w2.h0')].pop();
    if (last) last.parentNode.insertBefore(last, last.parentNode.firstChild);
    [...document.querySelectorAll(`.${cssN}`)]
        .map(el => {
            const m = el.textContent.trim().match(/^\d+\.?$/);
            if (m) {
                const qAns = el.previousElementSibling;
                el.classList.add('q-no');
                const qBody = el.nextElementSibling;
                if (qBody) {
                    qBody.classList.add(`q-body`);
                    const qNo = m[0].replace('.', '');
                    qBody.setAttribute('data-no', qNo);
                    const ans = qAns ? qAns.textContent.trim() : 'N/A';
                    qBody.setAttribute('data-ans', ans);
                    qAns.setAttribute('data-no', qNo);
                    const ansField = qAns.querySelector('div');
                    if (ansField) {
                        ansField.classList.add('q-ans');
                        ansField.textContent = stat.answers.find(a => a.no === qNo)?.ans || emptyChar;
                        ansField.setAttribute('data-ans', ans);
                        ansField.setAttribute('data-no', qNo);
                    }
                }
            }
        });
    document.body.removeAttribute('cloak');
    [...document.querySelectorAll(`.${cssQ}`)]
        .filter(el => !el.classList.contains('q-body'))
        .map(el => {
            let prev = el.previousElementSibling;
            while (prev && !prev?.classList?.contains('q-body')) {
                prev = prev.previousElementSibling;
            }
            if (prev == null) {
                let prevPage = el.closest('.pf');
                var qBodys = prevPage.previousElementSibling?.querySelectorAll('.q-body');
                prev = qBodys ? qBodys[qBodys.length - 1] : null;
            }
            if (prev?.classList?.contains('q-body')) {
                el.classList.add('q-body');
                el.setAttribute('data-no', prev.getAttribute('data-no'));
                el.setAttribute('data-ans', prev.getAttribute('data-ans'));
            }
        });
    document.querySelectorAll('.q-body div').forEach(el => {
        // el.style.border = '1px dashed blue';
        const text = el.textContent.trim();
        const m = text.match(/^\([A-D]\)/);
        if (m) {
            el.classList.add('q-option');
            el.setAttribute('data-option', m[0].replace(/[()]/g, ''));
            const qNo = el.closest('.q-body').getAttribute('data-no');
            el.setAttribute('data-no', qNo);
        }
    });
    updateStats();
}

document.addEventListener('click', function (event) {
    const target = event.target;
    const option = target.closest('.q-option');
    if (option) {
        const qNo = option.getAttribute('data-no');
        const qAns = document.querySelector(`.q-ans[data-no='${qNo}']`);
        if (qAns) {
            qAns.textContent = option.getAttribute('data-option');
            updateStats();
        }
    }
});