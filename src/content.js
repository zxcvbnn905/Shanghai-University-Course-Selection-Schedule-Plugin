// 配置常量
const TARGET_TABLE_ID = 'xskbtable';
const STORAGE_KEY = 'courseWeekColors';
const DEFAULT_COLORS = {
    'week-1-8': '#ff9966',      // 1-8周颜色（橙色）
    'week-9-16': '#e0c61e',     // 9-16周颜色（黄色）
    'week-1-16': '#e31212',     // 1-16周颜色（红色）
    'irregular': '#195bd5',     // 不规则时间颜色（蓝色）
    'default': '#83fc0d'        // 默认颜色（绿色）
};

// 颜色配置
let colorConfig = { ...DEFAULT_COLORS };
let isFetching = false;

// 主函数：初始化插件
async function initWeekColorPlugin() {
    console.log('🎨 课表周次颜色插件初始化');

    // 加载保存的颜色配置
    await loadColorConfig();

    // 检查目标表格是否存在
    const targetTable = document.getElementById(TARGET_TABLE_ID);
    if (!targetTable) {
        console.log(`❌ 未找到目标表格: ${TARGET_TABLE_ID}`);
        setTimeout(checkForTable, 1000);
        return;
    }

    console.log(`✅ 找到目标表格: ${TARGET_TABLE_ID}`);

    // 避免重复处理
    if (targetTable.dataset.weekColorProcessed === 'true') {
        return;
    }

    targetTable.dataset.weekColorProcessed = 'true';


    // 自动获取并应用课程数据
    await autoFetchAndApplyCourseData();

    // 监听表格变化
    setupTableObserver(targetTable);
}

// 检查表格是否存在
function checkForTable() {
    const targetTable = document.getElementById(TARGET_TABLE_ID);
    if (targetTable) {
        initWeekColorPlugin();
    } else {
        setTimeout(checkForTable, 1000);
    }
}

// 自动获取并应用课程数据
async function autoFetchAndApplyCourseData() {
    console.log('🔄 自动获取课程数据...');

    // 先检查是否有缓存的课程数据
    //const cachedData = await getCachedCourseData();
    //if (cachedData.length > 0) {
    //    console.log(`📋 使用缓存数据: ${cachedData.length} 门课程`);
    //    applyColorsToSchedule(cachedData);
    //    return;
    //}

    // 如果没有缓存数据，自动获取
    showLoadingMessage('正在获取课程数据...');

    try {
        // 从API获取
        const apiData = await fetchCourseData();

        if (apiData.length > 0) {
            console.log(`✅ 从API获取 ${apiData.length} 门课程`);
            await saveCourseData(apiData);
            applyColorsToSchedule(apiData);
            hideLoadingMessage();
            return;
        }

        // 没有获取到数据
        showDataLoadPrompt('未找到课程数据，请刷新页面后重试');

    } catch (error) {
        console.error('获取课程数据失败:', error);
        showDataLoadPrompt('获取失败，请刷新页面后重试');
    }
}

// 获取缓存的课程数据
async function getCachedCourseData() {
    try {
        const result = await chrome.storage.local.get(['courseData']);
        return result.courseData || [];
    } catch (error) {
        return [];
    }
}

// 保存课程数据
async function saveCourseData(courseData) {
    try {
        await chrome.storage.local.set({ courseData: courseData });
        return true;
    } catch (error) {
        return false;
    }
}

