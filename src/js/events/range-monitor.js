import {EMPTY_BODY_ACTIVE_FLAG, isComposing, KRICH_CONTAINER, KRICH_EDITOR, KRICH_TOOL_BAR} from '../vars/global-fileds'
import {KRange} from '../utils/range'
import {syncButtonsStatus} from '../utils/btn'
import {isEmptyBodyElement} from '../utils/tools'
import {findParentTag} from '../utils/dom'

/**
 * 编辑区最新的已激活的 KRange 对象
 * @type {KRange}
 */
export let editorRange

export function registryRangeMonitor() {
    document.addEventListener('selectionchange', updateEditorRange)
}

export function updateEditorRange() {
    if (isComposing) return
    if (!KRICH_CONTAINER.contains(document.activeElement)) {
        editorRange = null
        KRICH_TOOL_BAR.classList.add('disable')
        return
    }
    if (KRICH_EDITOR !== document.activeElement) return
    const prev = editorRange
    const range = KRange.activated()
    editorRange = range
    KRICH_EDITOR.querySelectorAll(`.${EMPTY_BODY_ACTIVE_FLAG}`)
        .forEach(it => it.classList.remove(EMPTY_BODY_ACTIVE_FLAG))
    const disableToolBar = () => KRICH_TOOL_BAR.classList.add('disable')
    if (range.body) {
        range.active()
        disableToolBar()
        range.body.classList.add(EMPTY_BODY_ACTIVE_FLAG)
        return
    } else if (findParentTag(range.startContainer, ['PRE'])) {
        disableToolBar()
        return
    } else {
        KRICH_TOOL_BAR.classList.remove('disable')
        for (let element of range.getAllTopElements()) {
            for (let it of [element, ...element.querySelectorAll('*')]) {
                if (isEmptyBodyElement(it))
                    it.classList.add(EMPTY_BODY_ACTIVE_FLAG)
            }
        }
    }
    if (!range.collapsed) {
        const lca = range.commonAncestorContainer
        syncButtonsStatus(lca.firstChild ?? lca)
    } else if (!prev?.collapsed || range.endContainer !== prev?.endContainer) {
        syncButtonsStatus(range.startContainer)
    }
}