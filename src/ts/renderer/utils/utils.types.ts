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

type ModalError = string | null;

interface CenterModalData {
    title: string;
    content: ModalRow[];
    onConfirm: (res: ModalRes) => Promise<ModalError>;
    onCancel: (() => void) | null;
    additionnalButtons: ModalButton[];
    cantClose: boolean;
};

interface UserData {
    id: number | null;
    token: string | null;
};

interface Playlist {
    name: string;
    songs: number;
    children: number;
};
