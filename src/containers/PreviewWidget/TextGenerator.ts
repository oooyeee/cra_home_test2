import { sTemplateNode } from "../MessageTemplateWidget"

function ParseAndSubstitute(text: string, values: Record<string, string>) {
    const regex = /\{([^}]+)\}/g;

    return text.replace(regex, (_, variableName) => {
        // if found good value but its empty then return empty
        if (values[variableName] === "") {
            return ""
        }

        // if found value that is not empty return its value or return regex match
        return values[variableName] || _
    });
}


function TextGenerator(template: sTemplateNode[], values: Record<string, string>) {
    function _loop(t: sTemplateNode[]): string {
        let text = ""

        for (let node of t) {
            if (node.type === "textarea") {
                text += ParseAndSubstitute(node.text, values);
                // } else if (node.type === "if") {
            } else {
                let value = values[node.value];
                // if (value !== undefined) {
                if (value !== "") {
                    text += _loop(node.children_then)
                } else {
                    text += _loop(node.children_else)
                }
                // }
            }
        }

        return text
    }

    let text = _loop(template)

    return text
}

export default TextGenerator

export {
    ParseAndSubstitute
}