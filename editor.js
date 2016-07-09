<div class="east-layout-top-bar layouttopBar cideLayout" id="debug_topBar">
	<span class="icon-window ui-components-toolbar-icon navmenu-ui-icons fa fa-bug"></span>
	<span class="layout-topHeader">Debugger</span>
	<span class="layouttop-rightMenu">
		<span class="layouttop-rightMenuOption" {{action "debugviewClose"}}>
			<div class="navmenu-ui-icons fa fa-close fa-12"></div>
		</span>
	</span>
</div>
<div class="debugtabHeader">
	<div class="debugHeadIcons" id="variableViewIcons" style="display: block;">
		<span title="terminate" class="layouttop-rightMenuOption debugiconmenu" {{ action "debuggingAction" "debugStop" }}>
			<div class="topbar-ui-icons icon-debug-stop {{if debugControllers.debug 'icon-debug-terminateenable' 'icon-debug-disable'}}" style="font-size:20px;margin:5px 0px 0px 5px;"></div>
		</span>
		<span title="Resume" class="layouttop-rightMenuOption debugiconmenu {{if debugControllers.next 'icon-debug-enable' 'icon-debug-disable'}}" {{ action "debuggingAction" "debugResume" }}>
			<div class="topbar-ui-icons fsize16 fa fa-eject tform90" style="top: 3px;"></div>
		</span>
		<span title="step over" class="layouttop-rightMenuOption debugiconmenu {{if debugControllers.next 'icon-debug-enable' 'icon-debug-disable'}}" {{ action "debuggingAction" "debugStepOver"}} >
			<div class="topbar-ui-icons fsize16 icon-debug-step-over"></div>
		</span>
		<span title="step into" class="layouttop-rightMenuOption debugiconmenu {{if debugControllers.next 'icon-debug-enable' 'icon-debug-disable'}}" {{ action "debuggingAction" "debugStepInto"}} >
			<div class="topbar-ui-icons fsize16 icon-debug-step-into" ></div>
		</span>
		<span title="step out" class="layouttop-rightMenuOption debugiconmenu {{if debugControllers.next 'icon-debug-enable' 'icon-debug-disable'}}" {{ action "debuggingAction" "debugStepOut"}} >
			<div class="topbar-ui-icons fsize16 icon-debug-step-out"></div>
		</span>
		{{#debug/show-allconfig thisCtrl="window/debug"}}
			<span class="layouttop-rightMenuOption curPointer" id="debugshowAllConfig" title="Debug As" style="padding: 7px 7px 7px;" {{action "setdebugActionType" "debug"}}>
	  			<span class="debugAsDv">
	      			<span class="runImgC run-color fa fa-bug" style="padding-top: 1px;"></span>
	      			<span class=""><span class="fa fa-caret-down"></span></span>
	  			</span>
			</span>
			<span class="layouttop-rightMenuOption curPointer" id="runshowAllConfig" title="Run As" style="padding: 7px 7px 8px;" {{action "setdebugActionType" "run"}}>
	  			<span class="runAsDv">
	      			<span class="runImgC fa fa-play-circle-o"></span>
	      			<span class=""><span class="fa fa-caret-down"></span></span>
	  			</span>
			</span>
		{{/debug/show-allconfig}}
	</div>
	<div class="debugHeadIcons" id="bpointViewIcons">
		<span class="layouttop-rightMenuOption debugiconmenu {{if chkbpointItems 'icon-debug-enable' 'icon-debug-disable'}}" {{action "removeall_bpoint"}}>
			<div class="topbar-ui-icons fsize16 fa fa-times-circle bpointClose" title="Remove All Breakpoints"></div>
		</span>
		<span class="layouttop-rightMenuOption debugiconmenu {{if chkselectedbpointItems 'icon-debug-enable' 'icon-debug-disable'}}" {{action "removeSelected_bpoint"}}>
			<div class="topbar-ui-icons fsize16 fa fa-times bpointClose" title="Remove Selected Breakpoints"></div>
		</span>
	</div>
</div>
{{#debug/debug-layout thisCtrl="window/debug"}}
	<div id="debugMainView" class="debugMainView">
		<div id="debugThreadView">
			<div class="debugnavtabHeader navtabHeader">
				<ul class="navtabItems">
					{{#each debugMenuItems.left as |debugitem|}}
						<li id="{{debugitem.id}}" class="navtab-item {{if debugitem.active 'navActive'}}" {{ action "debugAction" debugitem "left" }}>
							<a>{{debugitem.item}}</a>
						</li>
					{{/each}}
				</ul>
			</div>
			<div class="debugnavMainView">
				{{partial debugLeftType}}
			</div>
		</div>
		<div id="debugVariableView">
			<div class="debugnavtabHeader navtabHeader">
				<ul class="navtabItems">
					{{#each debugMenuItems.center as |debugitem|}}
						<li id="{{debugitem.id}}" class="navtab-item {{if debugitem.active 'navActive'}}" {{ action "debugAction" debugitem "center" }}>
							<a>{{debugitem.item}}</a>
						</li>
					{{/each}}
				</ul>
			</div>
			<div class="debugnavMainView">
				{{partial debugCenterType}}
			</div>
		</div>
		<div id="debugWatcherView">
		</div>
	</div>
{{/debug/debug-layout}}
