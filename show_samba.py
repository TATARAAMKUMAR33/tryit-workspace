content = open("generate_master.py", encoding="utf-8").read()

# Find exact duplicate and show it
lines = content.split("\n")
samba_lines = [(i,l) for i,l in enumerate(lines) if "SambaNova" in l or "SECONDARY-A" in l or "SECONDARY-B" in l]
for i,l in samba_lines:
    print(f"L{i}: {repr(l[:80])}")
