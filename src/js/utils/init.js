import krichStyle from '../../resources/css/main.styl'
import {registryMouseClickEvent} from '../events/mouse-click-event'
import {registryKeyboardEvent} from '../events/keyboard-event'
import {editorRange, registryRangeMonitor} from '../events/range-monitor'
import {registryBeforeInputEventListener} from '../events/before-input'
import {
    behaviors,
    DATA_ID,
    initContainerQuery,
    KRICH_CLASS,
    KRICH_EC_CLASS,
    KRICH_EDITOR,
    KRICH_EDITOR_CLASS,
    KRICH_HOVER_TIP_CLASS,
    KRICH_TOOL_BAR,
    KRICH_TOOL_BAR_CLASS,
    markStatusCacheEffect, markStatusCacheInvalid,
    statusCheckCache
} from '../vars/global-fileds'
import {compareBtnListStatusWith} from './btn'
import {KRange} from './range'
import {getElementBehavior, readSelectedColor} from './tools'
import {findParentTag} from './dom'
import {TODO_MARKER} from '../vars/global-tag'
import {registryEditorScrollEvent} from '../events/scroll-event'
import {registryIntersectionObserverEvent} from '../events/intersection-observer-event'

/**
 * 在指定容器内初始化编辑器，该容器应当是一个内容为空的标签
 *
 * @param optional {string|Element} 元素选择器或容器
 */
export function initKrich(optional) {
    initContainer(optional)
    registryMouseClickEvent()
    registryKeyboardEvent()
    registryRangeMonitor()
    registryEditorScrollEvent()
    registryIntersectionObserverEvent()
    registryBeforeInputEventListener()
}

/**
 * 初始化容器
 * @param optional {string|Element} 元素选择器或容器
 */
function initContainer(optional) {
    const container = typeof optional === 'string' ? document.querySelector(optional) : optional
    console.assert(/^\s*$/g.test(container.textContent) && container.childElementCount === 0, "指定的容器内容不为空：", container)
    container.insertAdjacentHTML('beforebegin', `<style>${krichStyle}</style>`)
    container.innerHTML = `<div class="${KRICH_TOOL_BAR_CLASS} disable">${
        Object.getOwnPropertyNames(behaviors)
            .map(it => behaviors[it].render())
            .join('')
    }</div><div class="${KRICH_EC_CLASS}"><div class="${KRICH_HOVER_TIP_CLASS}" tabindex="-1"></div><div class="${KRICH_EDITOR_CLASS}" spellcheck contenteditable><p><br></p></div></div>`
    container.classList.add(KRICH_CLASS)
    initContainerQuery(container)
    for (let child of KRICH_TOOL_BAR.children) {
        const dataId = child.getAttribute(DATA_ID)
        behaviors[dataId].button = child
        if (child.classList.contains('color')) {
            const syncColor = () => input.style.background = readSelectedColor(child)
            const input = child.lastChild
            input.onchange = () => {
                console.assert(!!editorRange, '正常情况下唤醒颜色选择器时 editorRange 必然不会空')
                syncColor()
                const behavior = getElementBehavior(child)
                behavior.onclick(editorRange, child)
                markStatusCacheInvalid()
            }
            syncColor()
        }
    }
}