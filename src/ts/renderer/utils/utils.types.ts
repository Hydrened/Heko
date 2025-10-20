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
type ModalRowData = string[];

interface ModalRow {
    label: string;
    type: ModalRowType;
    maxLength?: number;
    defaultValue?: string;
    data?: ModalRowData;
};

interface ModalRowRes {
    label: string;
    value: string;
    index?: number;
};
type ModalRes = ModalRowRes[];

interface ModalButton {
    title: string;
    onClick: () => void;
};

type ModalError = string | null;

interface CenterModalData {
    title: string;
    content?: ModalRow[];
    onConfirm: (res: ModalRes) => Promise<ModalError>;
    onCancel?: () => void;
    additionnalButtons?: ModalButton[];
    cantClose: boolean;
};




interface ContextmenuRow {
    title: string;
    shortcut?: Shortcut;
    onClick?: () => Promise<void>;
    rows?: ContextmenuRow[];
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
