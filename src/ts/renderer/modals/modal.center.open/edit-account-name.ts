import App from "./../../app.js";
import * as Requests from "./../../utils/utils.requests.js";

async function editAccountNameOnConfirm(app: App, modal: CenterModal): Promise<ModalError> {
    const newName: string = modal.getFieldValue("New name");
    if (newName.length < 3) {
        return {
            fieldName: "New name",
            error: "Name has to be at least 3 characters long.",
        };
    }

    const editAccountNameReqRes: any = await Requests.user.editName(app, newName);
    if (!editAccountNameReqRes.success) {
        app.throwError(`Can't edit accout name: ${editAccountNameReqRes.error}`);
        return null;
    }

    const userData: UserData = app.account.getUserData();
    app.account.setUserData(userData.id!, userData.token!, newName, userData.email!);
    app.settings.account.loggedIn(app.settings.get());

    app.modalManager.openTopModal("SUCCESS", `Successfully edited account name to "${newName}".`);
    return null;
}

export default function openEditAccountNameModal(app: App): void {
    if (!app.account.isLoggedIn()) {
        return;
    }

    const content: ModalRow[] = [
        { label: "New name", type: "TEXT", maxLength: 150, defaultValue: app.account.getUserData().name! },
    ];

    const data: CenterModalData = {
        title: "Edit song from Heko",
        content: content,
        onConfirm: async (modal: CenterModal) => await editAccountNameOnConfirm(app, modal),
        cantClose: false,
    };

    app.modalManager.openCenterModal(data);
}
