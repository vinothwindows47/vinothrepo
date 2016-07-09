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
		<span title="terminate" class="layouttop-rightMenuOption debugiconmenu" {{ action "debuggingAction" "STOP" }}>
			<div class="topbar-ui-icons icon-debug-stop {{if debugControllers.debug 'icon-debug-terminateenable' 'icon-debug-disable'}}" style="font-size:20px;margin:5px 0px 0px 5px;"></div>
		</span>
		<span title="Resume (F8)" class="layouttop-rightMenuOption debugiconmenu {{if debugControllers.next 'icon-debug-enable' 'icon-debug-disable'}}" {{ action "debuggingAction" "RESUME" }}>
			<div class="topbar-ui-icons fsize16 fa fa-eject tform90" style="top: 3px;"></div>
		</span>
		<span title="Step Over (F6)" class="layouttop-rightMenuOption debugiconmenu {{if debugControllers.next 'icon-debug-enable' 'icon-debug-disable'}}" {{ action "debuggingAction" "STEPOVER"}} >
			<div class="topbar-ui-icons fsize16 icon-debug-step-over"></div>
		</span>
		<span title="Step Into (F5)" class="layouttop-rightMenuOption debugiconmenu {{if debugControllers.next 'icon-debug-enable' 'icon-debug-disable'}}" {{ action "debuggingAction" "STEPINTO"}} >
			<div class="topbar-ui-icons fsize16 icon-debug-step-into" ></div>
		</span>
		<span title="Step Out" class="layouttop-rightMenuOption debugiconmenu {{if debugControllers.next 'icon-debug-enable' 'icon-debug-disable'}}" {{ action "debuggingAction" "STEPOUT"}} >
			<div class="topbar-ui-icons fsize16 icon-debug-step-out"></div>
		</span>
		{{#debug/show-allconfig thisCtrl="window/debug"}}
			<span class="layouttop-rightMenuOption curPointer" id="debugshowAllConfig" title="Debug As" style="padding: 7px 7px 7px;" {{action "setdebugActionType" "debug"}}>
	  			<span class="debugAsDv">
	      			<span class="runImgC run-color fa fa-bug" style="padding-top: 1px;"></span>
	      			<span class=""><span class="fa fa-caret-down"></span></span>
	  			</span>
			</span>
			<span class="layouttop-rightMenuOption curPointer" id="runshowAllConfig" title="Run As" style="padding: 7px 7px 8px; display:none" {{action "setdebugActionType" "run"}}>
	  			<span class="runAsDv">
	      			<span class="runImgC fa fa-play-circle-o"></span>
	      			<span class=""><span class="fa fa-caret-down"></span></span>
	  			</span>
			</span>
		{{/debug/show-allconfig}}
	</div>
</div>
{{#debug/debug-layout thisCtrl="window/debug"}}
	<div id="debugMainView" class="debugMainView" style='height:auto;'>
		{{#each debugMenuItems as |debugItem|}}
			<div id={{debugItem.id}}>
				<div class='debugHeader' {{action "toggleLayout" debugItem}}>
					<span class='bold' style='color:#616161'>
						{{#if debugItem.expand}}
							<i class="fa fa-caret-down" aria-hidden="true" style='padding-right:5px;'></i>
						{{else}}
							<i class="fa fa-caret-right" aria-hidden="true" style='padding-right:5px;'></i>
						{{/if}}
						{{debugItem.name}}
					</span>
				</div>
				{{partial debugItem.partial}}
			</div>
		{{/each}}
	</div>
{{/debug/debug-layout}}