async function getRequiredParams() {
    let xnm, xqm;
    const params = new URLSearchParams(window.location.search);

    for (let i = 0; i < 5; i++) { // 尝试5次，每次间隔1秒
        xnm = params.get('xnm') || document.querySelector('input[name="xkxnm"]')?.value;
        xqm = params.get('xqm') || document.querySelector('input[name="xkxqm"]')?.value;

        if (xnm && xqm) {
            return { xnm, xqm };
        }

        console.warn(`第 ${i + 1} 次尝试获取 xnm/xqm 失败，1秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { xnm: null, xqm: null };
}

// 获取课程数据（API方式）
async function fetchCourseData() {
    if (isFetching) {
        console.log('正在获取中，请稍候...');
        return [];
    }

    isFetching = true;

    try {
        console.log('📡 请求课程数据...');

        // 稳健地获取 xnm 和 xqm
        const { xnm, xqm } = await getRequiredParams();

        if (!xnm || !xqm) {
            console.error('❌ 多次尝试后，仍无法确定学年 (xnm) 或学期 (xqm)');
            showDataLoadPrompt('无法自动确定当前学期，请确保您在正确的课表页面，或尝试刷新页面。');
            isFetching = false;
            return [];
        }

        const params = new URLSearchParams(window.location.search);
        const gnmkdm = params.get('gnmkdm') || 'N253512';
        const csrftoken = document.querySelector('#csrftoken')?.value || '';

        console.log(`使用学年: ${xnm}, 学期: ${xqm}`);

        // 构建请求体 - 模拟zzxkYzbChoosedZy.js中的getParam逻辑
        const requestBody = new URLSearchParams({
            "kklxdm": document.querySelector('#kklxdm')?.value || '',
            "xkkz_id": document.querySelector('#xkkz_id')?.value || '',
            "njdm_id": document.querySelector('#njdm_id')?.value || '',
            "zyh_id": document.querySelector('#zyh_id')?.value || '',
            "zyfx_id": document.querySelector('#zyfx_id')?.value || 'wfx',
            "bh_id": document.querySelector('#bh_id')?.value || '',
            "xbm": document.querySelector('#xbm')?.value || '',
            "xslbdm": document.querySelector('#xslbdm')?.value || '',
            "ccdm": document.querySelector('#ccdm')?.value || '',
            "xsbj": document.querySelector('#xsbj')?.value || '',
            "xkxnm": xnm,
            "xkxqm": xqm,
            "kch": "",
            "kcm": "",
            "jsh": "",
            "jsm": "",
            "sjd": "",
            "kkfs": "",
            "xq": "",
            "jc": "",
            "sfym": "false",
            "sfct": "false",
            "sfxx": "false",
            "sfzn": "false",
            "sfywyl": "false",
            "sfgss": "false",
            "show_type": "1",
            "sfcx": "0",
            "sfms": "0",
            "kzlx": "ck", // 'ck' for 已选课程
            'doType': 'query',
            'gnmkdm': gnmkdm,
            'csrftoken': csrftoken
        });

        // 发送POST请求到 Display 端点
        const response = await fetch(`https://jwxt.shu.edu.cn/jwglxt/xsxk/zzxkyzb_cxZzxkYzbChoosedDisplay.html?gnmkdm=${gnmkdm}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `https://jwxt.shu.edu.cn/jwglxt/xsxk/zzxkyzb_cxZzxkYzbIndex.html?doType=details&gnmkdm=${gnmkdm}&layout=default`
            },
            body: requestBody.toString(),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        console.log('API响应:', data);

        // 检查数据结构
        if (Array.isArray(data)) {
            const filteredData = data.filter(item => item && item.sksj && item.kcmc);
            console.log(`✅ 获取到 ${filteredData.length} 门课程`);
            return filteredData;
        } else if (data && Array.isArray(data.rows)) {
            const filteredData = data.rows.filter(item => item && item.sksj && item.kcmc);
            console.log(`✅ 获取到 ${filteredData.length} 门课程`);
            return filteredData;
        } else if (data && data.data && Array.isArray(data.data)) {
            const filteredData = data.data.filter(item => item && item.sksj && item.kcmc);
            console.log(`✅ 获取到 ${filteredData.length} 门课程`);
            return filteredData;
        } else if (data && Array.isArray(data.kbList)) { // 兼容课表查询页的数据结构
            const filteredData = data.kbList.filter(item => item && item.sksj && item.kcmc);
            console.log(`✅ 获取到 ${filteredData.length} 门课程`);
            return filteredData;
        } else {
            console.warn('数据格式未识别:', data);
            return [];
        }

    } catch (error) {
        console.error('请求课程数据失败:', error);
        return [];
    } finally {
        isFetching = false;
    }
}


