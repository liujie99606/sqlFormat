// 配置文件 - 包含应用程序的基础数据和配置选项

// 时间选项生成函数
function generateTimeOptions() {
    const options = [];
    
    // 生成0-24小时的选项，每半小时一个选项
    for (let hour = 0; hour < 24; hour++) {
        // 整点
        options.push({
            value: hour,
            label: `${hour.toString().padStart(2, '0')}:00`
        });
        
        // 半点
        options.push({
            value: hour + 0.5,
            label: `${hour.toString().padStart(2, '0')}:30`
        });
    }
    
    return options;
}

// 应用配置对象
const AppConfig = {
    // 默认配置
    defaults: {
        salaryType: 'hourly',
        salaryAmount: 0,
        startTime: 8,
        endTime: 16,
    },
    
    // 预生成的时间选项
    timeOptions: generateTimeOptions(),
    
    // 可用的薪资类型配置
    salaryTypes: {
        'monthly': {
            label: '月薪 (元/月)',
            hoursPerPeriod: 21.75 * 8 // 月薪时期望的工作小时数
        },
        'daily': {
            label: '日薪 (元/天)',
            hoursPerPeriod: 8 // 日薪时期望的工作小时数
        },
        'hourly': {
            label: '时薪 (元/小时)',
            hoursPerPeriod: 1 // 时薪本身就是以小时计算
        }
    }
}; 