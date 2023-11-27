import {DATA_ID, behaviors, TOP_LIST, DATA_HASH, BUTTON_STATUS, KRICH_CONTAINER, SELECT_VALUE} from './global-fileds'

/**
 * 构建一个新的元素
 * @param key {string} behavior 中的 key 名
 * @param tagName {string} 标签名称
 * @param classNames {string} 想要添加的类名
 */
export function createElement(key, tagName, ...classNames) {
    console.assert(key in behaviors, `${key} 不存在`)
    const {hash, extra} = behaviors[key]
    const element = document.createElement(tagName)
    element.className = classNames.join(' ')
    element.setAttribute(DATA_ID, key)
    const button = KRICH_CONTAINER.querySelector(`.krich-tools>*[${DATA_ID}=${key}]`)
    if (hash) element.setAttribute(DATA_HASH, hash(button))
    if (extra) {
        const attributes = extra(button)
        for (let key in attributes) {
            element.setAttribute(key, attributes[key])
        }
    }
    return element
}

/**
 * 获取指定节点的第一个文本子节点
 * @param node {Node}
 * @return {Node}
 */
export function getFirstTextNode(node) {
    while (!['#text', 'BR'].includes(node.nodeName)) {
        node = node.firstChild
    }
    return node
}

/**
 * 获取指定节点的最后一个文本子结点
 * @param node {Node}
 * @return {Node}
 */
export function getLastTextNode(node) {
    while (!['#text', 'BR'].includes(node.nodeName))
        node = node.lastChild
    return node
}

/** @param element {HTMLElement} */
export function getElementBehavior(element) {
    return behaviors[element.getAttribute(DATA_ID)]
}

/**
 * 判断两个富文本节点是否相同（不判断节点内容）
 * @param arg0 {HTMLElement}
 * @param arg1 {HTMLElement}
 */
export function equalsKrichNode(arg0, arg1) {
    console.assert(!!arg0 && arg1, '参数不能为 null/undefined', arg0, arg1)
    const h0 = getElementBehavior(arg0)
    const h1 = getElementBehavior(arg1)
    console.assert(!!h0 && h1, `两个节点有一个不包含 ${DATA_ID} 属性或属性值错误`, arg0, arg1)
    return h0 === h1 && h0.hash?.(arg0) === h1.hash?.(arg1)
}

/**
 * 判断指定节点是否被某个类型的标签包裹
 * @param node {Node} 指定的节点
 * @param names {string} 标签名称
 */
export function findParentTag(node, ...names) {
    console.assert(names && names.length !== 0, 'names 不应当为空')
    if (names.includes(node.nodeName)) return node
    let item = node.parentElement
    while (!item.classList.contains('krich-editor')) {
        if (names.includes(item.nodeName)) return item
        item = item.parentElement
    }
}

/**
 * 将指定的元素替换为指定元素，同时保留子元素
 * @param src {HTMLElement} 要被替换的元素
 * @param novel {HTMLElement} 新的元素
 */
export function replaceElement(src, novel) {
    novel.innerHTML = src.innerHTML
    src.replaceWith(novel)
}

/**
 * 判断指定节点是否是顶层节点
 * @param node {Node}
 * @return {boolean}
 */
export function isTopElement(node) {
    return TOP_LIST.includes(node.nodeName)
}

/**
 * 查找最邻近的文本节点
 * @param node {Node}
 */
export function nextSiblingText(node) {
    let dist = node
    while (true) {
        const next = dist.nextSibling
        if (next) {
            dist = next
            break
        }
        dist = dist.parentNode
        if (!dist) return null
    }
    return getFirstTextNode(dist)
}

/**
 * 比较按钮和标签的状态是否相同
 * @param button {HTMLElement} 按钮对象
 * @param element {HTMLElement} 标签对象
 * @return {boolean}
 */
export function compareBtnStatusWith(button, element) {
    const {verify, hash} = getElementBehavior(element)
    /**
     * @param button {HTMLElement}
     * @param element {HTMLElement}
     */
    const defComparator = (button, element) => {
        const buttonHash = hash?.(button)
        const elementHash = element.getAttribute(DATA_HASH)
        return buttonHash === elementHash
    }
    if (verify) {
        if (!verify(button, element))
            return false
    } else if (!defComparator(button, element)) {
        return false
    }
    return true
}

