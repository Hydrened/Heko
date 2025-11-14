import App from "./../../app.js";
import * as Bridge from "./../../utils/utils.bridge.js";
import * as Requests from "./../../utils/utils.requests.js";

async function loginModalOnConfirm(app: App, modal: CenterModal): Promise<ModalError> {
    const email: string = modal.getFieldValue("Email");
    const password: string = modal.getFieldValue("Password");

    const loginReqRes: any = await Requests.user.login(email, password);
    if (!loginReqRes.success) {
        return {
            fieldName: loginReqRes.fieldName,
            error: loginReqRes.error,
        };
    }
    
    await Bridge.token.save(loginReqRes.token);
    
    const userID: ID = Number(loginReqRes.userID);
    const token: Token = loginReqRes.token;
    const name: string = loginReqRes.name;
    app.account.setUserData(userID, token, name, email);

    app.account.loggedIn();

    return null;
}

export default function openLoginModal(app: App): CenterModal {
    const content: ModalRow[] = [
        { label: "Email", type: "EMAIL", maxLength: 150 },
        { label: "Password", type: "PASSWORD", maxLength: 150 },
    ];

    const additionnalButtons: ModalButton[] = [
        { title: "Register", onClick: () => app.account.openRegisterModal() },
    ];

    const data: CenterModalData = {
        title: "Login",
        content: content,
        onConfirm: async (modal: CenterModal) => await loginModalOnConfirm(app, modal),
        additionnalButtons: additionnalButtons,
        cantClose: true,
    };

    app.modalManager.openCenterModal(data);
    return app.modalManager.getCurrentCenterModal()!;
}
