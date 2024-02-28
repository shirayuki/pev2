import _ from "lodash"
import type { IPlan, Node } from "@/interfaces"
import { NodeProp } from "@/enums"

export class HelpService {
  public nodeId = 0

  public getNodeTypeDescription(nodeType: string) {
    return NODE_DESCRIPTIONS[nodeType.toUpperCase()]
  }

  public getHelpMessage(helpMessage: string) {
    return HELP_MESSAGES[helpMessage.toUpperCase()]
  }
}

interface INodeDescription {
  [key: string]: string
}

export const NODE_DESCRIPTIONS: INodeDescription = {
  LIMIT: "指定された数の行をレコードセットから返します。",
  SORT: "指定されたソートキーに基づいてレコードセットをソートします。",
  "NESTED LOOP": `1つ目のレコードセットのすべてのレコードをループし、2つ目のセットで一致するものを見つけようとします。
    一致するすべてのレコードが返されます。`,
  "MERGE JOIN": "2つのレコードセットを最初に<strong>結合キー</strong>でソートして結合します。",
  HASH: `入力レコードセットのレコードからハッシュテーブルを生成します。
    ハッシュは<strong>ハッシュ結合</strong>で使用されます。`,
  "HASH JOIN" :"1つのレコードセットをハッシュ化して（<strong>ハッシュスキャン</strong>を使用して）、もう1つのレコードセットを結合します。",
  AGGREGATE:"レコードを<strong>GROUP BY</strong>や<code>sum()</code>などの集計関数に基づいてグループ化します。",
  HASHAGGREGATE:`レコードをGROUP BYやsum()などの集計関数に基づいてグループ化します。
    Hash Aggregateは、最初にハッシュを使用してキーでレコードを整理します。`,
  "SEQ SCAN": `入力レコードセットを順次スキャンして関連するレコードを見つけます。
    テーブルから読み取る場合、Seq Scans（インデックススキャンとは異なり）は単一の読み取り操作を実行します（テーブルのみが読み取られます）。`,
  "INDEX SCAN": `<strong>インデックス</strong>に基づいて関連するレコードを見つけます。
    インデックススキャンは2つの読み取り操作を行います: 1つ目はインデックスを読み取り、もう1つはテーブルから実際の値を読み取ります。`,

  "INDEX ONLY SCAN": `<strong>インデックス</strong>に基づいて関連するレコードを見つけます。
    インデックスのみスキャンは、インデックスからの単一の読み取り操作を行い、対応するテーブルからは読み取りません。`,

  "BITMAP HEAP SCAN": `searches through the pages returned by the <strong>Bitmap Index Scan</strong>
    for relevant rows.`,
  "BITMAP INDEX SCAN": `uses a <strong>Bitmap Index</strong> (index which uses 1 bit per page)
    to find all relevant pages.
    Results of this node are fed to the <strong>Bitmap Heap Scan</strong>.`,
  "CTE SCAN": `<strong>共通テーブル式（CTE）クエリ</strong>の結果を順次スキャンします。
    CTEの結果は実体化され（計算されて一時的に保存されます）、その後にスキャンされます。`,
  MEMOIZE: "内側のネストされたループの結果をキャッシュするために使用されます。現在のパラメーターの結果がすでにキャッシュにある場合、基礎となるノードの実行を回避します。",
  GATHER: "並列ワーカーの結果を未定義の順序で読み取ります。",
  "GATHER MERGE": "並列ワーカーの結果を、任意の順序を保持して読み取ります。"
}

interface IHelpMessage {
  [key: string]: string
}

export const HELP_MESSAGES: IHelpMessage = {
  "MISSING EXECUTION TIME": `Execution time (or Total runtime) not available for this plan. Make sure you
    use EXPLAIN ANALYZE.`,
  "MISSING PLANNING TIME": "Planning time not available for this plan.",
  "WORKERS PLANNED NOT LAUNCHED": `Less workers than planned were launched.
Consider modifying max_parallel_workers or max_parallel_workers_per_gather.`,
  "WORKERS DETAILED INFO MISSING": `Consider using EXPLAIN (ANALYZE, VERBOSE)`,
  "FUZZY NEEDS VERBOSE": `Information may not be accurate. Use EXPLAIN VERBOSE mode.`,
  "HINT TRACK_IO_TIMING": `HINT: activate <em><b>track_io_timing</b></em> to have details on time spent outside the PG cache.`,
}

interface EaseInOutQuadOptions {
  currentTime: number
  start: number
  change: number
  duration: number
}

