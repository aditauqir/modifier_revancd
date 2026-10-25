# coding: utf-8

import os
import time
import json
import subprocess
from flask import Flask, render_template, jsonify, request, session
import git
from git_modify import RepoModifier, LLMHistoryEngineer

app = Flask(__name__)
app.config["SECRET_KEY"] = ";'AAN12#('S09KS[.:PQ9U0S'/2WEL"


def make_time_str(timestamp):
    time_array = time.localtime(timestamp)
    date_str = time.strftime("%Y-%m-%d", time_array)
    time_str = time.strftime("%H:%M:%S", time_array)
    return date_str, time_str


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/get_commits", methods=["POST"])
def get_commits():
    address = request.form.get("address", "").strip()
    rev = request.form.get("rev", "").strip()

    try:
        limit = int(request.form.get("limit", 20))
    except (ValueError, TypeError):
        limit = 20

    try:
        skip = int(request.form.get("skip", 0))
    except (ValueError, TypeError):
        skip = 0

    if not address:
        return jsonify({
            "success": False,
            "error": "Please enter a git repository path."
        })

    expanded_path = os.path.abspath(os.path.expanduser(address))
    if not os.path.isdir(expanded_path):
        return jsonify({
            "success": False,
            "error": f"Path does not exist: {address}"
        })

    try:
        repo = RepoModifier(expanded_path)
    except git.InvalidGitRepositoryError:
        return jsonify({
            "success": False,
            "error": f"'{address}' is not a valid git repository."
        })
    except git.NoSuchPathError:
        return jsonify({
            "success": False,
            "error": f"Repository path not found: '{address}'"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

    if not rev:
        try:
            rev = repo.repo.active_branch.name
        except Exception:
            rev = "HEAD"

    session["address"] = expanded_path
    session["rev"] = rev

    data = {
        "success": True,
        "commits": [],
        "rev": rev,
        "address": expanded_path,
        "total": repo.count_commits(rev)
    }

    try:
        branch_info = repo.get_branches()
        data["branches"] = branch_info["branches"]
        data["branches_data"] = branch_info.get("branches_data", [])
        data["active_branch"] = branch_info["active_branch"]
    except Exception:
        data["branches"] = [rev]
        data["branches_data"] = [{"name": rev, "sha": "", "is_active": True}]
        data["active_branch"] = rev

    try:
        origin_info = repo.get_origin_info()
        data["origin_info"] = origin_info
        data["has_origin"] = origin_info["has_origin"]
        data["origin_url"] = origin_info["origin_url"]
        data["is_tied_to_origin"] = origin_info["is_tied_to_origin"]
    except Exception:
        data["origin_info"] = {"has_origin": False, "origin_url": "", "is_tied_to_origin": False}
        data["has_origin"] = False
        data["origin_url"] = ""
        data["is_tied_to_origin"] = False

    try:
        commits_generator = repo.get_commits(rev, max_count=limit, skip=skip)
        branches_data = data.get("branches_data", [])
        for commit in commits_generator:
            date, time_part = make_time_str(commit.authored_date)
            matching_branches = [b["name"] for b in branches_data if b.get("sha") and (b["sha"] == commit.hexsha or commit.hexsha.startswith(b["sha"]))]
            commit_data = {
                "sha": commit.hexsha,
                "message": commit.message.split("\n")[0] if commit.message else "",
                "author": commit.author.name if commit.author else "",
                "email": commit.author.email if commit.author else "",
                "date": date,
                "time": time_part,
                "branches": matching_branches,
            }
            data["commits"].append(commit_data)

        data["has_more"] = (len(data["commits"]) == limit)
        if data["total"] is not None:
            data["has_more"] = (skip + len(data["commits"]) < data["total"])

        if skip == 0:
            session["commits_old"] = data["commits"]
        else:
            old = session.get("commits_old", [])
            existing_shas = {c["sha"] for c in old}
            for c in data["commits"]:
                if c["sha"] not in existing_shas:
                    old.append(c)
            session["commits_old"] = old[:100]

    except git.exc.GitCommandError as e:
        return jsonify({
            "success": False,
            "error": f"Git error on revision '{rev}': {e.stderr.strip() if e.stderr else str(e)}"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })

    return jsonify(data)


@app.route("/get_command", methods=["POST"])
def get_command():
    address = request.form.get("address", session.get("address", ""))
    rev = request.form.get("rev", session.get("rev", "HEAD"))
    address = os.path.abspath(os.path.expanduser(address.strip())) if address else ""

    raw_old = request.form.get("old_commits")
    if raw_old:
        try:
            old_commits = json.loads(raw_old)
        except Exception:
            old_commits = session.get("commits_old", [])
    else:
        old_commits = session.get("commits_old", [])

    try:
        new_commits = json.loads(request.form.get("commits", "[]"))
    except Exception:
        new_commits = []

    command = RepoModifier.generate_command(address, rev, old_commits, new_commits)
    session["command"] = command
    session["address"] = address
    session["rev"] = rev

    return jsonify({
        "success": True,
        "command": command
    })


@app.route("/create_branch", methods=["POST"])
def create_branch():
    address = request.form.get("address", session.get("address", "")).strip()
    branch_name = request.form.get("branch_name", "").strip()
    start_point = request.form.get("start_point", "").strip() or None
    checkout = request.form.get("checkout", "true").lower() in ("true", "1", "yes")

    if not address:
        return jsonify({"success": False, "error": "Repository address is required."})
    if not branch_name:
        return jsonify({"success": False, "error": "Branch name is required."})

    expanded_path = os.path.abspath(os.path.expanduser(address))
    try:
        repo = RepoModifier(expanded_path)
        created = repo.create_branch(branch_name, start_point=start_point, checkout=checkout)
        branch_info = repo.get_branches()
        session["address"] = expanded_path
        session["rev"] = branch_info["active_branch"]

        commits = []
        for c in repo.get_commits(branch_info["active_branch"], max_count=20, skip=0):
            date, time_part = make_time_str(c.authored_date)
            matching = [b["name"] for b in branch_info["branches_data"] if b.get("sha") and (b["sha"] == c.hexsha or c.hexsha.startswith(b["sha"]))]
            commits.append({
                "sha": c.hexsha,
                "message": c.message.split("\n")[0] if c.message else "",
                "author": c.author.name if c.author else "",
                "email": c.author.email if c.author else "",
                "date": date,
                "time": time_part,
                "branches": matching,
            })

        return jsonify({
            "success": True,
            "branch": created,
            "branches": branch_info["branches"],
            "branches_data": branch_info["branches_data"],
            "active_branch": branch_info["active_branch"],
            "commits": commits,
            "message": f"Branch '{created}' created successfully."
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/switch_branch", methods=["POST"])
def switch_branch():
    address = request.form.get("address", session.get("address", "")).strip()
    branch_name = request.form.get("branch_name", "").strip()

    if not address or not branch_name:
        return jsonify({"success": False, "error": "Address and branch name are required."})

    expanded_path = os.path.abspath(os.path.expanduser(address))
    try:
        repo = RepoModifier(expanded_path)
        switched = repo.switch_branch(branch_name)
        branch_info = repo.get_branches()
        session["address"] = expanded_path
        session["rev"] = switched

        commits = []
        for c in repo.get_commits(switched, max_count=20, skip=0):
            date, time_part = make_time_str(c.authored_date)
            matching = [b["name"] for b in branch_info["branches_data"] if b.get("sha") and (b["sha"] == c.hexsha or c.hexsha.startswith(b["sha"]))]
            commits.append({
                "sha": c.hexsha,
                "message": c.message.split("\n")[0] if c.message else "",
                "author": c.author.name if c.author else "",
                "email": c.author.email if c.author else "",
                "date": date,
                "time": time_part,
                "branches": matching,
            })

        return jsonify({
            "success": True,
            "active_branch": switched,
            "branches": branch_info["branches"],
            "branches_data": branch_info["branches_data"],
            "commits": commits,
            "message": f"Switched to branch '{switched}'."
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/make_changes", methods=["POST"])
def make_changes():
    address = request.form.get("address", session.get("address", "")).strip()
    rev = request.form.get("rev", session.get("rev", "HEAD")).strip()
    target_branch = request.form.get("target_branch", "").strip() or None
    raw_old = request.form.get("old_commits")
    raw_new = request.form.get("commits", "[]")
    change_origin = request.form.get("change_origin", "false").lower() in ("true", "1", "yes")
    new_origin_url = request.form.get("new_origin_url", "").strip() or None
    push_origin = request.form.get("push_origin", "false").lower() in ("true", "1", "yes")

    if not address:
        return jsonify({"success": False, "error": "Repository address is required."})

    expanded_path = os.path.abspath(os.path.expanduser(address))

    try:
        old_commits = json.loads(raw_old) if raw_old else session.get("commits_old", [])
    except Exception:
        old_commits = session.get("commits_old", [])

    try:
        new_commits = json.loads(raw_new) if raw_new else []
    except Exception:
        new_commits = []

    try:
        repo = RepoModifier(expanded_path)
        result = repo.apply_modifications(
            rev=rev,
            old_commits=old_commits,
            new_commits=new_commits,
            target_branch=target_branch,
            new_origin_url=new_origin_url if change_origin else None,
            push_origin=push_origin
        )

        branch_info = repo.get_branches()
        origin_info = repo.get_origin_info()

        # Build human-friendly message
        parts = []
        if result.get("commits_modified"):
            parts.append("Commits successfully rewritten")
        if result.get("target_branch"):
            parts.append(f"on branch '{result['target_branch']}'")
        if result.get("origin_updated"):
            parts.append(f"origin URL changed to '{result.get('origin_url')}'")
        if result.get("pushed_to_origin"):
            parts.append("and changes pushed to remote origin")

        msg = ", ".join(parts) if parts else "Repository verified with no changes needed."

        # Fetch fresh first page of commits
        commits = []
        for c in repo.get_commits(result.get("target_branch", rev), max_count=20, skip=0):
            date, time_part = make_time_str(c.authored_date)
            matching = [b["name"] for b in branch_info["branches_data"] if b.get("sha") and (b["sha"] == c.hexsha or c.hexsha.startswith(b["sha"]))]
            commits.append({
                "sha": c.hexsha,
                "message": c.message.split("\n")[0] if c.message else "",
                "author": c.author.name if c.author else "",
                "email": c.author.email if c.author else "",
                "date": date,
                "time": time_part,
                "branches": matching,
            })

        session["commits_old"] = commits
        session["rev"] = result.get("target_branch", rev)

        return jsonify({
            "success": True,
            "message": msg,
            "details": result,
            "commits": commits,
            "branches": branch_info["branches"],
            "branches_data": branch_info["branches_data"],
            "active_branch": branch_info["active_branch"],
            "origin_info": origin_info,
            "has_origin": origin_info["has_origin"],
            "origin_url": origin_info["origin_url"],
            "is_tied_to_origin": origin_info["is_tied_to_origin"],
            "total": repo.count_commits(result.get("target_branch", rev))
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})


@app.route("/run_command", methods=["POST"])
def run_command():
    command = request.form.get("command", session.get("command", "")).strip()

    if not command or command.startswith('# No commits were changed.'):
        return jsonify({
            "success": False,
            "error": "No modifications to apply. Please edit commit author, email, or date first."
        })

    script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "modify_time.sh")
    try:
        with open(script_path, "w") as f:
            f.write(command)

        proc = subprocess.run(["sh", script_path], capture_output=True, text=True)
        if proc.returncode != 0:
            return jsonify({
                "success": False,
                "error": proc.stderr or proc.stdout or "Command failed with non-zero exit status."
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })
    finally:
        if os.path.exists(script_path):
            try:
                os.remove(script_path)
            except OSError:
                pass

    return jsonify({
        "success": True,
        "message": "Repository commits modified successfully!"
    })


@app.route("/add_commit", methods=["POST"])
def add_commit():
    address = request.form.get("address", session.get("address", "")).strip()
    message = request.form.get("message", "").strip()
    author = request.form.get("author", "").strip()
    email = request.form.get("email", "").strip()
    date_str = request.form.get("date", "").strip()
    time_str = request.form.get("time", "").strip()

    if not address:
        return jsonify({"success": False, "error": "Repository address is required."})
    if not message:
        return jsonify({"success": False, "error": "Commit message is required."})

    expanded_path = os.path.abspath(os.path.expanduser(address))
    try:
        repo = RepoModifier(expanded_path)
        repo.add_commit(
            message=message,
            author_name=author if author else None,
            author_email=email if email else None,
            date_str=date_str if date_str else None,
            time_str=time_str if time_str else None
        )
        return jsonify({
            "success": True,
            "message": f"Successfully created new commit: '{message}'"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


@app.route("/get_llm_prompt", methods=["GET"])
def get_llm_prompt():
    return jsonify({
        "success": True,
        "prompt": LLMHistoryEngineer.DEFAULT_SYSTEM_PROMPT
    })


@app.route("/llm_generate_commits", methods=["POST"])
def llm_generate_commits():
    address = request.form.get("address", session.get("address", "")).strip().strip("'\"")
    prompt = request.form.get("prompt", "").strip()
    provider = request.form.get("provider", "openrouter").strip().lower()
    api_key = request.form.get("api_key", "").strip()
    model = request.form.get("model", "").strip() or None
    base_url = request.form.get("base_url", "").strip() or None
    system_prompt = request.form.get("system_prompt", "").strip() or None

    expanded_path = os.path.abspath(os.path.expanduser(address)) if address else ""

    if not prompt or prompt.lower() in ("diff", "git diff"):
        if expanded_path and os.path.isdir(expanded_path):
            try:
                repo = git.Repo(expanded_path)
                diff = ""
                try:
                    diff = repo.git.diff("HEAD~1")
                except Exception:
                    diff = repo.git.diff()
                if not diff:
                    diff = "No uncommitted diff found. Please synthesize a sequence of 3-5 commits."
                prompt = f"Analyze the following repository changes/diff and decompose into atomic commits:\n\n{diff}"
            except Exception:
                prompt = "Synthesize an atomic progression of commits for a clean repository."
        else:
            prompt = "Synthesize an atomic progression of commits for a clean repository."

    try:
        commits = LLMHistoryEngineer.generate_commits(
            prompt_text=prompt,
            provider=provider,
            api_key=api_key if api_key else None,
            model=model,
            base_url=base_url,
            system_prompt=system_prompt
        )
        return jsonify({
            "success": True,
            "commits": commits
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        })


if __name__ == "__main__":
    app.run(debug=True)
