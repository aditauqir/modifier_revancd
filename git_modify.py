# coding: utf-8

import os
import time
import subprocess
import git


class RepoModifier(object):
    edit_command = """\
export FILTER_BRANCH_SQUELCH_WARNING=1
cd "{path}"
rm -rf "$(git rev-parse --git-dir)/refs/original/"

git filter-branch -f --env-filter \\
\"
    {commands}
\" {rev}
"""

    time_command = """
if [ \\$GIT_COMMIT = \"{commit_sha}\" ]; then
     export GIT_AUTHOR_DATE={commit_time}
     export GIT_COMMITTER_DATE={commit_time}
     export GIT_AUTHOR_NAME={commit_name}
     export GIT_AUTHOR_EMAIL={commit_email}
     export GIT_COMMITTER_NAME=\\$GIT_AUTHOR_NAME
     export GIT_COMMITTER_EMAIL=\\$GIT_AUTHOR_EMAIL
fi
"""

    def __init__(self, repo_path):
        normalized_path = os.path.abspath(os.path.expanduser(repo_path.strip()))
        self.repo_path = normalized_path
        self.command_list = []
        self.command = ""

        try:
            self.repo = git.Repo(self.repo_path)
        except (git.InvalidGitRepositoryError, git.NoSuchPathError):
            raise

    @staticmethod
    def make_timestamp(time_str, dash=False):
        """\
        getTime('2016/01/27 23:12:18') -> 1453907538
        """
        if not time_str:
            return int(time.time())

        time_str = str(time_str).strip()
        formats = [
            "%Y-%m-%d %H:%M:%S",
            "%Y/%m/%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y/%m/%d %H:%M",
            "%Y-%m-%d",
            "%Y/%m/%d",
        ]
        for fmt in formats:
            try:
                time_array = time.strptime(time_str, fmt)
                return int(time.mktime(time_array))
            except ValueError:
                continue

        try:
            return int(time_str)
        except (ValueError, TypeError):
            return int(time.time())

    @staticmethod
    def make_time_str(timestamp):
        """\
        getTime(1453907538) -> '2016-01-27 23:12:18'
        """
        time_array = time.localtime(timestamp)
        return time.strftime("%Y-%m-%d %H:%M:%S", time_array)

    @classmethod
    def generate_command(cls, repo_path, rev, old_commits, new_commits):
        command_list = []
        msg_command_list = []
        old_map = {c["sha"]: c for c in old_commits if "sha" in c}

        for new_commit in new_commits:
            sha = new_commit.get("sha")
            if not sha or sha not in old_map:
                continue
            old_commit = old_map[sha]

            old_time_str = " ".join(filter(None, [old_commit.get("date", ""), old_commit.get("time", "")]))
            new_time_str = " ".join(filter(None, [new_commit.get("date", ""), new_commit.get("time", "")]))

            old_timestamp = cls.make_timestamp(old_time_str, dash=True)
            new_timestamp = cls.make_timestamp(new_time_str, dash=True)

            commit_time_changed = (old_timestamp != new_timestamp)
            commit_name_changed = (old_commit.get("author", "") != new_commit.get("author", ""))
            commit_email_changed = (old_commit.get("email", "") != new_commit.get("email", ""))

            old_msg = (old_commit.get("message", "") or "").strip()
            new_msg = (new_commit.get("message", "") or "").strip()
            commit_msg_changed = (old_msg != new_msg)

            if not any([commit_time_changed, commit_name_changed, commit_email_changed, commit_msg_changed]):
                continue

            if commit_time_changed or commit_name_changed or commit_email_changed:
                params = {
                    "commit_sha": sha
                }

                if commit_time_changed:
                    params["commit_time"] = "'{}'".format(new_timestamp)
                else:
                    params["commit_time"] = "\"\\$GIT_COMMITTER_DATE\""

                if commit_name_changed:
                    safe_name = str(new_commit.get("author", "")).replace("'", "'\\''")
                    params["commit_name"] = "'{}'".format(safe_name)
                else:
                    params["commit_name"] = "\"\\$GIT_AUTHOR_NAME\""

                if commit_email_changed:
                    safe_email = str(new_commit.get("email", "")).replace("'", "'\\''")
                    params["commit_email"] = "'{}'".format(safe_email)
                else:
                    params["commit_email"] = "\"\\$GIT_AUTHOR_EMAIL\""

                command_list.append(cls.time_command.format(**params))

            if commit_msg_changed:
                safe_old = old_msg.replace("'", "'\\''")
                safe_new = new_msg.replace("'", "'\\''")
                msg_command_list.append((safe_old, safe_new))

        if not command_list and not msg_command_list:
            return '# No commits were changed.\necho "No changes detected."'

        if not rev or rev.strip() == "":
            rev = "HEAD"

        filters = []
        if command_list:
            filters.append(f"""--env-filter \\
\"
{''.join(command_list)}
\"""")

        if msg_command_list:
            conds = []
            for i, (so, sn) in enumerate(msg_command_list):
                keyword = "if" if i == 0 else "elif"
                safe_old = so.replace('"', '\\"')
                safe_new = sn.replace('"', '\\"')
                conds.append(f'{keyword} [ "$msg" = "{safe_old}" ]; then\n    printf "%s\\n" "{safe_new}"')
            msg_filter_code = "\n".join(conds)
            filters.append(f"""--msg-filter '
msg=$(cat)
{msg_filter_code}
else
    printf "%s\\n" "$msg"
fi
'""")

        normalized_path = os.path.abspath(os.path.expanduser(repo_path.strip()))
        command = f"""export FILTER_BRANCH_SQUELCH_WARNING=1
cd "{normalized_path.replace('\\', '\\\\')}"
rm -rf "$(git rev-parse --git-dir)/refs/original/"

# Auto-stash any unstaged or untracked changes before rewriting branches
STASH_CREATED=0
if [ -n "$(git status --porcelain)" ]; then
    git stash push -u -m "git_modifier_autostash" >/dev/null 2>&1
    STASH_CREATED=1
fi

git filter-branch -f \\
  {' '.join(filters)} {rev}

# Restore any stashed working directory changes
if [ "$STASH_CREATED" -eq 1 ]; then
    git stash pop --quiet >/dev/null 2>&1 || true
fi
"""

        return command

    def get_commits(self, rev=None, max_count=20, skip=0):
        """\
        Getting commits behind the given revision or current branch.
        """
        if not self.repo:
            raise git.InvalidGitRepositoryError

        if not rev or rev.strip() == "":
            try:
                rev = self.repo.active_branch.name
            except Exception:
                rev = "HEAD"

        kwargs = {}
        if max_count is not None and max_count > 0:
            kwargs["max_count"] = max_count
        if skip is not None and skip > 0:
            kwargs["skip"] = skip

        yield from self.repo.iter_commits(rev, **kwargs)

    def count_commits(self, rev=None):
        """\
        Get total number of commits reachable from revision.
        """
        if not self.repo:
            return None
        if not rev or rev.strip() == "":
            try:
                rev = self.repo.active_branch.name
            except Exception:
                rev = "HEAD"
        try:
            return int(self.repo.git.rev_list("--count", rev))
        except Exception:
            return None

    def add_commit(self, message, author_name=None, author_email=None, date_str=None, time_str=None):
        """\
        Create a new commit in the repository.
        """
        if not self.repo:
            raise git.InvalidGitRepositoryError

        env = os.environ.copy()
        if author_name:
            env["GIT_AUTHOR_NAME"] = author_name
            env["GIT_COMMITTER_NAME"] = author_name
        if author_email:
            env["GIT_AUTHOR_EMAIL"] = author_email
            env["GIT_COMMITTER_EMAIL"] = author_email

        if date_str and time_str:
            dt_str = f"{date_str} {time_str}"
            env["GIT_AUTHOR_DATE"] = dt_str
            env["GIT_COMMITTER_DATE"] = dt_str
        elif date_str:
            env["GIT_AUTHOR_DATE"] = date_str
            env["GIT_COMMITTER_DATE"] = date_str

        cmd = ["git", "commit", "--allow-empty", "-m", message]
        res = subprocess.run(cmd, cwd=self.repo_path, env=env, capture_output=True, text=True)
        if res.returncode != 0:
            raise Exception(res.stderr or res.stdout or "Failed to create commit.")
        return True

    def get_branches(self):
        """
        Get all local branch names and active branch.
        """
        if not self.repo:
            raise git.InvalidGitRepositoryError
        branches = [h.name for h in self.repo.heads]
        try:
            active = self.repo.active_branch.name
        except Exception:
            active = "HEAD"
        if not branches:
            branches = [active] if active != "HEAD" else ["master"]
        return {
            "branches": branches,
            "active_branch": active
        }

    def create_branch(self, branch_name, start_point=None, checkout=True):
        """
        Create a new branch and optionally check it out.
        """
        if not self.repo:
            raise git.InvalidGitRepositoryError
        branch_name = (branch_name or "").strip()
        if not branch_name:
            raise ValueError("Branch name cannot be empty.")

        existing = [h.name for h in self.repo.heads]
        if branch_name in existing:
            if checkout:
                self.repo.git.checkout(branch_name)
            return branch_name

        if checkout:
            if start_point:
                self.repo.git.checkout("-b", branch_name, start_point)
            else:
                self.repo.git.checkout("-b", branch_name)
        else:
            if start_point:
                self.repo.git.branch(branch_name, start_point)
            else:
                self.repo.git.branch(branch_name)
        return branch_name

    def switch_branch(self, branch_name):
        """
        Checkout an existing branch.
        """
        if not self.repo:
            raise git.InvalidGitRepositoryError
        branch_name = (branch_name or "").strip()
        if not branch_name:
            raise ValueError("Branch name cannot be empty.")
        self.repo.git.checkout(branch_name)
        return branch_name

    def get_origin_info(self):
        """
        Get remote origin URL and check if repository is tied to an origin.
        """
        if not self.repo:
            raise git.InvalidGitRepositoryError

        has_origin = False
        origin_url = ""
        remotes = []
        for r in self.repo.remotes:
            urls = list(r.urls)
            url = urls[0] if urls else ""
            remotes.append({"name": r.name, "url": url})
            if r.name == "origin":
                has_origin = True
                origin_url = url

        tracks_origin = False
        try:
            tracking = self.repo.active_branch.tracking_branch()
            if tracking and tracking.remote_name == "origin":
                tracks_origin = True
        except Exception:
            pass

        return {
            "has_origin": has_origin,
            "origin_url": origin_url,
            "remotes": remotes,
            "is_tied_to_origin": has_origin or tracks_origin,
            "tracks_origin": tracks_origin
        }

    def set_origin_url(self, new_url):
        """
        Set or update the origin remote URL.
        """
        if not self.repo:
            raise git.InvalidGitRepositoryError
        new_url = (new_url or "").strip()
        if not new_url:
            raise ValueError("Origin URL cannot be empty.")

        origin_exists = "origin" in [r.name for r in self.repo.remotes]
        if origin_exists:
            self.repo.git.remote("set-url", "origin", new_url)
        else:
            self.repo.git.remote("add", "origin", new_url)
        return new_url

    def push_to_origin(self, branch=None, force=True):
        """
        Push branch to remote origin.
        """
        if not self.repo:
            raise git.InvalidGitRepositoryError

        if not branch:
            try:
                branch = self.repo.active_branch.name
            except Exception:
                branch = "HEAD"

        origin_exists = "origin" in [r.name for r in self.repo.remotes]
        if not origin_exists:
            raise ValueError("Repository has no 'origin' remote configured.")

        args = ["origin", branch]
        if force:
            args.append("--force")

        try:
            out = self.repo.git.push(*args)
            return out
        except Exception as e:
            raise Exception(f"Failed to push to origin: {str(e)}")

    @classmethod
    def execute_filter_branch(cls, command):
        """
        Execute generated filter-branch script safely.
        """
        if not command or command.startswith("# No commits were changed."):
            return True, "No commit changes needed."

        script_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "modify_time.sh")
        try:
            with open(script_path, "w") as f:
                f.write(command)

            proc = subprocess.run(["sh", script_path], capture_output=True, text=True)
            if proc.returncode != 0:
                err = proc.stderr or proc.stdout or "Command failed with non-zero exit status."
                return False, err
            return True, "Filter-branch completed successfully."
        except Exception as e:
            return False, str(e)
        finally:
            if os.path.exists(script_path):
                try:
                    os.remove(script_path)
                except OSError:
                    pass

    def apply_modifications(self, rev, old_commits, new_commits, target_branch=None, new_origin_url=None, push_origin=False):
        """
        Execute the full modification workflow:
        1. Create or checkout target branch if requested.
        2. Execute filter-branch if commits modified.
        3. Change origin URL if requested and tied to an origin or setting new origin.
        4. Push rewritten branch to origin if requested.
        """
        if not self.repo:
            raise git.InvalidGitRepositoryError

        active_rev = rev or "HEAD"
        if target_branch and target_branch.strip() and target_branch.strip() != active_rev:
            self.create_branch(target_branch.strip(), start_point=active_rev, checkout=True)
            active_rev = target_branch.strip()

        # Generate command for modified commits
        command = self.generate_command(self.repo_path, active_rev, old_commits, new_commits)
        commits_modified = not command.startswith("# No commits were changed.")

        stashed = False
        if self.repo.is_dirty(untracked_files=True):
            try:
                self.repo.git.stash("push", "-u", "-m", "git_modifier_autostash")
                stashed = True
            except Exception:
                pass

        try:
            if commits_modified:
                ok, msg = self.execute_filter_branch(command)
                if not ok:
                    raise Exception(f"Filter-branch failed: {msg}")

            # Handle origin modifications
            origin_info = self.get_origin_info()
            origin_updated = False
            new_url_applied = None

            if new_origin_url and new_origin_url.strip():
                target_url = new_origin_url.strip()
                if target_url != origin_info.get("origin_url"):
                    self.set_origin_url(target_url)
                    origin_updated = True
                    new_url_applied = target_url

            pushed = False
            if push_origin:
                updated_origin = self.get_origin_info()
                if updated_origin.get("has_origin"):
                    self.push_to_origin(branch=active_rev, force=True)
                    pushed = True

            return {
                "success": True,
                "commits_modified": commits_modified,
                "target_branch": active_rev,
                "origin_updated": origin_updated,
                "origin_url": new_url_applied or origin_info.get("origin_url"),
                "pushed_to_origin": pushed
            }
        finally:
            if stashed:
                try:
                    self.repo.git.stash("pop")
                except Exception:
                    pass

    def console_modify(self):
        """\
        Modify all the commits in console
        """
        commits = self.get_commits()

        for commit in commits:
            params = {
                "commit_sha": commit.hexsha
            }

            print("\n", commit.hexsha[:6], commit.message.split("\n")[0])
            c = input("Modify it? (y/n): ")
            if c.lower() not in ("y", "yes"):
                continue

            print("Commit time(\"%s\"):" % self.make_time_str(commit.authored_date))
            commit_time = input()
            print("Commit author name (%s):" % (commit.author.name if commit.author else ""))
            commit_name = input()
            print("Commit author email (%s):" % (commit.author.email if commit.author else ""))
            commit_email = input()

            if commit_time or commit_name or commit_email:
                if commit_time:
                    params["commit_time"] = "'{}'".format(commit_time)
                else:
                    params["commit_time"] = "\"\\$GIT_COMMITTER_DATE\""

                if commit_name:
                    params["commit_name"] = "'{}'".format(commit_name)
                else:
                    params["commit_name"] = "\"\\$GIT_AUTHOR_NAME\""

                if commit_email:
                    params["commit_email"] = "'{}'".format(commit_email)
                else:
                    params["commit_email"] = "\"\\$GIT_AUTHOR_EMAIL\""

                self.command_list.append(self.time_command.format(**params))

        self.command = self.edit_command.format(
            path=self.repo_path.replace("\\", "\\\\"),
            commands="".join(self.command_list),
            rev="HEAD"
        )

        return self.command

    def run(self):
        """\
        Run the shell script.
        """
        script_path = "./modify_time.sh"
        with open(script_path, "w") as f:
            f.write(self.command)
        res = subprocess.run(["sh", script_path], capture_output=True, text=True)
        if os.path.exists(script_path):
            os.remove(script_path)
        if res.returncode != 0:
            raise Exception(res.stderr or res.stdout)


