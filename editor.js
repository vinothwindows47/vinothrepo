<div class="bpoint-mainElem">
	<ul class="bpointItems">
		{{#each bpointItems.content as |bpoint-item|}}
			<li class="bpoint-item" >
				<div class="bpointChkbox customChkbox" {{ action "bpointchkChange" bpoint-item}}>
					<input type="checkbox" checked={{bpoint-item.selected}}>
					<label></label>
				</div>
				<div class='bpointLineNumber' {{ action "gotoFile" bpoint-item.filepath bpoint-item.lineNumber }}>
					{{bpoint-item.lineDetail}}
				</div>
			</li>
		{{/each}}
		{{#unless bpointItems.content}}
			<div class="message empty">No breakpoints</div>
		{{/unless}}
	</ul>
</div>
