type ID = number;
type Token = string;
type Shortcut = string[] | null;

interface UserData {
    id: ID | null;
    token: Token | null;
};



type ModalRowType = "TEXT" | "NUMBER" | "EMAIL" | "PASSWORD";

interface ModalRow {
    label: string;
    type: ModalRowType;
    maxLength: number;
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




interface ContextmenuRow {
    title: string;
    shortcut: Shortcut;
    onClick: () => void;
    content: ContextmenuRow[] | null;
};



interface Playlist {
    id: ID;
    parentID: ID;
    name: string;
    position: number;
    opened: boolean;
    songs: number;
    children: number;
    creationDate: number;
};
