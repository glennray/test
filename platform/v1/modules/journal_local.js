/***********************************************
* Developer : Bible and Journal App LLC
* Ownership : This source file is proprietary property of Bible and Journal App LLC
* All code (c)2013 Bible and Journal App LLC all rights reserved
* Visit http://bibleandjournalapp.com/
***********************************************/

var journal = new kendo.data.ObservableObject({
	// properties
	user: null,
	page: 1,
	pageSize: 8,
	hasMorePages: false,
	journal: null,
	editingJournal: null,
	entry: null,
	editingEntry: null,
	entryDialogTitle: "",
	journalDialogTitle: "",
	journalCount: 0,
	entryCount: 0,
    mode: "",
    scroller:false,
    editHeight: 0,
    lastView: "journal",
    refreshEditor: true,
    customJournalDef: null,
    currentPartIndex: 0,
    dbLocal: null,

	// dependent methods
	isUserSignedIn: function() {
		return journal.get("user") != null;
	},
	entryDateFormatted: function() {
		var created = kendo.parseDate(journal.get("entry").get("EntryDate"));
		return kendo.toString(created, "dddd MMMM d, yyyy" );
	},
	entryContent: function() {
		var content = htmlDecode(journal.get("entry").Content.replace(/\n/g, "<br/>"));
		var html = content;
		return html;
	},
	entryContentText: function() {
	    var content = htmlDecode(journal.get("editingEntry").Content);
		var text = content.replace(/&lt;br&gt;/g,"\n");
		var html = strip($('<div/>').html(text).text());
		return html;
	},
	entryContentHtml: function() {
		var content = htmlDecode(journal.get("editingEntry").Content);
		var html = content;
		return html;
	},
	entryContentShareText: function() {
		var content, text, html;
		if (journal.get("entry").get("CustomJournalId") != null && journal.get("entry").get("CustomJournalId").length > 0) {
			content = htmlDecode(journal.get("entry").Content);
			text = content.replace(/<br>/g,"\n").replace(/<div>/g, "\n").replace(/~\|~/g,"\n\n");
			html = strip($('<div/>').html(text).text());
		}
		else {
			content = htmlDecode(journal.get("entry").Content);
			text = content.replace(/<br>/g,"\n").replace(/<div>/g, "\n");
			html = strip($('<div/>').html(text).text());
		}
		return html;
	},
	entryContentShareHtml: function() {
		var content = htmlDecode(journal.get("entry").Content).replace(/~\|~/g,"<br>");
		return content;
	},
	hasJournals: function() {
		return journal.get("journalCount") > 0;
	},
	hasEntries: function() {
		return journal.get("entryCount") > 0;
	},
	entryBlockMonth: function() {
		return journal.getEntryDatePart(journal.get("editingEntry").get("EntryDate"), 'MMM')
	},
	entryBlockDay: function() {
		return journal.getEntryDatePart(journal.get("editingEntry").get("EntryDate"), 'dd')
	},
	isJournalEditable: function() {
		if (journal.get("journal") != null) {
			return journal.get("journal").get("CustomJournalId") == null;
		}
		else {
			return false;
		}
	},
	currentPartTitle: function() {
		if (journal.get("customJournalDef") != null) {
			return journal.get("customJournalDef").parts[journal.get("currentPartIndex")].title;
		}
		else {
			return "";
		}
	},
	isLeftNavEnabled: function() {
		return journal.get("currentPartIndex") > 0;
	},
	isRightNavEnabled: function() {
		if (journal.get("customJournalDef") == null) return false;
		return journal.get("currentPartIndex") < journal.get("customJournalDef").get("parts").length-1;
	},
	editingInitialized: false,

	// datasources
	dsJournals: new kendo.data.DataSource({
		data: [],
		change: function() {
			console.log("dsJournals.change fired");
			$("#pagehint-journals").text("You have no journals.");
			journal.set("journalCount", journal.get("dsJournals").data().length);
			//journal.installCustomJournals();
		}
	}),
	
	dsEntries: new kendo.data.DataSource({
		data: [],
		transport: {
			read: function(options) {
				var results = [];
				options.success(results);
			}
		},
		schema: {
			model: JournalEntry,
			data: "Entries",
			parse: function (data) {
				journal.set("hasMorePages", data.HasMorePages);
				return data;
			}
		},
		change: function(e) {
			var data = journal.get("dsEntries").data();
			if (data.length > 0) {
				for(var i=0;i < data.length; i++) {
					journal.get("dsAllEntries").data().push(data[i]);
				}
			}
			setTimeout(function() {
	    		if (app != null) { app.hideLoading(); }
	    	}, 500);
	    	$("#pagehint-journal-entries").text("This journal has no entries.");
		}
	}),
	dsAllEntries: new kendo.data.DataSource({
		data: [],
		change: function() {
			journal.set("entryCount", journal.get("dsAllEntries").data().length);
		}
	}),

	getDbJournals: function() {
		var dbj = window.openDatabase("BajaJournals", "1.0", "Baja Journals", 5000000);
		dbj.transaction(function(tx) { 
			tx.executeSql('SELECT Id,Title,AccountId,Created,Modified,CustomJournalId FROM Journals', [], 
			// success
			function(tx, results) {
				var journalData = [];
				for(var i=0;i < results.rows.length;i++) {
					var item = results.rows.item(i);
					journalData[i] = { Id: item.Id, Title: item.Title, AccountId: item.AccountId, CustomJournalId: item.CustomJournalId };
					journalData[i].Created = moment(item.Created).toDate();
					journalData[i].Modified = moment(item.Modified).toDate();
					console.log(journalData[i]);
				}
				journal.get("dsJournals").data(journalData);
			},
			// error
			journal.dbError);
		}, journal.dbError);
	},
	
	dbError: function(err) {
		console.log(err);
		alert(err.message);
	},
	
	// methods
	init: function() {

		// init db
		var dbj = window.openDatabase("BajaJournals", "1.0", "Baja Journals", 5000000);
		dbj.transaction(function(tx) {
			tx.executeSql('DROP TABLE IF EXISTS Journals');
			tx.executeSql('CREATE TABLE IF NOT EXISTS Journals (Id unique, Title, AccountId, Created, Modified, CustomJournalId)');
			for(var i=1;i <= 20;i++) {
				var nowString = (new Date()).valueOf();
				var sql = 'INSERT INTO Journals (Id, Title, AccountId, Created, Modified, CustomJournalId) VALUES ({0},"Test Journal {0}",28,{1},{1},null)';
				tx.executeSql(kendo.format(sql, i, nowString));
			}
		}, journal.dbError, function() {
			// success
			journal.clearData();

			$(document).live("user-login", function(event) {
				journal.set("user", event.user);
				console.log("user set");
				//journal.get("dsJournals").read();
				journal.getDbJournals();
			});
			$(document).live("user-logout", function(event) {
				journal.set("user", null);
				journal.clearData();
			});

			console.log("journal module initialized");
		});
	},

	installCustomJournals: function() {
		console.log("installing custom journals...");
		/*if (journal.get("user") != null && config.journal.custom != null && config.journal.custom.length > 0) {
			var journals = journal.get("dsJournals").data();
			for(var i=0;i < config.journal.custom.length;i++) {
				var def = config.journal.custom[i];
				console.log("looking for journal: " + def.id);
				var foundJournal = false;
				for(var j=0; j < journals.length;j++) {
					if (journals[j].CustomJournalId == def.id) {
						console.log("FOUND");
						foundJournal = true;
						break;
					}
				}
				if (!foundJournal) {
					console.log("NOT FOUND");
					var newJournal = {
						Id: 0,
						Title: def.title,
						AccountId: journal.get("user").Id,
						CustomJournalId:def.id
					};
					var url = config.journal.urlSaveJournal.replace("{id}", 0);
					$.ajax({
						url: url,
						type: "POST",
						async:false,
						contentType: "application/json;charset=utf-8",
						data: JSON.stringify(newJournal),
						success: function(savedJournal) {
							console.log("Journal " + savedJournal.Title + " created");
						},
						error: function(xhr, status, error) {
							alert(status + "\n" + error);
						}
					});
				}
			}
		}*/
	},
	
	clearData: function() {
		journal.get("dsJournals").data([]);
		journal.get("dsEntries").data([]);
		journal.get("dsAllEntries").data([]);
	},

	addJournal: function(e) {
		var newJournal = { Id: 0, Title: "" };
		journal.set("editingJournal", newJournal);
		journal.set("journalDialogTitle", "Add Journal");
		$("#journal-edit-title").text("Add Journal");
		$("#journal_id").val(journal.get("editingJournal").Id);
		$("#journal_title").val(journal.get("editingJournal").Title);
		$("#button-journal-delete").hide();
		var dialog = $("#journal-edit").data("kendoMobileModalView");
		dialog.open();
		baja.set("modalOpen", true);

	},

	editJournal: function(e) {
		var dialog = $("#journal-edit").data("kendoMobileModalView");
		dialog.open();
		$("#journal-edit-title").text("Edit Journal");
		baja.set("modalOpen", true);
		journal.set("editingJournal", journal.get("journal"));
		journal.set("journalDialogTitle", "Edit Journal");
		$("#journal_id").val(journal.get("editingJournal").Id);
		$("#journal_title").val(journal.get("editingJournal").Title);
		$("#button-journal-delete").show();
		//journal.openJournalEdit(e);
	},

	saveJournal: function(e) {
		$(".loading-message").text("Saving...");
		app.showLoading();
		var journalId = $("#journal_id").val();
		var newJournal = {
			Id: journalId,
			Title: $.trim($("#journal_title").val()).length > 0 ? $.trim($("#journal_title").val()) : "Journal",
			AccountId: journal.get("user").Id
		};
		var url = config.journal.urlSaveJournal.replace("{id}", journalId);
		$.ajax({
			url: url,
			type: "POST",
			contentType: "application/json;charset=utf-8",
			data: JSON.stringify(newJournal),
			success: function(savedJournal) {
                var theJournal = new kendo.data.ObservableObject(savedJournal);
				if (journalId == 0) {
					journal.get("dsJournals").data().unshift(theJournal);
				}
				else {
					var allJournals = journal.get("dsJournals").data();
					for(var i=0;i < allJournals.length; i++) {
						if (allJournals[i].Id == journalId) {
							allJournals[i] = theJournal;
							break;
						}
					}
					journal.set("journal", theJournal);
				}

				var view = $("#journal-edit").data("kendoMobileModalView");
				view.close();
				baja.set("modalOpen", false);
                var list = $("#list-journals").data("kendoMobileListView");
                list.refresh();
			},
			error: function() {
				alert("error saving journal");
			},
			complete: function() {
				app.hideLoading();
				$(".loading-message").text("Loading...");
			}
		});
	},

	deleteJournal: function(e) {
		navigator.notification.confirm(
			'This will permanently delete your journal and any entries it contains.\nAre you sure you want to do this?',
			function(buttonIndex) {
				if (buttonIndex == 1) {
					var journalId = $("#journal_id").val();
					var url = config.journal.urlDeleteJournal.replace("{id}", journalId);
					$.ajax({
						url: url,
						type: "DELETE",
						success: function() {
                            var journalId = $("#journal_id").val();
                            var allJournals = journal.get("dsJournals").data();
            				for(var i=0;i < allJournals.length; i++) {
        						if (allJournals[i].Id == journalId) {
        							journal.get("dsJournals").data().splice(i, 1);
        							break;
        						}
        					}
							var view = $("#journal-edit").data("kendoMobileModalView");
							view.close();
							baja.set("modalOpen", false);
                            var list = $("#list-journals").data("kendoMobileListView");
                            list.refresh();
							app.navigate("#:back");
						},
						error: function() {
							alert("error deleting journal");
						}
					});
				}
			},
			'Confirm Delete',
			'Yes,No'
		);
	},

	addEntry: function(e) {
		journal.set("mode", "add");
		var entry = { Id: 0, Created: new Date(), Title: "", Content: "", Modified: new Date(), EntryDate: new Date(), CustomJournalId: journal.get("journal").get("CustomJournalId") };
		journal.set("editingEntry", entry);
		$("#entry_id").val(journal.get("editingEntry").Id);
		journal.set("entryDialogTitle", "Add Journal Entry");
		
		// custom journals
		if (entry.CustomJournalId != null && config.journal.custom != null && config.journal.custom.length > 0) {
			for(var i=0;i < config.journal.custom.length;i++) {
				var customDef = config.journal.custom[i];
				if (customDef.id == entry.CustomJournalId) {
					journal.set("customJournalDef", customDef);
					journal.set("currentPartIndex", 0);
					entry.parts = customDef.parts;
					journal.set("editingEntry", entry);
					break;
				}
			}
		}
		
		app.navigate("journal-entry-edit");
	},

	editEntry: function(e) {
		journal.set("mode", "edit");
		var entry = journal.get("entry");
		journal.set("editingEntry", entry);
		$("#entry_id").val(journal.get("editingEntry").Id);
		journal.set("entryDialogTitle", "Edit Journal Entry");
		
		// custom journals
		console.log("entry CJI: " + entry.CustomJournalId);
		if (entry.CustomJournalId != null && config.journal.custom != null && config.journal.custom.length > 0) {
			console.log("setting up custom entry...");
			for(var i=0;i < config.journal.custom.length;i++) {
				var customDef = config.journal.custom[i];
				if (customDef.id == entry.CustomJournalId) {
					console.log("parsing custom content...");
					journal.set("customJournalDef", customDef);
					journal.set("currentPartIndex", 0);
					var content = htmlDecode(entry.Content);
					var partContent = content.split("~|~");
					entry.parts = [];
					for(var j=0;j < partContent.length;j++) {
						var part = { text: partContent[j] };
						entry.parts[entry.parts.length] = part;
					}
					journal.set("editingEntry", entry);
					break;
				}
			}
		}
		
		/*if (baja.get("isTablet")) {
			var dialog = $("#journal-entry-edit-modal").data("kendoMobileModalView");
			dialog.open();
			if (!journal.get("editingInitialized")) {
				journal.initJournalEntryEdit();
				journal.set("editingInitialized", true);
			}
			journal.showJournalEntryEdit();
		}
		else {*/
			app.navigate("journal-entry-edit");
		//}
	},
	
	saveEntry: function(e) {
		$(".loading-message").text("Saving...");
		app.showLoading();
		var entryId = $("#entry_id").val();
		console.log("entry id: " + entryId);
		var edited = journal.get("editingEntry");
		var newEntry = {
			Id: entryId,
			JournalId: journal.get("journal").Id,
			Title: $("#entry-edit-title").val(),
			Content: htmlEncode($("#entry-edit-div").html()),
			EntryDate: kendo.parseDate($("#entry-edit-date").val())
		};
		
		if (edited.CustomJournalId != null) {
			edited.parts[journal.get("currentPartIndex")].text = $("#entry-edit-div").html();
			var html = "";
			for(var i=0;i < edited.parts.length;i++) {
				html += edited.parts[i].text + "~|~";
			}
			html = html.substr(0, html.length - 3);
			console.log("NEW CONTENT: " + html);
			newEntry.Content = htmlEncode(html);
			newEntry.Title = "Devotions";
			newEntry.CustomJournalId = edited.CustomJournalId;
		}
		
		var url = config.journal.urlSaveEntry.replace("{id}", entryId);
		$.ajax({
			url: url,
			type: "POST",
			contentType: "application/json;charset=utf-8",
			data: JSON.stringify(newEntry),
			success: function(savedEntry) {
                var entry = new kendo.data.ObservableObject(savedEntry);
				if (entryId == 0) {
					journal.get("dsAllEntries").data().unshift(entry);
				}
				else {
					var allEntries = journal.get("dsAllEntries").data();
					for(var i=0;i < allEntries.length; i++) {
						if (allEntries[i].Id == entryId) {
                            console.log("updated allEntries");
							allEntries[i] = entry;
							break;
						}
					}
                    var entries = journal.get("dsEntries").data();
    				for(var i=0;i < entries.length; i++) {
						if (entries[i].Id == entryId) {
                            console.log("updated entries");
							entries[i] = entry;
							break;
						}
					}
                    var list = $("#list-journal-entries").data("kendoMobileListView");
                    list.refresh();
				}
				journal.set("entry", entry);
				journal.set("mode", "edit");
				/*if (baja.get("isTablet")) {
					var dialog = $("#journal-entry-edit-modal").data("kendoMobileModalView");
					dialog.close();
				}
				else {*/
					app.navigate("journal-entry");
				//}
			},
			error: function(xhr, status, error) {
				console.log(status + ":" + error);
				alert("error saving entry");
			},
			complete: function() {
				app.hideLoading();
				$(".loading-message").text("Loading...");
			}
		});
	},

	cancelEditEntry: function(e) {
		navigator.notification.confirm("If you leave this journal entry without saving you will lose any unsaved changes.\nAre you sure you want to do this?", function(buttonIndex) {
			if (buttonIndex == 1) {
				if (journal.get("mode") == "add") {
					app.navigate("#journal-entries", "slide:right");
				}
				else {
					app.navigate("#journal-entry", "slide:right");
				}
			}
		}, "Just Checking...", "Yes,No");
	},

	deleteEntry: function(e) {
		navigator.notification.confirm(
			'This will permanently delete your entry.\nAre you sure you want to do this?',
			function(buttonIndex) {
				if (buttonIndex == 1) {
					var entryId = $("#entry_id").val();
					var url = config.journal.urlDeleteEntry.replace("{id}", entryId);
					$.ajax({
						url: url,
						type: "DELETE",
						success: function() {
							var allEntries = journal.get("dsAllEntries").data();
							for(var i=0;i < allEntries.length; i++) {
								if (allEntries[i].Id == entryId) {
									allEntries.splice(i,1);
									journal.get("dsAllEntries").data(allEntries);
									break;
								}
							}
                            var list = $("#list-journal-entries").data("kendoMobileListView");
                            list.refresh();
							app.navigate("journal-entries", "slide:left reverse");
						},
						error: function() {
							alert("error deleting entry");
						}
					});
				}
			},
			'Confirm Delete',
			'Yes,No'
		);
	},

	loadMoreEntries: function(e) {
		app.showLoading();
		journal.set("page", parseInt(journal.get("page")) + 1);
		journal.get("dsEntries").read();
	},

	selectJournal: function(journalItem) {
		app.showLoading();
		journal.set("hasMorePages", false);
		journal.get("dsEntries").data([]);
		journal.get("dsAllEntries").data([]);
		journal.set("journal", journalItem);
		journal.set("page", 1);
		journal.get("dsEntries").read();
	    app.navigate("journal-entries");
	    setTimeout(function() {
	    	app.scroller().reset();
	    }, 400);
	},

	selectJournalEntry: function(entry) {
		journal.set("entry", entry);
	    app.navigate("journal-entry");
	    setTimeout(function() {
	    	app.scroller().reset();
	    }, 400);
	},

	initHome: function(e) {
		$("#list-journals").kendoMobileListView({
			dataSource: journal.get("dsJournals"),
			autoBind: false,
			template: $("#template-journal").html(),
			click: function(e) {
				journal.selectJournal(e.dataItem);
			}
		});
		journal.get("dsAllEntries").data([]);
		journal.get("dsEntries").data([]);
		if (journal.get("user") != null) {
			journal.get("dsJournals").read();
		}
	},

	showHome: function(e) {
		baja.trackView("/journals");
		//AppiraterPlugin.sigEvent();
	},

	openJournalEdit: function(e) {
		console.log("openJournalEdit");
		baja.trackView("/journal-edit");
		var title = journal.get("journalDialogTitle");
		if (journal.isJournalEditable()) {
			$("#button-journal-delete").show();
		}
		else {
			$("#button-journal-delete").hide();
		}
	},

	closeJournalEdit: function() {
		baja.set("modalOpen", false);
	},

	initJournalEntries: function(e) {
		$("#list-journal-entries").kendoMobileListView({
			dataSource: journal.get("dsAllEntries"),
			autoBind: true,
			template: $("#template-journal-entry").html(),
			click: function(e) {
                //console.log(e.dataItem);
				journal.selectJournalEntry(e.dataItem);
			}
		});
	},

	showJournalEntries: function(e) {
		baja.trackView("/journal-entries");
		journal.set("lastView", "journal-entries");
	},

	initJournalEntry: function(e) {

	},

	showJournalEntry: function(e) {
		baja.trackView("/journal-entry");
		journal.set("lastView", "journal-entry");
		
		$("#entry-content-custom").hide();
		$("#entry-content-default").show();
		
		var item = journal.get("entry");
		if (item.CustomJournalId != null && config.journal.custom != null && config.journal.custom.length > 0) {
			for(var i=0;i < config.journal.custom.length;i++) {
				var customDef = config.journal.custom[i];
				if (customDef.id == item.CustomJournalId) {
					console.log("formatting custom content...");
					journal.set("customJournalDef", customDef);
					var content = htmlDecode(item.Content);
					var partContent = content.split("~|~");
					var html = ""
					for(var j=0;j < partContent.length;j++) {
						html += "<div class='entry-part-title'>" + customDef.parts[j].title + "</div>";
						html += "<div>" + partContent[j] + "</div><br/>";
					}
					$("#entry-content-custom").html(html);
					$("#entry-content-custom").show();
					$("#entry-content-default").hide();
					break;
				}
			}
		}
	},

    initJournalEntryEdit: function(e) {
    	console.log("initJournalEntryEdit");
        $("#entry-edit-title").live("focus", function(e) {
        	console.log("title focus");
        	$(".format-button").fadeOut();
        });

		$("#entry-edit-date").live("focus", function(event) {
			if (kendo.support.mobileOS.name == "android") {
				var currentField = $(this);
				var myNewDate = new Date(Date.parse(currentField.val())) || new Date();
				
				// Same handling for iPhone and Android
				window.plugins.datePicker.show({
					date : myNewDate,
					mode : 'date', // date or time or blank for both
					allowOldDates : true
				}, function(returnDate) {
					var newDate = new Date(returnDate);
					currentField.val(newDate.toString("dd/MMM/yyyy"));
		
					// This fixes the problem you mention at the bottom of this script with it not working a second/third time around, because it is in focus.
					currentField.blur();
				});
			}
		});

		if (!baja.get("isTablet")) {
			$("#entry-edit-div").bind("touchmove", function(e) {
				console.log("bind: editor touchmove");
				e.stopPropagation();
			});
		}

        $("#entry-edit-div").live("focus", function(e) {
        	$(".format-button").fadeIn();
        	console.log("editor focus");
        	if (baja.get("isTablet")) {
        		setTimeout(function() { $("html, body").animate({ scrollTop:0 }, 500); }, 250);
        	}
        	else {
        		if (kendo.support.mobileOS.name == "ios") {
        			$(this).css("height", "198px");
        			$(".km-tabstrip").css("visibility", "hidden");
        		}
        		else {
        			journal.set("editHeight", $(this).height());
        			//$(this).css("height", "160px");
        			$(".km-tabstrip").hide();
        		}
        		setTimeout(function() { $("html, body").animate({ scrollTop:0 }, 500); }, 250);
        	}

        });
        
        $("#entry-edit-div").live("blur", function(e) {
        	console.log("editor blur");
        	if (baja.get("isTablet")) {
        		$("html, body").animate({ scrollTop:0 }, 200);
        	}
        	else {
				if (kendo.support.mobileOS.name == "ios") {
					$(this).css("height", "inherit");
					$(".km-tabstrip").css("visibility", "visible");
					$("html, body").animate({ scrollTop:0 }, 200);
				}
				else {
					$(this).height(journal.get("editHeight"));
					$(".km-tabstrip").show();
				}
			}
        });
        
        $(document).bind("selectionchange", function() {
            journal.updateEditState();
        });

		$(".format-button").live("touchend", function(e) {
			var command = $(this).attr("ref");
			if (command != null) {
				e.preventDefault();
				e.stopPropagation();
		        execEditorCommand(command);
				journal.updateEditState();
			}
		});
	},

	showJournalEntryEdit: function(e) {
		if (journal.get("refreshEditor")) {
			var entry = journal.get("editingEntry");
			if (!journal.get("scroller") && kendo.support.mobileOS.name == "ios") {
				if (!baja.get("isTablet")) {
					console.log("creating scroller");
					var scroller = $("#edit-scroller").kendoMobileScroller();
					journal.set("scroller", true);
				}
			}
			baja.trackView("/journal-entry-edit");
			journal.set("entryDialogTitle", "Add Journal Entry");
			
			var entryDate = kendo.parseDate(entry.EntryDate);
			if (kendo.support.mobileOS.name == "android") {
				$("#entry-edit-date").val(kendo.toString(entryDate,"MMMM dd, yyyy"));
			}
			else {
				$("#entry-edit-date").val(kendo.toString(entryDate,"yyyy-MM-dd"));
			}
			$("#entry-edit-title").val(entry.Title);
			
			// custom journal, special entry with parts
			if (entry.CustomJournalId != null) {
				$("#journal-edit-custom-title").show();
				$("#journal-entry-detail  .entry-date-block").hide();
				$("#entry-edit-date").hide();
				$("#entry-edit-title").hide();
				var partText = entry.parts[journal.get("currentPartIndex")].text;
				$("#entry-edit-div").html(partText);
			}
			// standard journal entry
			else {
				$("#journal-edit-custom-title").hide();
				$("#journal-entry-detail  .entry-date-block").show();
				$("#entry-edit-date").show();
				$("#entry-edit-title").show();
				$("#entry-edit-div").html(journal.entryContentHtml);
			}
			console.log("edit stuff ready");
			journal.set("lastView", "journal-entry-edit");
			journal.set("refreshEditor", true);
		}
	},

	beforeShowRedirect: function(e) {
		journal.set("lastView", "journal");
		e.preventDefault();
		app.navigate("journal");
	},
	
	returnToView: function(e) {
		var lastView = journal.get("lastView");
		console.log("RETURN TO: " + lastView);
		if (lastView != "journal") {
			e.preventDefault();
			console.log("redirecting to: " + lastView);
			if (lastView == "journal-entry-edit") {
				journal.set("refreshEditor", false);
			}
			app.navigate(lastView);
		}
	},
	
	getEntryDatePart: function(entryDate, part) {
		return kendo.toString(kendo.parseDate(entryDate), part);
	},

	updateEntryEditDate: function() {
		if ($("#entry-edit-date").val() != "") {
			journal.get("editingEntry").set("EntryDate", kendo.parseDate($("#entry-edit-date").val()));
		}
		else {
			var entryDate = kendo.parseDate(journal.get("editingEntry").EntryDate);
	        $("#entry-edit-date").val(kendo.toString(entryDate,"yyyy-MM-dd"));
		}
	},

    updateEditState: function() {
        var aryCommands = ["bold","italic","underline"];
        for(var i=0;i < aryCommands.length;i++) {
            var state = document.queryCommandState(aryCommands[i]);
            var button = $(".format-button[ref='" + aryCommands[i] + "']");
            if (state) {
			    button.removeClass("button-on").addClass("button-on");
			}
            else {
                button.removeClass("button-on");
            }
        }
    },
    
	share: function(e) {
		var title = journal.get("entry").Title + " - " + kendo.toString(kendo.parseDate(journal.get("entry").EntryDate), "yyyy-MM-dd");
		var shareData = { text: journal.entryContentShareText(), title: title, html:journal.entryContentShareHtml() };
		baja.showSharePanel(e.button, "journal", false, shareData);
	},
	
	navigatePart: function(e) {
		var entry = journal.get("editingEntry");
		var def = journal.get("customJournalDef");
		var maxParts = def.parts.length;
		var index = journal.get("currentPartIndex");
		var oldIndex = journal.get("currentPartIndex");
		var direction = e.button.attr("rel");
		switch (direction) {
			case "right":
				index++;
				console.log("up");
				break;
				
			case "left":
				index--;
				console.log("down");
				break;
		}
		entry.parts[oldIndex].text = $("#entry-edit-div").html();
		console.log(entry.parts[oldIndex].text);
		journal.set("currentPartIndex", index);
		var partText = entry.parts[index].text;
		$("#entry-edit-div").html(partText);
		e.stopPropagation();
	}
	
});

// models
var JournalEntry = kendo.data.Model.define( {
    id: "Id",
    fields: {
    	"JournalId": { type: "number" },
        "Title": { type: "string" },
        "Content": { type: "string" },
        "Created": { type: "date" },
        "Modified": { type: "date" },
        "EntryDate": { type: "date" },
        "CustomJournalId": { type: "string" }
    }
});
var dboptions = null;

journal.init();
