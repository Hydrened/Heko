import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";

async function removeAccountOnConfirm(app: App): Promise<ModalError> {
    const email: string = app.account.getUserData().email!;

    const sendRemoveAccountConfirmationReqRes: any = await Requests.user.sendRemoveConfirmation(app, email);
    if (!sendRemoveAccountConfirmationReqRes.success) {
        app.throwError(`Can't send remove account confirmation mail: ${sendRemoveAccountConfirmationReqRes.error}`);
        return null;
    }

    app.modalManager.openTopModal("SUCCESS", `Confirmation mail sent at ${email}`);
    return null;
}

export default function openRemoveAccountModal(app: App): void {
    const data: CenterModalData = {
        title: "Are you sure you want to remove your account? A confirmation email will be sent to your address.",
        content: [],
        onConfirm: async (modal: CenterModal) => removeAccountOnConfirm(app),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
