import TextGenerator from '../containers/PreviewWidget/TextGenerator';
import { ParseAndSubstitute } from '../containers/PreviewWidget/TextGenerator';
import type { sTemplateNode } from '../containers/MessageTemplateWidget';

import GetUniqueId from '../utils/GetUniqueId';


test("parsing text with valid variables", () => {
    let text = "Hello mr {lastname} {firstname}";

    let values = {
        "firstname": "Bill",
        "lastname": "Gates"
    };
    
    let parsed = ParseAndSubstitute(text, values)
    
    let expected = "Hello mr Gates Bill"

    expect(parsed).toEqual(expected)
});

test("parsing text with NON valid (or missing) variables", () => {
    let text = "Hello mr {middlename} {firstname}";

    let values = {
        "firstname": "Bill",
        "lastname": "Gates"
    };
    
    let parsed = ParseAndSubstitute(text, values)
    
    let expected = "Hello mr {middlename} Bill"

    expect(parsed).toEqual(expected)
});

test("parsing text with empty variables", () => {
    let text = "Hello mr {lastname} {firstname}";

    let values = {
        "firstname": "Bill",
        "lastname": ""
    };
    
    let parsed = ParseAndSubstitute(text, values)
    
    let expected = "Hello mr  Bill"

    expect(parsed).toEqual(expected)
});

test("parsing text with EXTRA variables", () => {
    let text = "Hello mr {lastname} {firstname}";

    let values = {
        "firstname": "Bill",
        "middlename": "Henry",
        "lastname": "Gates",
    };
    
    let parsed = ParseAndSubstitute(text, values)
    
    let expected = "Hello mr Gates Bill"

    expect(parsed).toEqual(expected)
});

test("parsing PLAIN text", () => {
    let text = "Hello mr Gates Bill";

    let values = {
        "firstname": "Bill",
        "lastname": "Gates",
    };
    
    let parsed = ParseAndSubstitute(text, values)
    
    let expected = "Hello mr Gates Bill"

    expect(parsed).toEqual(expected)
});

test('text generation: all variables are filled', () => {
    let values = {
        "firstname": "Bill",
        "lastname": "Gates",
        "company": "Microsoft",
        "position": "Founder",
    };

    let template: sTemplateNode[] = [
        {
            type: "textarea",
            text: "Hello mr {lastname} {firstname}\n"
        },
        {
            type: "if",
            id: GetUniqueId(),
            option: 2,
            value: "company",
            children_then: [
                {
                    type: "textarea",
                    text: "What is your role at the {company} ?\n"
                },
                {
                    type: "if",
                    id: GetUniqueId(),
                    option: 3,
                    value: "position",
                    children_then: [
                        {
                            type: "textarea",
                            text: "What do you do as {position} ?\n"
                        }
                    ],
                    children_else: [
                        {
                            type: "textarea",
                            text: "What is your position ?\n"
                        }
                    ]
                },
                {
                    type: "textarea",
                    text: ""
                },

            ],
            children_else: [
                {
                    type: "textarea",
                    text: "Where do you work ?\n"
                },
            ]
        },
        {
            type: "textarea",
            text: "Best regards, Bob"
        },
    ];

    let text = TextGenerator(template, values)

    let expectedText = [
        "Hello mr Gates Bill",
        "What is your role at the Microsoft ?",
        "What do you do as Founder ?",
        "Best regards, Bob",
    ].join("\n");

    expect(text).toEqual(expectedText)
});



test('text generation: Else test, missing variable value', () => {
    let values = {
        "firstname": "Bill",
        "lastname": "Gates",
        "company": "",
        "position": "Founder",
    };

    let template: sTemplateNode[] = [
        {
            type: "textarea",
            text: "Hello mr {lastname} {firstname}\n"
        },
        {
            type: "if",
            id: GetUniqueId(),
            option: 2,
            value: "company",
            children_then: [
                {
                    type: "textarea",
                    text: "What is your role at the {company} ?\n"
                },
                {
                    type: "if",
                    id: GetUniqueId(),
                    option: 3,
                    value: "position",
                    children_then: [
                        {
                            type: "textarea",
                            text: "What do you do as {position} ?\n"
                        }
                    ],
                    children_else: [
                        {
                            type: "textarea",
                            text: "What is your position ?\n"
                        }
                    ]
                },
                {
                    type: "textarea",
                    text: ""
                },

            ],
            children_else: [
                {
                    type: "textarea",
                    text: "Where do you work ?\n"
                },
            ]
        },
        {
            type: "textarea",
            text: "Best regards, Bob"
        },
    ];

    let text = TextGenerator(template, values)

    let expectedText = [
        "Hello mr Gates Bill",
        "Where do you work ?",
        "Best regards, Bob",
    ].join("\n");

    expect(text).toEqual(expectedText)
});