// 显示加载消息
function showLoadingMessage(text) {
    const existing = document.getElementById('loading-message');
    if (existing) existing.remove();

    const message = document.createElement('div');
    message.id = 'loading-message';
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #17a2b8;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10001;
        font-family: Arial, sans-serif;
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    message.innerHTML = `
        <div style="width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div>${text}</div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;

    document.body.appendChild(message);
}

// 隐藏加载消息
function hideLoadingMessage() {
    const message = document.getElementById('loading-message');
    if (message) message.remove();
}

// 显示成功消息
function showSuccessMessage(text) {
    const message = document.createElement('div');
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;

    message.innerHTML = `✅ ${text}`;
    document.body.appendChild(message);

    setTimeout(() => {
        if (message.parentNode) {
            message.parentNode.removeChild(message);
        }
    }, 3000);
}

// 显示数据加载提示
function showDataLoadPrompt(message) {
    const existing = document.getElementById('data-prompt');
    if (existing) existing.remove();

    const prompt = document.createElement('div');
    prompt.id = 'data-prompt';
    prompt.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ffc107;
        color: #856404;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        width: 300px;
        font-family: Arial, sans-serif;
        border: 1px solid #ffeaa7;
    `;

    prompt.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold;">
            ⚠️ ${message || '需要课程数据'}
        </div>
        
        <div style="margin-bottom: 12px; font-size: 12px;">
            请选择操作：
        </div>
        
        <div style="display: flex; gap: 8px;">
            <button id="retryFetchBtn" style="flex: 1; padding: 8px; background: #856404; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                重试获取
            </button>
            <button id="closePromptBtn" style="width: 40px; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                关闭
            </button>
        </div>
    `;

    document.body.appendChild(prompt);

    document.getElementById('retryFetchBtn').addEventListener('click', async () => {
        prompt.remove();
        await autoFetchAndApplyCourseData();
    });

    document.getElementById('closePromptBtn').addEventListener('click', () => {
        prompt.remove();
    });
}

// 添加颜色控制面板
function addColorControlPanel() {
    const existing = document.getElementById('color-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'color-panel';
    panel.style.cssText = `
        position: fixed;
        top: 20px;
        left: 20px;
        background: white;
        border: 2px solid #5cb85c;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        width: 280px;
        font-family: Arial, sans-serif;
    `;

    panel.innerHTML = `
        <div style="margin-bottom: 10px; font-weight: bold; color: #333; border-bottom: 1px solid #eee; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span>🎨 课表颜色设置</span>
            <button id="minimize-btn" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #666;">−</button>
        </div>
        
        <div id="panel-content">
            <div style="margin-bottom: 10px; font-size: 12px; color: #666; background: #f8f9fa; padding: 8px; border-radius: 4px;">
                <div style='display: flex; flex-wrap: wrap; align-items: center; gap: 10px;'>
                    <div style='display: flex; align-items: center;'><p style='margin-right:5px;background-color:#ff9966;height:15px;width:30px;'></p>1-8周</div>
                    <div style='display: flex; align-items: center;'><p style='margin-right:5px;background-color:#e0c61e;height:15px;width:30px;'></p>9-16周</div>
                    <div style='display: flex; align-items: center;'><p style='margin-right:5px;background-color:#e31212;height:15px;width:30px;'></p>1-16周</div>
                    <div style='display: flex; align-items: center;'><p style='margin-right:5px;background-color:#195bd5;height:15px;width:30px;'></p>不规则</div>
                    <div style='display: flex; align-items: center;'><p style='margin-right:5px;background-color:#83fc0d;height:15px;width:30px;'></p>默认</div>
                </div>
            </div>
            
            <div style="margin-bottom: 10px;">
                ${['week-1-8', 'week-9-16', 'week-1-16', 'irregular', 'default']
        .map(type => `
                        <div style="display: flex; align-items: center; margin-bottom: 6px;">
                            <span style="width: 70px; font-size: 12px;">${getWeekTypeName(type)}:</span>
                            <input type="color" id="color-${type}" value="${colorConfig[type]}" style="flex: 1; height: 25px;">
                        </div>
                    `).join('')}
            </div>
            
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                <button id="apply-btn" style="flex: 1; padding: 8px; background: #5cb85c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    应用
                </button>
                <button id="reset-btn" style="flex: 1; padding: 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    重置
                </button>
            </div>
            
            <div style="display: flex; gap: 8px;">
                <button id="fetch-btn" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    刷新数据
                </button>
                <button id="clear-btn" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                    清空
                </button>
            </div>
            
            <div id="stats-info" style="margin-top: 10px; padding: 8px; background: #f8f9fa; border-radius: 4px; font-size: 11px; color: #666;">
                <div style="font-weight: bold; margin-bottom: 4px;">📊 等待数据加载...</div>
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    // 事件监听
    document.getElementById('apply-btn').addEventListener('click', async () => {
        await updateColorConfig();
    });

    document.getElementById('reset-btn').addEventListener('click', async () => {
        colorConfig = { ...DEFAULT_COLORS };
        await chrome.storage.local.set({ [STORAGE_KEY]: colorConfig });
        location.reload();
    });

    document.getElementById('fetch-btn').addEventListener('click', async () => {
        panel.remove();
        await autoFetchAndApplyCourseData();
        addColorControlPanel();
    });

    document.getElementById('clear-btn').addEventListener('click', async () => {
        await chrome.storage.local.remove(['courseData']);
        showSuccessMessage('已清空课程数据');
        location.reload();
    });

    document.getElementById('minimize-btn').addEventListener('click', () => {
        const content = document.getElementById('panel-content');
        const btn = document.getElementById('minimize-btn');

        if (content.style.display === 'none') {
            content.style.display = 'block';
            btn.textContent = '−';
        } else {
            content.style.display = 'none';
            btn.textContent = '+';
        }
    });
}

