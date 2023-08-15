import styles from "./IfThenElseWidget.module.sass"

interface ITemplateIfNode<R> {
    type: "if"
    id: string
    option: number
    value: string
    children_then: R[]
    children_else: R[]
}



export type {
    ITemplateIfNode,
}

type IfThenElseWidgetProps = {
    arrVarNames: string[]
    thenBlocks: React.ReactNode
    elseBlocks: React.ReactNode
    selfTemplateNode: ITemplateIfNode<any>
    removeHandler: (id: string) => void
}

export default function IfThenElseWidget({ arrVarNames, thenBlocks, elseBlocks, selfTemplateNode, removeHandler }: IfThenElseWidgetProps) {

    function OnClickDeleteHandler(ev: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
        ev.preventDefault();

        removeHandler(selfTemplateNode.id)

    }


    function OnSelectChangeHandler(ev: React.ChangeEvent<HTMLSelectElement>) {
        if (ev.currentTarget.selectedIndex !== undefined && ev.currentTarget.selectedIndex >= 0) {
            let option = ev.currentTarget.selectedIndex;
            ev.currentTarget.value = arrVarNames[option];
            selfTemplateNode.option = option;
            selfTemplateNode.value = arrVarNames[option];
        }
    }


    return (<div className={styles.IfThenElseWidget}>
        <div>
            <button type="button" onClick={OnClickDeleteHandler}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
                    <path></path>
                    <path></path>
                </svg>
            </button>
        </div>
        <div><span></span></div>
        <div>
            <div className={styles.IfBlock}>
                <div><span>IF</span></div>
                <label>
                    <select ref={(node)=>{selfTemplateNode.value = arrVarNames[selfTemplateNode.option ?? 0]}} name="select_if_variable" onChange={OnSelectChangeHandler} defaultValue={arrVarNames[selfTemplateNode.option ?? 0] ?? undefined}>
                        {arrVarNames.map((item, index) => <option key={index} >{item}</option>)}
                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
                        <path></path>
                        <path></path>
                    </svg>
                </label>
            </div>
            <div className={styles.ThenBlock}>
                <div>
                    <span>THEN</span>
                </div>
                <div>
                    {thenBlocks}
                </div>
            </div>
            <div className={styles.ElseBlock}>
                <div><span>ELSE</span></div>
                <div>
                    {elseBlocks}
                </div>
            </div>
        </div>
    </div>)
}