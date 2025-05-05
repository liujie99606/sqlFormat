# SQL格式化工具

![SQL格式化工具](https://img.shields.io/badge/SQL-格式化工具-4361ee)
![版本](https://img.shields.io/badge/版本-1.0.0-brightgreen)
![语言](https://img.shields.io/badge/语言-HTML/CSS/JS-orange)
![许可证](https://img.shields.io/badge/许可证-MIT-blue)

## 📄 项目简介

SQL格式化工具是一个轻量级、易用的在线工具，可以帮助开发人员、数据分析师和数据库管理员快速格式化SQL查询语句，提高代码可读性和可维护性。

## ✨ 主要功能

- 📝 **SQL格式化**：自动格式化SQL代码，增强可读性
- 🔍 **语法高亮**：采用highlight.js提供精美的SQL语法高亮显示
- 📋 **复制功能**：一键复制格式化后的SQL代码
- 🧹 **清空功能**：快速清空输入区域和结果
- 📱 **响应式设计**：适配不同设备屏幕尺寸

## 🔧 技术栈

- HTML5 + CSS3
- 原生JavaScript
- [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) - SQL格式化库
- [highlight.js](https://highlightjs.org/) - 代码高亮库
- [Bootstrap Icons](https://icons.getbootstrap.com/) - 图标

## 💻 使用方法

1. 在左侧输入框中粘贴您需要格式化的SQL代码
2. 点击"格式化"按钮
3. 右侧窗口将显示格式化后的SQL代码，并带有语法高亮
4. 点击"复制结果"按钮可以复制格式化后的代码

## 🚀 本地部署

此项目是纯前端项目，可以直接在浏览器中打开HTML文件运行，或通过任何Web服务器托管：

```bash
# 使用Python简易HTTP服务器
python -m http.server

# 或使用Node.js的http-server
npx http-server
```

## 📚 支持的SQL方言

- MySQL
- PostgreSQL
- SQL Server (T-SQL)
- Oracle (PL/SQL)
- 标准SQL

## 📝 许可证

[MIT](LICENSE)

## 👨‍💻 作者

Ruimo

---

如果您发现任何问题或有改进建议，欢迎[提交Issue](https://github.com/liujie99606/sqlFormat/issues)或贡献代码。
