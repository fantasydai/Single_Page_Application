/*
* spa.shell.js
*Shell module for SPA
*/
spa.shell=(function () {
	'use strict';
	//----------------Begin Module Scope Variables----------------
	//把静态配置值放在configMap变量中
	var configMap= {
		main_html:String()
			     +'<div class="spa-shell-head">'
			     	+'<div class="spa-shell-head-logo">'
			     		+'<h1>SPA</h1>'
			     		+'<p>javascript end to end</p>'
			     	+ '</div>'
			     	+'<div class="spa-shell-head-acct"></div>'
			     	+'<div class="spa-shell-head-search"></div>'
			     +'</div>'
			     +'<div class="spa-shell-main">'
			     	+'<div class="spa-shell-main-nav"></div>'
			     	+'<div class="spa-shell-main-content"></div>'
			     +'</div>'
			     +'<div class="spa-shell-foot"></div>'
			     +'<div class="spa-shell-modal"></div>',
		//chat滑块配置项
		chat_extent_time:250,
		chat_retract_time:300,
		chat_extend_height:450,
		chat_retract_height:15,
		resize_interval : 200,//尺寸调整事件时间间隔
		chat_extended_title: 'Click to retract',
		chat_retracted_title:'Click to extend'
	},
	anchor_schema_map = {//定义给uriAnchor使用的映射，用于验证
		chat: {opened:true,closed:true}
	},
	stateMap = {//将在整个模板中共享的动态信息放在stateMap中
		$container : undefined,
		anchor_map:{},//保存当前锚的值
		resize_idto : undefined//保存尺寸调整的超时函数的ID
	},
	jqueryMap = {},//将jQuery集合缓存在jqueryMap中
	//声明所有模块作用域内的变量
	setJqueryMap,
	onClickChat,
	onResize,
	initModule,
	setChatAnchor,
	copyAnchorMap,
	changeAnchorPart,
	onTapAcct,onLogin,onLogout, //声明onTapAcct,onLogin和onLogout事件处理程序
	onHashchange;
	//------------------------End Module Scope Variables------------------------------

	//------------------------Begin Utility Methods--------------------------------------
	copyAnchorMap = function () {
		return $.extend(true,{},stateMap.anchor_map);//复制anchor_map
	};
	//------------------------End Utility Methods----------------------------------------

	//------------------------Begin Dom Methods创建和操作页面元素-------------------
	//setJqueryMap
	setJqueryMap=function () {
		var $container=stateMap.$container;
		jqueryMap={
			$container : $container,
			$acct          : $container.find('.spa-shell-head-acct'),
			$nav           : $container.find('.spa-shell-main-nav')
		};
	};
	/*
	* changeAnchorPart
	* 添加changeAnchorPart方法对锚进行更新，接收一个映射(想要更改的内容)，如{chat:"open"}
	* 参数：
	*         arg_map - 想要更改的map
	*返回：
	*         true - URI锚已被更新
	*         false - URI锚没有被更新
	*/
	changeAnchorPart = function (arg_map) {
		var anchor_map_revise = copyAnchorMap(),
		      bool_return = true,
		      key_name , key_name_dep;
		//Begin merge changes into anchor map
		for (key_name in arg_map) {
			if (arg_map.hasOwnProperty(key_name)) {
				if(key_name.indexOf('_') === 0){
					continue;
				}
				anchor_map_revise[key_name] = arg_map[key_name];
				key_name_dep = "_"+key_name;
				if(arg_map[key_name_dep]){
					anchor_map_revise[key_name_dep] = arg_map[key_name_dep];
				}
				else {
					delete anchor_map_revise[key_name_dep];
					delete anchor_map_revise['_s'+key_name_dep];
				}
			}
		}
		// Begun attempt to update URI.revert id not successful
		try {
			$.uriAnchor.setAnchor(anchor_map_revise);
		}
		catch (error) {
			//replace URI with exisiting state
			$.uriAnchor.setAnchor(stateMap.anchor_map,null,true);
			bool_return=false;
		}
		return bool_return;
	};
	//--------------------------End Dom Methods-------------------------------------

	//--------------------------Begin Event Handles------------------------------------
	//chat点击事件处理程序
	onClickChat = function (event) {
		changeAnchorPart ({
			chat: (stateMap.is_chat_retracted ? 'open':'closed')
		});
		return false;
	};

	//onResize函数
	onResize = function () {
		//当前没有尺寸调整计时器在运作时，便运行onReize函数
		if (stateMap.resize_idto) {
			return true;
		}
		spa.chat.handleResize();
		stateMap.resize_idto = setTimeout(
			function () {stateMap.resize_idto = undefined;},
			configMap.resize_interval
		);
		return true;
	};

	/*
	* onHashchange
	* 添加onHashchange事件处理程序处理URI锚变化
	*/
	onHashchange = function (event) {
		var anchor_map_previous = copyAnchorMap(),
		      is_ok= true,
		      anchor_map_proposed,
		      _s_chat_previous,
		      _s_chat_proposed,
		      s_chat_proposed;

		try {
			anchor_map_proposed = $.uriAnchor.makeAnchorMap();
		}
		catch (error) {
			$.uriAnchor.setAnchor (anchor_map_previous,null,true);
			return false;
		}
		stateMap.anchor_map = anchor_map_proposed;
		//convenience vars
		_s_chat_previous = anchor_map_previous._s_chat;
		_s_chat_proposed = anchor_map_proposed._s_chat;

		//Begin adjust chat compent if change
		if (!anchor_map_previous || _s_chat_previous !== _s_chat_proposed){
			s_chat_proposed = anchor_map_proposed.chat;
			switch (s_chat_proposed) {
				case 'opened' :
					is_ok=spa.chat.setSliderPosition('opened');
					break;
				case 'closed' :
					is_ok=spa.chat.setSliderPosition('closed');
					break;
				default :
					spa.chat.setSliderPosition('closed');
					delete anchor_map_proposed.chat;
					$.uriAnchor.setAnchor(anchor_map_proposed,null,true);
			}
		}
		//当setSliderPosition返回false时(意味着更改位置请求被拒绝)，此时做出相应反应
		//要么退回之前位置的锚值，之前不存在则使用默认值。
		if (!is_ok) {
			if (anchor_map_previous) {
				$.uriAnchor.setAnchor(anchor_map_previous,null,true);
				stateMap.anchor_map = anchor_map_previous;
			} else {
				delete anchor_map_proposed.chat;
				$uriAnchor.setAnchor(anchor_map_proposed,null,true);
			}
		}
		return false;
	};

	//添加onTapAcct方法，当点击账户元素时，如果用户名是匿名的，则提示输入用户名，
	//然后调用spa.model.people.login(<username>)方法，如果用户已经登录，则调用
	//spa.model.people.logout()方法
	onTapAcct = function (event) {
		var acct_text , user_name , user = spa.model.people.get_user();
		if(user.get_is_anon()){
			user_name = prompt('please sign-in');
			spa.model.people.login(user_name);
			jqueryMap.$acct.text('...processing...');
		} else {
			spa.model.people.logout();
		}
		return false;
	};

	//添加onLogin和onLogout事件处理程序，这会更新用户区，onLogin把文字‘please sign-in’替换为用户名，
	//用户名由login_user对象提供，该对象由spa-login事件发布。onLogout把文字恢复成'please sign-in'。
	onLogin = function (event,login_user) {
		jqueryMap.$acct.text(login_user.name);
	};

	onLogout = function (event,logout_user) {
		jqueryMap.$acct.text('Please sign-in');
	};

	//--------------------------End Event Handles--------------------------------------

	//--------------------------Begin Callbacks-----------------------------------

	//创建回调函数setChatAnchor。给chat提供请求更改URI的安全方法
	setChatAnchor = function (position_type) {
		return changeAnchorPart ({chat : position_type});
	};
	//--------------------------End Callbacks--------------------------------------
	//--------------------------Begin Public Methods放置公共方法区块-----------------
	//initModule methods
	initModule=function ($container) {
		stateMap.$container=$container;
		$container.html(configMap.main_html);
		setJqueryMap();
		//configure uriAnchor to use our schema
		$.uriAnchor.configModule({
			schema_map:configMap.anchor_schema_map
		});
		spa.chat.configModule({
			set_chat_anchor : setChatAnchor,
			chat_model : spa.model.chat,
			people_model : spa.model.people
		});
		spa.chat.initModule(jqueryMap.$container);
		$(window).bind('hashchange',onHashchange).
		bind('resize',onResize).trigger('hashchange');

		//让jquery集合container分别订阅spa-login和spa-logout事件对于的处理程序
		$.gevent.subscribe ($container,'spa-login',onLogin);
		$.gevent.subscribe ($container,'spa-logout',onLogout);

		//初始化用户区文字，绑定鼠标点击事件处理程序
		jqueryMap.$acct.text('Please sign-in').bind('utap',onTapAcct);
	};
	return {initModule:initModule};
	//-------------------------End Public Method-------------------------------------
})();