// 获取周次类型名称
function getWeekTypeName(type) {
    const names = {
        'week-1-8': '1-8周',
        'week-9-16': '9-16周',
        'week-1-16': '1-16周',
        'irregular': '不规则',
        'default': '默认'
    };
    return names[type] || type;
}

// 更新颜色配置
async function updateColorConfig() {
    const types = ['week-1-8', 'week-9-16', 'week-1-16', 'irregular', 'default'];
    types.forEach(type => {
        const input = document.getElementById(`color-${type}`);
        if (input) {
            colorConfig[type] = input.value;
        }
    });

    await chrome.storage.local.set({ [STORAGE_KEY]: colorConfig });

    // 重新应用颜色
    const cachedData = await getCachedCourseData();
    if (cachedData.length > 0) {
        applyColorsToSchedule(cachedData);
    }
}

// 应用颜色到课表
function applyColorsToSchedule(courseData) {
    console.log('开始应用颜色...');

    // 重置所有单元格
    const cells = document.querySelectorAll(`#${TARGET_TABLE_ID} td[id^="td_"]`);
    cells.forEach(cell => {
        cell.style.backgroundColor = '';
        cell.innerHTML = '';
        cell.title = '';
    });

    // 1. 构建一个以单元格ID为键的课程表
    const scheduleMap = {};
    courseData.forEach(course => {
        if (course.sksj && course.kcmc) {
            const timeSlots = parseTimeSlots(course.sksj);
            timeSlots.forEach(slot => {
                const cellId = `td_${slot.day}-${slot.section}`;
                if (!scheduleMap[cellId]) {
                    scheduleMap[cellId] = [];
                }
                scheduleMap[cellId].push(course);
            });
        }
    });

    // 统计
    const stats = {
        'week-1-8': 0,
        'week-9-16': 0,
        'week-1-16': 0,
        'irregular': 0,
        'default': 0,
        'total': 0
    };

    // 2. 遍历 scheduleMap，为每个单元格确定并应用颜色
    Object.keys(scheduleMap).forEach(cellId => {
        const coursesInSlot = scheduleMap[cellId];
        const cell = document.getElementById(cellId);

        if (cell && coursesInSlot.length > 0) {
            // 3. 分析合并后的周次类型
            const weekType = analyzeWeekType(coursesInSlot);
            stats[weekType]++;
            stats.total++;
            const color = colorConfig[weekType] || colorConfig.default;

            cell.style.backgroundColor = color;

            // 4. 在单元格中显示所有课程信息
            const courseInfoHtml = coursesInSlot.map(course => {
                const shortName = course.kcmc.length > 10 ? course.kcmc.substring(0, 8) + '...' : course.kcmc;
                return `
                    <div style="font-size: 8px; font-weight: bold; margin-bottom: 2px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${course.kcmc}">
                        ${shortName}
                    </div>
                `;
            }).join('');

            cell.innerHTML = courseInfoHtml;

            const fullTitle = coursesInSlot.map(course => course.kcmc).join('\n---\n');
            cell.title = fullTitle;
        }
    });


    console.log('✅ 颜色应用完成', stats);

    // 更新统计信息
    updatePanelStats(stats);

    // 插入或更新课表下方的图例
    insertOrUpdateLegend();

    // 移除旧的图例
    const table = document.getElementById(TARGET_TABLE_ID);
    if (table) {
        const rows = table.getElementsByTagName('tr');
        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            const legendCell = lastRow.querySelector('td[colspan="8"]');
            if (legendCell) {
                lastRow.remove();
            }
        }
    }

    if (table) delete table.dataset.isApplyingColors; // 移除标记
}