export function scrollChildIntoParentView(
  parent: Element,
  child: Element,
  shouldCenter: boolean,
  done?: () => void
) {
  if (!child) {
    return
  }
  // Where is the parent on page
  const parentRect = parent.getBoundingClientRect()
  // Where is the child
  const childRect = child.getBoundingClientRect()

  let scrollLeft = parent.scrollLeft // don't move
  const isChildViewableX =
    childRect.left >= parentRect.left &&
    childRect.left <= parentRect.right &&
    childRect.right <= parentRect.right

  let scrollTop = parent.scrollTop
  const isChildViewableY =
    childRect.top >= parentRect.top &&
    childRect.top <= parentRect.bottom &&
    childRect.bottom <= parentRect.bottom

  if (shouldCenter || !isChildViewableX || !isChildViewableY) {
    // scroll by offset relative to parent
    // try to put the child in the middle of parent horizontaly
    scrollLeft =
      childRect.left +
      parent.scrollLeft -
      parentRect.left -
      parentRect.width / 2 +
      childRect.width / 2
    scrollTop =
      childRect.top +
      parent.scrollTop -
      parentRect.top -
      parentRect.height / 2 +
      childRect.height / 2
    smoothScroll({
      element: parent,
      to: { scrollTop, scrollLeft },
      duration: 400,
      done,
    })
  } else if (done) {
    done()
  }
}

const easeInOutQuad = ({
  currentTime,
  start,
  change,
  duration,
}: EaseInOutQuadOptions) => {
  let newCurrentTime = currentTime
  newCurrentTime /= duration / 2

  if (newCurrentTime < 1) {
    return (change / 2) * newCurrentTime * newCurrentTime + start
  }

  newCurrentTime -= 1
  return (-change / 2) * (newCurrentTime * (newCurrentTime - 2) - 1) + start
}

interface SmoothScrollOptions {
  duration: number
  element: Element
  to: {
    scrollTop: number
    scrollLeft: number
  }
  done?: () => void
}

export function smoothScroll({
  duration,
  element,
  to,
  done,
}: SmoothScrollOptions) {
  const startX = element.scrollTop
  const startY = element.scrollLeft
  const changeX = to.scrollTop - startX
  const changeY = to.scrollLeft - startY
  const startDate = new Date().getTime()

  const animateScroll = () => {
    const currentDate = new Date().getTime()
    const currentTime = currentDate - startDate
    element.scrollTop = easeInOutQuad({
      currentTime,
      start: startX,
      change: changeX,
      duration,
    })
    element.scrollLeft = easeInOutQuad({
      currentTime,
      start: startY,
      change: changeY,
      duration,
    })

    if (currentTime < duration) {
      requestAnimationFrame(animateScroll)
    } else {
      element.scrollTop = to.scrollTop
      element.scrollLeft = to.scrollLeft
      if (done) {
        done()
      }
    }
  }
  animateScroll()
}

/*
 * Split a string, ensuring balanced parenthesis and balanced quotes.
 */
export function splitBalanced(input: string, split: string) {
  // Build the pattern from params with defaults:
  const pattern = "([\\s\\S]*?)(e)?(?:(o)|(c)|(t)|(sp)|$)"
    .replace("sp", split)
    .replace("o", "[\\(\\{\\[]")
    .replace("c", "[\\)\\}\\]]")
    .replace("t", "['\"]")
    .replace("e", "[\\\\]")
  const r = new RegExp(pattern, "gi")
  const stack: string[] = []
  let buffer: string[] = []
  const results: string[] = []
  input.replace(r, ($0, $1, $e, $o, $c, $t, $s) => {
    if ($e) {
      // Escape
      buffer.push($1, $s || $o || $c || $t)
      return ""
    } else if ($o) {
      // Open
      stack.push($o)
    } else if ($c) {
      // Close
      stack.pop()
    } else if ($t) {
      // Toggle
      if (stack[stack.length - 1] !== $t) {
        stack.push($t)
      } else {
        stack.pop()
      }
    } else {
      // Split (if no stack) or EOF
      if ($s ? !stack.length : !$1) {
        buffer.push($1)
        results.push(buffer.join(""))
        buffer = []
        return ""
      }
    }
    buffer.push($0)
    return ""
  })
  return results
}

export function findNodeById(plan: IPlan, id: number): Node | undefined {
  let o: Node | undefined = undefined
  const root = plan.content.Plan
  if (root.nodeId == id) {
    return root
  }
  if (root && root.Plans) {
    root.Plans.some(function iter(child: Node): boolean | undefined {
      if (child.nodeId === id) {
        o = child
        return true
      }
      return child.Plans && child.Plans.some(iter)
    })
    if (!o && plan.ctes) {
      _.each(plan.ctes, (cte) => {
        if (cte.nodeId == id) {
          o = cte
          return false
        } else if (cte.Plans) {
          cte.Plans.some(function iter(child: Node): boolean | undefined {
            if (child.nodeId === id) {
              o = child
              return true
            }
            return child.Plans && child.Plans.some(iter)
          })
          if (o) {
            return false
          }
        }
      })
    }
  }
  return o
}

export function findNodeBySubplanName(
  plan: IPlan,
  subplanName: string
): Node | undefined {
  let o: Node | undefined = undefined
  if (plan.ctes) {
    _.each(plan.ctes, (cte) => {
      if (cte[NodeProp.SUBPLAN_NAME] == "CTE " + subplanName) {
        o = cte
        return false
      }
    })
  }
  return o
}
