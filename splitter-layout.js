/**
 * Splitter Layout component use in split two layout view .
 */

import cideComp from 'cide/components/cide-component';

export default cideComp.extend({
	
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
		  		splitType = self.get('splitType');
		  	if(splitType === "aceDiff") {
		  	    let diffCtrl = self._getController();
		  	    diffCtrl.resizeDiffLayout();
		  	}
	  }

});
