
import { useEffect, useState } from "react"
import { sTemplateNode } from "../MessageTemplateWidget"
import styles from "./PreviewWidget.module.sass"


import TextGenerator from "./TextGenerator"



type PreviewWidgetProps = {
    arrVarNames: string[],
    template: sTemplateNode[]
}

export default function PreviewWidget({ arrVarNames, template }: PreviewWidgetProps) {

    let [inputs, setInputs] = useState<Record<string, string>>(
        arrVarNames.reduce<Record<string, string>>((acc, val) => {
            acc[val] = ""
            return acc
        }, {})
    );

    let [text, setText] = useState<string>("");

    useEffect(() => {
        setText(TextGenerator(template, inputs));
    }, [template, arrVarNames, inputs])

    function OnChangeHandler(ev: React.FormEvent<HTMLInputElement>) {

        let value = ev.currentTarget.value
        let key = ev.currentTarget.name


        setInputs((currentInputs) => {
            let newInputs = { ...currentInputs }
            newInputs[key] = value;

            return newInputs
        });

    }

    return (<div className={styles.PreviewWidget}>
        <div className={styles.PreviewArea}>{text}</div>
        <ul className={styles.VarList}>
            {arrVarNames.map((item, index) => {
                return (<li key={index}>
                    <label htmlFor={item}>
                        <span>{item}</span>
                        <input type="text" name={item} id={item} onChange={OnChangeHandler} />
                    </label>
                </li>)
            })}
        </ul>
    </div>)
}