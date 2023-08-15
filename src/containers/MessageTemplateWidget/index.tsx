import React, { useRef, type CSSProperties, useState, createRef, useEffect, useMemo, useCallback } from "react"

import styles from "./MessageTemplateWidget.module.sass"
import TextArea from "../../components/TextArea"
import type { ITemplateTextNode, TemplateTextNode } from "../../components/TextArea"
import IfThenElseWidget from "../IfThenElseWidget"
import type { ITemplateIfNode } from "../IfThenElseWidget"

import GetUniqueId from "../../utils/GetUniqueId"
import PreviewWidget from "../PreviewWidget"

type TemplateIfNode = ITemplateIfNode<TemplateNode>

type TemplateNode = TemplateTextNode | TemplateIfNode
export type sTemplateNode = ITemplateTextNode | ITemplateIfNode<sTemplateNode>

function SearchNode(nodes: TemplateNode[], textarea: HTMLTextAreaElement): { list: TemplateNode[], index: number } | null {
    let result = null;
    for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].type === "textarea") {
            if (textarea.isSameNode((nodes[i] as TemplateTextNode).ref.current)) {
                return {
                    index: i,
                    list: nodes
                }
            }

        } else if (nodes[i].type === "if") {
            result = SearchNode((nodes[i] as TemplateIfNode).children_then, textarea);
            if (result) { break }
            result = SearchNode((nodes[i] as TemplateIfNode).children_else, textarea);
            if (result) { break }
        }
    }

    return result
}

function SpliceNode(list: TemplateNode[], index: number, firstHalfText: string, secondHalfText: string) {
    // create if node and its children
    let cThenNode: TemplateTextNode = {
        type: "textarea",
        ref: createRef<HTMLTextAreaElement>(),
        text: ""
    }

    let cElseNode: TemplateTextNode = {
        type: "textarea",
        ref: createRef<HTMLTextAreaElement>(),
        text: ""
    }

    let ifNode: TemplateIfNode = {
        type: "if",
        option: 0,
        value: "",
        id: GetUniqueId(),
        children_then: [cThenNode],
        children_else: [cElseNode]
    }

    // create text for second half
    let secondHalfNode: TemplateTextNode = {
        type: "textarea",
        ref: createRef<HTMLTextAreaElement>(),
        text: secondHalfText
    }

    // list is mutable array from ref
    // insert ifNode and secondHalf to list after index
    list.splice(index + 1, 0, ifNode, secondHalfNode)
}

function JsonToTemplate(storedJson: sTemplateNode[]): TemplateNode[] {

    function _loop(json: sTemplateNode[]): TemplateNode[] {
        let result: TemplateNode[] = [];

        for (let item of json) {
            if (item.type === "textarea") {
                result.push({
                    ...item,
                    ref: createRef<HTMLTextAreaElement>()
                })
            } else if (item.type === "if") {
                result.push({
                    type: item.type,
                    id: item.id,
                    option: item.option,
                    value: item.value,
                    children_then: _loop(item.children_then),
                    children_else: _loop(item.children_else)
                })
            }
        }

        return result
    }

    let template: TemplateNode[] = _loop(storedJson);

    return template
}

function TemplateToJson(nodes: TemplateNode[]): sTemplateNode[] {
    let data: string | null = null;
    try {
        data = JSON.stringify(nodes, (key, value) => {
            if (key === "ref") {
                return undefined
            }
            return value
        })
    } catch (err) {
        console.log("failed to transform template to json");
        console.log(err);
    }

    let json = JSON.parse(data ?? "[]") as sTemplateNode[];

    return json
}

function spliceTemplateIfNode(id: string, nodes: TemplateNode[]) {
    let index = nodes.findIndex((value) => { return value.type === "if" && value.id === id })
    if (index >= 0) {
        // "if" node is always between "textarea" nodes
        (nodes[index - 1] as TemplateTextNode).text = (nodes[index - 1] as TemplateTextNode).text + (nodes[index + 1] as TemplateTextNode).text;
        nodes.splice(index, 2)
    }
}

