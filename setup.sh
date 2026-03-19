#!/usr/bin/env bash
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GLOBAL_DIR="$HOME/.claude"
PROJECT_DIR="$(pwd)"

# colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'
DIM='\033[2m'

print_step() { echo -e "\n${CYAN}→${NC} $1"; }
print_done() { echo -e "${GREEN}  done${NC}"; }
print_warn() { echo -e "${YELLOW}  warning:${NC} $1"; }
print_skip() { echo -e "${DIM}  skipped${NC}"; }

# single-keypress y/n (no enter needed)
confirm() {
  local PROMPT="$1"
  printf "  %s (y/N): " "$PROMPT"
  IFS= read -rsn1 KEY
  echo "$KEY"
  [[ "$KEY" =~ ^[Yy]$ ]]
}

# ─────────────────────────────────────────────
# interactive multiselect
# ─────────────────────────────────────────────
multiselect() {
  local RESULT_NAME="$1"
  shift
  local -a OPTIONS=("$@")
  local COUNT=${#OPTIONS[@]}
  local CURSOR=0
  local -a SELECTED=()
  local DRAWN=false

  for ((i = 0; i < COUNT; i++)); do
    SELECTED+=("true")
  done

  tput civis 2>/dev/null || true

  draw_list() {
    if [ "$DRAWN" = "true" ]; then
      for ((i = 0; i < COUNT + 2; i++)); do
        tput cuu1 2>/dev/null
        tput el 2>/dev/null
      done
    fi

    for ((i = 0; i < COUNT; i++)); do
      local PREFIX="  "
      local CHECK="${DIM}○${NC}"

      if [ "${SELECTED[$i]}" = "true" ]; then
        CHECK="${GREEN}●${NC}"
      fi

      if [ "$i" -eq "$CURSOR" ]; then
        PREFIX="${CYAN}▸${NC}"
      fi

      echo -e "    ${PREFIX} ${CHECK}  ${OPTIONS[$i]}"
    done

    echo ""
    echo -e "    ${DIM}↑↓ navigate  space toggle  a all  n none  i invert  enter confirm${NC}"
    DRAWN=true
  }

  draw_list

  while true; do
    IFS= read -rsn1 KEY

    if [[ "$KEY" == $'\x1b' ]]; then
      # read the rest of the escape sequence ([ + letter)
      IFS= read -rsn2 REST
      case "$REST" in
        "[A") # up
          if [ "$CURSOR" -gt 0 ]; then
            CURSOR=$((CURSOR - 1))
          else
            CURSOR=$((COUNT - 1))
          fi
          ;;
        "[B") # down
          if [ "$CURSOR" -lt $((COUNT - 1)) ]; then
            CURSOR=$((CURSOR + 1))
          else
            CURSOR=0
          fi
          ;;
      esac
    elif [[ "$KEY" == " " ]]; then
      if [ "${SELECTED[$CURSOR]}" = "true" ]; then
        SELECTED[$CURSOR]="false"
      else
        SELECTED[$CURSOR]="true"
      fi
    elif [[ "$KEY" == "a" || "$KEY" == "A" ]]; then
      for ((i = 0; i < COUNT; i++)); do SELECTED[$i]="true"; done
    elif [[ "$KEY" == "n" || "$KEY" == "N" ]]; then
      for ((i = 0; i < COUNT; i++)); do SELECTED[$i]="false"; done
    elif [[ "$KEY" == "i" || "$KEY" == "I" ]]; then
      for ((i = 0; i < COUNT; i++)); do
        if [ "${SELECTED[$i]}" = "true" ]; then SELECTED[$i]="false"; else SELECTED[$i]="true"; fi
      done
    elif [[ "$KEY" == "" ]]; then
      break
    fi

    draw_list
  done

  tput cnorm 2>/dev/null || true

  local RESULT=""
  for ((i = 0; i < COUNT; i++)); do
    if [ "${SELECTED[$i]}" = "true" ]; then
      RESULT+="$i "
    fi
  done

  eval "$RESULT_NAME='$RESULT'"
}

# ─────────────────────────────────────────────
# mode selection
# ─────────────────────────────────────────────
echo -e "\n${BOLD}falcani solver framework${NC}"
echo -e "source:  ${CYAN}$SCRIPT_DIR${NC}"
echo -e "project: ${CYAN}$PROJECT_DIR${NC}"
echo ""
echo -e "  ${BOLD}1${NC}) global    — identity + skills to ~/.claude (applies to all projects)"
echo -e "  ${BOLD}2${NC}) local     — everything into this project only"
echo -e "  ${BOLD}3${NC}) hybrid    — global identity + skills, project-level settings/hooks"
echo -e "  ${BOLD}4${NC}) uninstall — remove global installation from ~/.claude"
echo ""
printf "  select mode (1-4): "
IFS= read -rsn1 MODE
echo "$MODE"

