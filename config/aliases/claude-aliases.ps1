# Claude Code model/effort shortcuts — claude<m>[<e>]
#   <m>: f=fable  o=opus  s=sonnet  h=haiku        (model family, version-agnostic)
#   <e>: l=low  m=medium  h=high  x=xhigh          (no suffix = max effort)
# Functions (not aliases) so extra args forward, e.g.  claudeox -p "hello"

function claudef  { claude --model fable  --effort max    @args }
function claudefl { claude --model fable  --effort low    @args }
function claudefm { claude --model fable  --effort medium @args }
function claudefh { claude --model fable  --effort high   @args }
function claudefx { claude --model fable  --effort xhigh  @args }

function claudeo  { claude --model opus   --effort max    @args }
function claudeol { claude --model opus   --effort low    @args }
function claudeom { claude --model opus   --effort medium @args }
function claudeoh { claude --model opus   --effort high   @args }
function claudeox { claude --model opus   --effort xhigh  @args }

function claudes  { claude --model sonnet --effort max    @args }
function claudesl { claude --model sonnet --effort low    @args }
function claudesm { claude --model sonnet --effort medium @args }
function claudesh { claude --model sonnet --effort high   @args }
function claudesx { claude --model sonnet --effort xhigh  @args }

function claudeh  { claude --model haiku  --effort max    @args }
function claudehl { claude --model haiku  --effort low    @args }
function claudehm { claude --model haiku  --effort medium @args }
function claudehh { claude --model haiku  --effort high   @args }
function claudehx { claude --model haiku  --effort xhigh  @args }
