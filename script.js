// 检查必要的库是否成功加载
window.onload = function () {
    if (typeof sqlFormatter === 'undefined') {
        showToast('错误：SQL格式化库加载失败，请检查网络连接或刷新页面重试', true);
        return;
    }
    
    if (typeof hljs === 'undefined') {
        showToast('错误：代码高亮库加载失败，请检查网络连接或刷新页面重试', true);
        return;
    }
    
    // 初始化高亮
    const resultElement = document.getElementById('result');
    hljs.highlightElement(resultElement);
};

/**
 * 格式化SQL语句
 */
function formatSQL() {
    const input = document.getElementById('sqlInput').value;
    const resultElement = document.getElementById('result');

    if (!input.trim()) {
        showToast('请输入SQL语句', true);
        return;
    }

    try {
        const formatted = sqlFormatter.format(input, {
            language: 'mysql', // 支持 'sql' | 'mysql' | 'postgres' | 'plsql'
            indent: '    ',   // 四个空格缩进
            uppercase: true, // 关键字大写
            linesBetweenQueries: 2 // 查询之间的空行数
        });
        
        // 设置代码内容并应用高亮
        resultElement.textContent = formatted;
        hljs.highlightElement(resultElement);
        
        showToast('格式化成功');
    } catch (error) {
        resultElement.textContent = '格式化错误：' + error.message;
        showToast('格式化失败：' + error.message, true);
    }
}

/**
 * 清空所有内容
 */
function clearAll() {
    document.getElementById('sqlInput').value = '';
    const resultElement = document.getElementById('result');
    resultElement.textContent = '-- 格式化后的SQL将显示在这里...';
    hljs.highlightElement(resultElement);
    showToast('已清空内容');
}

/**
 * 复制格式化结果
 */
function copyResult() {
    const resultText = document.getElementById('result').textContent;
    if (!resultText || resultText === '-- 格式化后的SQL将显示在这里...') {
        showToast('没有可复制的内容', true);
        return;
    }

    navigator.clipboard.writeText(resultText)
        .then(() => {
            showToast('复制成功！');
        })
        .catch(err => {
            showToast('复制失败: ' + err, true);
        });
}

/**
 * 显示提示信息
 * @param {string} message - 显示的消息
 * @param {boolean} isError - 是否为错误消息
 */
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // 设置消息和样式
    toastMessage.textContent = message;

    if (isError) {
        toast.classList.add('error');
        toast.querySelector('i').className = 'bi bi-exclamation-circle';
    } else {
        toast.classList.remove('error');
        toast.querySelector('i').className = 'bi bi-check-circle';
    }

    // 显示提示
    toast.classList.add('show');

    // 3秒后隐藏
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
} 