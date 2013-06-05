/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

var home = new kendo.data.ObservableObject({
	// properties
	
	// dependent methods

	init: function() {
		window.console && console.log("home module initialized");
	},
	
	buildWidgets: function() {
		$("#divLogo").remove();
		$("#div-home").empty();
		for(var i=0;i < config.home.widgets.length;i++) {
			var widget = config.home.widgets[i];
			var template;
			var data;
			switch(widget.type) {
				case "custom":
					try {
						template = kendo.template($("#" + widget.template).html());
						$("#div-home").append(template(data));
						if (widget.onload != null) {
							console.log("calling " + widget.onload);
							eval(widget.onload);
						}
					}
					catch(ex) {}
					break;
			
				case "logo":
					var defaultImage = "logo.jpg";
					if (widget.image != null) {
						defaultImage = widget.image;
					}
					data = config.appHttpRoot + "/assets/" + defaultImage;
					template = kendo.template($("#template-home-logo").html());
					$("#div-home").before(template(data));
					if (widget.click != null) {
						$("#divLogo").attr("data-click", widget.click).bind("touchend", function() {
							eval($(this).attr("data-click"));
						});
					}
					break;
					
				case "reading-plan":
					data = new Date();
					template = kendo.template($("#template-home-reading-plan").html());
					$("#div-home").append(template(data));
					break;
					
				case "container":
					var template = kendo.template($("#template-home-widget-small").html());
					var outer = $("<div class='widget-outer' style='padding:8px;'></div>");
					var inner = $("<div class='widget-inner'></div>");
					var container = $("<div class='widget-container'></div>");
					if (baja.get("os") == "web") {
						container.css("width","210px");
					}
					for(var w=0;w < widget.widgets.length;w++) {
						if (baja.get("os") == "web" && widget.widgets[w].tab != "tabBible" && widget.widgets[w].tab != "tabJournal") continue;
						if (widget.widgets[w].clickandroid != null && widget.widgets[w].clickandroid.length > 0 && baja.get("os") == "android") {
							widget.widgets[w].click = widget.widgets[w].clickandroid;
						}
						var cell = $(template(widget.widgets[w]));
						var event = "click";
						if (baja.get("os") == "android") {
							event = "click";
						}
						cell.bind(event, function(e) {
							eval($(this).attr("data-onclick"));
							if ($(this).attr("data-tab").length > 0) {
								if ($(this).attr("data-tab") == "clear") {
									$("#custom-tabstrip").data("kendoMobileTabStrip").clear();
								}
								else {
									for(var t=0;t < config.tabs.length;t++) {
										if (config.tabs[t].id == $(this).attr("data-tab")) {
											window.console && console.log("tab view: " + config.tabs[t].view);
											baja.setCurrentTab(config.tabs[t].view);
											break;
										}
									}
								}
							}
							e.stopPropagation();
							e.preventDefault();
							return false;
						});
						cell.appendTo(container);
					}
					outer.append(inner.append(container));
					outer.appendTo("#div-home");
					if (widget.widgets.length > 3) {
						container.kendoMobileScrollView();
						console.log("created widget scroller");
					}
					break;
					
			}
		}
	}
});

home.init();