/*
* spa.shell.js
*Shell module for SPA
*/
spa.shell=(function () {
	//----------------Begin Module Scope Variables----------------
	//把静态配置值放在configMap变量中
	var configMap= {
		main_html:String()
			     +'<div class="spa-shell-head">'
			     	+'<div class="spa-shell-head-logo"></div>'
			     	+'<div class="spa-shell-head-acct"></div>'
			     	+'<div class="spa-shell-head-search"></div>'
			     +'</div>'
			     +'<div class="spa-shell-main">'
			     	+'<div class="spa-shell-main-nav"></div>'
			     	+'<div class="spa-shell-main-content"></div>'
			     +'</div>'
			     +'<div class="spa-shell-foot"></div>'
			     +'<div class="spa-shell-chat"></div>'
			     +'<div class="spa-shell-modal"></div>',
		//chat滑块配置项
		chat_extent_time:1000,
		chat_retract_time:300,
		chat_extend_height:450,
		chat_retract_height:15,
		chat_extended_title: 'Click to retract',
		chat_retracted_title:'Click to extend'
	},
	stateMap={
		$container:null,
		is_chat_retracted:true
	},//将在整个模板中共享的动态信息放在stateMap中
	jqueryMap={},//将jQuery集合缓存在jqueryMap中
	setJqueryMap,toggleChat,onClickChat,initModule;//声明所有模块作用域内的变量
	//------------------------End Module Scope Variables------------------------------

	//------------------------Begin Dom Methods创建和操作页面元素-------------------
	//setJqueryMap
	setJqueryMap=function () {
		var $container=stateMap.$container;
		jqueryMap={
			$container:$container,
			$chat:$container.find('.spa-shell-chat')
		};
	};
	//toggleChat--Extend or retract chat slider
	//参数：
	//        *do_extend - 如果为真，浮出slider，否则隐藏
	//        *callback - 回调函数
	//返回值： boolean
	//        *true  - 当前动画正在进行中
	//        *flase - 当前没有动画
	//状态： boolean
	//        *true - slider 处于收起状态
	//        *false - slider处于展开状态
	toggleChat = function (do_extend,callback) {
		var px_chat_ht = jqueryMap.$chat.height(),
		      is_open = px_chat_ht === configMap.chat_extend_height,
		      is_closed = px_chat_ht === configMap.chat_retract_height,
		      is_sliding = !is_open && !is_closed;
		if(is_sliding){return false;}//避免展开和收起同时进行

		if(do_extend){//展开动画
			jqueryMap.$chat.animate(
				{height:configMap.chat_extend_height},
				configMap.chat_extent_time,
				function () {
					jqueryMap.$chat.attr('title',configMap.chat_extended_title);
					stateMap.is_chat_retracted=false;
					//如果传入回调函数，则动画结束后调用
					if(callback){
						callback(jqueryMap.$chat);
					}
				}
			);
			return true;
		}
		//收起动画
		jqueryMap.$chat.animate(
				{height:configMap.chat_retract_height},
				configMap.chat_retract_time,
				function () {
					jqueryMap.$chat.attr('title',configMap.chat_retracted_title);
					stateMap.is_chat_retracted=true;
					//如果传入回调函数，则动画结束后调用
					if(callback){
						callback(jqueryMap.$chat);
					}
				}
			);
		return true;
	};
	//--------------------------End Dom Methods-------------------------------------
	
	//--------------------------Begin Event Handles------------------------------------
	//chat点击事件处理程序
	onClickChat=function (event) {
		toggleChat(stateMap.is_chat_retracted);
		return false;
	};
	//--------------------------End Event Handlse--------------------------------------
	
	//--------------------------Begin Public Methods放置公共方法区块-----------------

	initModule=function ($container) {
		stateMap.$container=$container;
		$container.html(configMap.main_html);
		setJqueryMap();
		stateMap.is_chat_retracted=true;
		jqueryMap.$chat.attr('title',configMap.chat_retracted_title)
		.click(onClickChat);
	};
	return {initModule:initModule};
	//-------------------------End Public Method-------------------------------------
})();