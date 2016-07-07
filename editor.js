<div id="bpoint-mainElem" class="bpoint-mainElem" style='display:none'>
	{{#if bpointItems.content}}
		<div id="bpointViewIcons" style='height:1px;'>
			<span class="layouttop-rightMenuOption debugiconmenu {{if chkbpointItems 'icon-debug-enable' 'icon-debug-disable'}}" style='float:right' {{action "removeall_bpoint"}}>
				<div class="topbar-ui-icons fsize16 fa fa-times-circle bpointClose" title="Remove All Breakpoints"></div>
			</span>
			<span class="layouttop-rightMenuOption debugiconmenu {{if chkselectedbpointItems 'icon-debug-enable' 'icon-debug-disable'}}" style='float:right' {{action "removeSelected_bpoint"}}>
				<div class="topbar-ui-icons fsize16 fa fa-times bpointClose" title="Remove Selected Breakpoints"></div>
			</span>
		</div>
		<ul class="bpointItems" style='margin-top:30px;position: absolute;width: 100%;bottom: 0px;top: 30px;overflow: auto;'>
			{{#each bpointItems.content as |bpoint-item|}}
				<li class="bpoint-item" >
					<div class="bpointChkbox customChkbox">
						{{input type="checkbox" checked=bpoint-item.selected}}
					</div>
					<div class='bpointLineNumber' {{ action "gotoFile" bpoint-item.filepath bpoint-item.lineNumber }}>
						{{bpoint-item.lineDetail}}
					</div>
				</li>
			{{/each}}
		</ul>
	{{else}}
		<div class="message empty">No breakpoints</div>
	{{/if}}
</div>
