import TalqsInteraction from 'talqsInteraction';
// 试题数据集合
var data = [];
// 当前显示的数据索引值
var currentIndex = 0;
// 当前显示试题的 ID
var currentId;
// 目前支持的题型
var typeList = [1, 2, 4, 10];

// 试题请求完成
var loadComplete = function(result) {
    // 数据筛选，只拿出目前支持交互的题型
    data = result.filter((item) => typeList.indexOf(parseInt(item.logicQuesTypeId, 10)) !== -1);
    // 试题渲染
    renderQS();
};

var answer = document.getElementById('answer');

// 转为可读性高的 JSON 字符串
var readableJson = function(data) {
    return JSON.stringify(data, null, 4)
}

TalqsInteraction.onChange = function(evt) {
    answer.innerHTML = `实时数据，用于实时提交，通过 <code>onChange</code> 订阅: 
                        <pre>${readableJson(evt.data)}</pre>`;
}

var app = document.getElementById('app');
var info = document.getElementById('info');
// 渲染试题
var renderQS = function() {
    // 当前试题数据赋值
    var currentData = data[currentIndex];
    currentId = currentData.queId;
    // 进行试题渲染
    app.innerHTML = TalqsTemplate.render(currentData, {
        queIndex: currentIndex + 1,
        hideDifficulty: true,
        hideSource: true,
    });
    // 写入之前的作答缓存
    var cache = TalqsInteraction.getData(currentId);
    answer.innerHTML = '';
    if (cache) {
        TalqsInteraction.setData(cache)
        answer.innerHTML = `之前的作答记录为: ${readableJson(cache)}`;
    }
    info.innerHTML = `逻辑类型： ${currentData.logicQuesTypeName}，逻辑类型ID： ${currentData.logicQuesTypeId}`;

    MathJax.Hub.Queue(['Typeset', MathJax.Hub], () => {
        // 自动布局
        TalqsTemplate.autoLayout();
    });
};

// 切换下一道题
document.getElementById('changeQS').addEventListener('click', function() {
    // 获取作答记录
    var jsonStr = TalqsInteraction.getData(currentId);
    var info = (jsonStr ? `作答记录为：${readableJson(jsonStr)}` : '你还未作答此题') + '，确定切换到下一题？';
    if (window.confirm(info)) {
        currentIndex = currentIndex < data.length - 1 ? currentIndex + 1 : 0;
        renderQS()
    }
})

// 获取作答数据
document.getElementById('getData').addEventListener('click', function() {
    var jsonStr = TalqsInteraction.getData(currentId);
    var info = jsonStr ? readableJson(jsonStr) : '你还未作答此题'
    alert(info)
})

// 结束答题
document.getElementById('finish').addEventListener('click', function() {
    answer.innerHTML = `所有的作答记录为：<pre>${readableJson(TalqsInteraction.getData())}</pre>`;
})

// 检查答案
document.getElementById('validate').addEventListener('click', function() {
    TalqsInteraction.submit({
        id: currentId,
        data: { // 必填参数，动态修改
            "systemSign": 0, // 系统标示
            "paperId": "2e68816e062349219a77ddaf0b7a0093", // Paper ID
            "courseId": "123", // 课程 ID
            "stuId": "123", // 学生 ID
            "chapterId": "123", // 直播讲 ID 
        },
        success: function(json) {
            answer.innerHTML = `判卷返回结果如下，1 为正确✅  0 为错误❎️: 
                        <pre>${readableJson(json)}</pre>`;
        },
        error: function(err){
            console.log(err.status);
        }
    })
})

// 请求试题数据
;
(function(cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '../data.json');
    xhr.send();
    xhr.onload = function() {
        cb(JSON.parse(this.responseText).data)
    }
})(loadComplete)
