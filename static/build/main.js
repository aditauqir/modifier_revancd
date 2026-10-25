var GitVisualizer = React.createClass({
  render: function() {
    var that = this;
    var commits = this.props.commits || [];
    var originalCommits = this.props.originalCommits || [];
    var branches = this.props.branches || [];
    var branchesData = this.props.branchesData || [];
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
      if (orig && (curr.message !== orig.message || curr.author !== orig.author || curr.email !== orig.email || curr.date !== orig.date || curr.time !== orig.time)) {
        modifiedCount++;
      }
    }
    var originDisplay = "No Origin";
    if (newOriginUrl && newOriginUrl.trim()) {
      originDisplay = "Origin: " + newOriginUrl.trim() + " (Pending)";
    } else if (originUrl) {
      originDisplay = "Origin: " + originUrl;
    }
    return /* @__PURE__ */ React.createElement("div", { className: "git-visualizer-card" }, /* @__PURE__ */ React.createElement("div", { className: "visualizer-header" }, /* @__PURE__ */ React.createElement("div", { className: "visualizer-title" }, /* @__PURE__ */ React.createElement("i", { className: "sitemap icon", style: { color: "var(--color-accent)" } }), /* @__PURE__ */ React.createElement("span", null, "Commit History Visualizer"), /* @__PURE__ */ React.createElement("span", { className: "zero-pill zero-pill-neutral" }, "Live Preview")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("div", { className: "visualizer-branches-list", style: { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 } }, "Branches:"), branches.map(function(b) {
      var isActive = b === activeBranch;
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: b,
          type: "button",
          className: "zero-pill " + (isActive ? "zero-pill-accent" : "zero-pill-neutral"),
          style: { cursor: "pointer", border: isActive ? "1px solid #18181B" : "1px solid var(--color-border)" },
          onClick: function() {
            if (that.props.onSwitchBranch) that.props.onSwitchBranch(b);
          },
          title: isActive ? "Current Active Branch" : "Click to switch to branch " + b
        },
        /* @__PURE__ */ React.createElement("i", { className: "code branch icon" }),
        " ",
        b
      );
    }), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "zero-pill zero-pill-neutral",
        style: { cursor: "pointer", border: "1px dashed var(--color-border)" },
        onClick: that.props.onOpenBranchModal,
        title: "Create a new branch"
      },
      /* @__PURE__ */ React.createElement("i", { className: "plus icon" }),
      " New Branch"
    )), /* @__PURE__ */ React.createElement("span", { className: "zero-pill " + (isTiedToOrigin || newOriginUrl ? "zero-pill-accent" : "zero-pill-neutral"), title: originDisplay }, /* @__PURE__ */ React.createElement("i", { className: (isTiedToOrigin || newOriginUrl ? "cloud" : "unlink") + " icon" }), originDisplay.length > 28 ? originDisplay.slice(0, 28) + "..." : originDisplay), modifiedCount > 0 ? /* @__PURE__ */ React.createElement("span", { className: "zero-pill zero-pill-orange" }, /* @__PURE__ */ React.createElement("i", { className: "edit outline icon" }), " ", modifiedCount, " pending") : /* @__PURE__ */ React.createElement("span", { className: "zero-pill zero-pill-green" }, /* @__PURE__ */ React.createElement("i", { className: "check icon" }), " Synced"))), /* @__PURE__ */ React.createElement("div", { className: "visualizer-scroll-area" }, /* @__PURE__ */ React.createElement("div", { className: "visualizer-track" }, /* @__PURE__ */ React.createElement("div", { className: "visualizer-rail" }), commits.map(function(c, idx) {
      var orig2 = origMap[c.sha] || originalCommits[idx];
      var isMod = orig2 && (c.message !== orig2.message || c.author !== orig2.author || c.email !== orig2.email || c.date !== orig2.date || c.time !== orig2.time);
      var isHead = idx === 0;
      var nodeBranches = [];
      if (c.branches && c.branches.length > 0) {
        nodeBranches = c.branches.slice();
      } else if (branchesData && branchesData.length > 0) {
        for (var bi = 0; bi < branchesData.length; bi++) {
          var bd = branchesData[bi];
          if (bd.sha && (bd.sha === c.sha || bd.sha.indexOf(c.sha) === 0 || c.sha.indexOf(bd.sha) === 0)) {
            if (nodeBranches.indexOf(bd.name) === -1) {
              nodeBranches.push(bd.name);
            }
          }
        }
      }
      if (isHead && nodeBranches.indexOf(activeBranch) === -1) {
        nodeBranches.unshift(activeBranch);
      }
      var tooltip = "Commit: " + (c.sha ? c.sha.slice(0, 7) : "") + "\nMessage: " + c.message + "\nAuthor: " + c.author + "\nDate: " + c.date + " " + c.time;
      if (nodeBranches.length > 0) {
        tooltip += "\nBranches: " + nodeBranches.join(", ");
      }
      if (isMod) {
        tooltip += "\n\n[MODIFIED (PENDING CONFIRMATION)]";
        if (c.message !== orig2.message) tooltip += "\nOriginal Msg: " + orig2.message;
        if (c.author !== orig2.author) tooltip += "\nOriginal Author: " + orig2.author;
        if (c.date !== orig2.date || c.time !== orig2.time) tooltip += "\nOriginal Date: " + orig2.date + " " + orig2.time;
      }
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: c.sha || idx,
          className: "visualizer-node",
          onClick: function() {
            if (onSelectCommit) onSelectCommit(idx);
          },
          title: tooltip
        },
        /* @__PURE__ */ React.createElement("div", { className: "visualizer-node-badges" }, isHead ? /* @__PURE__ */ React.createElement("span", { className: "v-badge v-badge-head" }, "HEAD") : null, nodeBranches.map(function(bName) {
          var isActive = bName === activeBranch;
          return /* @__PURE__ */ React.createElement(
            "span",
            {
              key: bName,
              className: "v-badge v-badge-branch " + (isActive ? "active" : "secondary"),
              style: {
                background: isActive ? "#18181B" : "#FFFFFF",
                color: isActive ? "#FAFAFA" : "#18181B",
                border: isActive ? "1px solid #18181B" : "1px solid #71717A"
              },
              title: "Branch: " + bName + (isActive ? " (Active HEAD)" : "")
            },
            /* @__PURE__ */ React.createElement("i", { className: "code branch icon" }),
            bName
          );
        }), isHead && (isTiedToOrigin || newOriginUrl) ? /* @__PURE__ */ React.createElement("span", { className: "v-badge v-badge-origin" }, "origin") : null, isMod ? /* @__PURE__ */ React.createElement("span", { className: "v-badge v-badge-modified" }, "EDITED") : null),
        /* @__PURE__ */ React.createElement("div", { className: "node-circle " + (isMod ? "modified" : "") }, commits.length - idx),
        /* @__PURE__ */ React.createElement("div", { className: "node-sha " + (isMod ? "modified" : "") }, c.sha ? c.sha.slice(0, 7) : "commit", isMod ? " *" : ""),
        /* @__PURE__ */ React.createElement("div", { className: "node-msg-preview " + (isMod ? "modified" : "") }, c.message || "(no message)"),
        /* @__PURE__ */ React.createElement("div", { className: "node-author " + (isMod ? "modified" : "") }, isMod ? /* @__PURE__ */ React.createElement("i", { className: "pencil alternate icon", style: { fontSize: "9px", marginRight: "3px" } }) : null, c.author || "Unknown"),
        /* @__PURE__ */ React.createElement("div", { className: "node-date " + (isMod ? "modified" : "") }, c.date || "")
      );
    }))), /* @__PURE__ */ React.createElement("div", { className: "visualizer-hint" }, /* @__PURE__ */ React.createElement("i", { className: "info circle icon" }), /* @__PURE__ */ React.createElement("span", null, "Click any commit node to jump to its row. Live preview dynamically reflects all branch pointers and pending commit modifications.")));
  }
});
var CommitForm = React.createClass({
  getInitialState: function() {
    var firstCommit = this.props.commits && this.props.commits.length > 0 ? this.props.commits[0] : null;
    var now = /* @__PURE__ */ new Date();
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
      llmModel: (localStorage.getItem("preferred_llm_provider") || "openrouter") === "openrouter" ? localStorage.getItem("openrouter_model") || "anthropic/claude-3.5-sonnet" : (localStorage.getItem("preferred_llm_provider") || "openrouter") === "deepseek" ? "deepseek-chat" : "gpt-4o",
      llmBaseUrl: localStorage.getItem("custom_api_url") || "",
      llmPrompt: "",
      llmSystemPrompt: "",
      loadingLLM: false,
      llmError: "",
      llmGeneratedCommits: [],
      branchesData: this.props.branchesData || []
    };
  },
  componentDidMount: function() {
    var that = this;
    window.triggerMakeChanges = function() {
      that.openConfirmModal();
    };
    window.triggerNewBranch = function() {
      that.openBranchModal();
    };
    window.triggerLLMModal = function() {
      that.toggleLLMModal();
    };
    this.updateSmartContext();
  },
  componentWillReceiveProps: function(nextProps) {
    var firstCommit = nextProps.commits && nextProps.commits.length > 0 ? nextProps.commits[0] : null;
    this.setState({
      commits: nextProps.commits || [],
      originalCommits: JSON.parse(JSON.stringify(nextProps.commits || [])),
      command: "",
      address: nextProps.address || "",
      rev: nextProps.rev || "HEAD",
      branches: nextProps.branches || this.state.branches,
      branchesData: nextProps.branchesData || this.state.branchesData,
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
  updateSmartContext: function() {
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
  inputChange: function(index, field, event) {
    var value = event.target.value;
    var commits = this.state.commits.slice();
    var commit = Object.assign({}, commits[index]);
    commit[field] = value;
    commits[index] = commit;
    this.setState({
      commits,
      command: ""
    }, this.updateSmartContext);
  },
  isModified: function(index) {
    var current = this.state.commits[index];
    var original = this.state.originalCommits[index];
    if (!current || !original) return false;
    return current.message !== original.message || current.author !== original.author || current.email !== original.email || current.date !== original.date || current.time !== original.time;
  },
  countModified: function() {
    var count = 0;
    for (var i = 0; i < this.state.commits.length; i++) {
      if (this.isModified(i)) count++;
    }
    return count;
  },
  getModifiedCommits: function() {
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
  scrollToCommit: function(index) {
    var el = document.getElementById("commit-row-" + index);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      $(el).addClass("commit-row-highlight");
      setTimeout(function() {
        $(el).removeClass("commit-row-highlight");
      }, 1500);
    }
  },
  handleBranchChange: function(event) {
    var val = event.target.value;
    if (val === "__CREATE_NEW__") {
      this.openBranchModal();
    } else {
      this.switchBranch(val);
    }
  },
  switchBranchTo: function(branchName) {
    this.switchBranch(branchName);
  },
  switchBranch: function(branchName) {
    var that = this;
    that.setState({ statusMessage: "Switching to branch " + branchName + "...", statusType: "info" });
    $.post("/get_commits", {
      address: that.state.address,
      rev: branchName,
      limit: 20,
      skip: 0
    }, function(data) {
      if (data.success) {
        that.setState({
          commits: data.commits || [],
          originalCommits: JSON.parse(JSON.stringify(data.commits || [])),
          rev: data.rev || branchName,
          activeBranch: data.active_branch || branchName,
          branches: data.branches || that.state.branches,
          branchesData: data.branches_data || that.state.branchesData,
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
    }).fail(function() {
      that.setState({
        statusMessage: "Network error switching branch.",
        statusType: "error"
      });
    });
  },
  openBranchModal: function() {
    this.setState({
      showBranchModal: true,
      newBranchName: "",
      branchError: ""
    });
  },
  closeBranchModal: function() {
    this.setState({
      showBranchModal: false,
      branchError: ""
    });
  },
  submitCreateBranch: function(e) {
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
    }, function(data) {
      that.setState({ creatingBranch: false });
      if (data.success) {
        that.setState({
          showBranchModal: false,
          branches: data.branches,
          branchesData: data.branches_data || that.state.branchesData,
          activeBranch: data.branch,
          rev: data.branch,
          commits: data.commits && data.commits.length > 0 ? data.commits : that.state.commits,
          originalCommits: data.commits && data.commits.length > 0 ? JSON.parse(JSON.stringify(data.commits)) : that.state.originalCommits,
          statusMessage: data.message || "Branch created successfully!",
          statusType: "success"
        });
        $("#rev-input").val(data.branch);
        localStorage.setItem("git_repo_rev", data.branch);
      } else {
        that.setState({ branchError: data.error || "Failed to create branch." });
      }
    }).fail(function(xhr, status, err) {
      that.setState({
        creatingBranch: false,
        branchError: "Network error: " + (err || "Could not reach server.")
      });
    });
  },
  openConfirmModal: function() {
    this.setState({
      showConfirmModal: true,
      confirmError: "",
      confirmTargetBranch: ""
    });
  },
  closeConfirmModal: function() {
    this.setState({
      showConfirmModal: false,
      confirmError: ""
    });
  },
  confirmMakeChanges: function() {
    var that = this;
    that.setState({ applyingChanges: true, confirmError: "" });
    var shouldChangeOrigin = that.state.newOriginUrl && that.state.newOriginUrl.trim() !== "" && that.state.newOriginUrl.trim() !== that.state.originUrl;
    $.post("/make_changes", {
      address: that.state.address,
      rev: that.state.rev,
      target_branch: that.state.confirmTargetBranch.trim(),
      commits: JSON.stringify(that.state.commits),
      old_commits: JSON.stringify(that.state.originalCommits),
      change_origin: shouldChangeOrigin ? "true" : "false",
      new_origin_url: that.state.newOriginUrl.trim(),
      push_origin: that.state.pushOrigin ? "true" : "false"
    }, function(data) {
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
    }).fail(function(xhr, status, err) {
      that.setState({
        applyingChanges: false,
        confirmError: "Network error: " + (err || "Could not reach server.")
      });
    });
  },
  loadMoreCommits: function() {
    var that = this;
    that.setState({ loadingMore: true });
    $.post("/get_commits", {
      address: that.state.address,
      rev: that.state.rev,
      limit: 20,
      skip: that.state.commits.length
    }, function(data) {
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
    }).fail(function() {
      that.setState({
        loadingMore: false,
        statusMessage: "Failed to load more commits.",
        statusType: "error"
      });
    });
  },
  toggleAddModal: function() {
    this.setState({
      showAddModal: !this.state.showAddModal,
      addCommitError: "",
      showLLMModal: false
    });
  },
  toggleLLMModal: function() {
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
      $.get("/get_llm_prompt", function(data) {
        if (data.success) {
          that.setState({ llmSystemPrompt: data.prompt });
        }
      });
    }
  },
  handleNewCommitChange: function(field, event) {
    var updated = Object.assign({}, this.state.newCommit);
    updated[field] = event.target.value;
    this.setState({ newCommit: updated });
  },
  setOpenRouterModel: function(modelName) {
    localStorage.setItem("openrouter_model", modelName);
    this.setState({ llmModel: modelName });
  },
  handleLLMFieldChange: function(field, event) {
    var val = event.target.value;
    var update = {};
    update[field] = val;
    if (field === "llmProvider") {
      localStorage.setItem("preferred_llm_provider", val);
      var key = localStorage.getItem(val + "_api_key") || "";
      update.llmApiKey = key;
      if (val === "openrouter") {
        update.llmModel = localStorage.getItem("openrouter_model") || "anthropic/claude-3.5-sonnet";
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
    } else if (field === "llmModel") {
      if (this.state.llmProvider === "openrouter") {
        localStorage.setItem("openrouter_model", val.trim());
      } else if (this.state.llmProvider === "custom") {
        localStorage.setItem("custom_api_model", val.trim());
      }
    }
    this.setState(update);
  },
  generateLLMCommits: function(e) {
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
    }, function(data) {
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
    }).fail(function(xhr, status, err) {
      that.setState({
        loadingLLM: false,
        llmError: "Request failed: " + (err || "Check your API key and connection.")
      });
    });
  },
  applyAllLLMCommits: function() {
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
      }, function(res) {
        if (res.success) {
          sendNext();
        } else {
          that.setState({
            loadingLLM: false,
            llmError: "Error at commit " + index + ": " + res.error
          });
        }
      }).fail(function() {
        that.setState({
          loadingLLM: false,
          llmError: "Network error creating commit " + index
        });
      });
    }
    sendNext();
  },
  submitNewCommit: function(e) {
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
    }, function(data) {
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
    }).fail(function() {
      that.setState({
        addingCommit: false,
        addCommitError: "Network error while creating commit."
      });
    });
  },
  doneClick: function(event) {
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
      }, function(data) {
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
      }).fail(function() {
        $btn.removeClass("loading disabled");
        that.setState({
          statusMessage: "Network error generating command.",
          statusType: "error"
        });
      });
    }
  },
  render: function() {
    var that = this;
    var modifiedCount = that.countModified();
    var modifiedCommitsList = that.getModifiedCommits();
    var originChanged = that.state.newOriginUrl && that.state.newOriginUrl.trim() !== "" && that.state.newOriginUrl.trim() !== that.state.originUrl;
    var confirmModal = null;
    if (that.state.showConfirmModal) {
      confirmModal = /* @__PURE__ */ React.createElement("div", { className: "custom-modal-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "custom-modal-card" }, /* @__PURE__ */ React.createElement("div", { className: "custom-modal-header" }, /* @__PURE__ */ React.createElement("h3", null, /* @__PURE__ */ React.createElement("i", { className: "shield alternate icon", style: { color: "var(--color-orange)" } }), "Confirm Git Repository Modifications"), /* @__PURE__ */ React.createElement("i", { className: "close icon link", onClick: that.closeConfirmModal })), that.state.confirmError ? /* @__PURE__ */ React.createElement("div", { className: "ui negative message" }, that.state.confirmError) : null, /* @__PURE__ */ React.createElement("div", { className: "ui info message", style: { margin: "10px 0" } }, /* @__PURE__ */ React.createElement("i", { className: "info circle icon" }), "Review all pending changes below. ", /* @__PURE__ */ React.createElement("strong", null, "No git modifications are executed before you click Confirm.")), /* @__PURE__ */ React.createElement("div", { className: "ui form", style: { marginTop: "16px" } }, /* @__PURE__ */ React.createElement("div", { className: "two fields" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("i", { className: "code branch icon" }), " Target Branch"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: that.state.rev,
          readOnly: true,
          style: { background: "var(--color-secondary)" }
        }
      ), /* @__PURE__ */ React.createElement("small", { style: { color: "var(--color-text-muted)" } }, "Branch history to be rewritten.")), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("i", { className: "plus circle icon" }), " Or Create New Branch for Changes (Optional)"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          placeholder: "e.g. rewritten-branch",
          value: that.state.confirmTargetBranch,
          onChange: function(e) {
            that.setState({ confirmTargetBranch: e.target.value });
          }
        }
      ), /* @__PURE__ */ React.createElement("small", { style: { color: "var(--color-text-muted)" } }, "Leave blank to apply directly to '", that.state.rev, "'."))), /* @__PURE__ */ React.createElement("div", { style: { background: "var(--color-primary)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-base)", padding: "14px", marginTop: "12px" } }, /* @__PURE__ */ React.createElement("h4", { style: { margin: "0 0 10px 0", color: "var(--color-text)", fontSize: "0.875rem" } }, /* @__PURE__ */ React.createElement("i", { className: "cloud icon", style: { color: "var(--color-accent)" } }), " Git Origin Remote Configuration"), that.state.isTiedToOrigin || that.state.hasOrigin ? /* @__PURE__ */ React.createElement("p", { style: { margin: "4px 0", fontSize: "0.8125rem" } }, /* @__PURE__ */ React.createElement("strong", null, "Current Origin:"), " ", /* @__PURE__ */ React.createElement("code", { style: { color: "var(--color-accent)", fontFamily: "var(--font-mono)" } }, that.state.originUrl)) : /* @__PURE__ */ React.createElement("p", { style: { margin: "4px 0", fontSize: "0.8125rem", color: "var(--color-text-muted)" } }, /* @__PURE__ */ React.createElement("em", null, "Repository is currently not tied to any origin remote.")), originChanged ? /* @__PURE__ */ React.createElement("div", { className: "ui warning message", style: { padding: "8px 12px", margin: "8px 0" } }, /* @__PURE__ */ React.createElement("i", { className: "exchange icon" }), " Origin remote URL will be updated to: ", /* @__PURE__ */ React.createElement("strong", null, that.state.newOriginUrl.trim())) : null, /* @__PURE__ */ React.createElement("div", { className: "ui checkbox", style: { marginTop: "8px" } }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          id: "confirm-push-origin",
          checked: that.state.pushOrigin,
          onChange: function(e) {
            that.setState({ pushOrigin: e.target.checked });
          }
        }
      ), /* @__PURE__ */ React.createElement("label", { htmlFor: "confirm-push-origin", style: { fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer" } }, "Force push rewritten branch to remote origin after modification (Recommended if tied to origin)"))), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "16px" } }, /* @__PURE__ */ React.createElement("h4", { style: { margin: "0 0 10px 0", color: "var(--color-text)", fontSize: "0.875rem" } }, /* @__PURE__ */ React.createElement("i", { className: "edit icon", style: { color: "var(--color-orange)" } }), " Modified Commits (", modifiedCommitsList.length, ")"), modifiedCommitsList.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "diff-table-container" }, /* @__PURE__ */ React.createElement("table", { className: "diff-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Commit"), /* @__PURE__ */ React.createElement("th", null, "Message"), /* @__PURE__ */ React.createElement("th", null, "Changes (Old \u2192 New)"))), /* @__PURE__ */ React.createElement("tbody", null, modifiedCommitsList.map(function(item) {
        var c = item.current;
        var o = item.original;
        var diffs = [];
        if (c.message !== o.message) {
          diffs.push(/* @__PURE__ */ React.createElement("div", { key: "m" }, "Msg: ", /* @__PURE__ */ React.createElement("span", { className: "diff-old" }, o.message), " ", /* @__PURE__ */ React.createElement("span", { className: "diff-new" }, c.message)));
        }
        if (c.author !== o.author) {
          diffs.push(/* @__PURE__ */ React.createElement("div", { key: "a" }, "Author: ", /* @__PURE__ */ React.createElement("span", { className: "diff-old" }, o.author), " ", /* @__PURE__ */ React.createElement("span", { className: "diff-new" }, c.author)));
        }
        if (c.email !== o.email) {
          diffs.push(/* @__PURE__ */ React.createElement("div", { key: "e" }, "Email: ", /* @__PURE__ */ React.createElement("span", { className: "diff-old" }, o.email), " ", /* @__PURE__ */ React.createElement("span", { className: "diff-new" }, c.email)));
        }
        if (c.date !== o.date || c.time !== o.time) {
          diffs.push(/* @__PURE__ */ React.createElement("div", { key: "t" }, "Time: ", /* @__PURE__ */ React.createElement("span", { className: "diff-old" }, o.date, " ", o.time), " ", /* @__PURE__ */ React.createElement("span", { className: "diff-new" }, c.date, " ", c.time)));
        }
        return /* @__PURE__ */ React.createElement("tr", { key: c.sha }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("code", { style: { fontFamily: "var(--font-mono)", fontWeight: "700" } }, c.sha.slice(0, 7))), /* @__PURE__ */ React.createElement("td", null, c.message ? c.message.slice(0, 40) : ""), /* @__PURE__ */ React.createElement("td", null, diffs));
      })))) : /* @__PURE__ */ React.createElement("p", { style: { color: "var(--color-text-muted)", fontSize: "0.8125rem" } }, "No commit modifications detected. Only branch or origin settings will be updated."))), /* @__PURE__ */ React.createElement("div", { className: "custom-modal-actions" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "zero-btn-secondary",
          onClick: that.closeConfirmModal,
          disabled: that.state.applyingChanges
        },
        "Cancel"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "zero-btn-primary " + (that.state.applyingChanges ? "loading disabled" : ""),
          onClick: that.confirmMakeChanges,
          style: { background: "var(--color-green)", borderColor: "var(--color-green)" }
        },
        /* @__PURE__ */ React.createElement("i", { className: "check circle icon" }),
        " Confirm & Apply Changes"
      ))));
    }
    var branchModal = null;
    if (that.state.showBranchModal) {
      branchModal = /* @__PURE__ */ React.createElement("div", { className: "custom-modal-overlay" }, /* @__PURE__ */ React.createElement("div", { className: "custom-modal-card", style: { maxWidth: "480px" } }, /* @__PURE__ */ React.createElement("div", { className: "custom-modal-header" }, /* @__PURE__ */ React.createElement("h3", null, /* @__PURE__ */ React.createElement("i", { className: "code branch icon", style: { color: "var(--color-accent)" } }), " Create New Git Branch"), /* @__PURE__ */ React.createElement("i", { className: "close icon link", onClick: that.closeBranchModal })), that.state.branchError ? /* @__PURE__ */ React.createElement("div", { className: "ui negative message" }, that.state.branchError) : null, /* @__PURE__ */ React.createElement("form", { className: "ui form", onSubmit: that.submitCreateBranch }, /* @__PURE__ */ React.createElement("div", { className: "field required" }, /* @__PURE__ */ React.createElement("label", null, "New Branch Name"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          placeholder: "e.g. feature/zero-ui",
          value: that.state.newBranchName,
          onChange: function(e) {
            that.setState({ newBranchName: e.target.value });
          },
          autoFocus: true
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Base Revision"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: that.state.rev,
          readOnly: true,
          style: { background: "var(--color-secondary)" }
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "custom-modal-actions" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "zero-btn-secondary",
          onClick: that.closeBranchModal
        },
        "Cancel"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "submit",
          className: "zero-btn-primary " + (that.state.creatingBranch ? "loading disabled" : "")
        },
        /* @__PURE__ */ React.createElement("i", { className: "plus icon" }),
        " Create Branch"
      )))));
    }
    var addCommitPanel = null;
    if (that.state.showAddModal) {
      addCommitPanel = /* @__PURE__ */ React.createElement("div", { className: "progressive-panel" }, /* @__PURE__ */ React.createElement("h4", null, /* @__PURE__ */ React.createElement("i", { className: "plus circle icon", style: { color: "var(--color-accent)" } }), " Add New Commit"), that.state.addCommitError ? /* @__PURE__ */ React.createElement("div", { className: "ui negative message" }, that.state.addCommitError) : null, /* @__PURE__ */ React.createElement("form", { className: "ui form", onSubmit: that.submitNewCommit }, /* @__PURE__ */ React.createElement("div", { className: "field required" }, /* @__PURE__ */ React.createElement("label", null, "Commit Message"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          placeholder: "e.g. feat(core): add progressive disclosure",
          value: that.state.newCommit.message,
          onChange: that.handleNewCommitChange.bind(that, "message")
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "four fields" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Author Name"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          placeholder: "Author Name",
          value: that.state.newCommit.author,
          onChange: that.handleNewCommitChange.bind(that, "author")
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Author Email"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "email",
          placeholder: "author@example.com",
          value: that.state.newCommit.email,
          onChange: that.handleNewCommitChange.bind(that, "email")
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Date"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "date",
          value: that.state.newCommit.date,
          onChange: that.handleNewCommitChange.bind(that, "date")
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Time"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          placeholder: "HH:MM:SS",
          value: that.state.newCommit.time,
          onChange: that.handleNewCommitChange.bind(that, "time")
        }
      ))), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px", marginTop: "10px" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "submit",
          className: "zero-btn-primary " + (that.state.addingCommit ? "loading disabled" : ""),
          style: { background: "var(--color-green)", borderColor: "var(--color-green)" }
        },
        /* @__PURE__ */ React.createElement("i", { className: "check icon" }),
        " Commit & Save"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "zero-btn-secondary",
          onClick: that.toggleAddModal
        },
        "Cancel"
      ))));
    }
    var aiEngineerPanel = null;
    if (that.state.showLLMModal) {
      aiEngineerPanel = /* @__PURE__ */ React.createElement("div", { className: "progressive-panel" }, /* @__PURE__ */ React.createElement("h4", null, /* @__PURE__ */ React.createElement("i", { className: "magic icon", style: { color: "var(--color-orange)" } }), " AI Git Engineer: Commit & Diff Sculptor"), /* @__PURE__ */ React.createElement("p", { style: { fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: "0 0 12px 0" } }, "Use OpenRouter, DeepSeek, OpenAI, Groq, Gemini, or any custom API key & endpoint to synthesize atomic commits with realistic timestamps and conventional commit messages."), that.state.llmError ? /* @__PURE__ */ React.createElement("div", { className: "ui negative message" }, that.state.llmError) : null, /* @__PURE__ */ React.createElement("form", { className: "ui form", onSubmit: that.generateLLMCommits }, /* @__PURE__ */ React.createElement("div", { className: "three fields" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "LLM Provider"), /* @__PURE__ */ React.createElement(
        "select",
        {
          className: "ui dropdown",
          value: that.state.llmProvider,
          onChange: that.handleLLMFieldChange.bind(that, "llmProvider")
        },
        /* @__PURE__ */ React.createElement("option", { value: "openrouter" }, "OpenRouter (Recommended - All Models)"),
        /* @__PURE__ */ React.createElement("option", { value: "deepseek" }, "DeepSeek (api.deepseek.com)"),
        /* @__PURE__ */ React.createElement("option", { value: "openai" }, "OpenAI (api.openai.com)"),
        /* @__PURE__ */ React.createElement("option", { value: "groq" }, "Groq (api.groq.com)"),
        /* @__PURE__ */ React.createElement("option", { value: "gemini" }, "Google Gemini"),
        /* @__PURE__ */ React.createElement("option", { value: "custom" }, "Custom / Any API Key")
      )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Model (Type any model ID from OpenRouter docs)"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          placeholder: that.state.llmProvider === "openrouter" ? "e.g. anthropic/claude-3.5-sonnet" : that.state.llmProvider === "deepseek" ? "deepseek-chat" : "gpt-4o",
          value: that.state.llmModel,
          onChange: that.handleLLMFieldChange.bind(that, "llmModel"),
          list: that.state.llmProvider === "openrouter" ? "openrouter-models-datalist" : void 0
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "field required" }, /* @__PURE__ */ React.createElement("label", null, "API Key"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "password",
          placeholder: that.state.llmProvider === "openrouter" ? "sk-or-v1-..." : that.state.llmProvider === "deepseek" ? "sk-..." : "Any API key",
          value: that.state.llmApiKey,
          onChange: that.handleLLMFieldChange.bind(that, "llmApiKey")
        }
      ))), that.state.llmProvider === "openrouter" ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px", alignItems: "center" } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 } }, "Quick Select:"), [
        "anthropic/claude-3.5-sonnet",
        "deepseek/deepseek-r1",
        "deepseek/deepseek-chat",
        "openai/gpt-4o",
        "openai/gpt-4o-mini",
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.3-70b-instruct",
        "qwen/qwen-2.5-coder-32b-instruct"
      ].map(function(m) {
        var isCurrent = that.state.llmModel === m;
        return /* @__PURE__ */ React.createElement(
          "button",
          {
            key: m,
            type: "button",
            className: "zero-pill " + (isCurrent ? "zero-pill-accent" : "zero-pill-neutral"),
            style: { cursor: "pointer", border: isCurrent ? "1px solid #18181B" : "1px solid var(--color-border)" },
            onClick: function() {
              that.setOpenRouterModel(m);
            }
          },
          m.split("/")[1] || m
        );
      })) : null, that.state.llmProvider === "custom" ? /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: "12px" } }, /* @__PURE__ */ React.createElement("label", null, "Base URL / Endpoint (e.g. Ollama, LM Studio, or custom proxy)"), /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          placeholder: "http://localhost:11434/v1/chat/completions",
          value: that.state.llmBaseUrl,
          onChange: that.handleLLMFieldChange.bind(that, "llmBaseUrl")
        }
      )) : null, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Diff or Instructions (Leave blank to auto-analyze diff)"), /* @__PURE__ */ React.createElement(
        "textarea",
        {
          rows: 3,
          placeholder: "Paste diff or describe: 'Decompose auth refactoring and unit tests into 2 atomic commits'",
          value: that.state.llmPrompt,
          onChange: that.handleLLMFieldChange.bind(that, "llmPrompt")
        }
      )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px", marginBottom: "14px" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "submit",
          className: "zero-btn-primary " + (that.state.loadingLLM ? "loading disabled" : "")
        },
        /* @__PURE__ */ React.createElement("i", { className: "bolt icon" }),
        " Synthesize Commits"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "zero-btn-secondary",
          onClick: that.toggleLLMModal
        },
        "Close"
      ))), that.state.llmGeneratedCommits && that.state.llmGeneratedCommits.length > 0 ? /* @__PURE__ */ React.createElement("div", { style: { marginTop: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "12px" } }, /* @__PURE__ */ React.createElement("div", { className: "ui list" }, that.state.llmGeneratedCommits.map(function(gc, gi) {
        return /* @__PURE__ */ React.createElement("div", { className: "item", key: gi, style: { padding: "4px 0" } }, /* @__PURE__ */ React.createElement("i", { className: "check circle outline green icon" }), /* @__PURE__ */ React.createElement("div", { className: "content" }, /* @__PURE__ */ React.createElement("div", { className: "header", style: { fontSize: "0.875rem" } }, gc.message ? gc.message.split("\n")[0] : ""), /* @__PURE__ */ React.createElement("div", { className: "description", style: { fontSize: "0.75rem", color: "var(--color-text-muted)" } }, gc.author || gc.author_name, " | ", gc.date, " ", gc.time)));
      })), /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "zero-btn-primary " + (that.state.loadingLLM ? "loading disabled" : ""),
          style: { background: "var(--color-green)", borderColor: "var(--color-green)", marginTop: "8px" },
          onClick: that.applyAllLLMCommits
        },
        /* @__PURE__ */ React.createElement("i", { className: "check icon" }),
        " Apply All ",
        that.state.llmGeneratedCommits.length,
        " Commits"
      )) : null);
    }
    var statusAlert = null;
    if (that.state.statusMessage) {
      var msgClass = that.state.statusType === "error" ? "negative" : that.state.statusType === "success" ? "positive" : "info";
      statusAlert = /* @__PURE__ */ React.createElement("div", { className: "ui " + msgClass + " message", style: { marginBottom: "1.25rem" } }, /* @__PURE__ */ React.createElement(
        "i",
        {
          className: "close icon",
          onClick: function() {
            that.setState({ statusMessage: "" });
          }
        }
      ), that.state.statusMessage);
    }
    var loadMoreSection = null;
    if (that.state.hasMore) {
      loadMoreSection = /* @__PURE__ */ React.createElement("div", { style: { marginTop: "1.5rem", textAlign: "center" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: "zero-btn-secondary " + (that.state.loadingMore ? "loading disabled" : ""),
          onClick: that.loadMoreCommits
        },
        /* @__PURE__ */ React.createElement("i", { className: "arrow down icon" }),
        " Load More Commits (+20)"
      ));
    } else if (that.state.commits.length > 0) {
      loadMoreSection = /* @__PURE__ */ React.createElement("div", { style: { marginTop: "1.5rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.8125rem" } }, /* @__PURE__ */ React.createElement("i", { className: "check circle outline icon" }), " All reachable commits loaded (", that.state.commits.length, " total)");
    }
    var commandArea = null;
    if (that.state.command) {
      commandArea = /* @__PURE__ */ React.createElement("div", { className: "progressive-panel", style: { marginTop: "1.5rem" } }, /* @__PURE__ */ React.createElement("h4", null, /* @__PURE__ */ React.createElement("i", { className: "terminal icon" }), " Generated Filter Script"), /* @__PURE__ */ React.createElement("div", { className: "ui form" }, /* @__PURE__ */ React.createElement(
        "textarea",
        {
          value: that.state.command,
          readOnly: true,
          rows: 6,
          style: { fontFamily: "var(--font-mono)", fontSize: "12px", background: "#18181B", color: "#FAFAFA" }
        }
      )), /* @__PURE__ */ React.createElement("div", { style: { marginTop: "12px", textAlign: "right" } }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "zero-btn-primary",
          style: { background: "var(--color-green)", borderColor: "var(--color-green)" },
          onClick: that.openConfirmModal
        },
        /* @__PURE__ */ React.createElement("i", { className: "check circle icon" }),
        " Make Changes & Confirm"
      )));
    }
    var statsTotalText = that.state.total !== null ? " of " + that.state.total : "";
    var hasPendingChanges = modifiedCount > 0 || originChanged;
    return /* @__PURE__ */ React.createElement("div", { className: "sixteen wide column" }, statusAlert, confirmModal, branchModal, addCommitPanel, aiEngineerPanel, /* @__PURE__ */ React.createElement(
      GitVisualizer,
      {
        commits: that.state.commits,
        originalCommits: that.state.originalCommits,
        branches: that.state.branches || [],
        branchesData: that.state.branchesData || [],
        activeBranch: that.state.activeBranch || that.state.rev,
        hasOrigin: that.state.hasOrigin,
        originUrl: that.state.originUrl,
        newOriginUrl: that.state.newOriginUrl,
        isTiedToOrigin: that.state.isTiedToOrigin,
        onSelectCommit: that.scrollToCommit,
        onSwitchBranch: that.switchBranchTo,
        onOpenBranchModal: that.openBranchModal
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "branch-origin-bar" }, /* @__PURE__ */ React.createElement("div", { className: "branch-controls-group" }, /* @__PURE__ */ React.createElement("label", { style: { fontWeight: "600", color: "var(--color-text)", fontSize: "0.8125rem" } }, /* @__PURE__ */ React.createElement("i", { className: "code branch icon", style: { color: "var(--color-accent)" } }), " Branch:"), /* @__PURE__ */ React.createElement("div", { className: "branch-select-wrapper" }, /* @__PURE__ */ React.createElement(
      "select",
      {
        value: that.state.rev,
        onChange: that.handleBranchChange
      },
      that.state.branches.map(function(b) {
        var isCur = b === that.state.activeBranch;
        return /* @__PURE__ */ React.createElement("option", { key: b, value: b }, b, isCur ? " (active)" : "");
      }),
      /* @__PURE__ */ React.createElement("option", { value: "__CREATE_NEW__" }, "+ Create New Branch...")
    )), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "zero-btn-secondary",
        style: { padding: "6px 12px", fontSize: "0.8125rem" },
        onClick: that.openBranchModal
      },
      /* @__PURE__ */ React.createElement("i", { className: "plus icon" }),
      " Branch"
    )), /* @__PURE__ */ React.createElement("div", { className: "origin-controls-group" }, that.state.isTiedToOrigin || that.state.hasOrigin ? /* @__PURE__ */ React.createElement("div", { className: "origin-badge", title: that.state.originUrl }, /* @__PURE__ */ React.createElement("i", { className: "cloud icon" }), /* @__PURE__ */ React.createElement("span", null, "Origin: ", that.state.originUrl.length > 28 ? that.state.originUrl.slice(0, 28) + "..." : that.state.originUrl)) : /* @__PURE__ */ React.createElement("div", { className: "origin-badge not-tied" }, /* @__PURE__ */ React.createElement("i", { className: "unlink icon" }), /* @__PURE__ */ React.createElement("span", null, "No Origin Remote")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "zero-btn-secondary",
        style: { padding: "6px 12px", fontSize: "0.8125rem" },
        onClick: function() {
          that.setState({ showOriginEdit: !that.state.showOriginEdit });
        }
      },
      /* @__PURE__ */ React.createElement("i", { className: "edit icon" }),
      " ",
      that.state.showOriginEdit ? "Hide Origin Setup" : "Change Origin"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "zero-btn-primary",
        style: {
          background: hasPendingChanges ? "var(--color-orange)" : "#18181B",
          borderColor: hasPendingChanges ? "var(--color-orange)" : "#18181B"
        },
        onClick: that.openConfirmModal
      },
      /* @__PURE__ */ React.createElement("i", { className: "magic icon" }),
      " Make Changes ",
      hasPendingChanges ? "(" + (modifiedCount + (originChanged ? 1 : 0)) + ")" : ""
    ))), that.state.showOriginEdit ? /* @__PURE__ */ React.createElement("div", { className: "progressive-panel", style: { marginBottom: "1.5rem" } }, /* @__PURE__ */ React.createElement("h4", null, /* @__PURE__ */ React.createElement("i", { className: "cloud upload icon", style: { color: "var(--color-accent)" } }), " Configure Remote Origin"), /* @__PURE__ */ React.createElement("div", { className: "ui action input", style: { width: "100%" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        placeholder: "Enter new origin URL (e.g. https://github.com/user/new-repo.git)",
        value: that.state.newOriginUrl,
        onChange: function(e) {
          that.setState({ newOriginUrl: e.target.value });
        }
      }
    ), that.state.newOriginUrl ? /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "zero-btn-secondary",
        onClick: function() {
          that.setState({ newOriginUrl: "" });
        }
      },
      "Clear"
    ) : null), /* @__PURE__ */ React.createElement("div", { className: "ui checkbox", style: { marginTop: "10px" } }, /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "checkbox",
        id: "bar-push-origin",
        checked: that.state.pushOrigin,
        onChange: function(e) {
          that.setState({ pushOrigin: e.target.checked });
        }
      }
    ), /* @__PURE__ */ React.createElement("label", { htmlFor: "bar-push-origin", style: { fontSize: "0.8125rem", cursor: "pointer" } }, "Push rewritten branch to origin after making changes (runs git push --force origin)"))) : null, /* @__PURE__ */ React.createElement("div", { className: "commit-table-card" }, /* @__PURE__ */ React.createElement("div", { className: "toolbar-stats" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "zero-pill zero-pill-accent", style: { marginRight: "6px" } }, "Branch: ", that.state.rev), /* @__PURE__ */ React.createElement("span", { className: "zero-pill zero-pill-neutral", style: { marginRight: "6px" } }, "Showing ", that.state.commits.length, statsTotalText, " commits"), modifiedCount > 0 ? /* @__PURE__ */ React.createElement("span", { className: "zero-pill zero-pill-orange" }, modifiedCount, " modified (live preview)") : null), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: "8px" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "zero-btn-secondary",
        style: { padding: "6px 12px", fontSize: "0.8125rem" },
        onClick: that.toggleLLMModal
      },
      /* @__PURE__ */ React.createElement("i", { className: "magic icon" }),
      " AI Engineer"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "zero-btn-secondary",
        style: { padding: "6px 12px", fontSize: "0.8125rem" },
        onClick: that.toggleAddModal
      },
      /* @__PURE__ */ React.createElement("i", { className: "plus icon" }),
      " Add Commit"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "zero-btn-primary",
        style: {
          background: hasPendingChanges ? "var(--color-orange)" : "#18181B",
          borderColor: hasPendingChanges ? "var(--color-orange)" : "#18181B",
          padding: "6px 14px",
          fontSize: "0.8125rem"
        },
        onClick: that.openConfirmModal
      },
      /* @__PURE__ */ React.createElement("i", { className: "magic icon" }),
      " Make Changes ",
      hasPendingChanges ? "(" + (modifiedCount + (originChanged ? 1 : 0)) + ")" : ""
    ))), /* @__PURE__ */ React.createElement("div", { className: "ui form" }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { fontWeight: "600", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-secondary)", paddingBottom: "8px" } }, /* @__PURE__ */ React.createElement("div", { className: "six fields", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "two wide field" }, /* @__PURE__ */ React.createElement("label", null, "SHA (Read-Only)")), /* @__PURE__ */ React.createElement("div", { className: "four wide field" }, /* @__PURE__ */ React.createElement("label", null, "Commit Message")), /* @__PURE__ */ React.createElement("div", { className: "three wide field" }, /* @__PURE__ */ React.createElement("label", null, "Author Name")), /* @__PURE__ */ React.createElement("div", { className: "three wide field" }, /* @__PURE__ */ React.createElement("label", null, "Author Email")), /* @__PURE__ */ React.createElement("div", { className: "two wide field" }, /* @__PURE__ */ React.createElement("label", null, "Date")), /* @__PURE__ */ React.createElement("div", { className: "two wide field" }, /* @__PURE__ */ React.createElement("label", null, "Time")))), that.state.commits.map(function(commit, index) {
      var modified = that.isModified(index);
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          id: "commit-row-" + index,
          className: "commit-row " + (modified ? "modified-row" : ""),
          key: commit.sha || index
        },
        /* @__PURE__ */ React.createElement("div", { className: "six fields", style: { margin: 0 } }, /* @__PURE__ */ React.createElement("div", { className: "two wide disabled field" }, /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "text",
            placeholder: "SHA",
            value: commit.sha ? commit.sha.slice(0, 7) : "",
            readOnly: true,
            style: { fontFamily: "var(--font-mono)" }
          }
        )), /* @__PURE__ */ React.createElement("div", { className: "four wide field" }, /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "text",
            placeholder: "Commit message",
            value: commit.message,
            title: commit.message,
            onChange: that.inputChange.bind(that, index, "message")
          }
        )), /* @__PURE__ */ React.createElement("div", { className: "three wide field" }, /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "text",
            placeholder: "Author",
            value: commit.author,
            onChange: that.inputChange.bind(that, index, "author")
          }
        )), /* @__PURE__ */ React.createElement("div", { className: "three wide field" }, /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "email",
            placeholder: "Email",
            value: commit.email,
            onChange: that.inputChange.bind(that, index, "email")
          }
        )), /* @__PURE__ */ React.createElement("div", { className: "two wide field" }, /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "date",
            value: commit.date,
            onChange: that.inputChange.bind(that, index, "date")
          }
        )), /* @__PURE__ */ React.createElement("div", { className: "two wide field" }, /* @__PURE__ */ React.createElement(
          "input",
          {
            type: "text",
            placeholder: "HH:MM:SS",
            value: commit.time,
            onChange: that.inputChange.bind(that, index, "time")
          }
        )))
      );
    })), loadMoreSection, /* @__PURE__ */ React.createElement("div", { style: { marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "zero-btn-secondary",
        onClick: that.doneClick,
        id: "edit"
      },
      /* @__PURE__ */ React.createElement("i", { className: "terminal icon" }),
      " View Raw Command"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "zero-btn-primary",
        style: {
          background: hasPendingChanges ? "var(--color-orange)" : "#18181B",
          borderColor: hasPendingChanges ? "var(--color-orange)" : "#18181B",
          padding: "12px 24px",
          fontSize: "1rem"
        },
        onClick: that.openConfirmModal
      },
      /* @__PURE__ */ React.createElement("i", { className: "magic icon" }),
      " Make Changes ",
      hasPendingChanges ? "(" + (modifiedCount + (originChanged ? 1 : 0)) + " pending)" : ""
    ))), commandArea);
  }
});
function renderError(message) {
  ReactDOM.render(
    /* @__PURE__ */ React.createElement("div", { className: "sixteen wide column" }, /* @__PURE__ */ React.createElement("div", { className: "ui negative message", style: { borderRadius: "var(--radius-base)" } }, /* @__PURE__ */ React.createElement(
      "i",
      {
        className: "close icon",
        onClick: function() {
          ReactDOM.unmountComponentAtNode(document.getElementById("commits"));
        }
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "header" }, "Error"), /* @__PURE__ */ React.createElement("p", null, message))),
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
  }, function(data) {
    $btn.removeClass("loading disabled");
    if (data.success) {
      ReactDOM.render(
        /* @__PURE__ */ React.createElement(
          CommitForm,
          {
            commits: data.commits,
            address: data.address,
            rev: data.rev,
            hasMore: data.has_more,
            total: data.total,
            branches: data.branches,
            branchesData: data.branches_data || [],
            activeBranch: data.active_branch,
            hasOrigin: data.has_origin,
            originUrl: data.origin_url,
            isTiedToOrigin: data.is_tied_to_origin
          }
        ),
        document.getElementById("commits")
      );
    } else {
      renderError(data.error || "Failed to load commits.");
    }
  }).fail(function(xhr, status, error) {
    $btn.removeClass("loading disabled");
    renderError("Network error: Could not reach server. " + (error || ""));
  });
}
window.refreshCurrentRepo = function() {
  var addr = $("#addr-input").val();
  var rev = $("#rev-input").val();
  fetchCommits(addr, rev);
};
function initKeyboardShortcuts() {
  $(document).on("keydown", function(e) {
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
  $("#api-keys-popout-btn").on("click", function() {
    $("#key-openrouter").val(localStorage.getItem("openrouter_api_key") || "");
    $("#model-openrouter").val(localStorage.getItem("openrouter_model") || "anthropic/claude-3.5-sonnet");
    $("#key-deepseek").val(localStorage.getItem("deepseek_api_key") || "");
    $("#key-openai").val(localStorage.getItem("openai_api_key") || "");
    $("#key-custom").val(localStorage.getItem("custom_api_key") || "");
    $("#url-custom").val(localStorage.getItem("custom_api_url") || "");
    $("#model-custom").val(localStorage.getItem("custom_api_model") || "");
    $("#api-keys-modal").fadeIn(200);
  });
  $("#api-keys-close-btn").on("click", function() {
    $("#api-keys-modal").fadeOut(150);
  });
  $("#api-keys-modal").on("click", function(e) {
    if ($(e.target).is("#api-keys-modal")) {
      $("#api-keys-modal").fadeOut(150);
    }
  });
  $(".toggle-pwd").on("click", function() {
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
  $("#api-keys-save-btn").on("click", function() {
    var or = $("#key-openrouter").val().trim();
    var om = $("#model-openrouter").val().trim();
    var ds = $("#key-deepseek").val().trim();
    var oa = $("#key-openai").val().trim();
    var cs = $("#key-custom").val().trim();
    var cu = $("#url-custom").val().trim();
    var cm = $("#model-custom").val().trim();
    if (or) localStorage.setItem("openrouter_api_key", or);
    else localStorage.removeItem("openrouter_api_key");
    if (om) localStorage.setItem("openrouter_model", om);
    else localStorage.removeItem("openrouter_model");
    if (ds) localStorage.setItem("deepseek_api_key", ds);
    else localStorage.removeItem("deepseek_api_key");
    if (oa) localStorage.setItem("openai_api_key", oa);
    else localStorage.removeItem("openai_api_key");
    if (cs) localStorage.setItem("custom_api_key", cs);
    else localStorage.removeItem("custom_api_key");
    if (cu) localStorage.setItem("custom_api_url", cu);
    else localStorage.removeItem("custom_api_url");
    if (cm) localStorage.setItem("custom_api_model", cm);
    else localStorage.removeItem("custom_api_model");
    updateApiKeyStatusDot();
    $("#api-keys-modal").fadeOut(150);
  });
  $("#api-keys-clear-btn").on("click", function() {
    $("#key-openrouter").val("");
    $("#model-openrouter").val("");
    $("#key-deepseek").val("");
    $("#key-openai").val("");
    $("#key-custom").val("");
    $("#url-custom").val("");
    $("#model-custom").val("");
    localStorage.removeItem("openrouter_api_key");
    localStorage.removeItem("openrouter_model");
    localStorage.removeItem("deepseek_api_key");
    localStorage.removeItem("openai_api_key");
    localStorage.removeItem("custom_api_key");
    localStorage.removeItem("custom_api_url");
    localStorage.removeItem("custom_api_model");
    updateApiKeyStatusDot();
  });
}
$(document).ready(function() {
  initApiKeysModal();
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
  $("#addr-input").on("input change", function() {
    localStorage.setItem("git_repo_path", $(this).val().trim());
  });
  $("#rev-input").on("input change", function() {
    localStorage.setItem("git_repo_rev", $(this).val().trim());
  });
  $("#modify").on("click", function() {
    var addr = $("#addr-input").val();
    var rev = $("#rev-input").val();
    fetchCommits(addr, rev);
  });
  $("#addr-input, #rev-input").on("keydown", function(e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      $("#modify").click();
    }
  });
  initKeyboardShortcuts();
  fetchCommits($("#addr-input").val(), $("#rev-input").val());
});
