# Claude Code model/effort shortcuts — claude<m>[<e>]
#   <m>: f=fable  o=opus  s=sonnet  h=haiku        (model family, version-agnostic)
#   <e>: l=low  m=medium  h=high  x=xhigh          (no suffix = max effort)
# Functions (not aliases) so extra args forward, e.g.  claudeox -p "hello"

claudef()  { claude --model fable  --effort max    "$@"; }
claudefl() { claude --model fable  --effort low    "$@"; }
claudefm() { claude --model fable  --effort medium "$@"; }
claudefh() { claude --model fable  --effort high   "$@"; }
claudefx() { claude --model fable  --effort xhigh  "$@"; }

claudeo()  { claude --model opus   --effort max    "$@"; }
claudeol() { claude --model opus   --effort low    "$@"; }
claudeom() { claude --model opus   --effort medium "$@"; }
claudeoh() { claude --model opus   --effort high   "$@"; }
claudeox() { claude --model opus   --effort xhigh  "$@"; }

claudes()  { claude --model sonnet --effort max    "$@"; }
claudesl() { claude --model sonnet --effort low    "$@"; }
claudesm() { claude --model sonnet --effort medium "$@"; }
claudesh() { claude --model sonnet --effort high   "$@"; }
claudesx() { claude --model sonnet --effort xhigh  "$@"; }

claudeh()  { claude --model haiku  --effort max    "$@"; }
claudehl() { claude --model haiku  --effort low    "$@"; }
claudehm() { claude --model haiku  --effort medium "$@"; }
claudehh() { claude --model haiku  --effort high   "$@"; }
claudehx() { claude --model haiku  --effort xhigh  "$@"; }
