var GitVisualizer = React.createClass({
	render: function () {
		var commits = this.props.commits || [];
		var originalCommits = this.props.originalCommits || [];
		var activeBranch = this.props.activeBranch || "master";
		var isTiedToOrigin = this.props.isTiedToOrigin;
		var originUrl = this.props.originUrl;
		var newOriginUrl = this.props.newOriginUrl;
		var onSelectCommit = this.props.onSelectCommit;

		var origMap = {};
		for (var i = 0; i < originalCommits.length; i++) {
			if (originalCommits[i].sha) {
				origMap[originalCommits[i].sha] = originalCommits[i];
			}
		}

		var modifiedCount = 0;
		for (var j = 0; j < commits.length; j++) {
			var curr = commits[j];
			var orig = origMap[curr.sha] || originalCommits[j];
			if (orig && (
				curr.message !== orig.message ||
				curr.author !== orig.author ||
				curr.email !== orig.email ||
				curr.date !== orig.date ||
				curr.time !== orig.time
			)) {
				modifiedCount++;
			}
		}

		var originDisplay = "No Origin";
		if (newOriginUrl && newOriginUrl.trim()) {
			originDisplay = "Origin: " + newOriginUrl.trim() + " (Pending)";
		} else if (originUrl) {
			originDisplay = "Origin: " + originUrl;
		}

		return (
			<div className="git-visualizer-card">
				<div className="visualizer-header">
					<div className="visualizer-title">
						<i className="sitemap icon" style={{ color: "var(--color-accent)" }}></i>
						<span>Commit History Visualizer</span>
						<span className="zero-pill zero-pill-neutral">Live Preview</span>
					</div>
					<div className="visualizer-badges">
						<span className="zero-pill zero-pill-accent">
							<i className="code branch icon"></i> {activeBranch}
						</span>
						<span className={"zero-pill " + (isTiedToOrigin || newOriginUrl ? "zero-pill-accent" : "zero-pill-neutral")} title={originDisplay}>
							<i className={(isTiedToOrigin || newOriginUrl ? "cloud" : "unlink") + " icon"}></i>
							{originDisplay.length > 34 ? originDisplay.slice(0, 34) + "..." : originDisplay}
						</span>
						<span className="zero-pill zero-pill-neutral">
							{commits.length} commits
						</span>
						{modifiedCount > 0 ? (
							<span className="zero-pill zero-pill-orange">
								<i className="edit outline icon"></i> {modifiedCount} pending
							</span>
						) : (
							<span className="zero-pill zero-pill-green">
								<i className="check icon"></i> Synced
							</span>
						)}
					</div>
				</div>

				<div className="visualizer-scroll-area">
					<div className="visualizer-track">
						<div className="visualizer-rail"></div>
						{commits.map(function (c, idx) {
							var orig = origMap[c.sha] || originalCommits[idx];
							var isMod = orig && (
								c.message !== orig.message ||
								c.author !== orig.author ||
								c.email !== orig.email ||
								c.date !== orig.date ||
								c.time !== orig.time
							);
							var isHead = (idx === 0);

							var tooltip = "Commit: " + (c.sha ? c.sha.slice(0, 7) : "") + "\nMessage: " + c.message + "\nAuthor: " + c.author + "\nDate: " + c.date + " " + c.time;
							if (isMod) {
								tooltip += "\n\n[MODIFIED (PENDING CONFIRMATION)]";
								if (c.message !== orig.message) tooltip += "\nOriginal Msg: " + orig.message;
								if (c.author !== orig.author) tooltip += "\nOriginal Author: " + orig.author;
								if (c.date !== orig.date || c.time !== orig.time) tooltip += "\nOriginal Date: " + orig.date + " " + orig.time;
							}

							return (
								<div
									key={c.sha || idx}
									className="visualizer-node"
									onClick={function () { if (onSelectCommit) onSelectCommit(idx); }}
									title={tooltip}
								>
									<div className="visualizer-node-badges">
										{isHead ? <span className="v-badge v-badge-head">HEAD</span> : null}
										{isHead ? <span className="v-badge v-badge-branch">{activeBranch}</span> : null}
										{isHead && (isTiedToOrigin || newOriginUrl) ? <span className="v-badge v-badge-origin">origin</span> : null}
										{isMod ? <span className="v-badge v-badge-modified">EDITED</span> : null}
									</div>

									<div className={"node-circle " + (isMod ? "modified" : "")}>
										{commits.length - idx}
									</div>

									<div className={"node-sha " + (isMod ? "modified" : "")}>
										{c.sha ? c.sha.slice(0, 7) : "commit"}
										{isMod ? " *" : ""}
									</div>

									<div className={"node-msg-preview " + (isMod ? "modified" : "")}>
										{c.message || "(no message)"}
									</div>

									<div className={"node-author " + (isMod ? "modified" : "")}>
										{isMod ? <i className="pencil alternate icon" style={{ fontSize: "9px", marginRight: "3px" }}></i> : null}
										{c.author || "Unknown"}
									</div>

									<div className={"node-date " + (isMod ? "modified" : "")}>
										{c.date || ""}
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="visualizer-hint">
					<i className="info circle icon"></i>
					<span>Interactive ambient graph: click any node to focus commit row. Edits are live visual previews and will <strong>NOT</strong> modify git until you confirm.</span>
				</div>
			</div>
		);
	}
});

var CommitForm = React.createClass({
	getInitialState: function () {
		var firstCommit = this.props.commits && this.props.commits.length > 0 ? this.props.commits[0] : null;
		var now = new Date();
		var todayStr = now.getFullYear() + "-" + ("0" + (now.getMonth() + 1)).slice(-2) + "-" + ("0" + now.getDate()).slice(-2);
		var timeStr = ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2) + ":" + ("0" + now.getSeconds()).slice(-2);

		return {
			commits: this.props.commits || [],
			originalCommits: JSON.parse(JSON.stringify(this.props.commits || [])),
			command: "",
			address: this.props.address || "",
			rev: this.props.rev || "HEAD",
			branches: this.props.branches || [this.props.rev || "master"],
			activeBranch: this.props.activeBranch || this.props.rev || "master",
			hasOrigin: !!this.props.hasOrigin,
			originUrl: this.props.originUrl || "",
			isTiedToOrigin: !!this.props.isTiedToOrigin,
			newOriginUrl: "",
			showOriginEdit: false,
			pushOrigin: !!this.props.isTiedToOrigin,
			hasMore: !!this.props.hasMore,
			total: this.props.total || null,
			loadingMore: false,
			showAddModal: false,
			addingCommit: false,
			addCommitError: "",
			statusMessage: "",
			statusType: "info",
			runningCommand: false,
			// Make Changes / Confirmation Modal
			showConfirmModal: false,
			applyingChanges: false,
			confirmError: "",
			confirmTargetBranch: "",
			// Branch Creation Modal
			showBranchModal: false,
			newBranchName: "",
			creatingBranch: false,
			branchError: "",
			newCommit: {
				message: "",
				author: firstCommit ? firstCommit.author : "",
				email: firstCommit ? firstCommit.email : "",
				date: todayStr,
				time: timeStr
			},
			showLLMModal: false,
			llmProvider: localStorage.getItem("preferred_llm_provider") || "openrouter",
			llmApiKey: localStorage.getItem((localStorage.getItem("preferred_llm_provider") || "openrouter") + "_api_key") || "",
			llmModel: (localStorage.getItem("preferred_llm_provider") || "openrouter") === "openrouter" ? "anthropic/claude-3.5-sonnet" : ((localStorage.getItem("preferred_llm_provider") || "openrouter") === "deepseek" ? "deepseek-chat" : "gpt-4o"),
			llmBaseUrl: localStorage.getItem("custom_api_url") || "",
			llmPrompt: "",
			llmSystemPrompt: "",
			loadingLLM: false,
			llmError: "",
			llmGeneratedCommits: []
		};
	},

	componentDidMount: function () {
		var that = this;
		window.triggerMakeChanges = function () {
			that.openConfirmModal();
		};
		window.triggerNewBranch = function () {
			that.openBranchModal();
		};
		window.triggerLLMModal = function () {
			that.toggleLLMModal();
		};
		this.updateSmartContext();
	},

	componentWillReceiveProps: function (nextProps) {
		var firstCommit = nextProps.commits && nextProps.commits.length > 0 ? nextProps.commits[0] : null;
		this.setState({
			commits: nextProps.commits || [],
			originalCommits: JSON.parse(JSON.stringify(nextProps.commits || [])),
			command: "",
			address: nextProps.address || "",
			rev: nextProps.rev || "HEAD",
			branches: nextProps.branches || this.state.branches,
			activeBranch: nextProps.activeBranch || nextProps.rev || "master",
			hasOrigin: !!nextProps.hasOrigin,
			originUrl: nextProps.originUrl || "",
			isTiedToOrigin: !!nextProps.isTiedToOrigin,
			pushOrigin: !!nextProps.isTiedToOrigin,
			hasMore: !!nextProps.hasMore,
			total: nextProps.total || null,
			newCommit: Object.assign({}, this.state.newCommit, {
				author: firstCommit ? firstCommit.author : this.state.newCommit.author,
				email: firstCommit ? firstCommit.email : this.state.newCommit.email
			})
		}, this.updateSmartContext);
	},

	updateSmartContext: function () {
		var modified = this.countModified();
		var text = "Zero Interface: Ready.";
		if (modified > 0) {
			text = "AI Context: " + modified + " commit(s) edited. Press 'Make Changes' to review and confirm.";
		} else if (this.state.isTiedToOrigin) {
			text = "Context: Branch '" + this.state.rev + "' tied to origin (" + this.state.originUrl + ").";
		} else {
			text = "Context: Local branch '" + this.state.rev + "' with " + this.state.commits.length + " commits loaded.";
		}
		$("#smart-context-text").text(text);
		$("#smart-context-bar").fadeIn(200);
	},

	inputChange: function (index, field, event) {
		var value = event.target.value;
		var commits = this.state.commits.slice();
		var commit = Object.assign({}, commits[index]);
		commit[field] = value;
		commits[index] = commit;

		this.setState({
			commits: commits,
			command: ""
		}, this.updateSmartContext);
	},

	isModified: function (index) {
		var current = this.state.commits[index];
		var original = this.state.originalCommits[index];
		if (!current || !original) return false;
		return (
			current.message !== original.message ||
			current.author !== original.author ||
			current.email !== original.email ||
			current.date !== original.date ||
			current.time !== original.time
		);
	},

	countModified: function () {
		var count = 0;
		for (var i = 0; i < this.state.commits.length; i++) {
			if (this.isModified(i)) count++;
		}
		return count;
	},

	getModifiedCommits: function () {
		var list = [];
		for (var i = 0; i < this.state.commits.length; i++) {
			if (this.isModified(i)) {
				list.push({
					current: this.state.commits[i],
					original: this.state.originalCommits[i],
					index: i
				});
			}
		}
		return list;
	},

	scrollToCommit: function (index) {
		var el = document.getElementById("commit-row-" + index);
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "center" });
			$(el).addClass("commit-row-highlight");
			setTimeout(function () {
				$(el).removeClass("commit-row-highlight");
			}, 1500);
		}
	},

	handleBranchChange: function (event) {
		var val = event.target.value;
		if (val === "__CREATE_NEW__") {
			this.openBranchModal();
		} else {
			this.switchBranch(val);
		}
	},

	switchBranch: function (branchName) {
		var that = this;
		that.setState({ statusMessage: "Switching to branch " + branchName + "...", statusType: "info" });

		$.post("/get_commits", {
			address: that.state.address,
			rev: branchName,
			limit: 20,
			skip: 0
		}, function (data) {
			if (data.success) {
				that.setState({
					commits: data.commits || [],
					originalCommits: JSON.parse(JSON.stringify(data.commits || [])),
					rev: data.rev || branchName,
					activeBranch: data.active_branch || branchName,
					branches: data.branches || that.state.branches,
					hasOrigin: !!data.has_origin,
					originUrl: data.origin_url || "",
					isTiedToOrigin: !!data.is_tied_to_origin,
					hasMore: data.has_more,
					total: data.total,
					statusMessage: "Active branch: " + (data.active_branch || branchName),
					statusType: "success"
				}, that.updateSmartContext);
				$("#rev-input").val(data.active_branch || branchName);
				localStorage.setItem("git_repo_rev", data.active_branch || branchName);
			} else {
				that.setState({
					statusMessage: data.error || "Failed to switch branch.",
					statusType: "error"
				});
			}
		}).fail(function () {
			that.setState({
				statusMessage: "Network error switching branch.",
				statusType: "error"
			});
		});
	},

	openBranchModal: function () {
		this.setState({
			showBranchModal: true,
			newBranchName: "",
			branchError: ""
		});
	},

	closeBranchModal: function () {
		this.setState({
			showBranchModal: false,
			branchError: ""
		});
	},

	submitCreateBranch: function (e) {
		if (e) e.preventDefault();
		var that = this;
		var name = that.state.newBranchName.trim();
		if (!name) {
			that.setState({ branchError: "Branch name cannot be empty." });
			return;
		}

		that.setState({ creatingBranch: true, branchError: "" });

		$.post("/create_branch", {
			address: that.state.address,
			branch_name: name,
			start_point: that.state.rev,
			checkout: "true"
		}, function (data) {
			that.setState({ creatingBranch: false });
			if (data.success) {
				that.setState({
					showBranchModal: false,
					branches: data.branches,
					activeBranch: data.branch,
					rev: data.branch,
					statusMessage: data.message || "Branch created successfully!",
					statusType: "success"
				});
				$("#rev-input").val(data.branch);
				localStorage.setItem("git_repo_rev", data.branch);
				that.switchBranch(data.branch);
			} else {
				that.setState({ branchError: data.error || "Failed to create branch." });
			}
		}).fail(function (xhr, status, err) {
			that.setState({
				creatingBranch: false,
				branchError: "Network error: " + (err || "Could not reach server.")
			});
		});
	},

	openConfirmModal: function () {
		this.setState({
			showConfirmModal: true,
			confirmError: "",
			confirmTargetBranch: ""
		});
	},

	closeConfirmModal: function () {
		this.setState({
			showConfirmModal: false,
			confirmError: ""
		});
	},

	confirmMakeChanges: function () {
		var that = this;
		that.setState({ applyingChanges: true, confirmError: "" });

		var shouldChangeOrigin = (that.state.newOriginUrl && that.state.newOriginUrl.trim() !== "" && that.state.newOriginUrl.trim() !== that.state.originUrl);

		$.post("/make_changes", {
			address: that.state.address,
			rev: that.state.rev,
			target_branch: that.state.confirmTargetBranch.trim(),
			commits: JSON.stringify(that.state.commits),
			old_commits: JSON.stringify(that.state.originalCommits),
			change_origin: shouldChangeOrigin ? "true" : "false",
			new_origin_url: that.state.newOriginUrl.trim(),
			push_origin: that.state.pushOrigin ? "true" : "false"
		}, function (data) {
			that.setState({ applyingChanges: false });
			if (data.success) {
				that.setState({
					showConfirmModal: false,
					statusMessage: data.message || "Changes applied successfully!",
					statusType: "success",
					commits: data.commits || [],
					originalCommits: JSON.parse(JSON.stringify(data.commits || [])),
					rev: data.active_branch || that.state.rev,
					activeBranch: data.active_branch || that.state.rev,
					branches: data.branches || that.state.branches,
					hasOrigin: !!data.has_origin,
					originUrl: data.origin_url || that.state.originUrl,
					isTiedToOrigin: !!data.is_tied_to_origin,
					newOriginUrl: "",
					showOriginEdit: false,
					total: data.total,
					command: ""
				}, that.updateSmartContext);
				$("#rev-input").val(data.active_branch || that.state.rev);
				localStorage.setItem("git_repo_rev", data.active_branch || that.state.rev);
			} else {
				that.setState({
					confirmError: data.error || "Failed to apply changes."
				});
			}
		}).fail(function (xhr, status, err) {
			that.setState({
				applyingChanges: false,
				confirmError: "Network error: " + (err || "Could not reach server.")
			});
		});
	},

	loadMoreCommits: function () {
		var that = this;
		that.setState({ loadingMore: true });

		$.post("/get_commits", {
			address: that.state.address,
			rev: that.state.rev,
			limit: 20,
			skip: that.state.commits.length
		}, function (data) {
			that.setState({ loadingMore: false });
			if (data.success && data.commits && data.commits.length > 0) {
				var newCommits = that.state.commits.concat(data.commits);
				var newOriginal = that.state.originalCommits.concat(JSON.parse(JSON.stringify(data.commits)));
				that.setState({
					commits: newCommits,
					originalCommits: newOriginal,
					hasMore: data.has_more,
					total: data.total
				});
			} else {
				that.setState({ hasMore: false });
			}
		}).fail(function () {
			that.setState({
				loadingMore: false,
				statusMessage: "Failed to load more commits.",
				statusType: "error"
			});
		});
	},

	toggleAddModal: function () {
		this.setState({
			showAddModal: !this.state.showAddModal,
			addCommitError: "",
			showLLMModal: false
		});
	},

	toggleLLMModal: function () {
		var that = this;
		var nextState = !that.state.showLLMModal;
		var provider = that.state.llmProvider || "openrouter";
		var savedKey = localStorage.getItem(provider + "_api_key") || "";
		that.setState({
			showLLMModal: nextState,
			showAddModal: false,
			llmApiKey: savedKey || that.state.llmApiKey,
			llmBaseUrl: localStorage.getItem("custom_api_url") || that.state.llmBaseUrl,
			llmError: ""
		});

		if (nextState && !that.state.llmSystemPrompt) {
			$.get("/get_llm_prompt", function (data) {
				if (data.success) {
					that.setState({ llmSystemPrompt: data.prompt });
				}
			});
		}
	},

	handleNewCommitChange: function (field, event) {
		var updated = Object.assign({}, this.state.newCommit);
		updated[field] = event.target.value;
		this.setState({ newCommit: updated });
	},

	handleLLMFieldChange: function (field, event) {
		var val = event.target.value;
		var update = {};
		update[field] = val;
		if (field === "llmProvider") {
			localStorage.setItem("preferred_llm_provider", val);
			var key = localStorage.getItem(val + "_api_key") || "";
			update.llmApiKey = key;
			if (val === "openrouter") {
				update.llmModel = "anthropic/claude-3.5-sonnet";
			} else if (val === "deepseek") {
				update.llmModel = "deepseek-chat";
			} else if (val === "openai") {
				update.llmModel = "gpt-4o";
			} else if (val === "groq") {
				update.llmModel = "llama-3.3-70b-versatile";
			} else if (val === "gemini") {
				update.llmModel = "gemini-1.5-flash";
			} else if (val === "custom") {
				update.llmModel = localStorage.getItem("custom_api_model") || "";
				update.llmBaseUrl = localStorage.getItem("custom_api_url") || "";
			}
		} else if (field === "llmApiKey") {
			localStorage.setItem(this.state.llmProvider + "_api_key", val.trim());
			if (typeof updateApiKeyStatusDot === "function") updateApiKeyStatusDot();
		} else if (field === "llmBaseUrl") {
			localStorage.setItem("custom_api_url", val.trim());
		} else if (field === "llmModel" && this.state.llmProvider === "custom") {
			localStorage.setItem("custom_api_model", val.trim());
		}
		this.setState(update);
	},

	generateLLMCommits: function (e) {
		if (e) e.preventDefault();
		var that = this;
		that.setState({ loadingLLM: true, llmError: "" });

		$.post("/llm_generate_commits", {
			address: that.state.address,
			prompt: that.state.llmPrompt,
			provider: that.state.llmProvider,
			api_key: that.state.llmApiKey,
			model: that.state.llmModel,
			base_url: that.state.llmBaseUrl,
			system_prompt: that.state.llmSystemPrompt
		}, function (data) {
			that.setState({ loadingLLM: false });
			if (data.success && data.commits) {
				that.setState({
					llmGeneratedCommits: data.commits,
					statusMessage: "AI synthesized " + data.commits.length + " atomic commits.",
					statusType: "success"
				});
			} else {
				that.setState({ llmError: data.error || "Failed to generate commits via LLM." });
			}
		}).fail(function (xhr, status, err) {
			that.setState({
				loadingLLM: false,
				llmError: "Request failed: " + (err || "Check your API key and connection.")
			});
		});
	},

	applyAllLLMCommits: function () {
		var that = this;
		var commits = that.state.llmGeneratedCommits;
		if (!commits || commits.length === 0) return;

		that.setState({ loadingLLM: true, llmError: "" });

		var index = 0;
		function sendNext() {
			if (index >= commits.length) {
				that.setState({
					loadingLLM: false,
					showLLMModal: false,
					llmGeneratedCommits: [],
					statusMessage: "All " + commits.length + " AI commits created in repository.",
					statusType: "success"
				});
				if (window.refreshCurrentRepo) {
					window.refreshCurrentRepo();
				}
				return;
			}

			var c = commits[index++];
			$.post("/add_commit", {
				address: that.state.address,
				message: c.message,
				author: c.author || c.author_name,
				email: c.email || c.author_email,
				date: c.date,
				time: c.time
			}, function (res) {
				if (res.success) {
					sendNext();
				} else {
					that.setState({
						loadingLLM: false,
						llmError: "Error at commit " + index + ": " + res.error
					});
				}
			}).fail(function () {
				that.setState({
					loadingLLM: false,
					llmError: "Network error creating commit " + index
				});
			});
		}

		sendNext();
	},

	submitNewCommit: function (e) {
		if (e) e.preventDefault();
		var that = this;
		var form = that.state.newCommit;

		if (!form.message.trim()) {
			that.setState({ addCommitError: "Commit message is required." });
			return;
		}

		that.setState({ addingCommit: true, addCommitError: "" });

		$.post("/add_commit", {
			address: that.state.address,
			message: form.message,
			author: form.author,
			email: form.email,
			date: form.date,
			time: form.time
		}, function (data) {
			that.setState({ addingCommit: false });
			if (data.success) {
				that.setState({
					showAddModal: false,
					statusMessage: data.message || "Commit added successfully.",
					statusType: "success",
					newCommit: Object.assign({}, that.state.newCommit, { message: "" })
				});
				if (window.refreshCurrentRepo) {
					window.refreshCurrentRepo();
				}
			} else {
				that.setState({ addCommitError: data.error || "Failed to add commit." });
			}
		}).fail(function () {
			that.setState({
				addingCommit: false,
				addCommitError: "Network error while creating commit."
			});
		});
	},

	doneClick: function (event) {
		var that = this;
		var action = event.target.id;

		if (action === "edit" || action === "regen") {
			var $btn = $(event.target);
			$btn.addClass("loading disabled");

			$.post("/get_command", {
				address: that.state.address,
				rev: that.state.rev,
				commits: JSON.stringify(that.state.commits),
				old_commits: JSON.stringify(that.state.originalCommits)
			}, function (data) {
				$btn.removeClass("loading disabled");
				if (data.success) {
					that.setState({
						command: data.command,
						statusMessage: "",
						statusType: "info"
					});
				} else {
					that.setState({
						statusMessage: data.error || "Error generating command.",
						statusType: "error"
					});
				}
			}).fail(function () {
				$btn.removeClass("loading disabled");
				that.setState({
					statusMessage: "Network error generating command.",
					statusType: "error"
				});
			});
		}
	},

	render: function () {
		var that = this;
		var modifiedCount = that.countModified();
		var modifiedCommitsList = that.getModifiedCommits();
		var originChanged = (that.state.newOriginUrl && that.state.newOriginUrl.trim() !== "" && that.state.newOriginUrl.trim() !== that.state.originUrl);

		// Confirmation Modal
		var confirmModal = null;
		if (that.state.showConfirmModal) {
			confirmModal = (
				<div className="custom-modal-overlay">
					<div className="custom-modal-card">
						<div className="custom-modal-header">
							<h3>
								<i className="shield alternate icon" style={{ color: "var(--color-orange)" }}></i>
								Confirm Git Repository Modifications
							</h3>
							<i className="close icon link" onClick={that.closeConfirmModal}></i>
						</div>

						{that.state.confirmError ? (
							<div className="ui negative message">{that.state.confirmError}</div>
						) : null}

						<div className="ui info message" style={{ margin: "10px 0" }}>
							<i className="info circle icon"></i>
							Review all pending changes below. <strong>No git modifications are executed before you click Confirm.</strong>
						</div>

						<div className="ui form" style={{ marginTop: "16px" }}>
							<div className="two fields">
								<div className="field">
									<label><i className="code branch icon"></i> Target Branch</label>
									<input
										type="text"
										value={that.state.rev}
										readOnly={true}
										style={{ background: "var(--color-secondary)" }}
									/>
									<small style={{ color: "var(--color-text-muted)" }}>
										Branch history to be rewritten.
									</small>
								</div>
								<div className="field">
									<label><i className="plus circle icon"></i> Or Create New Branch for Changes (Optional)</label>
									<input
										type="text"
										placeholder="e.g. rewritten-branch"
										value={that.state.confirmTargetBranch}
										onChange={function (e) { that.setState({ confirmTargetBranch: e.target.value }); }}
									/>
									<small style={{ color: "var(--color-text-muted)" }}>
										Leave blank to apply directly to '{that.state.rev}'.
									</small>
								</div>
							</div>

							<div style={{ background: "var(--color-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-base)", padding: "14px", marginTop: "12px" }}>
								<h4 style={{ margin: "0 0 10px 0", color: "var(--color-text)", fontSize: "0.875rem" }}>
									<i className="cloud icon" style={{ color: "var(--color-accent)" }}></i> Git Origin Remote Configuration
								</h4>
								{that.state.isTiedToOrigin || that.state.hasOrigin ? (
									<p style={{ margin: "4px 0", fontSize: "0.8125rem" }}>
										<strong>Current Origin:</strong> <code style={{ color: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>{that.state.originUrl}</code>
									</p>
								) : (
									<p style={{ margin: "4px 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
										<em>Repository is currently not tied to any origin remote.</em>
									</p>
								)}

								{originChanged ? (
									<div className="ui warning message" style={{ padding: "8px 12px", margin: "8px 0" }}>
										<i className="exchange icon"></i> Origin remote URL will be updated to: <strong>{that.state.newOriginUrl.trim()}</strong>
									</div>
								) : null}

								<div className="ui checkbox" style={{ marginTop: "8px" }}>
									<input
										type="checkbox"
										id="confirm-push-origin"
										checked={that.state.pushOrigin}
										onChange={function (e) { that.setState({ pushOrigin: e.target.checked }); }}
									/>
									<label htmlFor="confirm-push-origin" style={{ fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer" }}>
										Force push rewritten branch to remote origin after modification (Recommended if tied to origin)
									</label>
								</div>
							</div>

							<div style={{ marginTop: "16px" }}>
								<h4 style={{ margin: "0 0 10px 0", color: "var(--color-text)", fontSize: "0.875rem" }}>
									<i className="edit icon" style={{ color: "var(--color-orange)" }}></i> Modified Commits ({modifiedCommitsList.length})
								</h4>
								{modifiedCommitsList.length > 0 ? (
									<div className="diff-table-container">
										<table className="diff-table">
											<thead>
												<tr>
													<th>Commit</th>
													<th>Message</th>
													<th>Changes (Old &rarr; New)</th>
												</tr>
											</thead>
											<tbody>
												{modifiedCommitsList.map(function (item) {
													var c = item.current;
													var o = item.original;
													var diffs = [];
													if (c.message !== o.message) {
														diffs.push(<div key="m">Msg: <span className="diff-old">{o.message}</span> <span className="diff-new">{c.message}</span></div>);
													}
													if (c.author !== o.author) {
														diffs.push(<div key="a">Author: <span className="diff-old">{o.author}</span> <span className="diff-new">{c.author}</span></div>);
													}
													if (c.email !== o.email) {
														diffs.push(<div key="e">Email: <span className="diff-old">{o.email}</span> <span className="diff-new">{c.email}</span></div>);
													}
													if (c.date !== o.date || c.time !== o.time) {
														diffs.push(<div key="t">Time: <span className="diff-old">{o.date} {o.time}</span> <span className="diff-new">{c.date} {c.time}</span></div>);
													}

													return (
														<tr key={c.sha}>
															<td><code style={{ fontFamily: "var(--font-mono)", fontWeight: "700" }}>{c.sha.slice(0, 7)}</code></td>
															<td>{c.message ? c.message.slice(0, 40) : ""}</td>
															<td>{diffs}</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								) : (
									<p style={{ color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
										No commit modifications detected. Only branch or origin settings will be updated.
									</p>
								)}
							</div>
						</div>

						<div className="custom-modal-actions">
							<button
								type="button"
								className="zero-btn-secondary"
								onClick={that.closeConfirmModal}
								disabled={that.state.applyingChanges}
							>
								Cancel
							</button>
							<button
								type="button"
								className={"zero-btn-primary " + (that.state.applyingChanges ? "loading disabled" : "")}
								onClick={that.confirmMakeChanges}
								style={{ background: "var(--color-green)", borderColor: "var(--color-green)" }}
							>
								<i className="check circle icon"></i> Confirm & Apply Changes
							</button>
						</div>
					</div>
				</div>
			);
		}

		// Branch Creation Modal
		var branchModal = null;
		if (that.state.showBranchModal) {
			branchModal = (
				<div className="custom-modal-overlay">
					<div className="custom-modal-card" style={{ maxWidth: "480px" }}>
						<div className="custom-modal-header">
							<h3><i className="code branch icon" style={{ color: "var(--color-accent)" }}></i> Create New Git Branch</h3>
							<i className="close icon link" onClick={that.closeBranchModal}></i>
						</div>
						{that.state.branchError ? (
							<div className="ui negative message">{that.state.branchError}</div>
						) : null}
						<form className="ui form" onSubmit={that.submitCreateBranch}>
							<div className="field required">
								<label>New Branch Name</label>
								<input
									type="text"
									placeholder="e.g. feature/zero-ui"
									value={that.state.newBranchName}
									onChange={function (e) { that.setState({ newBranchName: e.target.value }); }}
									autoFocus={true}
								/>
							</div>
							<div className="field">
								<label>Base Revision</label>
								<input
									type="text"
									value={that.state.rev}
									readOnly={true}
									style={{ background: "var(--color-secondary)" }}
								/>
							</div>
							<div className="custom-modal-actions">
								<button
									type="button"
									className="zero-btn-secondary"
									onClick={that.closeBranchModal}
								>
									Cancel
								</button>
								<button
									type="submit"
									className={"zero-btn-primary " + (that.state.creatingBranch ? "loading disabled" : "")}
								>
									<i className="plus icon"></i> Create Branch
								</button>
							</div>
						</form>
					</div>
				</div>
			);
		}

		// Progressive Disclosure: Add Commit Panel
		var addCommitPanel = null;
		if (that.state.showAddModal) {
			addCommitPanel = (
				<div className="progressive-panel">
					<h4><i className="plus circle icon" style={{ color: "var(--color-accent)" }}></i> Add New Commit</h4>
					{that.state.addCommitError ? (
						<div className="ui negative message">{that.state.addCommitError}</div>
					) : null}
					<form className="ui form" onSubmit={that.submitNewCommit}>
						<div className="field required">
							<label>Commit Message</label>
							<input
								type="text"
								placeholder="e.g. feat(core): add progressive disclosure"
								value={that.state.newCommit.message}
								onChange={that.handleNewCommitChange.bind(that, "message")}
							/>
						</div>
						<div className="four fields">
							<div className="field">
								<label>Author Name</label>
								<input
									type="text"
									placeholder="Author Name"
									value={that.state.newCommit.author}
									onChange={that.handleNewCommitChange.bind(that, "author")}
								/>
							</div>
							<div className="field">
								<label>Author Email</label>
								<input
									type="email"
									placeholder="author@example.com"
									value={that.state.newCommit.email}
									onChange={that.handleNewCommitChange.bind(that, "email")}
								/>
							</div>
							<div className="field">
								<label>Date</label>
								<input
									type="date"
									value={that.state.newCommit.date}
									onChange={that.handleNewCommitChange.bind(that, "date")}
								/>
							</div>
							<div className="field">
								<label>Time</label>
								<input
									type="text"
									placeholder="HH:MM:SS"
									value={that.state.newCommit.time}
									onChange={that.handleNewCommitChange.bind(that, "time")}
								/>
							</div>
						</div>
						<div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
							<button
								type="submit"
								className={"zero-btn-primary " + (that.state.addingCommit ? "loading disabled" : "")}
								style={{ background: "var(--color-green)", borderColor: "var(--color-green)" }}
							>
								<i className="check icon"></i> Commit & Save
							</button>
							<button
								type="button"
								className="zero-btn-secondary"
								onClick={that.toggleAddModal}
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			);
		}

		// Progressive Disclosure: AI Engineer Panel
		var aiEngineerPanel = null;
		if (that.state.showLLMModal) {
			aiEngineerPanel = (
				<div className="progressive-panel">
					<h4><i className="magic icon" style={{ color: "var(--color-orange)" }}></i> AI Git Engineer: Commit & Diff Sculptor</h4>
					<p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 12px 0" }}>
						Use OpenRouter, DeepSeek, OpenAI, Groq, Gemini, or any custom API key & endpoint to synthesize atomic commits with realistic timestamps and conventional commit messages.
					</p>
					{that.state.llmError ? (
						<div className="ui negative message">{that.state.llmError}</div>
					) : null}
					<form className="ui form" onSubmit={that.generateLLMCommits}>
						<div className="three fields">
							<div className="field">
								<label>LLM Provider</label>
								<select
									className="ui dropdown"
									value={that.state.llmProvider}
									onChange={that.handleLLMFieldChange.bind(that, "llmProvider")}
								>
									<option value="openrouter">OpenRouter (Recommended - All Models)</option>
									<option value="deepseek">DeepSeek (api.deepseek.com)</option>
									<option value="openai">OpenAI (api.openai.com)</option>
									<option value="groq">Groq (api.groq.com)</option>
									<option value="gemini">Google Gemini</option>
									<option value="custom">Custom / Any API Key</option>
								</select>
							</div>
							<div className="field">
								<label>Model</label>
								<input
									type="text"
									placeholder={that.state.llmProvider === "openrouter" ? "anthropic/claude-3.5-sonnet" : (that.state.llmProvider === "deepseek" ? "deepseek-chat" : "gpt-4o")}
									value={that.state.llmModel}
									onChange={that.handleLLMFieldChange.bind(that, "llmModel")}
								/>
							</div>
							<div className="field required">
								<label>API Key</label>
								<input
									type="password"
									placeholder={that.state.llmProvider === "openrouter" ? "sk-or-v1-..." : (that.state.llmProvider === "deepseek" ? "sk-..." : "Any API key")}
									value={that.state.llmApiKey}
									onChange={that.handleLLMFieldChange.bind(that, "llmApiKey")}
								/>
							</div>
						</div>

						{that.state.llmProvider === "custom" ? (
							<div className="field" style={{ marginBottom: "12px" }}>
								<label>Base URL / Endpoint (e.g. Ollama, LM Studio, or custom proxy)</label>
								<input
									type="text"
									placeholder="http://localhost:11434/v1/chat/completions"
									value={that.state.llmBaseUrl}
									onChange={that.handleLLMFieldChange.bind(that, "llmBaseUrl")}
								/>
							</div>
						) : null}

						<div className="field">
							<label>Diff or Instructions (Leave blank to auto-analyze diff)</label>
							<textarea
								rows={3}
								placeholder="Paste diff or describe: 'Decompose auth refactoring and unit tests into 2 atomic commits'"
								value={that.state.llmPrompt}
								onChange={that.handleLLMFieldChange.bind(that, "llmPrompt")}
							/>
						</div>
						<div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
							<button
								type="submit"
								className={"zero-btn-primary " + (that.state.loadingLLM ? "loading disabled" : "")}
							>
								<i className="bolt icon"></i> Synthesize Commits
							</button>
							<button
								type="button"
								className="zero-btn-secondary"
								onClick={that.toggleLLMModal}
							>
								Close
							</button>
						</div>
					</form>
					{that.state.llmGeneratedCommits && that.state.llmGeneratedCommits.length > 0 ? (
						<div style={{ marginTop: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "12px" }}>
							<div className="ui list">
								{that.state.llmGeneratedCommits.map(function (gc, gi) {
									return (
										<div className="item" key={gi} style={{ padding: "4px 0" }}>
											<i className="check circle outline green icon"></i>
											<div className="content">
												<div className="header" style={{ fontSize: "0.875rem" }}>{gc.message ? gc.message.split("\n")[0] : ""}</div>
												<div className="description" style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
													{(gc.author || gc.author_name)} | {gc.date} {gc.time}
												</div>
											</div>
										</div>
									);
								})}
							</div>
							<button
								type="button"
								className={"zero-btn-primary " + (that.state.loadingLLM ? "loading disabled" : "")}
								style={{ background: "var(--color-green)", borderColor: "var(--color-green)", marginTop: "8px" }}
								onClick={that.applyAllLLMCommits}
							>
								<i className="check icon"></i> Apply All {that.state.llmGeneratedCommits.length} Commits
							</button>
						</div>
					) : null}
				</div>
			);
		}

		// Status Alert
		var statusAlert = null;
		if (that.state.statusMessage) {
			var msgClass = that.state.statusType === "error" ? "negative" : that.state.statusType === "success" ? "positive" : "info";
			statusAlert = (
				<div className={"ui " + msgClass + " message"} style={{ marginBottom: "1.25rem" }}>
					<i
						className="close icon"
						onClick={function () { that.setState({ statusMessage: "" }); }}
					></i>
					{that.state.statusMessage}
				</div>
			);
		}

		// Load More Commits Section
		var loadMoreSection = null;
		if (that.state.hasMore) {
			loadMoreSection = (
				<div style={{ marginTop: "1.5rem", textAlign: "center" }}>
					<button
						type="button"
						className={"zero-btn-secondary " + (that.state.loadingMore ? "loading disabled" : "")}
						onClick={that.loadMoreCommits}
					>
						<i className="arrow down icon"></i> Load More Commits (+20)
					</button>
				</div>
			);
		} else if (that.state.commits.length > 0) {
			loadMoreSection = (
				<div style={{ marginTop: "1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem" }}>
					<i className="check circle outline icon"></i> All reachable commits loaded ({that.state.commits.length} total)
				</div>
			);
		}

		// Command Card (Progressive Disclosure)
		var commandArea = null;
		if (that.state.command) {
			commandArea = (
				<div className="progressive-panel" style={{ marginTop: "1.5rem" }}>
					<h4><i className="terminal icon"></i> Generated Filter Script</h4>
					<div className="ui form">
						<textarea
							value={that.state.command}
							readOnly={true}
							rows={6}
							style={{ fontFamily: "var(--font-mono)", fontSize: "12px", background: "#18181B", color: "#FAFAFA" }}
						/>
					</div>
					<div style={{ marginTop: "12px", textAlign: "right" }}>
						<button
							className="zero-btn-primary"
							style={{ background: "var(--color-green)", borderColor: "var(--color-green)" }}
							onClick={that.openConfirmModal}
						>
							<i className="check circle icon"></i> Make Changes & Confirm
						</button>
					</div>
				</div>
			);
		}

		var statsTotalText = that.state.total !== null ? " of " + that.state.total : "";
		var hasPendingChanges = (modifiedCount > 0 || originChanged);

		return (
			<div className="sixteen wide column">
				{statusAlert}
				{confirmModal}
				{branchModal}
				{addCommitPanel}
				{aiEngineerPanel}

				{/* 1. Dynamic Visualizer on Top */}
				<GitVisualizer
					commits={that.state.commits}
					originalCommits={that.state.originalCommits}
					activeBranch={that.state.activeBranch || that.state.rev}
					hasOrigin={that.state.hasOrigin}
					originUrl={that.state.originUrl}
					newOriginUrl={that.state.newOriginUrl}
					isTiedToOrigin={that.state.isTiedToOrigin}
					onSelectCommit={that.scrollToCommit}
				/>

				{/* 2. Branch Dropdown & Origin Controls Bar */}
				<div className="branch-origin-bar">
					<div className="branch-controls-group">
						<label style={{ fontWeight: "600", color: "var(--color-text)", fontSize: "0.8125rem" }}>
							<i className="code branch icon" style={{ color: "var(--color-accent)" }}></i> Branch:
						</label>
						<div className="branch-select-wrapper">
							<select
								value={that.state.rev}
								onChange={that.handleBranchChange}
							>
								{that.state.branches.map(function (b) {
									var isCur = (b === that.state.activeBranch);
									return (
										<option key={b} value={b}>
											{b}{isCur ? " (active)" : ""}
										</option>
									);
								})}
								<option value="__CREATE_NEW__">+ Create New Branch...</option>
							</select>
						</div>
						<button
							type="button"
							className="zero-btn-secondary"
							style={{ padding: "6px 12px", fontSize: "0.8125rem" }}
							onClick={that.openBranchModal}
						>
							<i className="plus icon"></i> Branch
						</button>
					</div>

					<div className="origin-controls-group">
						{that.state.isTiedToOrigin || that.state.hasOrigin ? (
							<div className="origin-badge" title={that.state.originUrl}>
								<i className="cloud icon"></i>
								<span>Origin: {that.state.originUrl.length > 28 ? that.state.originUrl.slice(0, 28) + "..." : that.state.originUrl}</span>
							</div>
						) : (
							<div className="origin-badge not-tied">
								<i className="unlink icon"></i>
								<span>No Origin Remote</span>
							</div>
						)}

						<button
							type="button"
							className="zero-btn-secondary"
							style={{ padding: "6px 12px", fontSize: "0.8125rem" }}
							onClick={function () { that.setState({ showOriginEdit: !that.state.showOriginEdit }); }}
						>
							<i className="edit icon"></i> {that.state.showOriginEdit ? "Hide Origin Setup" : "Change Origin"}
						</button>

						<button
							type="button"
							className="zero-btn-primary"
							style={{
								background: hasPendingChanges ? "var(--color-orange)" : "#18181B",
								borderColor: hasPendingChanges ? "var(--color-orange)" : "#18181B"
							}}
							onClick={that.openConfirmModal}
						>
							<i className="magic icon"></i> Make Changes {hasPendingChanges ? "(" + (modifiedCount + (originChanged ? 1 : 0)) + ")" : ""}
						</button>
					</div>
				</div>

				{/* Progressive Disclosure: Origin Setup Bar */}
				{that.state.showOriginEdit ? (
					<div className="progressive-panel" style={{ marginBottom: "1.5rem" }}>
						<h4><i className="cloud upload icon" style={{ color: "var(--color-accent)" }}></i> Configure Remote Origin</h4>
						<div className="ui action input" style={{ width: "100%" }}>
							<input
								type="text"
								placeholder="Enter new origin URL (e.g. https://github.com/user/new-repo.git)"
								value={that.state.newOriginUrl}
								onChange={function (e) { that.setState({ newOriginUrl: e.target.value }); }}
							/>
							{that.state.newOriginUrl ? (
								<button
									type="button"
									className="zero-btn-secondary"
									onClick={function () { that.setState({ newOriginUrl: "" }); }}
								>
									Clear
								</button>
							) : null}
						</div>
						<div className="ui checkbox" style={{ marginTop: "10px" }}>
							<input
								type="checkbox"
								id="bar-push-origin"
								checked={that.state.pushOrigin}
								onChange={function (e) { that.setState({ pushOrigin: e.target.checked }); }}
							/>
							<label htmlFor="bar-push-origin" style={{ fontSize: "0.8125rem", cursor: "pointer" }}>
								Push rewritten branch to origin after making changes (runs git push --force origin)
							</label>
						</div>
					</div>
				) : null}

				{/* 3. Commits Table Card */}
				<div className="commit-table-card">
					<div className="toolbar-stats">
						<div>
							<span className="zero-pill zero-pill-accent" style={{ marginRight: "6px" }}>Branch: {that.state.rev}</span>
							<span className="zero-pill zero-pill-neutral" style={{ marginRight: "6px" }}>Showing {that.state.commits.length}{statsTotalText} commits</span>
							{modifiedCount > 0 ? (
								<span className="zero-pill zero-pill-orange">{modifiedCount} modified (live preview)</span>
							) : null}
						</div>
						<div style={{ display: "flex", gap: "8px" }}>
							<button
								type="button"
								className="zero-btn-secondary"
								style={{ padding: "6px 12px", fontSize: "0.8125rem" }}
								onClick={that.toggleLLMModal}
							>
								<i className="magic icon"></i> AI Engineer
							</button>
							<button
								type="button"
								className="zero-btn-secondary"
								style={{ padding: "6px 12px", fontSize: "0.8125rem" }}
								onClick={that.toggleAddModal}
							>
								<i className="plus icon"></i> Add Commit
							</button>
							<button
								type="button"
								className="zero-btn-primary"
								style={{
									background: hasPendingChanges ? "var(--color-orange)" : "#18181B",
									borderColor: hasPendingChanges ? "var(--color-orange)" : "#18181B",
									padding: "6px 14px",
									fontSize: "0.8125rem"
								}}
								onClick={that.openConfirmModal}
							>
								<i className="magic icon"></i> Make Changes {hasPendingChanges ? "(" + (modifiedCount + (originChanged ? 1 : 0)) + ")" : ""}
							</button>
						</div>
					</div>

					<div className="ui form">
						<div className="field" style={{ fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-secondary)", paddingBottom: "8px" }}>
							<div className="six fields" style={{ margin: 0 }}>
								<div className="two wide field"><label>SHA (Read-Only)</label></div>
								<div className="four wide field"><label>Commit Message</label></div>
								<div className="three wide field"><label>Author Name</label></div>
								<div className="three wide field"><label>Author Email</label></div>
								<div className="two wide field"><label>Date</label></div>
								<div className="two wide field"><label>Time</label></div>
							</div>
						</div>
						{that.state.commits.map(function (commit, index) {
							var modified = that.isModified(index);
							return (
								<div
									id={"commit-row-" + index}
									className={"commit-row " + (modified ? "modified-row" : "")}
									key={commit.sha || index}
								>
									<div className="six fields" style={{ margin: 0 }}>
										<div className="two wide disabled field">
											<input
												type="text"
												placeholder="SHA"
												value={commit.sha ? commit.sha.slice(0, 7) : ""}
												readOnly={true}
												style={{ fontFamily: "var(--font-mono)" }}
											/>
										</div>
										<div className="four wide field">
											<input
												type="text"
												placeholder="Commit message"
												value={commit.message}
												title={commit.message}
												onChange={that.inputChange.bind(that, index, "message")}
											/>
										</div>
										<div className="three wide field">
											<input
												type="text"
												placeholder="Author"
												value={commit.author}
												onChange={that.inputChange.bind(that, index, "author")}
											/>
										</div>
										<div className="three wide field">
											<input
												type="email"
												placeholder="Email"
												value={commit.email}
												onChange={that.inputChange.bind(that, index, "email")}
											/>
										</div>
										<div className="two wide field">
											<input
												type="date"
												value={commit.date}
												onChange={that.inputChange.bind(that, index, "date")}
											/>
										</div>
										<div className="two wide field">
											<input
												type="text"
												placeholder="HH:MM:SS"
												value={commit.time}
												onChange={that.inputChange.bind(that, index, "time")}
											/>
										</div>
									</div>
								</div>
							);
						})}
					</div>

					{loadMoreSection}

					<div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
						<button
							className="zero-btn-secondary"
							onClick={that.doneClick}
							id="edit"
						>
							<i className="terminal icon"></i> View Raw Command
						</button>
						<button
							className="zero-btn-primary"
							style={{
								background: hasPendingChanges ? "var(--color-orange)" : "#18181B",
								borderColor: hasPendingChanges ? "var(--color-orange)" : "#18181B",
								padding: "12px 24px",
								fontSize: "1rem"
							}}
							onClick={that.openConfirmModal}
						>
							<i className="magic icon"></i> Make Changes {hasPendingChanges ? "(" + (modifiedCount + (originChanged ? 1 : 0)) + " pending)" : ""}
						</button>
					</div>
				</div>

				{commandArea}
			</div>
		);
	}
});

function renderError(message) {
	ReactDOM.render(
		<div className="sixteen wide column">
			<div className="ui negative message" style={{ borderRadius: "var(--radius-base)" }}>
				<i
					className="close icon"
					onClick={function () { ReactDOM.unmountComponentAtNode(document.getElementById("commits")); }}
				></i>
				<div className="header">Error</div>
				<p>{message}</p>
			</div>
		</div>,
		document.getElementById("commits")
	);
}

function fetchCommits(addr, rev) {
	if (!addr || !addr.trim()) {
		renderError("Please enter a git repository path (e.g. . or /path/to/repo).");
		return;
	}

	var cleanAddr = addr.trim();
	var cleanRev = rev ? rev.trim() : "";

	// Persist path and rev in localStorage so user never loses them on reload
	localStorage.setItem("git_repo_path", cleanAddr);
	if (cleanRev) {
		localStorage.setItem("git_repo_rev", cleanRev);
	}

	var $btn = $("#modify");
	$btn.addClass("loading disabled");

	$.post("/get_commits", {
		address: cleanAddr,
		rev: cleanRev,
		limit: 20,
		skip: 0
	}, function (data) {
		$btn.removeClass("loading disabled");
		if (data.success) {
			ReactDOM.render(
				<CommitForm
					commits={data.commits}
					address={data.address}
					rev={data.rev}
					hasMore={data.has_more}
					total={data.total}
					branches={data.branches}
					activeBranch={data.active_branch}
					hasOrigin={data.has_origin}
					originUrl={data.origin_url}
					isTiedToOrigin={data.is_tied_to_origin}
				/>,
				document.getElementById("commits")
			);
		} else {
			renderError(data.error || "Failed to load commits.");
		}
	}).fail(function (xhr, status, error) {
		$btn.removeClass("loading disabled");
		renderError("Network error: Could not reach server. " + (error || ""));
	});
}

window.refreshCurrentRepo = function () {
	var addr = $("#addr-input").val();
	var rev = $("#rev-input").val();
	fetchCommits(addr, rev);
};

// Setup Voice Recognition & Gesture System (Zero Interface)
function initZeroAmbientControls() {
	var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	var $micBtn = $("#voice-cmd-btn");
	var $voiceLabel = $("#voice-label");

	if (!SpeechRecognition) {
		$voiceLabel.text("Voice N/A");
		$micBtn.attr("title", "Speech Recognition not supported in this browser.");
		return;
	}

	var recognition = new SpeechRecognition();
	recognition.continuous = false;
	recognition.lang = "en-US";
	recognition.interimResults = false;

	var isListening = false;

	$micBtn.on("click", function () {
		if (isListening) {
			recognition.stop();
			return;
		}
		try {
			recognition.start();
			isListening = true;
			$micBtn.addClass("active");
			$voiceLabel.text("Listening...");
		} catch (e) {
			console.warn("Speech recognition error:", e);
		}
	});

	recognition.onresult = function (event) {
		var transcript = event.results[0][0].transcript.toLowerCase().trim();
		console.log("Voice transcript:", transcript);
		$voiceLabel.text("'" + transcript + "'");

		if (transcript.indexOf("make changes") !== -1 || transcript.indexOf("confirm") !== -1 || transcript.indexOf("apply") !== -1) {
			if (window.triggerMakeChanges) window.triggerMakeChanges();
		} else if (transcript.indexOf("new branch") !== -1 || transcript.indexOf("create branch") !== -1) {
			if (window.triggerNewBranch) window.triggerNewBranch();
		} else if (transcript.indexOf("reload") !== -1 || transcript.indexOf("refresh") !== -1 || transcript.indexOf("inspect") !== -1) {
			if (window.refreshCurrentRepo) window.refreshCurrentRepo();
		} else if (transcript.indexOf("ai") !== -1 || transcript.indexOf("engineer") !== -1) {
			if (window.triggerLLMModal) window.triggerLLMModal();
		}

		setTimeout(function () {
			$voiceLabel.text("Voice Ready");
		}, 2500);
	};

	recognition.onend = function () {
		isListening = false;
		$micBtn.removeClass("active");
		if ($voiceLabel.text() === "Listening...") {
			$voiceLabel.text("Voice Ready");
		}
	};

	recognition.onerror = function (e) {
		isListening = false;
		$micBtn.removeClass("active");
		$voiceLabel.text("Voice Error");
		setTimeout(function () {
			$voiceLabel.text("Voice Ready");
		}, 2000);
	};

	// Keyboard Gestures: Cmd+Enter to Make Changes, Escape to close modals
	$(document).on("keydown", function (e) {
		if ((e.metaKey || e.ctrlKey) && e.keyCode === 13) {
			e.preventDefault();
			if (window.triggerMakeChanges) window.triggerMakeChanges();
		}
		if (e.keyCode === 27) {
			$(".custom-modal-overlay .close.icon").click();
			$("#api-keys-modal").fadeOut(150);
		}
	});
}

function updateApiKeyStatusDot() {
	var openrouter = localStorage.getItem("openrouter_api_key") || "";
	var deepseek = localStorage.getItem("deepseek_api_key") || "";
	var openai = localStorage.getItem("openai_api_key") || "";
	var custom = localStorage.getItem("custom_api_key") || "";
	if (openrouter.trim() || deepseek.trim() || openai.trim() || custom.trim()) {
		$("#api-keys-dot").addClass("configured");
		$("#api-keys-label").text("API Keys (Active)");
	} else {
		$("#api-keys-dot").removeClass("configured");
		$("#api-keys-label").text("API Keys");
	}
}

function initApiKeysModal() {
	updateApiKeyStatusDot();

	$("#api-keys-popout-btn").on("click", function () {
		$("#key-openrouter").val(localStorage.getItem("openrouter_api_key") || "");
		$("#key-deepseek").val(localStorage.getItem("deepseek_api_key") || "");
		$("#key-openai").val(localStorage.getItem("openai_api_key") || "");
		$("#key-custom").val(localStorage.getItem("custom_api_key") || "");
		$("#url-custom").val(localStorage.getItem("custom_api_url") || "");
		$("#model-custom").val(localStorage.getItem("custom_api_model") || "");
		$("#api-keys-modal").fadeIn(200);
	});

	$("#api-keys-close-btn").on("click", function () {
		$("#api-keys-modal").fadeOut(150);
	});

	$("#api-keys-modal").on("click", function (e) {
		if ($(e.target).is("#api-keys-modal")) {
			$("#api-keys-modal").fadeOut(150);
		}
	});

	$(".toggle-pwd").on("click", function () {
		var targetId = $(this).data("target");
		var $input = $("#" + targetId);
		var $icon = $(this).find("i.icon");
		if ($input.attr("type") === "password") {
			$input.attr("type", "text");
			$icon.removeClass("eye").addClass("eye slash");
		} else {
			$input.attr("type", "password");
			$icon.removeClass("eye slash").addClass("eye");
		}
	});

	$("#api-keys-save-btn").on("click", function () {
		var or = $("#key-openrouter").val().trim();
		var ds = $("#key-deepseek").val().trim();
		var oa = $("#key-openai").val().trim();
		var cs = $("#key-custom").val().trim();
		var cu = $("#url-custom").val().trim();
		var cm = $("#model-custom").val().trim();

		if (or) localStorage.setItem("openrouter_api_key", or); else localStorage.removeItem("openrouter_api_key");
		if (ds) localStorage.setItem("deepseek_api_key", ds); else localStorage.removeItem("deepseek_api_key");
		if (oa) localStorage.setItem("openai_api_key", oa); else localStorage.removeItem("openai_api_key");
		if (cs) localStorage.setItem("custom_api_key", cs); else localStorage.removeItem("custom_api_key");
		if (cu) localStorage.setItem("custom_api_url", cu); else localStorage.removeItem("custom_api_url");
		if (cm) localStorage.setItem("custom_api_model", cm); else localStorage.removeItem("custom_api_model");

		updateApiKeyStatusDot();
		$("#api-keys-modal").fadeOut(150);
	});

	$("#api-keys-clear-btn").on("click", function () {
		$("#key-openrouter").val("");
		$("#key-deepseek").val("");
		$("#key-openai").val("");
		$("#key-custom").val("");
		$("#url-custom").val("");
		$("#model-custom").val("");
		localStorage.removeItem("openrouter_api_key");
		localStorage.removeItem("deepseek_api_key");
		localStorage.removeItem("openai_api_key");
		localStorage.removeItem("custom_api_key");
		localStorage.removeItem("custom_api_url");
		localStorage.removeItem("custom_api_model");
		updateApiKeyStatusDot();
	});
}

$(document).ready(function () {
	initApiKeysModal();
	// Restore previous file path from localStorage so it is never lost on reload
	var savedPath = localStorage.getItem("git_repo_path");
	var savedRev = localStorage.getItem("git_repo_rev");

	if (savedPath && savedPath.trim()) {
		$("#addr-input").val(savedPath.trim());
	} else if (!$("#addr-input").val()) {
		$("#addr-input").val(".");
	}

	if (savedRev && savedRev.trim()) {
		$("#rev-input").val(savedRev.trim());
	}

	$("#addr-input").on("input change", function () {
		localStorage.setItem("git_repo_path", $(this).val().trim());
	});

	$("#rev-input").on("input change", function () {
		localStorage.setItem("git_repo_rev", $(this).val().trim());
	});

	$("#modify").on("click", function () {
		var addr = $("#addr-input").val();
		var rev = $("#rev-input").val();
		fetchCommits(addr, rev);
	});

	$("#addr-input, #rev-input").on("keydown", function (e) {
		if (e.keyCode === 13) {
			e.preventDefault();
			$("#modify").click();
		}
	});

	initZeroAmbientControls();

	// Proactively load commits on page load using persisted path
	fetchCommits($("#addr-input").val(), $("#rev-input").val());
});