/**
 * 判断一个节点持有的样式和按钮列表的样式是否相同
 * @param buttonContainer {HTMLElement} 按钮的父级控件
 * @param node {Node} 节点
 * @return {null|HTMLElement[]} 返回按钮和节点状态不一致的按钮列表
 */
export function compareBtnListStatusWith(buttonContainer, node) {
    const record = new Set()
    let element = node.parentElement
    let dataId = element.getAttribute(DATA_ID)
    const result = []
    while (dataId) {
        record.add(dataId)
        if (!getElementBehavior(element).noStatus) {
            const button = buttonContainer.querySelector(`&>*[${DATA_ID}=${dataId}]`)
            if (!compareBtnStatusWith(button, element))
                result.push(button)
        }
        element = element.parentElement
        dataId = element?.getAttribute(DATA_ID)
    }
    for (let child of buttonContainer.children) {
        const id = child.getAttribute(DATA_ID)
        if (BUTTON_STATUS[id] && !record.has(id) && !behaviors[id].noStatus) result.push(child)
    }
    return result.length === 0 ? null : result
}

/**
 * 同步按钮和指定节点的状态
 * @param buttonContainer {HTMLElement} 按钮的父级标签
 * @param node {Node} 文本节点
 */
export function syncButtonsStatus(buttonContainer, node) {
    const syncHelper = (button, element) => {
        const setter = element ? getElementBehavior(element).setter : null
        const key = button.getAttribute(DATA_ID)
        if (setter) {
            setter(button, element)
        } else if (button.classList.contains('select')) {
            const value = element?.getAttribute(SELECT_VALUE) ?? '0'
            button.setAttribute(SELECT_VALUE, value)
            const item = button.querySelector(`.item[${SELECT_VALUE}="${value}"]`)
            button.getElementsByClassName('value')[0].innerHTML = item.innerHTML
            BUTTON_STATUS[key] = value
        } else if (element) {
            button.classList.add('active')
            BUTTON_STATUS[key] = true
        } else {
            button.classList.remove('active')
            delete BUTTON_STATUS[key]
        }
    }
    let element = node.parentElement
    let dataId = element.getAttribute(DATA_ID)
    const record = new Set()
    while (dataId) {
        record.add(dataId)
        const button = buttonContainer.querySelector(`&>*[${DATA_ID}=${dataId}]`)
        if (!compareBtnStatusWith(button, element)) {
            syncHelper(button, element)
        }
        element = element.parentElement
        dataId = element?.getAttribute(DATA_ID)
    }
    for (let button of buttonContainer.children) {
        if (!record.has(button.getAttribute(DATA_ID))) {
            syncHelper(button, null)
        }
    }
}

/**
 * 复制 DOM 树
 * @param node {Node} #text 节点
 * @param text {string} 文本节点的内容
 * @param breaker {function(Node):boolean} 断路器，判断是否终止复制
 * @return {[Node, Text]} 克隆出来的文本节点
 */
export function cloneDomTree(node, text, breaker) {
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
 * 查找指定元素在 Collection 中的下标
 * @param children {HTMLCollection}
 * @param item {HTMLElement}
 * @return {number}
 */
export function findIndexInCollection(children, item) {
    for (let i = 0; i < children.length; i++) {
        if (children[i] === item) return i
    }
    return -1
}

/**
 * 查找指定字符在字符串指定区域中出现的次数
 * @param item {string} 指定字符
 * @param str {string} 字符串
 * @param startIndex {number} 起始下标（包含）
 * @param endIndex {number?} 终止下标（不包含，缺省查询到结尾）
 */
export function countChar(item, str, startIndex, endIndex) {
    console.assert(item.length === 1, '[item] 的长度应当等于 1', item)
    const end = endIndex ?? str.length
    let count = 0
    for (let i = startIndex; i < end; ++i) {
        if (str[i] === item) ++count
    }
    return count
}