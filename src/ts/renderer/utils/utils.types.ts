type ModalRowType = "TEXT" | "NUMBER" | "EMAIL" | "PASSWORD";

interface ModalRow {
    label: string;
    type: ModalRowType;
    data: string[] | null;
    defaultValue: string;
};

type ModalRowRes = { [label: string]: string };
type ModalRes = ModalRowRes[];

interface ModalButton {
    title: string;
    onClick: () => void;
};

interface CenterModalData {
    title: string;
    content: ModalRow[];
    onConfirm: (res: ModalRes) => Promise<string>;
    onCancel: (() => void) | null;
    additionnalButtons: ModalButton[];
    cantClose: boolean;
};
