// 存储实例
import talqsStorageData from './data/data';
// 选择型
import choiceType from './question/choiceType';
// 填空型
import blankType from './question/blankType';
// 下拉选择型
import dropdownType from './question/dropdownType';
// 交互模板
import templates from './template/index';
// 模板辅助函数
import helper from './helper/index';

import { TALQS_EVENT }  from './events/index';

// 注册交互版本的组件和辅助函数
const registerInteractiveTemplate = function(TalqsTemplate) {
  // 注册交互版组件
  const components = TalqsTemplate.components;
  TalqsTemplate.updateTemplateList({
    // 覆盖内置的题干和选项模板，使之可以交互
    [components.StemsWrapper]: {
      components: [
        {
          name: components.Content,
          template: templates.questionContent
        },
        {
          name: components.Options,
          template: templates.questionOptions
        }
      ]
    },
    // 在解析中添加我的答案组件
    [components.AnalyzeWrapper]: {
      components: [
        {
          name: 'questionMyAnswer',
          template: templates.questionMyAnswer,
          index: 1,
        },
      ]
    }
  });
  // 注册 helper
  for (let key in helper) {
    TalqsTemplate.registerHelper(key, helper[key]);
  }
}

const switchInteractive = function(interactive) {
  if (interactive) {
    registerInteractiveTemplate(TalqsTemplate)
  } else {
    TalqsTemplate.resetComponent();
  }
}

const TalqsInteraction = {
  /**
   * @param {[Array/Object]} data [内置数据列表]
   * 给插件设置内置填充数据
   * data: [
   *   {
   *     queId: 'xxx',  // 试题 ID
   *     data: ["A", "B"] // 默认试题作答数据
   *   }
   * ]
   * data: {
   *   试题ID: {
   *     data: ['A']
   *   }
   * }
   */
  setData(data) {
    if (Array.isArray(data)) {
      data.forEach((item) => {
        talqsStorageData.set(item.queId, item);
      })
    } else {
      for (let key in data) {
        talqsStorageData.set(key, data[key]);
      }
    }
    document.dispatchEvent(new Event(TALQS_EVENT.CHANGE));
  },
  /**
   * 获取作答数据，可以指定 ID 获取对应的作答数据
   * @param  {[String]} id [试题ID]
   */
  getData(id) {
    return talqsStorageData.get(id);
  },

  isInteractive: true,

  toggleInteraction(value) {
    this.isInteractive = value !== undefined ? value : !this.isInteractive
    switchInteractive(this.isInteractive);
  },

  init() {
    this.toggleInteraction(this.isInteractive);
  },

  /**
   * 插件交互数据变更通知回调
   */
  onChange: null,

  /**
   * 默认接口配置
   */
  defaultConfig: {
    url: 'http://paperrestfz.aibeike.com/paperrest/rest/question/verifyAnswer.json',
    dataType: "jsonp",
  },

  VALIDATE_ERR: 1000,

  /**
   * 验证试题答案
   * @param  {[Object]} config [提交配置]
   * @return {[type]}        [description]
   */
  submit(data){
    const configData = data || {}
    if (configData.answer) {
      const success = configData.success;
      const error = configData.error;
      const isFn = fn => typeof fn === 'function';
      // 回调对象封装
      const callBack = {
        success(result) {
          if (result.success) {
            isFn(success) && success(result.data);
          } else { // 后台报错则返回此对象，暂时定义 status 为 1000
            isFn(error) && error({message: result.message, status: this.VALIDATE_ERR });
          }
        },
        error(err) {
          isFn(error) && error(err);
        }
      }
      // ajax 对象封装，数据，回调
      const wrapper = Object.assign(this.defaultConfig, data, callBack);
      if (wrapper.data) { 
        // 作答数据添加
        wrapper.data.content = JSON.stringify(configData.answer);
        $.ajax(wrapper)
      }
    }
  },
}

TalqsInteraction.init();

// 监听输入事件
document.addEventListener(TALQS_EVENT.INPUT, function(evt){
  const listener = TalqsInteraction.onChange;
  listener && listener.call(this, evt);
})

export default TalqsInteraction;

