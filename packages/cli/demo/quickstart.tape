Source packages/cli/demo/settings.tape

Output docs/public/demos/quickstart.webm

Hide
Type@1ms `demo="$PWD/packages/cli/demo/quickstart.ts"; zaly() { bun "$demo" "$@"; }; unset PROMPT_COMMAND; PS1='❯ '; clear`
Enter
Sleep 500ms
Show

Type "zaly --yolo"
Sleep 400ms
Enter
Wait+Screen /demo\/quickstart/
Sleep 1s

Type "Fix the total calculation in @price.ts and run the tests."
Sleep 600ms
Enter
Wait+Screen /return price \* quantity/
Screenshot docs/public/demos/quickstart.png
Sleep 250ms
Wait+Screen /Both tests pass/
Sleep 4s

Hide
Ctrl+c
Ctrl+c
Sleep 500ms
