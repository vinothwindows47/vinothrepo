/**
 * Splitter Layout component use in split two layout view .
 */
export default Em.Component.extend({
	
	didInsertElement() {
		let self = this,
			layoutType = self.get("type"),
			leftWidth = self.get("leftWidth"), rightWidth;
		if(Em.isNone(leftWidth)) {
			leftWidth = 25;
			rightWidth = (layoutType === "twoLayout") ? 75 : 100;
		}
		else {
			rightWidth = 100-leftWidth;
		}
		let outletLayoutOptions = {};
		if(layoutType === "oneLayout") {
		    outletLayoutOptions = {
					center__paneSelector: "#" + self.get('centerId'),
					center__size: rightWidth+"%",
					onresize_end: function() {
						self.resizeoutletLayouts();
					}
			};
		}
		
		if(layoutType === "twoLayout") {
			outletLayoutOptions = {
					livePaneResizing:	true,
					west__paneSelector: "#" + self.get('leftId'),
					west__size: leftWidth+"%",
					center__paneSelector: "#" + self.get('rightId'),
					center__size: rightWidth+"%",
					onresize_end: function() {
						self.resizeoutletLayouts();
					}
			};
		}
		
		Em.$('#' + self.get('mainId')).layout(outletLayoutOptions);
		self.resizeoutletLayouts();
	},
	
	/**
	   * Whenever layout adjust, outlet layout will be resizable handler.
	   */
	
	  resizeoutletLayouts: function() {
		  	let self = this,
		  		splitType = self.get('splitType'),
		  		thisCtrl = self.get('thisCtrl');
		  	if(splitType === "aceDiff") {
		  		let layoutPos = self.getdiffLayoutPosition(),
		  			acediffheight = (thisCtrl === "repo/compare" || thisCtrl === "repo/mergeresolve") ? layoutPos.height - 70 + "px" : layoutPos.height - 30 + "px",
		  			acediffwidth = layoutPos.width - 20 + "px",
		  			acediffgroupwidth = layoutPos.width - 18 + "px";
				$('#acediff-container').css({'width':acediffwidth, 'height': acediffheight });
				$('#acediffgroup-container').css({'width':acediffgroupwidth});
				if(!Em.isNone(window.aceDiffToolObj)) {
					window.aceDiffToolObj.editors.left.ace.resize();
					window.aceDiffToolObj.editors.right.ace.resize();
					window.aceDiffToolObj.updateaceDiffResizer();
				}
		  	}
	  },
	  
	  getdiffLayoutPosition: function() {
		  let outletLayoutWidth = Em.$("#rightDiffLayout").width(),
		  	  outletLayoutHeight = Em.$("#rightDiffLayout").height(),
		  	  olPosObj = { width: outletLayoutWidth, height: outletLayoutHeight};
		  return olPosObj;
	  }

});
