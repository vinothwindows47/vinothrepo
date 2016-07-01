/**
 * @description All code editor and tabs operation will handle in this file
 */
import commonUtils from 'cide/utils/common/commonutils';
import langUtils from 'cide/utils/langutils';
import editorUtils from 'cide/utils/editorutils';
import layoutUtils from 'cide/utils/layoututils';
import editorneedCtrlMixin from 'cide/mixins/editor/editorneedCtrl_mixin';
import editortabsMixin from 'cide/mixins/editor/editortabs_mixin';
import editorutilOpMixin from 'cide/mixins/editor/editorutiloperation_mixin';
import editorsaveResourceMixin from 'cide/mixins/editor/editorsaveResource_mixin';
import collaborateeditorMixin from 'cide/mixins/editor/collaborate_mixin';
import websocketMixin from 'cide/mixins/websocket/websocketutil_mixin';
import editorAddonMixin from 'cide/mixins/editor/editorAddon_mixin';
import codecompleteMixin from 'cide/mixins/editor/codecomplete_mixin';

export default Em.Controller.extend(editorAddonMixin, editorneedCtrlMixin, editortabsMixin, editorutilOpMixin, editorsaveResourceMixin, collaborateeditorMixin, websocketMixin, codecompleteMixin, {
	
	editor: { editorOption: false, lineNumber:null, debug:false, debugNext: false, debugline:null, selectRange:null },
	editorUtil: {
					"clipboardText": ''
				},
				
	setLangModes: function() {
		let self = this,
		getEditorLangModes = editorUtils.getEditorModes(),
		shwLangModeChgObj = [], lModeFirstObj = [],
		lModeObj;
		getEditorLangModes.forEach(function(langMode, index){
			lModeObj = {};
			lModeObj["lModeName"] = langMode.alias;
			if(index === 0) { lModeFirstObj.pushObject(lModeObj); }
			shwLangModeChgObj.pushObject(lModeObj);
		});
		self.get('appCtrl').set('lModes', shwLangModeChgObj);
	}.on('init'),
				
	//Get current file name of current editor
	getSessionFilename: function() {
		let currentEditor = this.get('appCtrl').getcurrentEditor();
		return this.get('appCtrl').getcurrentFilename(currentEditor);
	},
	
	//Get opened file tabs position for overflow file check handler
	getOpenedFileTabPosition: function(filename) {
		let self = this, 
			getOpenedFileTabPosMap = {}, 
			fileId,
			getSupportedEditor = self.get('appCtrl').totalSupportedEditor();
		
		getSupportedEditor.forEach(function(editorName){
			let geteditorTabs = self.get('appCtrl').getcurrentEditortabs(editorName);
			if(geteditorTabs.indexOf(filename) >= 0) {
				getOpenedFileTabPosMap["editorName"] = editorName;
				fileId = commonUtils.generateFileId(filename);
				if(editorUtils.tabOverflowChk(editorName, fileId) === "overflow") {
					self.get('appCtrl').moveEditortabs(editorName, filename, geteditorTabs.length-1);
					getOpenedFileTabPosMap["tabPosition"] = geteditorTabs.indexOf(filename);
					self.reRenderTabPanel(editorName, geteditorTabs);
				}
				else {
					getOpenedFileTabPosMap["tabPosition"] = geteditorTabs.indexOf(filename);
				}
			}
		});
		return getOpenedFileTabPosMap;
	},
	
	/** Update opened file tabs content **/
	updateOpenedFileTabs: function(projectname) {
		let self = this, 
			geteditorTabs, 
			getcurrFileName,
			getSupportedEditor = self.get('appCtrl').totalSupportedEditor();
		
		getSupportedEditor.forEach(function(editorName){
			geteditorTabs = self.get('appCtrl').getcurrentEditortabs(editorName);
			getcurrFileName = self.get('appCtrl').getcurrentFilename(editorName);
			geteditorTabs.forEach(function(filename){
				if(commonUtils.getFirstSlashvalue(filename) === projectname) {
					if(filename === getcurrFileName) {
						self.updateFileContent(editorName, filename);
					} else {
						self.get('appCtrl').setfileupdatestate(filename, true);
					}
				}
			});
		});
	},

	/**
	 * This method is for get editor layout adjustable width and height based on resolution .
	 * This method will call also inside ace.js file.Whenever editor layout adjusts, this method will call.
	 */
	geteditorLayoutPosition: function(editorName) {
		let editorLayoutWidth = Em.$("#" + editorName).width(),
			editorLayoutHeight = Em.$("#" + editorName).height(),
			olPosObj = { width: editorLayoutWidth, height: editorLayoutHeight};
		return olPosObj;
	},
	
	// set editor current row and column number in bottom of the editor bar
	setEditorRowColumnNumber: function(rowNumber, columnNumber) {
		let self = this;
		self.get('appCtrl').set('appObserver.rowNumber', rowNumber);
		self.get('appCtrl').set('appObserver.columnNumber', columnNumber);
	},
	
	/**
	 * Update detail bar 
	 */
	update_editorAppObserver: function(thisEditor) {
		let self = this;
		self.get('appCtrl').setcurrentEditor(thisEditor);
		self.get('appCtrl').send('currentFocusLayout', 'editor');
		self.get('appCtrl').detailBarChanged('editor');
		let currentFileName = self.getSessionFilename();
		if(!Em.isEmpty(currentFileName)) {
			let filesessionObj =  self.get('appCtrl').getfilesessionObj(currentFileName),
				currentFileEditorObj = self.get('appCtrl').getcurrentEditorObj(thisEditor),
				cursorPos = currentFileEditorObj.getCursorPosition();
			self.get('appCtrl').setProperties({
				'appObserver.currentFilePath': currentFileName,
				'appObserver.rowNumber': cursorPos.row + 1,
				'appObserver.columnNumber': cursorPos.column + 1,
				'appObserver.langMode': editorUtils.getEditorModeObjFilter('acemode', commonUtils.getMode(filesessionObj.editorsession.$modeId)).alias
			});
		} else {
			self.get('appCtrl').detailBarChanged('explorer');
		}
	},

	/**
	 * Check editor selection already in clipboard or not.If true, this content will be pasted.
	 */
	checkEditorSelection: function() {
		let self = this,
			currentEditor = self.get('appCtrl').getcurrentEditor(),
			editorObjval = self.get('appCtrl').getcurrentEditorObj(currentEditor),
			chkSelection = (editorObjval.getCopyText() === "") ? false: true;
		return chkSelection;
	},
	
	/*Open file with file name only*/
	openFile: function(filename, options) {
		let self = this,
			currentEditor = self.get('appCtrl').getcurrentEditor();
		self.openFile_editor(currentEditor, filename, options);
	},

	// This method is starting point of the file open in editor
	openFile_editor: function(currentEditor, filename, options) {
		let self = this;
		if(Em.isNone(wsTerminal)) {
			self.initializeTerminalWebSocket();
		}
		/*check filename already loaded or not*/
		let filesessionObj =  self.get('appCtrl').getfilesessionObj(filename);
		if(!Em.isNone(options)){
			if(!Em.isNone(options.setlineNumber)){
				self.set("editor.lineNumber",options.setlineNumber);
			}
			if(!Em.isNone(options.debug)){
				self.setProperties({
					"editor.debug": options.debug,
					"editor.debugNext": options.debugNext,
					"editor.debugline": options.debugline
				});
			}
		}
		self.set("editor.editorOption", false);
		if(Em.isEmpty(filesessionObj)) {
			self.setFile_Editor(currentEditor, filename);
		}
		else {
			let fileupdState = self.get('appCtrl').getfileupdatestate(filename),
				getOpenedTabPos = self.getOpenedFileTabPosition(filename);
			if(fileupdState) {
				self.updateFileContent(getOpenedTabPos.editorName, filename);
			} else {
				self.setEditorSession(getOpenedTabPos.editorName, filename, true);
				self.showTabpanel(getOpenedTabPos.editorName, filename);
			}
		}
	},
	
	// This method handle gotoLine with linenumber scrollto in center visible
	gotoLine: function(editorObj, lineNumber) {
		editorObj.gotoLine(lineNumber);
		editorObj.scrollToLine(lineNumber, true, true);
	},
	
	//This method is for refresh file content in editor
	refreshFile_editor: function(currentEditor, filename, linenumber) {
		let self = this,
			filesessionObj =  self.get('appCtrl').getfilesessionObj(filename);
		if(Em.isEmpty(filesessionObj)) {
			self.openFile_editor(currentEditor, filename);
		}
		else {
			let getfileContent = self.store.queryRecord('files/filecontent', {filepath: filename});
			getfileContent.then((getfilecontentRes) => {   /* Get file content response from server */
				if(getfilecontentRes.get('exists')) {
					let editorObjval = self.get('appCtrl').getcurrentEditorObj(currentEditor);
					self.removeFullFileContentRange(filename);
					self.insertFullFileContentRange(filename, getfilecontentRes.get('content'));
					editorObjval.focus();
					self.gotoLine(editorObjval, linenumber);
				}
				else {
					self.deleteEditorSession(currentEditor, filename);
				}
			}, function(){

			});
		}
	},

	// This method for get file content for a file from server call method.
	setFile_Editor: function(currentEditor, filename) {
		let self = this;
		self.getFileContent(currentEditor, filename);
	},

	// This method for get file content value from the server .
	getFileContent: function(currentEditor, filename) {
		if(Em.isEmpty(filename)) {
			return;
		}
		let self = this,
			getfileContent = self.store.queryRecord('files/filecontent', {filepath: filename});
		getfileContent.then((getfilecontentRes) => {   /* Get file content response from server */
			if(getfilecontentRes.get('exists')) {
				self.addEditorSession(currentEditor, getfilecontentRes, filename);
			}
			else {
				if(self.get('appCtrl').isEditortabPresent(filename)) {
					self.deleteEditorSession(currentEditor, filename);
				}
			}
		}, function(){

		});
	},
	
	//Remove file content from specific range in editor
	removeFileContentRange: function(filename, range) {
		let self = this, fileSession = self.get('appCtrl').getcurrentEditorSessionValue(filename);
		fileSession.remove(range);
	},
	
	//Insert file content from specific range in editor
	insertFileContentRange: function(filename, filecontent, range) {
		let self = this, fileSession = self.get('appCtrl').getcurrentEditorSessionValue(filename);
		fileSession.insert(range, filecontent);
	},
	
	//Remove full file content from ace session
	removeFullFileContentRange: function(filename) {
		let self = this, fileSession = self.get('appCtrl').getcurrentEditorSessionValue(filename),
			filesessRowLen = fileSession.getLength() - 1,
			filesessLastRowRange = fileSession.getLine(filesessRowLen).length;
		fileSession.remove({ start: { row: 0, column: 0 }, end: { row: filesessRowLen, column: filesessLastRowRange}});
	},
	
	//Insert full file content from ace session
	insertFullFileContentRange: function(filename, filecontent) {
		let self = this, fileSession = self.get('appCtrl').getcurrentEditorSessionValue(filename);
		fileSession.insert({ row: 0, column: 0 }, filecontent);
	},
	
	// This method for get update file content value from the server.
	updateFileContent: function(currentEditor, filename) {
		let self = this,
			getfileContent = self.store.query('files/filecontent', {filepath: filename});
		getfileContent.then((getfilecontentResponse) => {   /* Get file content response from server */
			getfilecontentResponse.filter((item) => {
				if(item.get('exists')) {
					let getfileLastModified = self.get('appCtrl').getfilelastModified(filename),
						filesavedState = self.get('appCtrl').getfilesavedstate(filename),
						fileContent = item.get('content'),
						filelastMod = item.get('last_modified');
					if(!filesavedState) {
						new BootstrapDialog({
				            title: 'Update Resource',
				            message: '"' + commonUtils.getLastSlashvalue(filename) +  '" has been modified.Do you want to overwrite this changes?',
				            closable: true,
				            draggable: true,
				            buttons: [
				                      {
				                    	  label: 'Cancel',
				                    	  cssClass: 'btn-sm btn-cancel',
				                    	  action: function(dialog) {
				                    		  self.get('appCtrl').setfileupdatestate(filename, false);
				                    		  self.setEditorSession(currentEditor, filename, true);
				              				  self.showTabpanel(currentEditor, filename);
				                    		  dialog.close();
				                    	  }
				                      },
				                      {
				                    	  label: 'Update',
				                    	  cssClass: 'btn-sm btn-create',
				                    	  action: function(dialog) {
				                    		  self.updateFileAfterSuccess(currentEditor, filename, fileContent, filelastMod);
				                    		  dialog.close();
				                    	  }
				                      }
				                    ]
				        }).open();
					} else {
						if(getfileLastModified !== item.get('last_modified')) {
							self.updateFileAfterSuccess(currentEditor, filename, fileContent, filelastMod);
						} else {
							self.get('appCtrl').setfileupdatestate(filename, false);
							self.setEditorSession(currentEditor, filename, true);
            				self.showTabpanel(currentEditor, filename);
						}
					}
				}
				else {
					if(self.get('appCtrl').isEditortabPresent(filename)) {
						self.deleteEditorSession(currentEditor, filename);
					}
				}
			});
		}, function(){

		});
	},
	
	// This method handling after file updating handler.
	updateFileAfterSuccess: function(currentEditor, filename, filecontent, lastModified) {
		let self = this;
		self.removeFullFileContentRange(filename);
		self.insertFullFileContentRange(filename, filecontent);
		self.get('appCtrl').setfileupdatestate(filename, false);
		self.get('appCtrl').setfilelastModified(filename, lastModified);
		self.saveeditor_tabTitle(filename);
		self.setEditorSession(currentEditor, filename, false);
	},

	/**
	 * @description This method for save file content in the opened file in editor.
	 * @paramter filename [STRING]
	 */
	saveFileContent: function(currentEditor, filename) {
		let self = this,
			checkfilesavedstate = self.get('appCtrl').getfilesavedstate(filename);
		if(checkfilesavedstate) {
			return;
		}
		self.saveFileResources({
			"currentEditor": currentEditor,
			"saveFileList": [filename]
		});
	},

	/**
	 * @description This method for after opened file in editor add new editor session obj maintained in browser [ AS A DICT OBJ ] for avoiding whenever tab change request from server.
	 * @paramter itemObj [ Premise file obj ] , filename [STRING]
	 */
	addEditorSession: function(currentEditor, itemObj, filename) {
		let self = this,
			editorObjval = self.get('appCtrl').getcurrentEditorObj(currentEditor),
			editorMode = editorUtils.getEditorMode(commonUtils.getLastSlashvalue(filename)), /* get editor Mode */
			newSession = new window.ace.EditSession(itemObj.get('content'), {  /* Create ace new edit session */
				"path" : "ace/mode/" + editorMode
			}),
			fileSession = {
								filetype: "ace", editorsession: newSession, savedstate: true, update: false, last_modified: itemObj.get('last_modified')
						  };
		self.get('appCtrl').setcurrentEditorSessionObj(filename, fileSession);
		self.addTabPanel(currentEditor, filename);  /* Add new tab panel */
		self.setEditorSession(currentEditor, filename, false);
		let UndoManager = ace.require("ace/undomanager").UndoManager;
		editorObjval.getSession().setUndoManager(new UndoManager());
		self.get('appCtrl').addEditortabs(currentEditor, filename);
	},
	
	/**
	 * @description This method for deleteeditorsession after file close actions.
	 * @paramter filename [STRING].
	 */
	deleteEditorSession: function(currentEditor, filename) {
		let self = this,
			checkfilesavedstate = self.get('appCtrl').getfilesavedstate(filename);
		if(!checkfilesavedstate){
			new BootstrapDialog({
	            title: 'Save Resource',
	            message: '"' + commonUtils.getLastSlashvalue(filename) +  '" has been modified.Save changes?',
	            closable: true,
	            draggable: true,
	            buttons: [
	                      {
	                    	  label: 'Cancel',
	                    	  cssClass: 'btn-sm btn-cancel',
	                    	  action: function(dialog) {
	                    		  dialog.close();
	                    	  }
	                      },
	                      {
	                    	  label: 'Close',
	                    	  cssClass: 'btn-sm btn-delete',
	                    	  action: function(dialog) {
	                    		  self.deleteEditorSessionAction(currentEditor, filename);
	                    		  dialog.close();
	                    	  }
	                      },
	                      {
	                    	  label: 'Save And Close',
	                    	  cssClass: 'btn-sm btn-create',
	                    	  action: function(dialog) {
	                    		  self.saveFileResources({
	                    			  "currentEditor": currentEditor,
	                    			  "saveFileList": [filename],
	                    			  "closeTabs": true,
	                    			  "isDialogClose": dialog
	                    		  });
	                    	  }
	                      }
	                    ]
	        }).open();
		} else {
			self.deleteEditorSessionAction(currentEditor, filename);
		}
	},
	
	/**
	 *  Delete editor session action.
	 */
	deleteEditorSessionAction: function(currentEditor, filename){
		let self = this,
			filenameObj = Em.makeArray(filename);
		filenameObj.forEach(function(filename){
			self.get('appCtrl').deletecurrentEditorSessionObj(filename);
	    	self.get('appCtrl').deleteEditortabs(currentEditor, filename);
	    	self.deleteTab(currentEditor + "_tabs", commonUtils.generateFileId(filename));
		});
	},
	
	/**
	 * @description This method will call every time file opened in editor set file content in editor sesssion.
	 * @paramter filename [STRING]
	 */
	setEditorSession: function(currentEditor, filename, isloaded) {
		let self = this;
		self.setEditorSessionPage(currentEditor);
		let editorObjval = self.get('appCtrl').getcurrentEditorObj(currentEditor),
			getSessionValue = self.get('appCtrl').getcurrentEditorSessionValue(filename);
		let lineNumber=self.get('editor.lineNumber');
		if(!Em.isEmpty(lineNumber)) {
			self.gotoLine(editorObjval, lineNumber);
		}
		self.set("editor.lineNumber",null);
		self.showTabpanel(currentEditor, filename);
		self.get('appCtrl').setcurrentFilename(currentEditor, filename);
		self.get('appCtrl').setcurrentEditor(currentEditor);
		editorObjval.setSession(getSessionValue);
		editorObjval.focus();
		if(!isloaded) {
			self.addMarker(currentEditor, filename);
			self.addBreakPoints(currentEditor, filename);
			let getOpenedTabPos = self.getOpenedFileTabPosition(filename);
			self.showTabpanel(getOpenedTabPos.editorName, filename);
		}
		self.get('appCtrl').send('currentFocusLayout', 'editor');
		self.editorShortcuts(editorObjval, filename);
		self.update_editorAppObserver(currentEditor);
		let selectRange=self.get('editor.selectRange');
		if(!Em.isEmpty(selectRange)){
			self.gotoLine(editorObjval, selectRange.start.row);
			editorObjval.selection.setRange(selectRange);
		}
		self.set("editor.selectRange",null);
		let debugMode = self.get('editor.debug');
		var debugline = self.get('editor.debugline'),
			getPreviousDebugMarkerSession = self.get('appCtrl').getLastDebugMarkerSession();
		if(debugMode) {
			let debugNext = self.get('editor.debugNext');
			if(!debugNext) {
				if(!Em.isNone(getPreviousDebugMarkerSession)) {
					self.clearDebugMarker(getPreviousDebugMarkerSession);
				}
			} else {
				if(!Em.isNone(debugline)){
					debugline = debugline - 1;
					let Range = ace.require('ace/range').Range,	
						debuglineLen = editorObjval.session.getLine(debugline).length;
					
					if(!Em.isNone(getPreviousDebugMarkerSession)) {
						self.clearDebugMarker(getPreviousDebugMarkerSession);
					}
					editorObjval.session.addMarker(new Range(debugline, 0, debugline, debuglineLen), "ace_debug_activeline", "text");
					self.get('appCtrl').setLastDebugMarkerSession(editorObjval.session);
					self.gotoLine(editorObjval, debugline);
				}
			}
		}
		self.setProperties({
								'editor.debug': false,
								'editor.debugline': null
						  });
		self.setFormatterSettings(editorObjval);
		if(self.get('outlineCtrl').get('outlinePanelVisible')) {
			self.get('outlineCtrl').send("changeOutlineFile");
		}
	},

	//Set editor empty page shows handler
	setEditorSessionEmptyPage: function(currentEditor) {
		let self = this;
		$("#" + currentEditor).css("display", "none");
		$("." + currentEditor + ".editor_empty_message").css("display", "block");
		self.get('appCtrl').set('appObserver.currentFilePath', '');
		self.get('appCtrl').detailBarChanged('explorer');
		self.get('appCtrl').setcurrentFilename(currentEditor, null);
	},

	setEditorSessionPage: function(currentEditor) {
		$("#" + currentEditor).css("display", "block");
		$("." + currentEditor + ".editor_empty_message").css("display", "none");
	},
	/**
	 * @description This method will call project explorer layout toggle action.
	 */
	expandEditor: function() {
		layoutUtils.projExpNormaltoggle();
	},

	reRenderTabPanel: function(currentEditor, filename) {
		$("#" + currentEditor + "_tabs").html('');
		this.addTabPanel(currentEditor, filename);
	},

	//This method will call after file open show tabs in top of the editor.
	addTabPanel: function(currentEditor, filename) {
		let self = this,
			filenameObj = Em.makeArray(filename);
		filenameObj.forEach(function(filename){
			self.addTab(currentEditor + "_tabs", {id: commonUtils.generateFileId(filename),
				filename: filename,
			    title: filename,
			    text: commonUtils.getLastSlashvalue(filename),
			    closable: true,
			    disabled:false,
			    iconClass: "icon_"+commonUtils.getFileModeIcon(commonUtils.getFileExtension(filename))
			 });
		});
		return true;
	},

	/**
	 * @description This method will call show error marker in language specific editor.
	 */
	addMarker: function(currentEditor, filename) {
		let self = this,
			editorObjval = self.get('appCtrl').getcurrentEditorObj(currentEditor);
		self.get("addMarkerCtrl").setAddMarker(editorObjval, filename);
	},
	
	// Clear debug marker handler
	clearDebugMarker: function(editorSession) {
		let getDebugMarkers = editorSession.getMarkers();
		for(let markerObj in getDebugMarkers){
			let classType = getDebugMarkers[markerObj].clazz;
			if(classType === "ace_debug_activeline"){
				let markerId = getDebugMarkers[markerObj].id;
				editorSession.removeMarker(markerId);
			}
		}
		
	},
	
	/**
	 * Add and clear breakpoints handler
	 */
	addBreakPoints: function(currentEditor, filename) {
		let self = this,
			editorObjval = self.get('appCtrl').getcurrentEditorObj(currentEditor);
		self.get("breakpointCtrl").getBreakPoints(editorObjval, filename);
	},
	clearBreakPoints: function(breakpointObj){
		let self = this,
			filepath, lineNumber;
		breakpointObj.forEach(function(bpointItems){
			filepath = bpointItems.filepath;
			lineNumber = bpointItems.lineNumber;
			if(!Em.isNone(filepath) && !Em.isNone(lineNumber)){
				let filesessionObj =  self.get('appCtrl').getfilesessionObj(filepath);
				if(!Em.isEmpty(filesessionObj)){
					filesessionObj.editorsession.clearBreakpoint(lineNumber - 1);
				}
			}
		});
	},
	
	/**
	 * Whenver file handler such as delete, cut, copy, paste, rename.That actions will be reflected in opened tabs also.
	 */
	handleTabs: function(newFileName, oldFileName, isFolder, handleTabType) {
		let self = this,
			getSupportedEditor = self.get('appCtrl').totalSupportedEditor();
		getSupportedEditor.forEach(function(editorName){
			let editorTabs = self.get('appCtrl').getcurrentEditortabs(editorName),
				handletype;
			if(isFolder) {
				let oldfolderName = oldFileName + "/",
					newfolderName = newFileName + "/",
					oldfileName, newfileName;
				for(var mt=0; mt < editorTabs.length; mt++) {
					oldfileName = editorTabs[mt];
					newfileName = oldfileName.replace(oldfolderName, newfolderName);
					if(oldfileName.substr(0, oldfolderName.length) === oldfolderName) {
						handletype = (handleTabType === "delete") ? self.deleteTabsHandler(editorName, newfileName) : self.renameTabsHandler(editorName, newfileName, oldfileName);
					}
				}
			}
			else {
				handletype = (handleTabType === "delete") ?  self.deleteTabsHandler(editorName, oldFileName) : self.renameTabsHandler(editorName, newFileName, oldFileName);
			}
		});
	},
	/**
	 * This method will be called on delete tab handler.
	 */
	deleteTabsHandler: function(editorName, fileName) {
		let self = this;
		if(self.get('appCtrl').isSpecificEditortabPresent(editorName, fileName)) {
			self.deleteEditorSession(editorName, fileName);
		}
	},
	
	/**
	 * This method will call delete editor multiple tabs handler
	 */
	deleteMultipleTabsHandler: function(editorName, fileObj) {
		let self = this;
		fileObj.forEach(function(fileName){
			if(self.get('appCtrl').isSpecificEditortabPresent(editorName, fileName)) {
				self.deleteEditorSession(editorName, fileName);
			}
		});
	},
	
	deleteMultipleTabsByNameHandler: function(fileObj) {
		let self = this,
			thisEditor;
		fileObj.forEach(function(fileName){
			thisEditor = self.get('appCtrl').getEditorbyFileName(fileName);
			if(self.get('appCtrl').isSpecificEditortabPresent(thisEditor, fileName)) {
				self.deleteEditorSession(thisEditor, fileName);
			}
		});
	},
	
	/**
	 * This method will call delete all editor all tabs 
	 */
	deleteAllEditorTabsHandler: function() {
		let self = this,
			getSupportedEditor = self.get('appCtrl').totalSupportedEditor(),
			thisEditorTabs;
		getSupportedEditor.forEach(function(editorName){
			thisEditorTabs = self.get('appCtrl').getcurrentEditortabs(editorName);
			self.deleteMultipleTabsHandler(editorName, thisEditorTabs);
		});
	},
	
	/**
	 * This method will be called on rename tab handler.
	 */
	renameTabsHandler: function(editorName, newfileName, oldfileName) {
		let self = this;
		if(self.get('appCtrl').isSpecificEditortabPresent(editorName, oldfileName)) {
			let filesessionObj =  self.get('appCtrl').getfilesessionObj(oldfileName),
				oldfileId = commonUtils.generateFileId(oldfileName),
				newfileId = commonUtils.generateFileId(newfileName);
			self.get('appCtrl').setcurrentEditorSessionObj(newfileName, filesessionObj);
			self.get('appCtrl').deletecurrentEditorSessionObj(oldfileName);
			self.renameTab(oldfileId, newfileId, newfileName);
			self.get('appCtrl').renameEditortabs(editorName, oldfileName, newfileName);
			self.get('appCtrl').renamecurrentFilename(editorName, oldfileName, newfileName);
		}
	},
	/**
	 * This method will call show particular tab while onclick open file.
	 * @PARAMs - position of the tabs[INTEGER]
	 */
	showTabpanel: function(currentEditor, filename) {
		let self = this;
		self.showTab(currentEditor + "_tabs", commonUtils.generateFileId(filename));
	},
	/**
	 * Editor tab show title handler with image based on extension.
	 */
	editor_tabTitle: function(tabtitleType) {
		let self = this,
			currentEditor = self.get('appCtrl').getcurrentEditor(),
			filename = self.get('appCtrl').getcurrentFilename(currentEditor),
			fileId = commonUtils.generateFileId(filename);
		if(tabtitleType === "change") {
			let checkfilesavedstate = self.get('appCtrl').getfilesavedstate(filename);
			if(checkfilesavedstate) {
				self.setTabTitle(fileId, "unsave");
				self.get('appCtrl').setfilesavedstate(filename, false);
				self.get('outlineCtrl').set('fileSavedState',false);
			}
		}
	},
	/**
	 * save editor tab title handler
	 */
	saveeditor_tabTitle: function(filename) {
		let self = this,
			fileId = commonUtils.generateFileId(filename);
			self.setTabTitle(fileId, "save");
		self.get('appCtrl').setfilesavedstate(filename, true);
	},
	/**
	 * Editor related all shortcut will be handled in this file.
	 */
	editorShortcuts: function(editorObj) {
		let self = this;
		editorObj.commands.addCommands([
                {
                	bindKey: commonUtils.bindKey('Ctrl-H', 'Command-H'),
					exec: function(editor) {
						self.get('srcOpCtrl').searchContent(editor);
					},
					readOnly: false // false if this command should not apply in readOnly mode
                },
                {
                	bindKey: commonUtils.bindKey('Alt-W', 'Option-W'),
					exec: function() {
						self.send('menuActions', 'closeFile');
					},
					readOnly: false // false if this command should not apply in readOnly mode
                },
                {
                	bindKey: commonUtils.bindKey('Alt-Shift-W', 'Alt-Shift-W'),
					exec: function() {
						self.send('menuActions', 'closeAllSpecificPane');
					},
					readOnly: false // false if this command should not apply in readOnly mode
                },
				{
					bindKey: commonUtils.bindKey('Ctrl-S', 'Command-S'),
					exec: function() {
						let currentEditor = self.get('appCtrl').getcurrentEditor(),
							currentFilename = self.getSessionFilename();
						self.editorSaveFile(currentEditor, currentFilename);
					},
					readOnly: false // false if this command should not apply in readOnly mode
				},
				{
					bindKey: commonUtils.bindKey('Ctrl-I', 'Ctrl-I'),
					exec: function() {
						self.get("winViewCtrl").hierarchyView();
					},
					readOnly: false // false if this command should not apply in readOnly mode
				},
				{
					bindKey: commonUtils.bindKey('Ctrl-O', 'Command-O'),
					exec: function() {						
						self.get('outlineCtrl').send("display_outlineView");
					},
					readOnly: false // false if this command should not apply in readOnly mode
				},
				{
					bindKey: commonUtils.bindKey('Ctrl-L', 'Command-L'),
					exec: function() {						
						editorUtils.gotoLine(editorObj);
					},
					readOnly: false // false if this command should not apply in readOnly mode
				},
				{
					bindKey: commonUtils.bindKey('Ctrl-B', 'Command-B'),
					exec: function(editor) {
						self.get('srcOpCtrl').formatSource(editor);
					},
					readOnly: false // false if this command should not apply in readOnly mode
				}
			]);
	},
	/**
	 * This method will call whenever editor file onclick save or Ctrl+s .
	 */
	editorSaveFile: function(currentEditor, filename) {
		let self = this;
		self.saveFileContent(currentEditor, filename);
		let editorObj = self.get('appCtrl').getcurrentEditorObj(currentEditor);
		editorObj.focus();
	},
	
	/**
	 * Set Editor Settings
	 */
	setEditorSettings: function(editorObj)  {
		var self = this;
		var getEditorPreference = self.get('appCtrl').getPreferences('editor');
		editorObj.setTheme("ace/theme/" + getEditorPreference.editorTheme);
		editorObj.setFontSize(getEditorPreference.fontSize);
		editorObj.renderer.setOption('showLineNumbers', getEditorPreference.showLineNumber);
		editorObj.setDisplayIndentGuides(getEditorPreference.showIndentGuide);
	},
	
	setFormatterSettings: function(editorObj) {
		let self = this,
		filename = self.getSessionFilename(),
		fileExt = commonUtils.getFileExtension(filename),
		getFormatterPreference = self.get('appCtrl').getPreferences('formatter')[fileExt];
		if(getFormatterPreference !== undefined) {
			if(getFormatterPreference.tab_size !== undefined) {
				editorObj.setOption("tabSize", getFormatterPreference.tab_size);
			}
		}
		else {
			editorObj.setOption("tabSize", 4);
		}
	},
	
	lmSearch: function() {
		let self = this,
			lmsearchVal = self.get('lmSearchInput'),
			lModes = self.get('searchlModes');
		if(!Em.isEmpty(lmsearchVal)) {
			let lmsearchRes = commonUtils.searchArrayObject(lModes, lmsearchVal, 'lModeName');
			self.set('lModes', lmsearchRes);
		} else {
			self.set('lModes', lModes);
		}
	}.observes('lmSearchInput'),
	
	actions: {
	}

});
