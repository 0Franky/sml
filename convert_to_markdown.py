"""Convert Claude Code session.jsonl to readable Markdown transcript."""
import json
import sys
from pathlib import Path

def extract_text(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if not isinstance(block, dict):
                continue
            t = block.get("type")
            if t == "text":
                parts.append(block.get("text", ""))
            elif t == "tool_use":
                name = block.get("name", "tool")
                inp = block.get("input", {})
                parts.append(f"\n**[Tool Call: {name}]**\n```json\n{json.dumps(inp, indent=2, ensure_ascii=False)[:2000]}\n```\n")
            elif t == "tool_result":
                c = block.get("content", "")
                if isinstance(c, list):
                    c = "\n".join(extract_text(c) if isinstance(c, list) else str(c) for c in c)
                parts.append(f"\n**[Tool Result]**\n```\n{str(c)[:1500]}\n```\n")
            elif t == "thinking":
                parts.append(f"\n*[Thinking: {block.get('thinking', '')[:500]}...]*\n")
        return "\n".join(parts)
    return str(content)

def main(jsonl_path, md_path):
    out = ["# Session Transcript\n\n"]
    out.append(f"Source: `{jsonl_path}`\n\n---\n\n")
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except json.JSONDecodeError:
                continue
            evtype = ev.get("type")
            if evtype == "user":
                msg = ev.get("message", {})
                content = msg.get("content", "")
                text = extract_text(content)
                if text.strip():
                    out.append(f"## User\n\n{text}\n\n---\n\n")
            elif evtype == "assistant":
                msg = ev.get("message", {})
                content = msg.get("content", "")
                text = extract_text(content)
                if text.strip():
                    out.append(f"## Assistant\n\n{text}\n\n---\n\n")
            elif evtype == "summary":
                out.append(f"## Summary\n\n{ev.get('summary', '')}\n\n---\n\n")
    Path(md_path).write_text("".join(out), encoding="utf-8")
    print(f"Wrote {md_path}")

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "session.jsonl"
    dst = sys.argv[2] if len(sys.argv) > 2 else "transcript.md"
    main(src, dst)