// 插入或更新课表下方的图例
function insertOrUpdateLegend() {
    const targetTable = document.getElementById(TARGET_TABLE_ID);
    if (!targetTable) return;

    let legendContainer = document.getElementById('custom-legend-container');
    if (!legendContainer) {
        legendContainer = document.createElement('div');
        legendContainer.id = 'custom-legend-container';
        legendContainer.style.cssText = `
            padding: 10px;
            margin-top: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 12px;
        `;
        // 插入到表格的父节点的末尾
        targetTable.parentNode.appendChild(legendContainer);
    }

    const legendHtml = `
        <div style="font-weight: bold; margin-bottom: 8px;">图例:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            ${Object.keys(colorConfig).map(type => `
                <div style="display: flex; align-items: center;">
                    <span style="width: 20px; height: 20px; background-color: ${colorConfig[type]}; border: 1px solid #ccc; margin-right: 5px;"></span>
                    <span>${getWeekTypeName(type)}</span>
                </div>
            `).join('')}
        </div>
    `;

    legendContainer.innerHTML = legendHtml;
}

// 更新面板统计信息
function updatePanelStats(stats) {
    const statsDiv = document.getElementById('stats-info');
    if (!statsDiv) return;

    statsDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">📊 课程统计</div>
        <div style="display: flex; justify-content: space-between;">
            <span style="color: ${colorConfig['week-1-8']};">1-8周: ${stats['week-1-8']}</span>
            <span style="color: ${colorConfig['week-9-16']};">9-16周: ${stats['week-9-16']}</span>
            <span style="color: ${colorConfig['week-1-16']};">1-16周: ${stats['week-1-16']}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span style="color: ${colorConfig['irregular']};">不规则: ${stats['irregular']}</span>
            <span style="color: ${colorConfig['default']};">默认: ${stats['default']}</span>
            <span style="font-weight: bold;">总计: ${stats.total}</span>
        </div>
    `;
}

// 分析周次类型
function analyzeWeekType(courses) {
    const coursesArray = Array.isArray(courses) ? courses : [courses];
    const weekSet = new Set();

    coursesArray.forEach(course => {
        const sksj = typeof course === 'string' ? course : course.sksj;
        if (!sksj) return;

        const cleanText = sksj.toString()
            .replace(/<br\/?>/gi, ' ')
            .replace(/<[^>]+>/g, '');

        // 匹配所有 {X-Y周} 或 {N周} 格式
        const weekRanges = cleanText.match(/\{(.+?)\}/g) || [];
        weekRanges.forEach(range => {
            const inner = range.slice(1, -1); // 移除花括号
            // 1-8周
            if (inner.includes('1-8周')) {
                for (let i = 1; i <= 8; i++) weekSet.add(i);
            }
            // 9-16周
            else if (inner.includes('9-16周')) {
                for (let i = 9; i <= 16; i++) weekSet.add(i);
            }
            // 1-16周
            else if (inner.includes('1-16周')) {
                for (let i = 1; i <= 16; i++) weekSet.add(i);
            }
            // X-Y周
            else {
                const matchRange = inner.match(/(\d+)-(\d+)周/);
                if (matchRange) {
                    const start = parseInt(matchRange[1]);
                    const end = parseInt(matchRange[2]);
                    for (let i = start; i <= end; i++) {
                        weekSet.add(i);
                    }
                } else {
                    // 单独的周次，如 {2周,6周,10周,14周}
                    const singleWeeks = inner.match(/\d+/g);
                    if (singleWeeks) {
                        singleWeeks.forEach(w => weekSet.add(parseInt(w)));
                    }
                }
            }
        });
    });

    if (weekSet.size === 0) {
        return 'default';
    }

    // 判断是否覆盖1-16周
    const hasWeek1_8 = Array.from(weekSet).some(w => w >= 1 && w <= 8);
    const hasWeek9_16 = Array.from(weekSet).some(w => w >= 9 && w <= 16);

    if (hasWeek1_8 && hasWeek9_16) {
         // 进一步检查是否完整覆盖1-16周
         let isFullTerm = true;
         for (let i = 1; i <= 16; i++) {
             if (!weekSet.has(i)) {
                 isFullTerm = false;
                 break;
             }
         }
         if (isFullTerm) {
             return 'week-1-16';
         }
    }

    if (weekSet.size >= 8 && Array.from(weekSet).every(w => w >= 1 && w <= 8)) {
        return 'week-1-8';
    }

    if (weekSet.size >= 8 && Array.from(weekSet).every(w => w >= 9 && w <= 16)) {
        return 'week-9-16';
    }

    return 'irregular';
}


// 解析时间信息
function parseTimeSlots(sksj) {
    const slots = [];
    const parts = sksj.split(/<br\/?>/gi);
    const dayMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 7 };

    parts.forEach(part => {
        const match = part.match(/星期([一二三四五六日])第(\d+)-(\d+)节/);
        if (match) {
            const day = dayMap[match[1]];
            const start = parseInt(match[2]);
            const end = parseInt(match[3]);

            if (day && start && end) {
                for (let i = start; i <= end; i++) {
                    slots.push({ day: day, section: i });
                }
            }
        }
    });

    return slots;
}

// 设置表格观察器
function setupTableObserver(table) {
    const observer = new MutationObserver(() => {
        if (!table.dataset.weekColorProcessed) {
            table.dataset.weekColorProcessed = 'true';
            autoFetchAndApplyCourseData();
        }
    });

    observer.observe(table, { childList: true, subtree: true });
}

// 加载颜色配置
async function loadColorConfig() {
    try {
        const result = await chrome.storage.local.get([STORAGE_KEY]);
        if (result[STORAGE_KEY]) {
            colorConfig = { ...DEFAULT_COLORS, ...result[STORAGE_KEY] };
        }
    } catch (error) {
        console.log('使用默认颜色配置');
    }
}

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('收到消息:', request.action);

    if (request.action === 'setWeekColors' && request.colors) {
        // 更新颜色配置
        colorConfig = { ...colorConfig, ...request.colors };
        chrome.storage.local.set({ [STORAGE_KEY]: colorConfig }).then(() => {
            // 重新应用颜色
            chrome.storage.local.get(['courseData']).then(result => {
                if (result.courseData) {
                    applyColorsToSchedule(result.courseData);
                }
            });
            sendResponse({ success: true });
        });
        return true;
    }

    if (request.action === 'fetchCourseData') {
        // 手动触发获取课程数据
        autoFetchAndApplyCourseData().then(() => {
            sendResponse({ success: true });
        });
        return true;
    }

    return true;
});

// 初始化插件
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWeekColorPlugin);
} else {
    initWeekColorPlugin();
}
