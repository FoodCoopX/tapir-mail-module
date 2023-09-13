import { IPage, JsonToMjml } from "easy-email-core";
import { MjmlToJson } from "easy-email-extensions";
import mjml from "mjml-browser";

export const mjmlToHtml = (mjmlString: string) => {
  return mjml(mjmlString, {
    validationLevel: "soft",
  }).html;
};

export const mjmlToJson = (mjmlString: string) => {
  return MjmlToJson(mjmlString);
};

export const jsonToHtml = (content: IPage) => {
  return mjmlToHtml(jsonToMjml(content));
};

export const jsonToMjml = (content: IPage) => {
  return JsonToMjml({
    data: content,
    mode: "production",
    context: content,
    beautify: false,
  })
    .replaceAll("\n", "")
    .replaceAll("<br>", "<br/>");
};
