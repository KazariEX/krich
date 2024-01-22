import {findParentTag} from '../utils/dom'
import {behaviors, KRICH_TOOL_BAR} from '../global-fileds'
import {KRange} from '../utils/range'

/**
 * 多元素结构的点击事件
 * @param range {KRange} 选择范围
 * @param key {string} 在 behaviors 中的 key
 * @param lineTagName {string?} 每行使用指定标签包裹时使用的标签名称
 */
export function onclickMultiElementStructure(range, key, lineTagName) {
    //const offlineData = range.serialization()
    helper(range, key, lineTagName)
    //KRange.deserialized(offlineData).active()
}

/**
 * 辅助函数，承载实际功能
 * @param range {KRange} 选择范围
 * @param key {string} 在 behaviors 中的 key
 * @param lineTagName {string?} 每行使用指定标签包裹时使用的标签名称
 */
function helper(range, key, lineTagName) {
    const behavior = behaviors[key]
    /**
     * 检查指定标签是否是结构对象
     * @param item {Element}
     * @return {boolean}
     */
    const structureChecker = item => item.matches?.(behavior.exp)
    /**
     * 构建一个结构
     * @return {HTMLElement}
     */
    const buildStructure = () =>
        behavior.builder(KRICH_TOOL_BAR.querySelector(`*[data-id="${key}"]`))
    const {startContainer, endContainer} = range.item
    const startTopContainer = findParentTag(startContainer, structureChecker)
    const endTopContainer = findParentTag(endContainer, structureChecker)
    if (startTopContainer && startTopContainer === endTopContainer) {
        /* 如果选择范围在目标结构当中，且仅选中了一个结构的部分或全部内容 */
        /**
         * 将列表中所有元素插入到指定位置
         * @param where {InsertPosition} 插入位置
         * @param elements {Element[]} 要插入的内容
         */
        const insertAll = (where, elements) => {
            for (let item of elements) {
                startTopContainer.insertAdjacentElement(where, item)
            }
        }
        /**
         * 从结构的 DOM 树中提取指定片段的行的对象
         * @param start {Element|Node} 起始（包含）
         * @param end {Element|Node?} 终止（包含），留空表示获取到结尾
         * @return {Element[]}
         */
        const selectLines = (start, end) => {
            console.assert(start instanceof Element, `start(${start.nodeName}) 必须是 Element 对象`)
            const array = []
            let item = start
            while (item) {
                array.push(item)
                if (item === end) break
                item = item.nextElementSibling
            }
            return array
        }
        /** 清除整个结构 */
        const removeAll = () => {
            insertAll('afterend', Array.from(startTopContainer.children))
            startTopContainer.remove()
        }
        // 如果没有范围选中则判定为选中了全部
        if (range.item.collapsed) return removeAll()
        // 检查指定元素的父元素是否是结构对象
        const topElementChecker = item => item.parentNode === startTopContainer
        // 获取选区的起始行和终止行
        const start = findParentTag(startContainer, topElementChecker)
        const end = findParentTag(endContainer, topElementChecker)
        // 判断选区是否包含结构的起始和结尾
        const isStart = startTopContainer.firstChild === start
        const isEnd = startTopContainer.lastChild === end
        if (isStart && isEnd) {   // 如果选中了所有行
            removeAll()
        } else if (isStart) {   // 如果选区包含第一行
            insertAll('beforebegin', selectLines(start, end))
        } else if (isEnd) {   // 如果选区包含最后一行
            insertAll('afterend', selectLines(start))
        } else {    // 如果选区夹在中间
            const middle = selectLines(start, end)
            const bottom = selectLines(end.nextSibling)
            const bottomStructure = buildStructure()
            bottomStructure.append(...bottom)
            startTopContainer.insertAdjacentElement('afterend', bottomStructure)
            insertAll('afterend', middle)
        }
        return
    }
    const lines = range.getAllTopElements()
    const existing = lines.find(structureChecker)
    if (existing) { // 如果顶层元素中包含一个同样的多元素结构，那么就将内容合并到其中
        let i = 0
        for (; i < lines.length && lines[i] !== existing; ++i) {
            existing.insertBefore(lines[i], existing.firstChild)
        }
        for (++i; i < lines.length; ++i) {
            existing.append(lines[i])
        }
    } else {    // 否则新建一个结构容纳所有内容
        const structure = buildStructure()
        lines[0].parentNode.insertBefore(structure, lines[0])
        const list = lineTagName ? lines.map(it => {
            const box = document.createElement(lineTagName)
            box.append(it)
            return box
        }) : lines
        structure.append(...list)
    }
}