function TemplateToJSX(_nodes: TemplateNode[], arrVarNames: string[], setter: React.Dispatch<React.SetStateAction<JSX.Element[]>>) {

    function _removeHandler(id: string, nodes: TemplateNode[]) {
        // "nodes" is current branch (sub conditional level) of template nodes
        spliceTemplateIfNode(id, nodes);
        // "_nodes" is full tree of template nodes
        SetTemplateBlocks(setter, _nodes, arrVarNames)
    }

    function _loop(nodes: TemplateNode[], depth: number, parentName: string) {

        let result: JSX.Element[] = []
        let seed = GetUniqueId() + "_"; // for use in key propety, should not start with same number (like 0), because later i splice mutable template nodes array
        let keyIndex = 0
        let depthName = `${parentName}_${depth}_`;
        for (let node of nodes) {
            if (node.type === "textarea") {
                let name = `${depthName}${keyIndex}`
                let textBlock = <TextArea key={seed + keyIndex} name={name} selfTemplateNode={node} />
                result.push(textBlock)
            } else if (node.type === "if") {
                let thenBlock = _loop(node.children_then, depth + 1, depthName + "t")
                let elseBlock = _loop(node.children_else, depth + 1, depthName + "e")
                let ifBlock = <IfThenElseWidget selfTemplateNode={node} key={seed + keyIndex} arrVarNames={arrVarNames} thenBlocks={thenBlock} elseBlocks={elseBlock} removeHandler={(id) => { _removeHandler(id, nodes) }} />
                result.push(ifBlock)
            }
            keyIndex++;
        }

        return result
    }

    let result = _loop(_nodes, 0, "")

    return result
}

function SetTemplateBlocks(setter: React.Dispatch<React.SetStateAction<JSX.Element[]>>, nodes: TemplateNode[], arrVarNames: string[]) {

    let result = TemplateToJSX(nodes, arrVarNames, setter)

    setter(result)
}

type MessageTemplateWidgetProps = {
    arrVarNames: string[],
    template: string,
    callbackSave: (json: sTemplateNode[]) => Promise<void>
}

const editorMinHeight = { "--editor-min-height": "200px" } as CSSProperties;

// ==============================================
// ==============================================
// ==============================================
// ==============================================
// ==============================================