case "$MODE" in
  1) INSTALL_GLOBAL=true;  INSTALL_LOCAL=false ;;
  2) INSTALL_GLOBAL=false; INSTALL_LOCAL=true  ;;
  3) INSTALL_GLOBAL=true;  INSTALL_LOCAL=true  ;;
  4)
    print_step "removing global falcani installation"
    if [ -f "$GLOBAL_DIR/CLAUDE.md" ]; then
      rm "$GLOBAL_DIR/CLAUDE.md"
      echo -e "  ${RED}-${NC} removed $GLOBAL_DIR/CLAUDE.md"
    else
      echo -e "  ${DIM}no CLAUDE.md found${NC}"
    fi
    if [ -d "$GLOBAL_DIR/skills" ]; then
      SKILL_COUNT=$(find "$GLOBAL_DIR/skills" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
      rm -rf "$GLOBAL_DIR/skills"
      echo -e "  ${RED}-${NC} removed $GLOBAL_DIR/skills/ ($SKILL_COUNT skills)"
    else
      echo -e "  ${DIM}no skills directory found${NC}"
    fi
    echo ""
    echo -e "${BOLD}${GREEN}global installation removed${NC}"
    echo ""
    exit 0
    ;;
  *)
    echo -e "\n${RED}invalid selection${NC}"
    exit 1
    ;;
esac

# ─────────────────────────────────────────────
# helpers
# ─────────────────────────────────────────────
install_claude_md() {
  local TARGET_DIR="$1"
  local TARGET_FILE="$TARGET_DIR/CLAUDE.md"
  mkdir -p "$TARGET_DIR"

  if [ -f "$TARGET_FILE" ]; then
    print_warn "existing CLAUDE.md found at $TARGET_FILE"
    if confirm "overwrite?"; then
      cp "$SCRIPT_DIR/CLAUDE.md" "$TARGET_FILE"
      print_done
    else
      print_skip
    fi
  else
    cp "$SCRIPT_DIR/CLAUDE.md" "$TARGET_FILE"
    print_done
  fi
}

