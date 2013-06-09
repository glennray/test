/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

var bible = new kendo.data.ObservableObject({

	// properties
	versionsLoaded: false,
	timer: null,
	version: { name:"English Standard Version", id:"ESV", audio:true, format:"html" },
	book: {
		Name: "John",
		Abbreviation: "John",
		Id: "43",
		Order: 43,
		Chapters: 21
	},
	chapter: 1,
	selectedBook: {},
	plan: config.bible.selectedPlan,
	planDay: DatePart("y", new Date()) - 1,
	planPassage: { Index:0 },
	planMode: false,
	planData: null,
	previousLocation: null,
	font: 1,
	fontSize: "Medium",
	textDisplay: "normal",
	playingCurrentChapter: false,
    navDisabled: false,

	// dependent methods
	bookChapter: function() {
	    return bible.get("book").get("Name") + " " + bible.get("chapter");
	},
	versionBook: function() {
	    return bible.get("version").get("id") + ":" + bible.get("book").get("Name");
	},
	contentKey: function() {
	    return bible.get("version").get("id") + ":" + bible.get("book").get("Abbreviation") + ":" + bible.get("chapter");
	},
	isLeftNavEnabled: function() {
		if (bible.get("dsBooks").data().length == 0) return true;
        var offset = bible.get("dsBooks").data()[0].get("Order") - 1;
		if (bible.get("planMode")) {
			if (bible.get("planPassage").get("Index") == 1) {
				return false;
			}
		}
		else {
			if (bible.get("chapter") == 1 && bible.get("book").get("Order") - offset == 1) {
				return false;
			}
		}
		return true;
	},
	isRightNavEnabled: function() {
		if (bible.get("planData") == null) return true;
        var offset = bible.get("dsBooks").data()[0].get("Order") - 1;
	    if (bible.get("planMode")) {
			if (bible.get("planPassage").get("Index") == bible.get("planData").get("Days")[bible.get("planDay")-1].get("Passages").length) {
				return false;
			}
		}
		else {
			if (bible.get("book").get("Order") - offset == bible.get("dsBooks").data().length && bible.get("chapter") == bible.get("book").get("Chapters")) {
	    		return false;
	    	}
	    }
		return true;
	},
	isPlanActive: function() {
		return bible.get("planPassage") !== null;
	},
	isAudioAvailable: function() {
		return bible.get("version").audio;
	},
	planDayTitle: function() {
		if (bible.get("planData") == null || bible.get("planData").Days == null) return "";
		var passages = bible.get("planData").Days[bible.get("planDay")-1].Passages;
		return bible.get("plan").name + " - " + bible.get("planPassage").get("Index") + " of " + passages.length;
	},
	planDayDate: function() {
		var planStart = config.bible.selectedPlan.startMonthDay;
		var currentYear = (new Date()).getFullYear();
		var planStartDate = new Date(currentYear, planStart.split("/")[0]-1, planStart.split("/")[1]);
		var planCurrentDate = DateAdd("d", bible.get("planDay")-1, planStartDate);
		
		return kendo.toString(planCurrentDate, "dddd, MMM d" );
	},

	// datasources
	dsBooks: new kendo.data.DataSource({
	    data: [],
		transport: {
			read: {
				url: config.bible.urlBooks,
				type: "GET",
				dataType: "json",
				contentType: "application/json",
				data: { version: function() { return bible.get("version").get("id"); } }
			}
		},
		change: function(e) {
		    var storageKey = bible.get("version").get("id") + "_books";
			localStorage.setObject(storageKey, bible.get("dsBooks").data());
            $(document).trigger($.Event("books-loaded"));
		},
        error: function(e) {
        	window.console && console.log("error getting data for dsBooks");
            if (app != null) app.hideLoading();
            $("#bible-overlay").css("opacity", "0");
            setTimeout(function() { $("#bible-overlay").hide(); }, 300);
        }
	}),
	dsPlanPassages: new kendo.data.DataSource({
		data: [],
        error: function(e) {
            if (app != null) app.hideLoading();
            $("#bible-overlay").css("opacity", "0");
            setTimeout(function() { $("#bible-overlay").hide(); }, 300);
        }
	}),

	// methods
	init: function() {
		var settings = localStorage.getObject("bible.settings");
		if (settings !== null) {
			bible.set("version", settings.version);
			bible.set("book", settings.book);
			bible.set("chapter", settings.chapter);
			if (settings.font !== null) { bible.set("font", settings.font); }
			if (settings.fontSize !== null) { bible.set("fontSize", settings.fontSize); }
			if (settings.textDisplay !== null) { bible.set("textDisplay", settings.textDisplay); }
		}
		bible.saveSettings();
		bible.applyTextSettings();
		bible.initEvents();
		window.console && console.log("bible module initialized");
	},

	initEvents: function() {
		window.console && console.log("bible.initEvents()");
		
		$(document).bind("app-init", function(e) {
		    bible.initData();
			//window.console && console.log(bible.get("planData"));
		});

        $(document).bind("books-loaded", function(e) {
            var offset = bible.get("dsBooks").data()[0].get("Order") - 1;
            var currentBook = bible.get("dsBooks").data()[bible.get("book").get("Order") - 1 - offset];
            if (currentBook != null) {
                bible.set("book", currentBook);
            }
            bible.selectChapter(bible.get("chapter"));
    	    bible.saveSettings();
        });
	},

	initData: function() {
		window.console && window.console && console.log("bible.initData()");
		var storageKey = bible.get("version").get("id") + "_books";
		if (localStorage.getObject(storageKey) != null) {
			window.console && console.log("getting bible books from cache");
			bible.get("dsBooks").data(localStorage.getObject(storageKey));
		}
		else {
			window.console && console.log("getting bible books from API");
			bible.get("dsBooks").read();
		}

		if (bible.get("planData") == null) {
			if (config.platformHttpRoot == null) {
				config.platformHttpRoot = resourceUrl + "platform/v1";
			}
			var planUrl = config.platformHttpRoot + config.bible.selectedPlan.url;
			if (localStorage.getObject(config.bible.selectedPlan.url) != null) {
				window.console && console.log("getting plan data from local storage");
				bible.set("planData", localStorage.getObject(config.bible.selectedPlan.url));
				var passages = bible.get("planData").Days[bible.get("planDay")-1].Passages;
				bible.get("dsPlanPassages").data(passages);
				bible.set("planPassage", passages[0]);
			}
			else {
				window.console && console.log("getting plan data from " + planUrl);
				$.ajax({
					url: planUrl,
					type: "GET",
					dataType: "json",
					async: false,
				    beforeSend: function (xhr) { },
					success: function(data) {
						window.console && console.log("got remote plan data");
						bible.set("planData", data);
						localStorage.setObject(config.bible.selectedPlan.url, data);
						var passages = data.Days[bible.get("planDay")-1].Passages;
						bible.get("dsPlanPassages").data(passages);
						bible.set("planPassage", passages[0]);
						window.console && console.log("got remote plan passages");
					},
					error: function() {
						window.console && console.log("failed to get reading plan from " + planUrl);
					}
				});
			}
		}
		else {
			var passages = bible.get("planData").Days[bible.get("planDay")-1].Passages;
			bible.get("dsPlanPassages").data(passages);
			bible.set("planPassage", passages[0]);
		}
	},
	
	playChapter: function(e) {
		if (!bible.get("playingCurrentChapter")) {
			bible.set("playingCurrentChapter", true);
			var query = bible.bookChapter();
			var version = bible.get("version").get("id");
			//var url = config.bible.urlAudio.replace("{0}",version).replace("{1}", query);
			var url = config.bible.urlAudio.replace("{0}","ESV").replace("{1}", query);// hack
			audio.showPlayer();
			$.ajax({
				url: url,
				dataType: "json",
				type: "GET",
				success: function(data) {
					if (data !== null && data.length > 0) {
						version = "ESV";// hack
						for(var i=0;i < data.length;i++) {
							data[i].Title += " (" + version + ")";
						}
						audio.playTracks(data);
					}
				}
			});
		}
		else {
			audio.showPlayer();
			if (!audio.isPlaying()) {
				audio.play();
			}
		}
	},

	playPlanAudio: function(e) {
		bible.set("playingCurrentChapter", false);
		var query = "";
		var passages = bible.get("planData").Days[bible.get("planDay")-1].Passages;
		for (var i=0;i < passages.length; i++) {
			query += passages[i].Reference + ",";
		}
		var version = bible.get("version").get("id");
		//var url = config.bible.urlAudio.replace("{0}",version).replace("{1}", query);
		var url = config.bible.urlAudio.replace("{0}","ESV").replace("{1}", query);//hack
		window.console && console.log("NEW URL: " + url);
		audio.showPlayer();
		$.ajax({
			url: url,
			dataType: "json",
			type: "GET",
			success: function(data) {
				if (data !== null && data.length > 0) {
					version = "ESV";// hack
					for(var i=0;i < data.length;i++) {
						data[i].Title += " (" + version + ")";
					}
					if (!bible.get("version").get("audio")) {
						var message = "Your current Bible version does not have audio.\nYou may click 'Okay' to hear the audio in the ESV (English Standard) version, ";
						message += "or click 'Nevermind' to cancel.";
						navigator.notification.confirm(message, function(buttonIndex) {
							if (buttonIndex == 1) {
								audio.playTracks(data);
							}
						}, "Audio Bible", "Okay, Nevermind");
					}
					else {
						audio.playTracks(data);
					}
				}
			}
		});
	},

	showToolbar: function() {
		clearTimeout(bible.get("timer"));
		$("#bible-toolbar-bottom").fadeIn(250);
		bible.set("timer", setTimeout(function() { $("#bible-toolbar-bottom").fadeOut(1000); }, 5000));
	},

	togglePlan: function(e) {
		bible.set("planMode", !bible.get("planMode"));
		if (bible.get("planMode")) {
			bible.selectPassage(bible.get("planPassage"));
			$("#bible-title-down").hide();
			return;
		}
		else {
			$("#bible-title-down").show();
		    var previousLoc = bible.get("previousLocation");
		    bible.set("book", previousLoc.book);
			$("#bible-toolbar-top").hide();
			$("#bible-button-plan").removeClass("pressed");
			bible.set("chapter", previousLoc.chapter);
		}
		var title = bible.bookChapter();
		$("#navbar-bible").data("kendoMobileNavBar").title(title);
		bible.selectChapter(bible.get("chapter"));
	},

	selectPassage: function(passage) {
		bible.set("planPassage", passage);
		var bookAbbr = passage.Reference.split(":")[0];
		var chapter = passage.Reference.split(":")[1];
		var books = bible.get("dsBooks").data();
		for (var i=0;i < books.length; i++) {
			if (books[i].Abbreviation == bookAbbr) {
				$("#bible-title-down").hide();
				$("#bible-toolbar-top").show();
				$("#bible-button-plan").addClass("pressed");
				if (!bible.get("planMode")) {
					bible.set("planMode", true);
					var previousLoc = { book: bible.get("book"), chapter: bible.get("chapter") };
					localStorage.setObject("bible.plan.previousLocation", previousLoc);
					bible.set("previousLocation", previousLoc);
				}
				bible.set("book", books[i]);
				bible.set("chapter", chapter);
				break;
			}
		}
		bible.selectChapter(bible.get("chapter"), true);
	},

	showPlanView: function(e) {
		baja.trackView("/bible-plan");
		var title = bible.get("plan").get("name");
		$("#navbar-plan").data("kendoMobileNavBar").title(title);
	},

	initPlanView: function(e) {
		e.view.element.kendoMobileSwipe(function(e) {
			bible.navigatePlan(e, e.direction);
		}, { minXDelta: 150, maxDuration: 300 });
		$("#plan-header a").live("touchstart", function(e) {
			$(this).addClass("pressed");
		});
		$("#plan-header a").live("touchend", function(e) {
			$(this).removeClass("pressed");
		});
		var listView = $("#list-bible-plan-passages").data("kendoMobileListView");
		if (listView == null) {
			$("#list-bible-plan-passages").kendoMobileListView({
				dataSource: bible.get("dsPlanPassages"),
				autoBind: true,
				template: $("#template-bible-plan-passage").html(),
				click: function(e) {
					bible.selectPassage(e.dataItem);
				}
			});
			e.view.element.find("li").kendoMobileSwipe(function(e) {
				bible.navigatePlan(e, e.direction);
			}, { minXDelta: 150, maxDuration: 300 });
		}
	},

	selectVersion: function(version) {
		bible.set("version", version);
		bible.loadBooks();
		//AppiraterPlugin.sigEvent();
	},

	selectBook: function(book) {
        var selectFirstChapter = false;
        if (!isNaN(book)) {
            var bookIndex = book;
            book = bible.get("dsBooks").data()[bookIndex];
            selectFirstChapter = true;
        }
		bible.set("selectedBook", book);
		var maxChapter = book.get("Chapters");
        var chapterButtons = "<tr>";
        for (var i=1; i <= maxChapter;i++) {
            chapterButtons += "<td class=\"chapter\"><a onclick=\"bible.onChapterClick(" + i + ", this)\">" + i + "</a></td>";
            if (i % 6 == 0) {
                chapterButtons += "</tr><tr>";
            }
        }
        chapterButtons += "</tr>";
        $("#chapterlist").html(chapterButtons);
        var buttongroup = $("#bible-ref-buttons").data("kendoMobileButtonGroup");
        if (buttongroup != undefined) {
            buttongroup.select(1);
        }
        $("#div-bible-chapters").show();
		$("#div-bible-books").hide();
		app.scroller().reset();
        var titleBar = $("#book-select-title").data("kendoMobileNavBar");
        if (titleBar != undefined) titleBar.title(book.Name);
        if (selectFirstChapter) {
            bible.set("book", book);
            bible.selectChapter(1, true);
        }
	},

	onChapterClick: function(chapter, ctrl) {
		$(".chapter a").removeClass("selected");
		$(ctrl).addClass("selected");
		bible.set("book", bible.get("selectedBook"));
		bible.selectChapter(chapter, true);
	},

	setBibleContent: function(content) {
		$("#divBibleText > p#bible-content").html(content);
		$("#divBibleText > p#bible-content").removeClass("html text").addClass(bible.get("version").get("format"));
		$("#divBibleText span[class^='v']").addClass("verse");
		$("#divBibleText div.chapter").removeAttr("class");
		if (app != null) app.hideLoading();
	},

	selectChapter: function(chapter, navToTextView) {
		window.console && console.log("selectChapter: " + chapter);
        bible.set("navDisabled", true);

		// use cache if present
		var key = bible.get("version").get("id") + ":" + bible.get("book").get("Abbreviation") + ":" + chapter;
	    var cachedContent = sessionStorage.getObject(key);
	    if (cachedContent !== null) {
			bible.setBibleContent(cachedContent);
			bible.set("chapter", chapter);
			bible.updateTitle();
			if (app != null) app.scroller().reset();
			bible.showToolbar();
			bible.saveSettings();
			if (cachedContent.length > 0) {
				localStorage.setObject("bible.content", cachedContent);
			}
            bible.set("navDisabled", false);
		}
		// get fresh content from api
	    else {
            var bookExists = false;
            var bookData = bible.get("dsBooks").data();
            for(var i=0;i < bookData.length;i++) {
                if (bookData[i].Abbreviation == bible.get("book").get("Abbreviation")) {
                    bookExists = true;
                    break;
                }
            }
            if (bookExists) {
            	app.showLoading();
            	var url = kendo.format(config.bible.urlChapter, bible.get("version").get("id"), bible.get("book").get("Abbreviation"), chapter, bible.get("version").get("format"));
    			$.ajax({
    				url: url,
    				type: "GET",
    				dataType: "json",
    				timeout: 30000,
    				success: function(data) {
    				    var content = data.Text + "<div class='copyright'>" + data.Copyright + "</div>";
    					bible.setBibleContent(content);
    					bible.set("chapter", chapter);
    					bible.updateTitle();
    					bible.showToolbar();
    					bible.saveSettings();
    					if (data.Text.length > 0) {
    						localStorage.setObject("bible.content", content);
    						sessionStorage.setObject(bible.contentKey(), content);
    					}
    					if (app != null) app.scroller().reset();
    				},
    				error: function(jqXHR, ajaxSettings, errorThrown) {
    					navigator.notification.alert("Error retrieving chapter content!\n" + errorThrown, null, "Data Error", "OK");
                        window.console && console.log(errorThrown);
                        app.hideLoading();
    				},
                    complete: function(jqXHR, textStatus) {
                    	window.console && console.log("ajax complete");
                        bible.set("navDisabled", false);
                        bible.set("playingCurrentChapter", false);
                    }
    			});
            }
            else {
                var msg = "Your current chapter does not exist in the version you selected, so we're setting you to the first book in your selected version.";
                navigator.notification.alert(msg, null, "FYI...", "OK");
                bible.selectBook(0);
                bible.selectChapter(1);
                app.hideLoading();
                return;
            }
	    }
		if (navToTextView) {
			if (app != null) app.navigate("bible");
			if (app != null) app.scroller().reset();
		}
		
		bible.set("playingCurrentChapter", false);
	},

	updateTitle: function(title) {
		var title = bible.bookChapter();
		window.console && console.log("new title: " + title);
		if ($("#navbar-bible").data("kendoMobileNavBar") != null) {
	    	$("#navbar-bible").data("kendoMobileNavBar").title(title);
	    }
	},
	
	loadVersions: function(e) {
		baja.trackView("/bible-versions");
		if (!bible.get("versionsLoaded")) {
			var ds = new kendo.data.DataSource({ data: config.bible.versions });
			$("#list-bible-versions").kendoMobileListView({
				dataSource: ds,
				template: $("#template-bible-version").html(),
				//style: "inset",
				click: function(e) {
					bible.selectVersion(e.dataItem);
				}
			});
			bible.set("versionsLoaded", true);
        }
        if (e.view != null) e.view.scroller.reset();
	},

	loadBooks: function(e) {
		var listView = $("#list-bible-books").data("kendoMobileListView");
		if (listView == null) {
			$("#list-bible-books").kendoMobileListView({
				dataSource: bible.get("dsBooks"),
				autoBind: false,
				template: $("#template-bible-book").html(),
				click: function(e) {
					bible.selectBook(e.dataItem);
				}
			});
        }
        var storageKey = bible.get("version") + "_books";
		var books = localStorage.getObject(storageKey);
		if (books !== null) {
			window.console && console.log("using cached books");
			bible.get("dsBooks").data(books);
		}
		else {
        	window.console && console.log("Not found in cache. Getting books from api");
			bible.get("dsBooks").read();
		}
	},

	showTextView: function(e, usePlanMode) {
		baja.trackView("/bible");
        bible.set("navDisabled", false);
		bible.applyTextSettings();
		window.console && console.log("usePlanMode: " + usePlanMode);
		if (usePlanMode != undefined) {
			if (usePlanMode != bible.get("planMode")) {
				bible.togglePlan();
				return;
			}
		}
		else {
			var planMode = e.view.params.usePlanMode;
			if (planMode != null) {
				var mode = (planMode == "false" ? false : true);
				if (mode != bible.get("planMode")) {
					bible.togglePlan();
					return;
				}
			}
		}
	    var title = bible.bookChapter();
		$("#navbar-bible").data("kendoMobileNavBar").title(title);
		bible.showToolbar();
		if (app != null && app.scroller()) {
			app.scroller().reset();
		}
	},

	initTextView: function(e) {
		e.view.element.find("#divBibleText").kendoMobileSwipe(function(e) {
			bible.navigate(e, e.direction);
		}, { minXDelta: 150, maxDuration: 300 });

		e.view.element.find("#divBibleText").live("click", function() {
			bible.showToolbar();
		});
		if (FastClick) { new FastClick(document.getElementById("divBibleText")); }

		e.view.scroller.bind("scroll", function(e) {
            bible.showToolbar();
        });

		$("#chapterlist .chapter a").live("touchstart", function(e) {
			$(this).addClass("hover");
		});
		$("#chapterlist .chapter a").live("touchend", function(e) {
			$(this).removeClass("hover");
		});

		if (baja.get("os") != "web") {
			$("#divBibleText span[class^='v'], span.title-passage").live("click", function(e) {
				if ($(this).hasClass("selected")) {
					$(this).removeClass("selected");
				}
				else {
					$(this).addClass("selected");
				}
				var selectedCount = $("#divBibleText .selected").length;
				if (selectedCount > 0) {
					$("#bible-button-share").fadeIn(100);
				}
				else {
					$("#bible-button-share").fadeOut(100);
				}
			});
		}
		
		bible.showToolbar();
        window.console && console.log("bible ui events initialized.");
        var lastContent = localStorage.getObject("bible.content");
        if (lastContent !== null) {
            bible.setBibleContent(lastContent);
        }
        else {
            bible.selectChapter(bible.get("chapter"));
        }
	},

	showBooks: function(e) {
		baja.trackView("/bible-books");
		var book = bible.get("book");
		bible.set("selectedBook", book);
		var buttongroup = $("#bible-ref-buttons").data("kendoMobileButtonGroup");
        if (buttongroup.selectedIndex == 1) {
        	$("#book-select-title").data("kendoMobileNavBar").title(book.get("Name"));
        }
        else {
            $("#book-select-title").data("kendoMobileNavBar").title("Select Book");
        }
        e.view.scroller.reset();
	},

	btnBookChapterSelect: function(e) {
		bible.switchBookChapter(this.selectedIndex);
	},

	switchBookChapter: function(selectedIndex) {
	    switch(selectedIndex) {
		    case 0:
		    	$("#div-bible-chapters").hide();
		    	$("#div-bible-books").show();
		    	$("#book-select-title").data("kendoMobileNavBar").title("Select Book");
		        break;
		    case 1:
		    	$("#div-bible-books").hide();
		    	$("#div-bible-chapters").show();
		    	var book = bible.get("selectedBook");
		    	bible.selectBook(book);
		        break;
		    default:
		    	break;
		}
	},

	navBooks: function(e) {
		if (!bible.get("planMode")) {
			app.navigate("bible-books");
		}
	},

	navigate: function(e, direction) {
        if (bible.get("navDisabled")) return;
		if (direction == null) {
			direction = e.button.attr("rel");
		}
		if (bible.get("planMode")) {
			bible.navigatePlanPassage(e, direction);
			return;
		}
	    var diff = 0;
	    var nextBook;
	    switch (direction) {
			case "left":
				if (bible.isRightNavEnabled()) {
				    diff = 1;
				}
				break;
			case "right":
			    if (bible.isLeftNavEnabled()) {
				    diff = -1;
				}
				break;
			default:
				break;
		}
		if (diff !== 0) {
            var offset = bible.get("dsBooks").data()[0].get("Order") - 1;
			var nextChapter = parseInt(bible.get("chapter"), 10) + parseInt(diff, 10);
			var currentBook = bible.get("dsBooks").data()[bible.get("book").get("Order") - 1 - offset];
			var currentChapter = bible.get("chapter");
			if (diff == 1) {
				if (nextChapter > currentBook.get("Chapters")) {
					nextBook = bible.get("dsBooks").data()[bible.get("book").get("Order") - offset];
					nextChapter = 1;
				}
			}
			else if (diff == -1) {
				if (nextChapter == 0 && bible.get("book").get("Order") >= 2) {
					nextBook = bible.get("dsBooks").data()[bible.get("book").get("Order") - 2 - offset];
					nextChapter = nextBook.get("Chapters");
				}
			}
			bible.set("book", nextBook == null ? currentBook : nextBook);
			if (nextBook != null) {
				bible.selectBook(nextBook);
			}
			bible.selectChapter(nextChapter);
		}
	},

	navigatePlanPassage: function(e, direction) {
        if (bible.get("navDisabled")) return;
		var diff = 0;
	    switch (direction) {
	    	case "left":
	    		diff = 1;
	    		break;
	    	case "right":
	    		diff = -1;
	    		break;
	    	default:
	    		break;
	    }
	    var passageIndex = bible.get("planPassage").get("Index");
	    passageIndex += diff;
	    var passages = bible.get("planData").Days[bible.get("planDay")-1].Passages;
	    var newPassage = passages[passageIndex-1]
	    bible.selectPassage(newPassage);
	},

	navigatePlan: function(e, direction) {
        if (bible.get("navDisabled")) return;
		if (direction == null) {
			direction = e.button.attr("rel");
		}
	    var diff = 0;
	    switch (direction) {
	    	case "left":
	    		diff = 1;
	    		break;
	    	case "right":
	    		diff = -1;
	    		break;
	    	default:
	    		break;
	    }
	    bible.set("planDay", parseInt(bible.get("planDay"), 10) + parseInt(diff, 10));
	    var passages = bible.get("planData").Days[bible.get("planDay")-1].Passages;
		bible.get("dsPlanPassages").data(passages);
		app.scroller().reset();
	},

	applyTextSettings: function() {
		$("#bible-content").removeClass("text-normal").removeClass("text-lowlight");
		$("#bible-content").parent().parent().removeClass("text-normal").removeClass("text-lowlight");
		$("#bible-content").removeClass("text-font1").removeClass("text-font2").removeClass("text-font3").removeClass("text-font4");
		$("#bible-content").removeClass("text-small").removeClass("text-medium").removeClass("text-large").removeClass("text-huge");
		$("#bible-content").addClass("text-font" + bible.get("font")).addClass("text-" + bible.get("fontSize").toLowerCase()).addClass("text-" + bible.get("textDisplay"));
		$("#bible-content").parent().parent().addClass("text-" + bible.get("textDisplay"));
	},

	saveSettings: function() {
		var settings = {
		    version: bible.get("version"),
		    book: bible.get("book"),
		    chapter: bible.get("chapter"),
			font: bible.get("font"),
			fontSize: bible.get("fontSize"),
			textDisplay: bible.get("textDisplay")
		};
		localStorage.setObject("bible.settings", settings);
	},

	share: function(e) {
		var verses = "";
		$("#bible-content .selected").each(function(i) {
			verses += $(this).text() + "\n";
		});
		var shareData = { text: verses, reference: bible.bookChapter() + " (" + bible.get("version").id + ")" };
		baja.showSharePanel(e.button, "bible", false, shareData);
	}
});
bible.init();

