import App from "../../app.js";
import CenterModal from "../modal.center.js";
import TopModal from "../modal.top.js";
import * as Bridge from "../../utils/utils.bridge.js";
import * as Requests from "../../utils/utils.requests.js";

async function registerModalOnConfirm(app: App, modal: CenterModal): Promise<ModalError> {
    const name: string = modal.getFieldValue("Name");
    const email: string = modal.getFieldValue("Email");
    const password: string = modal.getFieldValue("Password");
    const confirm: string = modal.getFieldValue("Confirm");

    const registerReqRes: any = await Requests.user.register(name, email, password, confirm);
    if (!registerReqRes.success) {
        return {
            error: registerReqRes.error,
        };
    }

    const loginReqRes: any = await Requests.user.login(email, password);
    if (!loginReqRes.success) {
        return {
            error: loginReqRes.error,
        };
    }

    await Bridge.token.save(loginReqRes.token);

    const userID: ID = Number(loginReqRes.userID);
    const token: Token = loginReqRes.token;
    app.account.setUserData(userID, token);

    app.account.loggedIn();

    TopModal.create("SUCCESS", "Account successfully created.");

    return null;
}

export default function openRegisterModal(app: App): CenterModal {
    const content: ModalRow[] = [
        { label: "Name", type: "TEXT", maxLength: 150 },
        { label: "Email", type: "EMAIL", maxLength: 150 },
        { label: "Password", type: "PASSWORD", maxLength: 150 },
        { label: "Confirm", type: "PASSWORD", maxLength: 150 },
    ];

    const additionnalButtons: ModalButton[] = [
        { title: "Login", onClick: () => app.account.openLoginModal() },
    ];

    const data: CenterModalData = {
        title: "Register",
        content: content,
        onConfirm: async (modal: CenterModal) => await registerModalOnConfirm(app, modal),
        additionnalButtons: additionnalButtons,
        cantClose: true,
    };

    return new CenterModal(app, data);
}