install_skills() {
  local TARGET_DIR="$1"

  if [ -d "$TARGET_DIR" ]; then
    print_warn "existing skills directory found"
    if confirm "overwrite all skills?"; then
      rm -rf "$TARGET_DIR"
      cp -r "$SCRIPT_DIR/.claude/skills" "$TARGET_DIR"
      print_done
    else
      echo "  merging new skills only (existing preserved)"
      for skill_dir in "$SCRIPT_DIR/.claude/skills"/*/; do
        skill_name=$(basename "$skill_dir")
        if [ ! -d "$TARGET_DIR/$skill_name" ]; then
          cp -r "$skill_dir" "$TARGET_DIR/$skill_name"
          echo -e "  ${GREEN}+${NC} added $skill_name"
        else
          echo -e "  ${DIM}~${NC} skipped $skill_name (already exists)"
        fi
      done
      print_done
    fi
  else
    mkdir -p "$(dirname "$TARGET_DIR")"
    cp -r "$SCRIPT_DIR/.claude/skills" "$TARGET_DIR"
    print_done
  fi
}

# ─────────────────────────────────────────────
# global install (modes 1 and 3)
# ─────────────────────────────────────────────
if [ "$INSTALL_GLOBAL" = true ]; then
  print_step "installing global CLAUDE.md to $GLOBAL_DIR"
  install_claude_md "$GLOBAL_DIR"

  print_step "installing global skills to $GLOBAL_DIR/skills"
  install_skills "$GLOBAL_DIR/skills"
fi

# ─────────────────────────────────────────────
# local install (modes 2 and 3)
# ─────────────────────────────────────────────
if [ "$INSTALL_LOCAL" = true ]; then

  if [ "$INSTALL_GLOBAL" = false ]; then
    print_step "installing CLAUDE.md to project root"
    install_claude_md "$PROJECT_DIR"

    print_step "installing skills to $PROJECT_DIR/.claude/skills"
    install_skills "$PROJECT_DIR/.claude/skills"
  fi

  # settings/hooks
  print_step "installing project settings to $PROJECT_DIR/.claude"
  mkdir -p "$PROJECT_DIR/.claude"

  if [ -f "$PROJECT_DIR/.claude/settings.json" ]; then
    print_warn "existing settings.json found in project"
    if confirm "overwrite?"; then
      cp "$SCRIPT_DIR/.claude/settings.json" "$PROJECT_DIR/.claude/settings.json"
      print_done
    else
      print_skip
    fi
  else
    cp "$SCRIPT_DIR/.claude/settings.json" "$PROJECT_DIR/.claude/settings.json"
    print_done
  fi

  # hooks
  print_step "installing hooks to $PROJECT_DIR/.claude/hooks"
  mkdir -p "$PROJECT_DIR/.claude/hooks"

  if [ -d "$SCRIPT_DIR/.claude/hooks" ]; then
    cp "$SCRIPT_DIR/.claude/hooks/"* "$PROJECT_DIR/.claude/hooks/" 2>/dev/null
    chmod +x "$PROJECT_DIR/.claude/hooks/"*.sh 2>/dev/null
    print_done
  else
    print_skip
  fi

  # biome.json
  print_step "installing biome.json configuration"

  if [ -f "$PROJECT_DIR/biome.json" ] || [ -f "$PROJECT_DIR/biome.jsonc" ]; then
    print_warn "existing biome config found"
    if confirm "overwrite with falcani config?"; then
      cp "$SCRIPT_DIR/biome.json" "$PROJECT_DIR/biome.json"
      print_done
    else
      print_skip
    fi
  else
    cp "$SCRIPT_DIR/biome.json" "$PROJECT_DIR/biome.json"
    print_done
  fi

  # project template
  print_step "copying project CLAUDE.md template to docs/"
  mkdir -p "$PROJECT_DIR/docs"

  if [ ! -f "$PROJECT_DIR/docs/PROJECT-CLAUDE-TEMPLATE.md" ]; then
    cp "$SCRIPT_DIR/PROJECT-CLAUDE-TEMPLATE.md" "$PROJECT_DIR/docs/PROJECT-CLAUDE-TEMPLATE.md"
    print_done
  else
    echo "  already exists"
    print_skip
  fi

  # ─────────────────────────────────────────────
  # dependency check (interactive multiselect)
  # ─────────────────────────────────────────────
  print_step "checking project dependencies"

  if [ ! -f "$PROJECT_DIR/package.json" ]; then
    print_warn "no package.json found — skipping dependency check"
  else
    DEPS_TO_CHECK=(
      "zod"
      "react-hook-form"
      "@hookform/resolvers"
      "pino"
      "@tanstack/react-query"
      "valtio"
      "gsap"
      "@gsap/react"
      "better-auth"
      "mongodb"
    )

    DEV_DEPS_TO_CHECK=(
      "@biomejs/biome"
      "vitest"
      "pino-pretty"
    )

    ALL_MISSING=()
    ALL_MISSING_TYPES=()
    ALL_MISSING_LABELS=()

    for dep in "${DEPS_TO_CHECK[@]}"; do
      if ! grep -q "\"$dep\"" "$PROJECT_DIR/package.json" 2>/dev/null; then
        ALL_MISSING+=("$dep")
        ALL_MISSING_TYPES+=("dep")
        ALL_MISSING_LABELS+=("$dep")
      fi
    done

    for dep in "${DEV_DEPS_TO_CHECK[@]}"; do
      if ! grep -q "\"$dep\"" "$PROJECT_DIR/package.json" 2>/dev/null; then
        ALL_MISSING+=("$dep")
        ALL_MISSING_TYPES+=("dev")
        ALL_MISSING_LABELS+=("$dep (dev)")
      fi
    done

    if [ ${#ALL_MISSING[@]} -gt 0 ]; then
      echo ""
      echo -e "  select dependencies to install:"
      echo ""

      SELECTED_INDICES=""
      multiselect SELECTED_INDICES "${ALL_MISSING_LABELS[@]}"

      if [ -z "$SELECTED_INDICES" ]; then
        print_skip
      else
        INSTALL_DEPS=()
        INSTALL_DEV_DEPS=()

        for idx in $SELECTED_INDICES; do
          dep="${ALL_MISSING[$idx]}"
          type="${ALL_MISSING_TYPES[$idx]}"
          if [ "$type" = "dev" ]; then
            INSTALL_DEV_DEPS+=("$dep")
          else
            INSTALL_DEPS+=("$dep")
          fi
        done

        if [ ${#INSTALL_DEPS[@]} -gt 0 ]; then
          echo -e "  installing: ${INSTALL_DEPS[*]}"
          pnpm add "${INSTALL_DEPS[@]}" 2>&1 | tail -5
        fi
        if [ ${#INSTALL_DEV_DEPS[@]} -gt 0 ]; then
          echo -e "  installing dev: ${INSTALL_DEV_DEPS[*]}"
          pnpm add -D "${INSTALL_DEV_DEPS[@]}" 2>&1 | tail -5
        fi
        print_done
      fi
    else
      echo -e "  ${GREEN}all falcani dependencies present${NC}"
    fi
  fi

  # ─────────────────────────────────────────────
  # git commit (ONLY framework files)
  # ─────────────────────────────────────────────
  print_step "staging framework files for git"

  if [ -d "$PROJECT_DIR/.git" ]; then
    FRAMEWORK_FILES=(
      ".claude/settings.json"
      ".claude/hooks"
      "biome.json"
      "docs/PROJECT-CLAUDE-TEMPLATE.md"
    )

    if [ "$INSTALL_GLOBAL" = false ]; then
      FRAMEWORK_FILES+=(
        "CLAUDE.md"
        ".claude/skills"
      )
    fi

    STAGED_COUNT=0
    for f in "${FRAMEWORK_FILES[@]}"; do
      if [ -e "$PROJECT_DIR/$f" ]; then
        if [ -d "$PROJECT_DIR/$f" ]; then
          UNTRACKED=$(git -C "$PROJECT_DIR" ls-files --others --exclude-standard -- "$f" 2>/dev/null || true)
          if [ -n "$UNTRACKED" ]; then
            git -C "$PROJECT_DIR" add -- "$f"
            echo -e "  ${GREEN}+${NC} $f/ ${DIM}(new)${NC}"
            STAGED_COUNT=$((STAGED_COUNT + 1))
          fi
        elif ! git -C "$PROJECT_DIR" ls-files --error-unmatch "$f" &>/dev/null; then
          git -C "$PROJECT_DIR" add -- "$f"
          echo -e "  ${GREEN}+${NC} $f ${DIM}(new)${NC}"
          STAGED_COUNT=$((STAGED_COUNT + 1))
        elif ! git -C "$PROJECT_DIR" diff --quiet -- "$f" 2>/dev/null; then
          git -C "$PROJECT_DIR" add -- "$f"
          echo -e "  ${GREEN}+${NC} $f ${DIM}(modified)${NC}"
          STAGED_COUNT=$((STAGED_COUNT + 1))
        fi
      fi
    done

    if [ "$STAGED_COUNT" -gt 0 ]; then
      if confirm "commit these $STAGED_COUNT item(s)?"; then
        git -C "$PROJECT_DIR" commit -m "chore: add falcani solver framework"
        print_done
      else
        echo "  staged but not committed"
      fi
    else
      echo "  no new framework files to stage"
    fi
  else
    print_warn "not a git repository — skipping git operations"
  fi

fi

# ─────────────────────────────────────────────
# summary
# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}setup complete${NC}"
echo ""

if [ "$INSTALL_GLOBAL" = true ]; then
  SKILL_COUNT=$(find "$GLOBAL_DIR/skills" -maxdepth 1 -mindepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
  echo -e "  global identity:  ${CYAN}$GLOBAL_DIR/CLAUDE.md${NC}"
  echo -e "  global skills:    ${CYAN}$GLOBAL_DIR/skills/${NC} ($SKILL_COUNT skills)"
fi

if [ "$INSTALL_LOCAL" = true ]; then
  if [ "$INSTALL_GLOBAL" = false ]; then
    echo -e "  project identity: ${CYAN}$PROJECT_DIR/CLAUDE.md${NC}"
    echo -e "  project skills:   ${CYAN}$PROJECT_DIR/.claude/skills/${NC}"
  fi
  echo -e "  project settings: ${CYAN}$PROJECT_DIR/.claude/settings.json${NC}"
  echo -e "  project biome:    ${CYAN}$PROJECT_DIR/biome.json${NC}"
  echo -e "  project template: ${CYAN}$PROJECT_DIR/docs/PROJECT-CLAUDE-TEMPLATE.md${NC}"
fi

echo ""
echo -e "  ${BOLD}next step:${NC} open claude code and say:"
echo -e "  ${CYAN}\"Let's start Phase 0. Here's the problem: [describe it]\"${NC}"
echo ""
