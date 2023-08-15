import { useRef } from "react"

import styles from "./TextArea.module.sass"

interface ITemplateTextNode {
    type: "textarea"
    text: string
}

// in JSON.stringify later, transformer function should check (filter) for "ref" key and return undefined value
type TemplateTextNode = ITemplateTextNode & {
    ref: React.RefObject<HTMLTextAreaElement>
}

export type {
    ITemplateTextNode,
    TemplateTextNode
}

type TextAreaProps = {
    name: string
    selfTemplateNode: TemplateTextNode
    rows?: number
    onClick?: React.MouseEventHandler<HTMLTextAreaElement>
    onInput?: React.FormEventHandler<HTMLTextAreaElement>
}

const HiddenDiv = ({ hiddenDivRef }: { hiddenDivRef: React.RefObject<HTMLDivElement> }) => {
    return (<div ref={hiddenDivRef} className={`${styles.TextArea} ${styles.TextArea_invisiblediv}`}> </div>);
}

export default function TextArea({ name, rows = 3, selfTemplateNode, onClick }: TextAreaProps) {

    let hiddenDivRef = useRef<HTMLDivElement>(null);

    const lns = rows && rows > 0 ? "\n".repeat(rows) : "";    

    function onInput(ev: React.FormEvent<HTMLTextAreaElement>) {
        selfTemplateNode.text = ev.currentTarget.value;

        hiddenDivRef.current!.innerText = " " + ev.currentTarget.value + lns;
        ev.currentTarget.style.height = hiddenDivRef.current!.offsetHeight + "px";
    }

    return (<label className={styles.TextAreaWrapper}>
        <textarea ref={selfTemplateNode.ref} name={name} rows={rows} onClick={onClick} onChange={onInput} className={styles.TextArea} defaultValue={selfTemplateNode.text}></textarea>
        <HiddenDiv hiddenDivRef={hiddenDivRef} />
    </label>)
}