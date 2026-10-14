import type { ReadTool } from "@zaly/agent"
import type { ToolRenderer, ToolResultCtx } from "./registry.ts"

import { justText } from "@zaly/ai"
import { prettyPath } from "@zaly/shared"
import { memo, unwrap } from "@zaly/tui"
import { box } from "@zaly/tui/widgets/box"
import { code } from "@zaly/tui/widgets/code"
import { log } from "@zaly/tui/widgets/log"
import { show } from "@zaly/tui/widgets/show"

const PREVIEW_LINE_LIMIT = 10

/** Render plain read output as a syntax-highlighted code block with
 *  visual line numbers based on the read's offset metadata. */
export const readRenderer: ToolRenderer<ReadTool> = {
  result(props: ToolResultCtx<ReadTool>) {
    const path = memo(() => {
      const p = unwrap(props.result)?.meta?.path
      return p ? prettyPath(p) : (props.params?.path ?? "unknown path")
    })

    const unchanged = memo(() => unwrap(props.result)?.meta?.unchanged === true)
    const title = memo(() =>
      unwrap(props.result)?.isError === true ? `${path()}  (error)` : path()
    )
    const content = memo(() => justText(unwrap(props.result)?.content ?? ""))
    const numberOffset = memo(() => unwrap(props.result)?.meta?.offset ?? props.params?.offset)

    return box(
      {},
      show(
        {
          use: () =>
            log({
              content: "file unchanged since last read",
              level: "warn",
              visible: unchanged,
            }),
          when: unchanged,
        },
        () =>
          code({
            code: content,
            limit: PREVIEW_LINE_LIMIT,
            more: (_more, msg) => `${msg} read`,
            numberOffset,
            numbered: true,
            path,
            title,
          })
      )
    )
  },
}
