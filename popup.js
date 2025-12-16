// 当前颜色配置
let currentColors = {
    'week-1-8': '#ff9966',
    'week-9-16': '#e0c61e',
    'week-1-16': '#e31212',
    'irregular': '#195bd5',
    'default': '#83fc0d'
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 加载保存的颜色配置
    await loadSavedColors();

    // 设置颜色选择器
    setupColorPickers();

    // 设置按钮事件
    setupButtons();

    // 更新当前页面信息
    updatePageStatus();
});

// 加载保存的颜色
async function loadSavedColors() {
    try {
        const result = await chrome.storage.local.get(['courseWeekColors']);
        if (result.courseWeekColors) {
            currentColors = { ...currentColors, ...result.courseWeekColors };
            updateAllColorPickers();
        }
    } catch (error) {
        console.log('使用默认颜色配置');
    }
}

// 更新所有颜色选择器
function updateAllColorPickers() {
    const pickers = {
        'colorWeek1_8': 'week-1-8',
        'colorWeek9_16': 'week-9-16',
        'colorWeek1_16': 'week-1-16',
        'colorIrregular': 'irregular',
        'colorDefault': 'default'
    };

    for (const [pickerId, colorKey] of Object.entries(pickers)) {
        const picker = document.getElementById(pickerId);
        const code = document.getElementById(pickerId + 'Code');
        if (picker && code) {
            picker.value = currentColors[colorKey];
            code.textContent = currentColors[colorKey];
        }
    }
}

// 设置颜色选择器事件
function setupColorPickers() {
    const pickers = {
        'colorWeek1_8': 'week-1-8',
        'colorWeek9_16': 'week-9-16',
        'colorWeek1_16': 'week-1-16',
        'colorIrregular': 'irregular',
        'colorDefault': 'default'
    };

    for (const [pickerId, colorKey] of Object.entries(pickers)) {
        const picker = document.getElementById(pickerId);
        if (picker) {
            picker.addEventListener('input', function(e) {
                const color = e.target.value;
                document.getElementById(pickerId + 'Code').textContent = color;
                currentColors[colorKey] = color;
            });
        }
    }
}

// 设置按钮事件
function setupButtons() {
    // 保存颜色按钮
    document.getElementById('saveColors').addEventListener('click', async function() {
        try {
            await chrome.storage.local.set({ 'courseWeekColors': currentColors });
            showStatus('颜色配置已保存！', 'success');
        } catch (error) {
            showStatus('保存失败', 'warning');
        }
    });

    // 应用颜色按钮
    document.getElementById('applyColors').addEventListener('click', async function() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'setWeekColors',
                colors: currentColors
            });
            showStatus('颜色已应用！', 'success');
        } catch (error) {
            showStatus('请刷新页面后重试', 'warning');
        }
    });

    // 重置颜色按钮
    document.getElementById('resetColors').addEventListener('click', async function() {
        currentColors = {
            'week-1-8': '#ff9966',
            'week-9-16': '#e0c61e',
            'week-1-16': '#e31212',
            'irregular': '#195bd5',
            'default': '#83fc0d'
        };

        updateAllColorPickers();
        await chrome.storage.local.set({ 'courseWeekColors': currentColors });

        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'setWeekColors',
                colors: currentColors
            });
            showStatus('已重置颜色！', 'success');
        } catch (error) {
            showStatus('重置成功', 'info');
        }
    });

    // 获取数据按钮
    document.getElementById('fetchData').addEventListener('click', async function() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tabs[0].id, {
                action: 'fetchCourseData'
            });
            showStatus('正在获取课程数据...', 'info');

            // 3秒后刷新状态
            setTimeout(updatePageStatus, 3000);
        } catch (error) {
            showStatus('请刷新页面后重试', 'warning');
        }
    });
}

// 更新页面状态信息
async function updatePageStatus() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        const isSchedulePage = currentTab.url.includes('zzxkyzb_cxZzxkYzbIndex.html');
        const statusDiv = document.getElementById('pageStatus');

        if (isSchedulePage) {
            const result = await chrome.storage.local.get(['courseData']);
            if (result.courseData && result.courseData.length > 0) {
                statusDiv.innerHTML = `
                    <div style="color: #28a745; font-size: 12px;">
                        ✅ 已加载 ${result.courseData.length} 门课程
                    </div>
                `;
            } else {
                statusDiv.innerHTML = `
                    <div style="color: #ffc107; font-size: 12px;">
                        ⚠️ 未找到课程数据
                    </div>
                `;
            }
        } else {
            statusDiv.innerHTML = `
                <div style="color: #6c757d; font-size: 12px;">
                    ℹ️ 请在课表页面使用此功能
                </div>
            `;
        }
    } catch (error) {
        console.log('获取页面状态失败');
    }
}

// 显示状态信息
function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.className = type === 'success' ? 'status-success' :
        type === 'warning' ? 'status-warning' : 'status-info';
    statusDiv.textContent = message;

    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
    }, 3000);
}