class LLMHistoryEngineer(object):
    DEFAULT_SYSTEM_PROMPT = """You are an expert Git History Engineer and Version Control Architect.
Your task is to analyze repository state, diffs, patches, or developer requirements and decompose them into an elegant, logically sequenced series of atomic Git commits with adjusted diff boundaries, realistic timestamps, and conventional commit messages.

CORE INSTRUCTIONS:
1. Decompose changes into atomic, focused commits (e.g. refactor before feature, docs, tests, fixes).
2. Assign realistic, chronologically advancing timestamps (YYYY-MM-DD and HH:MM:SS) spaced logically.
3. Use conventional commit formatting: type(scope): imperative summary, followed by explanatory body.
4. Return ONLY a valid JSON object matching this schema:
{
  "commits": [
    {
      "message": "feat(core): implement feature\\n\\nDetailed context...",
      "author": "Developer Name",
      "email": "dev@example.com",
      "date": "YYYY-MM-DD",
      "time": "HH:MM:SS"
    }
  ]
}"""

    @classmethod
    def generate_commits(cls, prompt_text, provider="openrouter", api_key=None, model=None, base_url=None, system_prompt=None):
        import json
        import urllib.request
        import urllib.error

        provider = (provider or "openrouter").lower().strip()
        api_key = (api_key or "").strip()

        # Auto-detect provider if key has well-known prefix
        if api_key and provider in ("auto", "custom", ""):
            if api_key.startswith("sk-or-v1-"):
                provider = "openrouter"
            elif api_key.startswith("sk-proj-"):
                provider = "openai"
            elif api_key.startswith("gsk_"):
                provider = "groq"

        # Check environment variables if api_key not directly supplied
        if not api_key:
            if provider == "openrouter":
                api_key = os.environ.get("OPENROUTER_API_KEY")
            elif provider == "deepseek":
                api_key = os.environ.get("DEEPSEEK_API_KEY")
            elif provider == "openai":
                api_key = os.environ.get("OPENAI_API_KEY")
            elif provider == "groq":
                api_key = os.environ.get("GROQ_API_KEY")
            elif provider == "gemini":
                api_key = os.environ.get("GEMINI_API_KEY")
            else:
                api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("DEEPSEEK_API_KEY") or os.environ.get("OPENAI_API_KEY")

        # Allow local endpoints (e.g. localhost Ollama / LM Studio) without API keys
        is_local = base_url and ("localhost" in base_url or "127.0.0.1" in base_url)
        if not api_key and not is_local:
            raise ValueError(f"Missing API key for {provider.capitalize()}. Please enter your API key.")

        headers = {
            "Content-Type": "application/json"
        }
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        # Configure endpoints, default models, and provider-specific headers
        if provider == "openrouter":
            url = base_url or "https://openrouter.ai/api/v1/chat/completions"
            model_name = model or "anthropic/claude-3.5-sonnet"
            headers["HTTP-Referer"] = "http://127.0.0.1:5000"
            headers["X-Title"] = "Git Repo Modifier"
        elif provider == "deepseek":
            url = base_url or "https://api.deepseek.com/chat/completions"
            model_name = model or "deepseek-chat"
        elif provider == "openai":
            url = base_url or "https://api.openai.com/v1/chat/completions"
            model_name = model or "gpt-4o"
        elif provider == "groq":
            url = base_url or "https://api.groq.com/openai/v1/chat/completions"
            model_name = model or "llama-3.3-70b-versatile"
        elif provider == "gemini":
            url = base_url or "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
            model_name = model or "gemini-1.5-flash"
        else:  # custom / generic OpenAI-compatible endpoint
            url = base_url or "https://openrouter.ai/api/v1/chat/completions"
            model_name = model or "anthropic/claude-3.5-sonnet"

        sys_prompt = system_prompt or cls.DEFAULT_SYSTEM_PROMPT
        payload = {
            "model": model_name,
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": prompt_text}
            ],
            "temperature": 0.3
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                content = res["choices"][0]["message"]["content"].strip()
                if content.startswith("```"):
                    content = content.split("\n", 1)[1]
                    content = content.rsplit("```", 1)[0]
                parsed = json.loads(content.strip())
                return parsed.get("commits", [])
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            raise Exception(f"{provider.upper()} API HTTP {e.code}: {err_body}")
        except Exception as e:
            raise Exception(f"Failed to generate commits via {provider.upper()}: {str(e)}")


if __name__ == '__main__':
    pass
