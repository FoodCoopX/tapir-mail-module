const ROOT_URL = 'http://localhost:8000' // FIXME: put in .env file
const API = {
    getTemplates: () => fetch(`${ROOT_URL}/api/demo/templates/list`).then(res => res.json()),
    getTemplate: (id: string) => fetch(`${ROOT_URL}/api/demo/templates/read/${id}`).then(res => res.json()),
    sendMail: (data: any) => fetch(`${ROOT_URL}/api/demo/mailing/save`, { method: "POST", body: JSON.stringify(data) })
}

export default API;