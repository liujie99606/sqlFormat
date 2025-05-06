// Vue主入口文件
const { createApp, ref, onMounted } = Vue;

const app = createApp({
  setup() {
    const sqlInput = ref('SELECT id,name FROM users WHERE age > 25 AND status = \'active\' ORDER BY id DESC;');
    const formattedResult = ref('-- 格式化后的SQL将显示在这里...');
    const toast = ref({
      visible: false,
      message: '',
      isError: false
    });

    // 检查必要的库是否成功加载
    onMounted(() => {
      if (typeof sqlFormatter === 'undefined') {
        showToast('错误：SQL格式化库加载失败，请检查网络连接或刷新页面重试', true);
        return;
      }
      
      if (typeof hljs === 'undefined') {
        showToast('错误：代码高亮库加载失败，请检查网络连接或刷新页面重试', true);
        return;
      }
      
      // 初始化高亮
      hljs.highlightElement(document.getElementById('result'));
    });

    /**
     * 格式化SQL语句
     */
    const formatSQL = () => {
      const input = sqlInput.value;

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
        
        // 设置代码内容
        formattedResult.value = formatted;
        
        // 应用高亮 (在nextTick后)
        Vue.nextTick(() => {
          hljs.highlightElement(document.getElementById('result'));
        });
        
        showToast('格式化成功');
      } catch (error) {
        formattedResult.value = '格式化错误：' + error.message;
        showToast('格式化失败：' + error.message, true);
      }
    };

    /**
     * 清空所有内容
     */
    const clearAll = () => {
      sqlInput.value = '';
      formattedResult.value = '-- 格式化后的SQL将显示在这里...';
      Vue.nextTick(() => {
        hljs.highlightElement(document.getElementById('result'));
      });
      showToast('已清空内容');
    };

    /**
     * 复制格式化结果
     */
    const copyResult = () => {
      if (!formattedResult.value || formattedResult.value === '-- 格式化后的SQL将显示在这里...') {
        showToast('没有可复制的内容', true);
        return;
      }

      navigator.clipboard.writeText(formattedResult.value)
        .then(() => {
          showToast('复制成功！');
        })
        .catch(err => {
          showToast('复制失败: ' + err, true);
        });
    };

    /**
     * 显示提示信息
     * @param {string} message - 显示的消息
     * @param {boolean} isError - 是否为错误消息
     */
    const showToast = (message, isError = false) => {
      toast.value = {
        visible: true,
        message,
        isError
      };

      // 3秒后隐藏
      setTimeout(() => {
        toast.value.visible = false;
      }, 3000);
    };

    return {
      sqlInput,
      formattedResult,
      toast,
      formatSQL,
      clearAll,
      copyResult
    };
  }
});

app.mount('#app'); 