export default function MessageTemplateWidget({ arrVarNames, template, callbackSave }: MessageTemplateWidgetProps) {
    let editorAreaRef = useRef<HTMLDivElement>(null);
    let modalRef = useRef<HTMLDivElement>(null);
    let initialTextAreaRef = useRef<HTMLTextAreaElement>(null);

    let parsedTemplate = useRef(useMemo(() => {
        return ((templateString) => {
            try {
                let json = JSON.parse(templateString)
                let template = JsonToTemplate(json)
                return template
            } catch (err) {
                console.log(err)
                return null
            }
        })(template)
    }, [template]));

    let templateNodes = useRef<TemplateNode[]>(parsedTemplate.current !== null ? parsedTemplate.current : [
        {
            type: "textarea",
            ref: initialTextAreaRef,
            text: ""
        }
    ])

    let lastRef = useRef((templateNodes.current[0] as TemplateTextNode).ref.current)
    let [blocks, setBlocks] = useState<JSX.Element[]>([]);
    // let [previewTemplate, setPreviewTemplate] = useState<TemplateNode[]>([]);
    let [previewBlock, setPreviewBlock] = useState<React.ReactNode>();


    useEffect(() => {
        // initial setup
        setBlocks(TemplateToJSX(templateNodes.current, arrVarNames, setBlocks));
        setPreviewBlock(<PreviewWidget arrVarNames={arrVarNames} template={templateNodes.current} />)
    }, [arrVarNames, template]);

    const getTextArea = useCallback((): [HTMLTextAreaElement | null, Selection | null] => {
        let selection = window.getSelection();

        if (selection) {
            // anchorNode is expected to be a label element with a textarea inside
            let textAreaContainer = selection.anchorNode as HTMLElement
            if (textAreaContainer) {
                let textArea = textAreaContainer.querySelector && textAreaContainer.querySelector(":scope > textarea") as HTMLTextAreaElement;
                if (textArea) {
                    return [textArea, selection]
                }
            }

        }

        // if never selected or could not find a text area from selection
        return [null, null]
    }, [])

    function ifThenElseHandler(ev: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {

        let [textArea, selection] = getTextArea();

        if (!textArea) { return; }

        // @TODO check depth level (for example, might stop at 3 or add collapsable page )
        let node = SearchNode(templateNodes.current, textArea)
        if (!node) { return; }

        const pos = textArea.selectionStart;
        let firstHalf = textArea.value.substring(0, pos)
        let secondHalf = textArea.value.substring(pos, textArea.value.length);
        if (selection) { selection.collapseToEnd(); }

        textArea.value = firstHalf;
        ; (node.list[node.index] as TemplateTextNode).text = firstHalf;

        SpliceNode(node.list, node.index, firstHalf, secondHalf)

        SetTemplateBlocks(setBlocks, templateNodes.current, arrVarNames)


    }

    async function _submit(ev: React.FormEvent<HTMLFormElement>) {
        ev.preventDefault()
        let json = TemplateToJson(templateNodes.current);
        callbackSave(json)
    }

    function toggleModal(ev: React.MouseEvent<HTMLButtonElement>) {
        let modal = modalRef.current!;
        modal.classList.toggle(`${styles["Modal--on"]}`);
        // to trigger preview update i recreate a new arrVarNames array, because templateNodes.current is always the same object snapshot
        setPreviewBlock(<PreviewWidget arrVarNames={[...arrVarNames]} template={templateNodes.current} />)
    }

    // blocks change, need useCallback to get a textArea from viewable DOM
    const addVariable = useCallback((index: number) => {
        let [textArea, selection] = getTextArea();

        let pos;

        if (!textArea) {
            textArea = lastRef.current! ?? (templateNodes.current[0] as TemplateTextNode).ref.current!;

            if (lastRef.current!) {
                pos = textArea.value.length;
            } else {
                pos = textArea.selectionStart;
            }

        } else {
            pos = textArea.selectionEnd;
        }

        let node = SearchNode(templateNodes.current, textArea);

        if (!node) { return; }

        let firstHalf = textArea.value.substring(0, pos)
        let secondHalf = textArea.value.substring(pos, textArea.value.length);
        if (selection !== null && selection.anchorNode) { selection.collapseToEnd(); }

        let updatedText = firstHalf + `{${arrVarNames[index]}}` + secondHalf

        textArea.value = updatedText;
        ; (node.list[node.index] as TemplateTextNode).text = updatedText

        SetTemplateBlocks(setBlocks, templateNodes.current, arrVarNames);

        // lastRef.current = (node.list[node.index] as TemplateTextNode).ref.current // does not work
        lastRef = (node.list[node.index] as TemplateTextNode).ref;
    }, []);

    return (<form action="" onSubmit={_submit} className={styles.Container}>
        <div ref={editorAreaRef} style={editorMinHeight} className={styles.EditorArea}>
            <div ref={modalRef} className={styles.Modal}>
                {previewBlock}
                <button type="button" className={styles["Button-Close"]} onClick={toggleModal}>close</button>
            </div>
            <ul className={styles.VarNames}>{arrVarNames && arrVarNames.map((varName, index) => (<li onClick={(ev) => { addVariable(index) }} key={index}><span>{varName}</span></li>))}</ul>
            <button type="button" className={styles.IfThenElse} onClick={ifThenElseHandler}><span>IF ? THEN : ELSE</span></button>
            {blocks}
        </div>
        <ul className={styles.Buttons}>
            <li>
                <button type="button" className={styles.Button} onClick={(ev) => { toggleModal(ev) }}>Preview</button>
            </li>
            <li>
                <button className={styles.Button} type="submit">
                    <span>Save</span>
                </button>
            </li>
        </ul>
    </form>)
}