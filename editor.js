import breakpoint_Mixin from 'cide/mixins/debug/break-point';
import commonUtils from "cide/utils/common/commonutils";

export default Ember.Controller.extend(breakpoint_Mixin, {
	
	sessFilename = self.get('codeEditorCtrl').getSessionFilename(),
	isshowDebugView = self.get('isShowDebugView'),
	isCurrConfigId = self.get('debugControllers.configId'),
	isJavaBox = (self.get('currentUser.currentBox.type') === "java" || self.get('currentUser.currentBox.type') === "zohobox") ? true : false,
	isJavaFile = (commonUtils.getFileExtension(sessFilename) === "java") ? true : false;
	
	
	debugMenuItems: {
						left: [
								Ember.Object.create({
									item: 'Threads',
									id: 'debugThreads',
									active: true
								  })
						      ],
						 center: [
			                   		Ember.Object.create({
			                   			item: 'Variables',
			                   			id: 'debugVariable',
			                   			active: true
			                   		}),
			                   		Ember.Object.create({
			                   			item: 'Breakpoints',
			                   			id: 'debugBreakpoint',
			                   			active: false
			                   		})
			                   	]
						},
	debugVariables: [],
	debugThreads: [],
	isShowDebugView: false,
	basic: { configId: '', name: ''}, // for debugging from debug view
	debugControllers: { configId: '', filepath: '', debug: false, next: false },
	debugActionAlreadyRunning: false,
	debugCenterType: 'debug/variable',
	debugLeftType: 'debug/threads',
	
	loaddebugMenuItems: function() {
		var self = this;
		self.getallbreakPoints();
	}.on('init'),
	
	debuggingController: function(debuggingObj){
		var self = this;
		var configId = parseInt(debuggingObj.get('id'));
		var filepath = debuggingObj.get('filepath');
		var linenumber = debuggingObj.get('linenumber');
		var variablesObj = debuggingObj.get('variable');
		var debugTraceObj = debuggingObj.get('debugtrace');
		var nextControl = debuggingObj.get('next');
		var debugControl = debuggingObj.get('debug');
		self.set('debugControllers.configId', configId);
		self.set('debugControllers.filepath', filepath);
		self.set('debugVariables', variablesObj);
		self.set('debugThreads', debugTraceObj);
		self.set('debugControllers.next', nextControl);
		self.set('debugControllers.debug', debugControl);
		if(filepath !==null && filepath !==undefined) {
			self.get("appCtrl").send('openFile', filepath, { "setlineNumber": linenumber, "debug": true, "debugNext": nextControl, "debugline": linenumber});
		} else {
			self.send('clearDebugMarker');
		}
		self.send('show_debugView');
	},

	actions: {
		
		show_debugView: function() {
			var self = this;
			self.get('appCtrl').send('hideOutletLayoutView', 'explorer');
			self.set('isShowDebugView', true);
			self.get('appCtrl').showLayoutView({
				viewName: 'debug', template: 'window/debug', into: 'application', controller: self
			});
		},
		
		hide_debugView: function() {
			var self = this;
			self.get('appCtrl').send('hideOutletLayoutView', 'debug');
		},
		
		debuggingonSave: function() {
			var self = this,
				sessFilename = self.get('codeEditorCtrl').getSessionFilename(),
				isshowDebugView = self.get('isShowDebugView'),
				isCurrConfigId = self.get('debugControllers.configId'),
				isJavaBox = (self.get('currentUser.currentBox.type') === "java" || self.get('currentUser.currentBox.type') === "zohobox") ? true : false,
				isJavaFile = (commonUtils.getFileExtension(sessFilename) === "java") ? true : false;
			if(isJavaBox && isJavaFile) {
				if(isshowDebugView && !Em.isNone(isCurrConfigId) && !Em.isEmpty(isCurrConfigId)) {
					var debugonSave_detailsReq = self.store.query("configuration/debugaction", { filepath: sessFilename, configId: isCurrConfigId, debugtype: "debugSave"});
					debugonSave_detailsReq.then((debugonSave_detailsRes) => {
						debugonSave_detailsRes.filter((item) => {
							self.debuggingController(item);
						});
					});
				}
			}
		},
		
		debuggingAction: function(debugType) {
			var self = this,
				configId = self.get('debugControllers.configId'),
				debugNext = self.get('debugControllers.next'),
				isDebugActionRunning = self.get('debugActionAlreadyRunning');
			if(isDebugActionRunning && debugType !== "debugStop") {
				return;
			}
			if(debugType === "debugStop") {
				debugNext = true;
			}
			self.send('clearDebugMarker');
			self.setProperties({
				debugVariables: [],
				debugThreads: []
			});
			if(debugNext){
				self.set('debugActionAlreadyRunning', true);
				var debugNext_detailsReq = self.store.query("configuration/debugaction", { configId: configId, debugtype: debugType});
				debugNext_detailsReq.then((debugNext_detailsRes) => {
					debugNext_detailsRes.filter((item) => {
						self.debuggingController(item);
						self.set('debugActionAlreadyRunning', false);
					});
				});
			}
		},
		
		clearDebugMarker: function() {
			var self = this,
				getPreviousDebugMarkerSession = self.get('appCtrl').getLastDebugMarkerSession();
			if(!Ember.isNone(getPreviousDebugMarkerSession)) {
				self.get('codeEditorCtrl').clearDebugMarker(getPreviousDebugMarkerSession);
			}
		},
		
		debugAction: function(debugItemObj, debugAlignType) {
			var self = this;
			var debugactionType = debugItemObj.item;
			var debugMenuItems = self.get('debugMenuItems'),
				debugObjType = "";
			if(debugAlignType === "left") { debugObjType = debugMenuItems.left; }
			if(debugAlignType === "center") { debugObjType = debugMenuItems.center; }
			if(debugAlignType === "right") { debugObjType = debugMenuItems.right; }
			debugObjType.setEach('active', false);
			var activedebugMenuItem = debugObjType.objectAt(debugObjType.indexOf(debugItemObj));
			activedebugMenuItem.set('active', true);
			$(".debugHeadIcons").css('display', 'none');
			switch(debugactionType){
				case "Variables":
					self.set('debugCenterType', 'debug/variable');
					$('#variableViewIcons').css('display', 'block');
					break;
				case "Breakpoints":
					self.set('debugCenterType', 'debug/breakpoints');
					$('#bpointViewIcons').css('display', 'block');
					break;
				case "Threads":
					self.set('debugLeftType', 'debug/threads');
					$('#variableViewIcons').css('display', 'block');
					break;
			}
		},
		
		debugviewClose: function(){
			var self = this;
			self.set('isShowDebugView', false);
			self.get('appCtrl').removeLayoutView('debug');
		},
		
		setdebugActionType: function(debugActionType) {
			var self = this;
			self.set('debugActionType', debugActionType);
		},
		
		runConfiguration: function() {
			var self = this;
			self.get('commonConfCtrl').runConfigModel({
				controller: self,
				configModelName: 'configuration/run'
			});
		},
		
		debugConfiguration: function() {
			var self = this;
			self.set('debugControllers.debug', true);
			self.get('commonConfCtrl').debugConfigModel({
				controller: self,
				configModelName: 'configuration/debug'
			});
		},
		
		gotoFile: function(filepath, lineNumber){
			var self = this;
			self.get("appCtrl").send('openFile', filepath, { "setlineNumber": lineNumber });
		}
		
	}
});
