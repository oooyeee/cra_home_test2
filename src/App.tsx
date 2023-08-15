import { useRef, useState } from 'react';
import styles from './App.module.sass';
import MessageTemplateWidget from './containers/MessageTemplateWidget';

import type { sTemplateNode } from "./containers/MessageTemplateWidget"

function App() {
    let modalRef = useRef<HTMLDivElement>(null)
    let buttonRef = useRef<HTMLButtonElement>(null)
    let [widget, setWidget] = useState<JSX.Element | null>(null);

    let storedVarNames = localStorage.getItem("arrVarNames");
    let varnames = storedVarNames ? JSON.parse(storedVarNames) : [
        "firstname", "lastname", "company", "position"
    ];

    let template = localStorage.getItem("template") ?? "";

    async function CallbackSave(json: sTemplateNode[]) {

        let jsonString = "[]";

        try {
            jsonString = JSON.stringify(json)
        } catch (err) {
            console.log("failed to stringify json template");
            console.log(err)
        }

        localStorage.setItem("template", jsonString)
    }

    function OpenModalWidget() {
        if (!widget) {
            setWidget(<MessageTemplateWidget arrVarNames={varnames} template={template} callbackSave={CallbackSave} />)
            let modal = modalRef.current!;
            modal.classList.toggle(styles["Modal--on"]);
            let button = buttonRef.current!;
            button.classList.toggle(styles["ButtonOpenModal--off"]);
        }
    }


    return (
        <div className={styles.wrapper}>
            <div className={styles.App}>
                <h1>Message Template Editor PRO</h1>
                <div className={styles.Modal} ref={modalRef}>
                    {widget}
                </div>
                <button ref={buttonRef} className={styles.ButtonOpenModal} onClick={() => { OpenModalWidget() }}>Message Editor</button>
            </div>
        </div>
    );
}

export default App;
