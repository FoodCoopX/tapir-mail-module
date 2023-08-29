import { IPage, JsonToMjml } from "easy-email-core";
import mjml from 'mjml-browser';

export const mjmlToHtml = (content: IPage) => {
    return mjml(JsonToMjml({
        data: content,
        mode: 'production',
        context: content
    }), {
        beautify: true,
        validationLevel: 'soft',
    }).html
}