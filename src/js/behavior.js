import headerSelectStyle from '../resources/html/tools/headerSelect.html'
import blockquoteStyle from '../resources/html/tools/blockquote.html'
import boldStyle from '../resources/html/tools/bold.html'
import underlineStyle from '../resources/html/tools/underline.html'
import italicStyle from '../resources/html/tools/italic.html'
import throughStyle from '../resources/html/tools/through.html'
import codeStyle from '../resources/html/tools/code.html'
import supStyle from '../resources/html/tools/sup.html'
import subStyle from '../resources/html/tools/sub.html'
import clearStyle from '../resources/html/tools/clear.html'
import colorStyle from '../resources/html/tools/color.html'
import backgroundStyle from '../resources/html/tools/background.html'
import ulStyle from '../resources/html/tools/ul.html'
import olStyle from '../resources/html/tools/ol.html'
import multiStyle from '../resources/html/tools/multi.html'

/**
 * 工具栏上的按钮的样式
 * @type {{[p:string]: {
 *     render: function(): string,
 *     onclick: function(Event, HTMLElement),
 *     hash?: function(HTMLElement): string
 * }}}
 */
const behaviors = {
    headerSelect: {
        render: () => headerSelectStyle
    },
    blockquote: {
        render: () => blockquoteStyle
    },
    bold: {
        render: () => boldStyle,
        onclick: () => {
            const selection = getSelection()
            const range = selection.getRangeAt(0)
            let anchor = range.startContainer
            let addBold = false
            let isFirst = true
            const newRange = document.createRange()
            do {
                const boldNode = findParentTag(anchor, 'B')
                if (boldNode) {
                    if (isFullInclusion(range, boldNode)) {
                        removeNodeReserveChild(boldNode)
                        if (isFirst) {
                            newRange.setStartBefore(anchor)
                            newRange.setEndAfter(anchor)
                        } else newRange.setEndAfter(anchor)
                    } else {
                        const [split, mode] = splitTextNodeAccordingRange(range, isFirst)
                        const oldAnchor = anchor
                        if (mode) {
                            anchor.textContent = split[0]
                            if (isFirst) newRange.setStartAfter(anchor)
                            const insertNode = (index, breaker) => {
                                const array = cloneDomTree(oldAnchor, split[index], breaker)
                                boldNode.parentNode.insertBefore(array[0], boldNode.nextSibling)
                                if (index === split.length - 1) {
                                    anchor = array[1]
                                    if (index === 1) newRange.setEndAfter(array[1])
                                    else newRange.setEndBefore(array[1])
                                }
                            }
                            if (split.length === 3)
                                insertNode(2, it => it === boldNode.parentNode)
                            insertNode(1, it => it.nodeName === 'B')
                        } else {
                            anchor.textContent = split[1]
                            const array = cloneDomTree(oldAnchor, split[0], it => it.nodeName === 'B')
                            boldNode.parentNode.insertBefore(array[0], boldNode)
                            if (isFirst)
                                newRange.setStartBefore(array[1])
                            newRange.setEndBefore(anchor)
                        }
                    }
                } else addBold = true
                anchor = nextSiblingText(anchor)
                isFirst = false
            } while (range.intersectsNode(anchor))
            if (addBold) range.surroundContents(document.createElement('b'))
            else {
                selection.removeAllRanges()
                selection.addRange(newRange)
            }
            optimizeTree(newRange)
        }
    },
    underline: {
        render: () => underlineStyle
    },
    italic: {
        render: () => italicStyle
    },
    through: {
        render: () => throughStyle
    },
    code: {
        render: () => codeStyle
    },
    sup: {
        render: () => supStyle
    },
    sub: {
        render: () => subStyle
    },
    clear: {
        render: () => clearStyle
    },
    color: {
        render: () => colorStyle
    },
    background: {
        render: () => backgroundStyle
    },
    ul: {
        render: () => ulStyle
    },
    ol: {
        render: () => olStyle
    },
    multi: {
        render: () => multiStyle
    }
}

/**
 * 判断指定节点是否被某个类型的标签包裹
 * @param node {Node} 指定的节点
 * @param name {string} 标签名称
 */
function findParentTag(node, name) {
    let item = node.parentElement
    while (!item.classList.contains('krich-editor')) {
        if (item.nodeName === name) return item
        item = item.parentElement
    }
}

