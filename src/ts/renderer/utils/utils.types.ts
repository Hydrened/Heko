type ID = number;
type Token = string;

interface UserData {
    id: ID | null;
    token: Token | null;
};



interface Shortcut {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    key: string;
};



interface Position {
    x: number;
    y: number;
};



type ModalRowType = "TEXT" | "NUMBER" | "EMAIL" | "PASSWORD" | "FILE" | "SELECT";

interface ModalRow {
    label: string;
    type: ModalRowType;
    maxLength: number | null;
    defaultValue: string | null;
    data: string[] | null;
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
    shortcut: Shortcut | null;
    onClick: (() => Promise<void>) | null;
    rows: ContextmenuRow[] | null;
};



interface Playlist {
    id: ID;
    userID: ID,
    parentID: ID;
    name: string;
    position: number;
    thumbnailFileName: string;
    opened: boolean;
    songs: number;
    children: number;
    creationDate: string;
};

interface Song {
    id: ID;
    playlistID: ID;
    fileName: string;
    title: string;
    artist: string;
    duration: number;
    creationDate: string;
};
