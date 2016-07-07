import breakpoint_Mixin from 'cide/mixins/debug/break-point';
import commonUtils from "cide/utils/common/commonutils";
import viewUtils from "cide/utils/viewutils";
import websocketMixin from 'cide/mixins/websocket/websocketutil_mixin';

export default Ember.Controller.extend(breakpoint_Mixin, websocketMixin, {
	
	appCtrl: Em.inject.controller('application'),
	codeEditorCtrl: Em.inject.controller('code/editor'),
	commonConfCtrl: Em.inject.controller('configuration/common_configuration'),
	winDebugCtrl: Em.inject.controller('window/debug'),
	winTerCtrl: Em.inject.controller("window/terminal"),
	variablesFoundObserver: false,
	threadViewOpen: true,
	isDebuggerPaused: false,
	tokenInfo: { tree: null, val: null },
	
	debugMenuItems: [
	                 {
	                	 name: "Variables",
	                	 id: "debug_variables",
	                	 partial: "debug/variable",
	                	 location: "north",
	                	 expand: true
	                 },
	                 {
	                	 name: "Threads",
	                	 id: "debug_threads",
	                	 partial: "debug/threads",
	                	 location: "center",
	                	 expand: false
	                 },
	                 {
	                	 name: "Breakpoints",
	                	 id: "debug_breakpoints",
	                	 partial: "debug/breakpoints",
	                	 location: "south",
	                	 expand: false
	                 }
	                 ],
	debugVariables: [],
	debugThreads: [],
	isShowDebugView: false,
	debugControllers: {filepath: '', debug: false, next: false },
	debugActionAlreadyRunning: false,
	
	loaddebugMenuItems: function() {
		var self = this;
		self.getallbreakPoints();
	},
	
	isDebugActive: function() {
		var self = this;
		return self.get('debugControllers.debug');
	},
	
	getCurrentPausedLine: function() {
		var self = this,
		getPreviousDebugMarkerSession = self.get('appCtrl').getLastDebugMarkerSession();
		if(!Ember.isNone(getPreviousDebugMarkerSession) && self.get('isDebuggerPaused')) {
			let getDebugMarkers = getPreviousDebugMarkerSession.getMarkers();
			for(let markerObj in getDebugMarkers){
				let classType = getDebugMarkers[markerObj].clazz;
				if(classType === "ace_debug_activeline"){
					let markerRow = getDebugMarkers[markerObj].range.start.row+1;
					return markerRow;
				}
			}
		}
		return -1;
	},
	
	debuggingController: function(debuggingObj){
		var self = this;
		var filepath = debuggingObj.filepath;
		var linenumber = debuggingObj.linenumber;
		var variablesObj = debuggingObj.variable;
		var debugTraceObj = debuggingObj.debugtrace;
		var nextControl = debuggingObj.next;
		var debugControl = debuggingObj.debug;
		var debugMsg = debuggingObj.message;
		if(!Em.isNone(debugMsg)) {
			commonUtils.showFormInfoMessage(debugMsg);
		}
		self.set('debugControllers.filepath', filepath);
		self.set('debugVariables', variablesObj);
		self.set('debugThreads', debugTraceObj);
		self.set('debugControllers.next', nextControl);
		self.set('debugControllers.debug', debugControl);
		if(variablesObj.length > 0) {
		    self.set('variablesFoundObserver', true);
		}
		if(filepath !==null && filepath !==undefined) {
		    if(!(commonUtils.isUserinCurrentBrowserTab())) {
		        if(!CideChatBlink.stopblink) {
        			CideChatBlink.start("Paused in debugger");
        			self.get('appCtrl').set('appObserver.collabBlinkChat', true);
        		}
		    }
		    self.set('isDebuggerPaused', true);
			self.get("appCtrl").send('openFile', filepath, { "setlineNumber": linenumber, "debug": true, "debugNext": nextControl, "debugline": linenumber});
		} else {
			self.send('clearDebugMarker');
		}
		if(debugControl) {
			self.send('show_debugView');
		}
	},
	
	initiateDebugger: function() {
		wsTerminal.send('{group: DEBUG, action: CONNECT}');
	},
	
	handleServerMsg: function(msgObj) {
	  let self = this;
	  switch(msgObj.group) {
	  	case "DEBUG":
	  		var breakpoints = JSON.parse(msgObj.breakpoint);
			  breakpoints.forEach(function(bpointObj) {
				  self.debuggingController(bpointObj);
			  });
			  self.set('debugActionAlreadyRunning', false);
	  		break;
	  	case "TOKEN_INFO":
	  		var tokenInfo = JSON.parse(msgObj.value);
	  		self.set('tokenInfo.tree', tokenInfo.variable);
	  		self.set('tokenInfo.val', tokenInfo.displayName);
	  		if(tokenInfo.variable.length > 0) {
	  			self.get('codeEditorCtrl').showTokenInfo();
	  		}
	  		break;
	  }
	},
	
	setPaneSizes: function() {
		let self = this,
		debugLayout = Em.$("#debugMainView").layout(),
		debugSouthLayout = Em.$("#debug_southPane").layout(),
		northSize = debugLayout.state.center.maxHeight,
		centerSize = debugSouthLayout.state.center.maxHeight,
		southSize = debugSouthLayout.state.south.size;
		if(northSize > 40) {
			Ember.set(self.get('debugMenuItems').findBy("id", "debug_variables"), 'expand', true);
		}
		else {
			Ember.set(self.get('debugMenuItems').findBy("id", "debug_variables"), 'expand', false);
		}
		if(centerSize > 40) {
			Ember.set(self.get('debugMenuItems').findBy("id", "debug_threads"), 'expand', true);
		}
		else {
			Ember.set(self.get('debugMenuItems').findBy("id", "debug_threads"), 'expand', false);
		}
		if(southSize < 40) {
			Ember.set(self.get('debugMenuItems').findBy("id", "debug_breakpoints"), 'expand', false);
			$("#bpoint-mainElem").hide();
		}
	},

	actions: {
		
		show_debugView: function() {
			var self = this;
			let windowViews = self.get('appCtrl').get('windowViews.pagePreference.views'),
			isViewRender = viewUtils.isViewRendered(windowViews, "debug");
			if(isViewRender) {
				return;
			}
			self.loaddebugMenuItems();
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
			sessFilename = self.get('codeEditorCtrl').getSessionFilename();
			if(self.isDebugActive()) {
				if(Ember.isNone(wsTerminal) || wsTerminal.readyState !== 1) {
					self.initializeTerminalWebSocket({action: 'DEBUG', debugAction: 'SAVE'});
				}
				else {
					wsTerminal.send('{group: DEBUG, filepath: "'+sessFilename+'", action:SAVE}');
				}
			}
		},
		
		debuggingAction: function(debugType) {
			var self = this,
				debugNext = self.get('debugControllers.next'),
				isDebugActionRunning = self.get('debugActionAlreadyRunning');
			if(isDebugActionRunning) {
				return;
			}
			if(debugType === "STOP") {
				debugNext = true;
			}
			self.send('clearDebugMarker');
			self.setProperties({
				debugVariables: [],
				debugThreads: []
			});
			if(debugNext){
				if(Ember.isNone(wsTerminal) || wsTerminal.readyState !== 1) {
					self.initializeTerminalWebSocket({action: 'DEBUG', debugAction: debugType});
				}
				else {
					wsTerminal.send('{group: DEBUG, action:'+debugType+'}');
				}
				self.set('debugActionAlreadyRunning', true);
			}
		},
		
		clearDebugMarker: function() {
			var self = this,
				getPreviousDebugMarkerSession = self.get('appCtrl').getLastDebugMarkerSession();
			self.set('isDebuggerPaused', false);
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
		},
		
		toggleLayout: function(layout) {
			let self = this;
			let debugLayout = Em.$("#debugMainView").layout(),
			debugSouthLayout = Em.$("#debug_southPane").layout();
			var northSize = debugLayout.state.center.maxHeight;
			var centerSize = debugSouthLayout.state.center.maxHeight;
			var southSize = debugSouthLayout.state.south.size;
			var debugHeight = northSize + centerSize + southSize;
			if(layout.expand) {
				if(layout.location === "north") {
						debugLayout.sizePane("south", debugHeight-25);
						debugSouthLayout.sizePane("south", southSize+northSize-25);
				}
				else if(layout.location === "center") {
					debugSouthLayout.sizePane("south", southSize + centerSize - 25);
				}
				else if(layout.location === "south") {
					$("#bpoint-mainElem").hide();
					Ember.set(self.get('debugMenuItems').findBy("id", layout.id), 'expand', !(layout.expand));
				}
			} 
			else {
				if(layout.location === "north") {
					debugLayout.sizePane("south", debugHeight - 200);
				}
				if(layout.location === "center") {
					if(southSize > northSize) {
						debugSouthLayout.sizePane("south", southSize- 200+25);
					}
					else {
						debugLayout.sizePane("south", southSize+200);
					}
					debugSouthLayout.sizePane("center", 200);
				}
				else if(layout.location === "south") {
					if(southSize < 100) {
						if(centerSize > northSize) {
							debugSouthLayout.sizePane("south", southSize+centerSize-25);
						}
						else {
							debugLayout.sizePane("south", southSize+ 200);
							debugSouthLayout.sizePane("south", southSize+centerSize-25);
						}
						debugSouthLayout.sizePane("south", 200);
					}
					Ember.set(self.get('debugMenuItems').findBy("id", layout.id), 'expand', !(layout.expand));
					$("#bpoint-mainElem").show();
				}
			}
		}
	}
});
