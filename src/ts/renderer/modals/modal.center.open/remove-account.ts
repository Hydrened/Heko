import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";

async function deleteAccountOnConfirm(app: App): Promise<ModalError> {
    const email: string = app.account.getUserData().email!;

    const sendDeleteAccountConfirmationReqRes: any = await Requests.user.sendDeleteConfirmation(app, email);
    if (!sendDeleteAccountConfirmationReqRes.success) {
        app.throwError(`Can't send delete account confirmation mail: ${sendDeleteAccountConfirmationReqRes.error}`);
        return null;
    }

    app.modalManager.openTopModal("SUCCESS", `Confirmation mail sent at ${email}`);
    return null;
}

export default function openDeleteAccountModal(app: App): void {
    const data: CenterModalData = {
        title: "Are you sure you want to delete your account? A confirmation email will be sent to your address.",
        content: [],
        onConfirm: async (modal: CenterModal) => deleteAccountOnConfirm(app),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