/**
 * 判断选取是否完全包含子元素
 * @param range {Range} 选取
 * @param childNode {Node} 子元素
 */
function isFullInclusion(range, childNode) {
    let childRange = document.createRange()
    childRange.selectNodeContents(getFirstTextNode(childNode))
    const startPoint = range.compareBoundaryPoints(Range.START_TO_START, childRange)
    if (startPoint > 0) return false
    childRange = document.createRange()
    childRange.selectNodeContents(getLastTextNode(childNode))
    const endPoint = range.compareBoundaryPoints(Range.END_TO_END, childRange)
    return endPoint >= 0
}

/**
 * 将一个元素从 DOM 中移除，但保留其所有子元素
 * @param node {Node} 要删除的元素
 */
function removeNodeReserveChild(node) {
    const parent = node.parentNode
    for (let childNode of node.childNodes) {
        parent.insertBefore(childNode, node)
    }
    parent.removeChild(node)
}

/**
 * 复制 DOM 树
 * @param node {Node} #text 节点
 * @param text {string} 文本节点的内容
 * @param breaker {function(Node):boolean} 断路器，判断是否终止复制
 * @return {[Node, Text]} 克隆出来的文本节点
 */
function cloneDomTree(node, text, breaker) {
    const textNode = document.createTextNode(text)
    let tree = textNode
    let pos = node
    node = node.parentNode
    while (!breaker(node)) {
        const item = node.cloneNode(false)
        item.appendChild(tree)
        tree = item
        pos = node
        node = node.parentNode
    }
    return [tree, textNode]
}

/**
 * 查找最邻近的文本节点
 * @param node {Node}
 */
function nextSiblingText(node) {
    let dist = node
    while (true) {
        const next = dist.nextSibling
        if (next) {
            dist = next
            break
        }
        dist = dist.parentNode
    }
    return getFirstTextNode(dist)
}

/**
 * 获取指定节点的第一个文本子节点
 * @param node {Node}
 */
function getFirstTextNode(node) {
    while (node.nodeType !== Node.TEXT_NODE) {
        node = node.firstChild
    }
    return node
}

/**
 * 获取指定节点的最后一个文本子结点
 * @param node {Node}
 */
function getLastTextNode(node) {
    while (node.nodeType !== Node.TEXT_NODE)
        node = node.lastChild
    return node
}

/**
 * 通过 Range 将一个文本节点切分为多个节点
 * @param range {Range} 选择的范围
 * @param isFirst {boolean} 是否为开头
 * @return {[string[], boolean]} 返回切分后的节点和填充模式，true 表示第一个元素保留原有效果
 */
function splitTextNodeAccordingRange(range, isFirst) {
    /**
     * 切分节点
     * @param content {string} 要切分的内容
     * @param index {number} 切分下标
     */
    const splitText = (content, ...index) => {
        const result = []
        for (let i = 0; i < index.length; i++) {
            result.push(content.substring(index[i], index[i + 1]))
        }
        return result
    }
    const {endContainer, endOffset, startContainer, startOffset} = range
    if (startContainer === endContainer) {
        const content = endContainer.textContent
        if (startOffset === 0)
            return [splitText(content, 0, endOffset), false]
        if (endOffset === content.length)
            return [splitText(content, 0, startOffset), true]
        return [splitText(content, 0, startOffset, endOffset), true]
    }
    let node, offset
    if (isFirst) {
        node = startContainer
        offset = startOffset
    } else {
        node = endContainer
        offset = endOffset
    }
    const content = node.textContent
    return [splitText(content, 0, offset), offset !== 0]
}

/**
 * 优化选中的节点结构
 * @param range {Range}
 */
function optimizeTree(range) {

}

/**
 * 获取指定文本节点的样式
 * @param node {Node}
 * @return {string[]} 样式列表
 */
function getTextStyle(node) {
    const result = []
    let item = node.parentElement
    while (!item.classList.contains('krich-editor')) {
        const id = item.getAttribute('data-id')
        if (id) {
            const behavior = behaviors[id]
            if (behavior.hash) result.push(behavior.hash(item))
        }
        item = item.parentElement
    }
    result.sort()
    return result
}

export default behaviors